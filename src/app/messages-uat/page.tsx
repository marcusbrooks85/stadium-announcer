"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { 
  Send, 
  Hash, 
  Plus, 
  Paperclip, 
  Smile, 
  ShieldCheck,
  Loader2,
  Megaphone,
  MessageSquare,
  Reply,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowRight,
  User,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  useFirestore, 
  useAuth, 
  useUser
} from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp, 
  limit
} from "firebase/firestore";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useSound from 'use-sound';

const COMMON_EMOJIS = ["👍", "❤️", "🔥", "⚾", "😂", "😮", "😢", "🙌", "💯", "✅", "❌", "⏳"];

const SEND_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
const RECEIVE_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
const REACTION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2568/2358-preview.mp3';

function MessageItem({ 
  msg, 
  isOwn, 
  isAdmin, 
  profiles, 
  roster, 
  onReact, 
  onReply, 
  onEdit, 
  onDelete 
}: any) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.text);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const touchStartX = useRef(0);
  const lastTap = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const profile = profiles[msg.senderId];
  const initials = (profile?.firstName?.[0] || profile?.lastName?.[0] || "?").toUpperCase();
  
  const displayName = useMemo(() => {
    if (!profile) return "Unknown";
    const base = profile.firstName || "User";
    if (!profile.playerId) return base;
    const player = roster.find((p: any) => p.id === profile.playerId);
    return player ? `${base} [#${player.number}]` : base;
  }, [profile, roster]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => setIsMenuOpen(true), 500);
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      onReact(msg, "❤️");
    }
    lastTap.current = now;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    if (deltaX > 0) setSwipeOffset(Math.min(deltaX, 80));
    if (Math.abs(deltaX) > 10 && longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (swipeOffset > 60) onReply(msg);
    setSwipeOffset(0);
  };

  if (msg.isDeleted) {
    return (
      <div className="flex flex-col ml-8 mb-4 opacity-40">
        <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Message Deleted</div>
        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl italic text-xs">This content was removed.</div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col group relative mb-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset === 0 ? 'transform 0.2s' : 'none' }}
    >
      {swipeOffset > 20 && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-primary animate-in fade-in slide-in-from-left-2">
          <Reply className="h-5 w-5" />
        </div>
      )}

      <Avatar className="h-8 w-8 border-2 border-background shadow-xl absolute -top-3 -left-2 z-20">
        <AvatarFallback className="bg-black/60 text-[8px] font-black">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col flex-1 pl-4">
        <div className="flex items-center gap-2 mb-1 ml-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{displayName}</span>
          <span className="text-[7px] text-muted-foreground opacity-40 uppercase">
            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
          </span>
          {msg.isEdited && <span className="text-[7px] text-muted-foreground opacity-30 uppercase italic">(edited)</span>}
        </div>

        <div className={cn(
          "relative text-[13px] font-bold leading-relaxed break-words p-3 rounded-2xl rounded-tl-none border border-white/5 shadow-sm max-w-[90%]",
          isOwn ? "bg-white/20 text-white" : "bg-white/5 text-white/90"
        )}>
          {msg.replyTo && (
            <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-primary text-[10px] opacity-60 line-clamp-1">
              {msg.replyTo.text}
            </div>
          )}

          {msg.mediaUrl && (
            <div className="relative w-full aspect-video mb-2 rounded-lg overflow-hidden border border-white/10">
              <Image src={msg.mediaUrl} alt="Chat" fill className="object-cover" unoptimized />
            </div>
          )}

          {editing ? (
            <div className="space-y-2">
              <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="bg-black/40 h-8 text-sm" autoFocus />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[8px] font-black" onClick={() => { onEdit(msg.id, editValue); setEditing(false); }}><Check className="h-3 w-3 mr-1" /> SAVE</Button>
                <Button size="sm" variant="ghost" className="h-7 text-[8px] font-black" onClick={() => setEditing(false)}>CANCEL</Button>
              </div>
            </div>
          ) : (
            <span>{msg.text}</span>
          )}

          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                <button key={emoji} onClick={() => onReact(msg, emoji)} className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-black/20 text-[9px]">
                  <span>{emoji}</span> <span className="font-black">{uids.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild><div className="absolute inset-0 pointer-events-none" /></PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-card border-white/10 shadow-2xl flex gap-1">
          {COMMON_EMOJIS.slice(0, 7).map(e => (
            <button key={e} onClick={() => { onReact(msg, e); setIsMenuOpen(false); }} className="h-8 w-8 hover:bg-white/10 rounded text-lg">{e}</button>
          ))}
          <div className="w-[1px] bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { onReply(msg); setIsMenuOpen(false); }}><Reply className="h-4 w-4" /></Button>
          {isOwn && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(true); setIsMenuOpen(false); }}><Pencil className="h-4 w-4" /></Button>}
          {(isOwn || isAdmin) && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { onDelete(msg.id); setIsMenuOpen(false); }}><Trash2 className="h-4 w-4" /></Button>}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function UATMessagesContent() {
  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, loading: authLoading } = useUser();
  const { userRole, userTeamId, teamData, isLoaded: gameLoaded, roster } = useUATGame();
  const { toast } = useToast();
  
  const [playSend] = useSound(SEND_SOUND, { volume: 0.5 });
  const [playReceive] = useSound(RECEIVE_SOUND, { volume: 0.4 });
  const [playReaction] = useSound(REACTION_SOUND, { volume: 0.3 });

  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!db || !userTeamId) return;
    const q = query(collection(db, "channels_UAT"), where("teamId", "==", userTeamId));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      setChannels(list);
      if (!selectedChannelId && list.length > 0) setSelectedChannelId(list.find(c => c.name === "general")?.id || list[0].id);
    });
  }, [db, userTeamId, selectedChannelId]);

  useEffect(() => {
    if (!db || !userTeamId) return;
    const q = query(collection(db, "users_UAT"), where("teamId", "==", userTeamId));
    return onSnapshot(q, (snap) => {
      const profiles: Record<string, any> = {};
      snap.forEach(d => profiles[d.id] = { id: d.id, ...d.data() });
      setUserProfiles(profiles);
    });
  }, [db, userTeamId]);

  useEffect(() => {
    if (!db || !selectedChannelId) return;
    setIsLoadingMessages(true);
    const q = query(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), orderBy("timestamp", "asc"), limit(50));
    return onSnapshot(q, (snap) => {
      const newMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (newMessages.length > 0) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.id !== lastMessageIdRef.current) {
          if (lastMsg.senderId !== auth.currentUser?.uid && lastMessageIdRef.current !== null) {
            playReceive();
            if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
              new Notification(`On Deck: ${userProfiles[lastMsg.senderId]?.firstName || "Team"}`, { body: lastMsg.text || "Image attachment" });
            }
          }
          lastMessageIdRef.current = lastMsg.id;
        }
      }
      setMessages(newMessages);
      setIsLoadingMessages(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [db, selectedChannelId, playReceive, auth.currentUser?.uid, userProfiles]);

  /**
   * Secure Cloudflare R2 Upload Logic
   * Strictly uses R2 with pre-signed URL matching Content-Type.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTeamId) return;
    
    setIsUploading(true);
    try {
      // 1. Fetch the pre-signed URL from our internal API using a clean relative path
      const presignRes = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload ticket');

      const { uploadUrl, fileKey } = presignData;

      // 2. Direct binary PUT request to Cloudflare R2 from browser
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error(`R2 storage rejected file: ${uploadRes.statusText}`);

      // 3. Construct public URL (Assuming default R2 public bucket pathing)
      const publicUrl = `https://on-deck-assets.r2.dev/${fileKey}`; 
      setAttachmentUrl(publicUrl);
      toast({ title: "Attachment Ready" });
      
    } catch (err: any) {
      console.error('Client upload error details:', err);
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: err.message || "An error occurred during binary R2 transmission."
      });
    } finally { setIsUploading(false); }
  };

  const startDM = async (targetUid: string) => {
    if (!auth.currentUser || !userTeamId) return;
    const currentUid = auth.currentUser.uid;
    const dmId = `dm_${[currentUid, targetUid].sort().join('_')}`;
    
    const channelRef = doc(db, "channels_UAT", dmId);
    const snap = await getDoc(channelRef);
    if (!snap.exists()) {
      const targetUser = userProfiles[targetUid];
      await setDoc(channelRef, {
        name: `${targetUser?.firstName || 'Private'}`,
        type: "private",
        teamId: userTeamId,
        members: [currentUid, targetUid],
        isDM: true,
        createdAt: serverTimestamp()
      });
    }
    setSelectedChannelId(dmId);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth.currentUser || (!newMessage.trim() && !attachmentUrl) || !selectedChannelId) return;
    try {
      playSend();
      await addDoc(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), {
        text: newMessage,
        mediaUrl: attachmentUrl || null,
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        teamId: userTeamId || "",
        replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text || "Media" } : null,
        reactions: {}
      });
      setNewMessage(""); setAttachmentUrl(null); setReplyingTo(null);
    } catch (e) { toast({ variant: "destructive", title: "Failed to send" }); }
  };

  const handleReaction = async (msg: any, emoji: string) => {
    if (!selectedChannelId || !auth.currentUser) return;
    playReaction();
    const current = msg.reactions || {};
    const users = current[emoji] || [];
    const updated = { ...current };
    if (users.includes(auth.currentUser.uid)) {
      updated[emoji] = users.filter((u: string) => u !== auth.currentUser.uid);
      if (updated[emoji].length === 0) delete updated[emoji];
    } else {
      updated[emoji] = [...users, auth.currentUser.uid];
    }
    await updateDoc(doc(db, "channels_UAT", selectedChannelId, "messages_UAT", msg.id), { reactions: updated });
  };

  const handleEditMessage = async (id: string, text: string) => {
    await updateDoc(doc(db, "channels_UAT", selectedChannelId!, "messages_UAT", id), { text, isEdited: true });
  };

  const handleDeleteMessage = async (id: string) => {
    await updateDoc(doc(db, "channels_UAT", selectedChannelId!, "messages_UAT", id), { isDeleted: true });
  };

  const groupedMessages = useMemo(() => {
    const groups: Record<string, any[]> = {};
    messages.forEach(m => {
      const d = m.timestamp?.toDate ? m.timestamp.toDate().toDateString() : new Date().toDateString();
      if (!groups[d]) groups[d] = []; groups[d].push(m);
    });
    return groups;
  }, [messages]);

  if (!gameLoaded || authLoading) return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connecting...</span></div>;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {teamData?.logoUrl ? <div className="relative w-6 h-6"><Image src={teamData.logoUrl} alt="Logo" fill className="object-contain" /></div> : <ShieldCheck className="h-5 w-5 text-primary" />}
          <div className="flex flex-col"><h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">Team Chat</h1><span className="text-[8px] font-black uppercase text-primary tracking-tighter">{teamData?.name || "Workspace"}</span></div>
        </div>
        <UATNavbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-card/40 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Search people..." className="h-9 bg-black/20 text-xs font-bold pl-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              <section className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-2 mb-3">Team Channels</h3>
                {channels.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedChannelId(c.id)} 
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      selectedChannelId === c.id ? "bg-primary text-white shadow-lg" : "hover:bg-white/5"
                    )}
                  >
                    <Hash className={cn("h-4 w-4", selectedChannelId === c.id ? "text-white" : "opacity-40")} />
                    <span className="text-xs font-bold uppercase tracking-wider">{c.name}</span>
                  </button>
                ))}
              </section>

              <section className="space-y-2">
                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-2 mb-3">Direct Messages</h3>
                {Object.values(userProfiles)
                  .filter(p => p.id !== auth.currentUser?.uid)
                  .map(p => {
                    const dmId = `dm_${[auth.currentUser?.uid, p.id].sort().join('_')}`;
                    const isActive = selectedChannelId === dmId;
                    return (
                      <button 
                        key={p.id} 
                        onClick={() => startDM(p.id)} 
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                          isActive ? "bg-primary text-white shadow-lg" : "hover:bg-white/5"
                        )}
                      >
                        <Avatar className="h-6 w-6 border border-white/10">
                          <AvatarFallback className="text-[8px] font-black">{(p.firstName?.[0] || "?").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold">{p.firstName} {p.lastName}</span>
                      </button>
                    );
                  })}
              </section>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col relative bg-black/10">
          <ScrollArea className="flex-1 p-4 pb-12">
            <div className="space-y-8 pl-4 pr-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-6">
                  <div className="flex justify-center"><div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full"><span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{date === new Date().toDateString() ? "TODAY" : date}</span></div></div>
                  {msgs.map(m => (
                    <MessageItem 
                      key={m.id} 
                      msg={m} 
                      isOwn={m.senderId === auth.currentUser?.uid} 
                      isAdmin={["super_admin", "league_admin"].includes(userRole || "")} 
                      profiles={userProfiles} 
                      roster={roster}
                      onReact={handleReaction}
                      onReply={setReplyingTo}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                    />
                  ))}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-card/50 backdrop-blur-xl border-t border-white/5 space-y-3">
            {replyingTo && (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20 animate-in slide-in-from-bottom-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-primary">Replying to {userProfiles[replyingTo.senderId]?.firstName}</span>
                  <span className="text-[10px] font-bold line-clamp-1">{replyingTo.text || "Media"}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}><X className="h-4 w-4" /></Button>
              </div>
            )}
            
            {attachmentUrl && (
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10 w-fit">
                <div className="relative w-12 h-12 rounded overflow-hidden border border-white/10">
                  <Image src={attachmentUrl} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-green-500 uppercase">Ready to send</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setAttachmentUrl(null)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10 max-w-4xl mx-auto w-full">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <Button variant="ghost" size="icon" className={cn("opacity-40", isUploading && "animate-spin")} type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
              </Button>
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="bg-transparent border-none focus-visible:ring-0 font-bold text-[13px] h-10 px-0" />
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="opacity-40" type="button"><Smile className="h-5 w-5" /></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-2 grid grid-cols-6 gap-1 bg-card border-white/10">
                  {COMMON_EMOJIS.map(e => <button key={e} onClick={() => setNewMessage(p => p + e)} className="h-8 w-8 hover:bg-white/10 rounded text-lg">{e}</button>)}
                </PopoverContent>
              </Popover>
              <Button disabled={(!newMessage.trim() && !attachmentUrl) || isUploading} type="submit" size="icon" className="h-10 w-10 bg-primary"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function UATMessagesPage() {
  return <UATGameProvider><UATMessagesContent /></UATGameProvider>;
}
