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
  ArrowLeft,
  User,
  Search,
  MoreVertical,
  Archive,
  MoreHorizontal,
  ChevronLeft,
  FolderArchive,
  MessagesSquare
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  deleteDoc,
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

/**
 * Custom Hook for Long Press detection
 */
function useLongPress(callback: () => void, ms = 500) {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startLongPress) {
      timer = setTimeout(callback, ms);
    } else {
      clearTimeout(timer!);
    }
    return () => clearTimeout(timer);
  }, [startLongPress, callback, ms]);

  return {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
  };
}

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
  const [showArchived, setShowArchived] = useState(false);

  // Management State
  const [manageTarget, setManageTarget] = useState<any | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

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
    });
  }, [db, userTeamId]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTeamId) return;
    
    setIsUploading(true);
    try {
      const resolvedType = file.type || 'application/octet-stream';
      const presignRes = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: resolvedType }),
      });
      
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload ticket');

      const { uploadUrl, fileKey } = presignData;
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': resolvedType },
      });

      if (!uploadRes.ok) throw new Error(`R2 storage rejected file: ${uploadRes.statusText}`);
      const publicUrl = `https://on-deck-assets.r2.dev/${fileKey}`; 
      setAttachmentUrl(publicUrl);
      toast({ title: "Attachment Ready" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
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

  const handleArchiveChannel = async (id: string, isArchived: boolean) => {
    await updateDoc(doc(db, "channels_UAT", id), { isArchived: !isArchived });
    toast({ title: isArchived ? "Channel Restored" : "Channel Archived" });
    setManageTarget(null);
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this channel? All messages will be lost.")) return;
    await deleteDoc(doc(db, "channels_UAT", id));
    if (selectedChannelId === id) setSelectedChannelId(null);
    toast({ title: "Channel Deleted" });
    setManageTarget(null);
  };

  const handleRenameChannel = async () => {
    if (!manageTarget || !renameValue.trim()) return;
    await updateDoc(doc(db, "channels_UAT", manageTarget.id), { name: renameValue.trim() });
    setIsRenaming(false);
    setManageTarget(null);
    toast({ title: "Channel Renamed" });
  };

  const groupedMessages = useMemo(() => {
    const groups: Record<string, any[]> = {};
    messages.forEach(m => {
      const d = m.timestamp?.toDate ? m.timestamp.toDate().toDateString() : new Date().toDateString();
      if (!groups[d]) groups[d] = []; groups[d].push(m);
    });
    return groups;
  }, [messages]);

  const filteredChannels = useMemo(() => {
    return channels.filter(c => !!c.isArchived === showArchived && !c.isDM);
  }, [channels, showArchived]);

  const directMessages = useMemo(() => {
    return Object.values(userProfiles).filter(p => p.id !== auth.currentUser?.uid);
  }, [userProfiles, auth.currentUser?.uid]);

  const activeChannel = useMemo(() => channels.find(c => c.id === selectedChannelId), [channels, selectedChannelId]);

  if (!gameLoaded || authLoading) return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connecting...</span></div>;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {selectedChannelId && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedChannelId(null)} className="lg:hidden h-9 w-9 mr-1 text-primary hover:bg-primary/10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {!selectedChannelId ? (
            <div className="flex items-center gap-3">
               <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessagesSquare className="h-5 w-5" />
               </div>
               <div className="flex flex-col">
                  <h1 className="font-headline font-black uppercase tracking-[0.1em] text-xs md:text-sm">MESSAGES</h1>
                  <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{teamData?.name || "Team Workspace"}</span>
               </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
               <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                    {activeChannel?.isDM ? <User className="h-4 w-4" /> : (activeChannel?.name?.[0] || "#").toUpperCase()}
                  </AvatarFallback>
               </Avatar>
               <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider">{activeChannel?.name || "Chat"}</span>
                  <span className="text-[8px] text-green-500 font-bold uppercase tracking-tighter">Active Thread</span>
               </div>
            </div>
          )}
        </div>
        <UATNavbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List View / Sidebar */}
        <aside className={cn(
          "w-full lg:w-80 bg-card/40 border-r border-border backdrop-blur-sm flex flex-col transition-all duration-300",
          selectedChannelId ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search threads..." className="h-10 bg-black/20 text-xs font-bold pl-10 border-white/5" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">View: {showArchived ? "Archived" : "Inbox"}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)} className="h-7 text-[8px] font-black uppercase tracking-widest px-3 bg-white/5">
                {showArchived ? "BACK TO ACTIVE" : "VIEW ARCHIVE"}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-8">
              <section className="space-y-2">
                <div className="flex items-center justify-between px-2 mb-4">
                  <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Group Channels</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-40 hover:opacity-100">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {filteredChannels.length === 0 && (
                  <p className="text-[9px] text-center py-8 opacity-30 font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">No {showArchived ? "archived" : "active"} groups</p>
                )}
                {filteredChannels.map(c => (
                  <ChannelListItem 
                    key={c.id} 
                    channel={c} 
                    isActive={selectedChannelId === c.id} 
                    onClick={() => setSelectedChannelId(c.id)}
                    isAdmin={["super_admin", "league_admin"].includes(userRole || "")}
                    onManage={(target) => setManageTarget(target)}
                  />
                ))}
              </section>

              {!showArchived && (
                <section className="space-y-2">
                  <div className="px-2 mb-4">
                    <h3 className="text-[10px] font-black uppercase text-secondary tracking-[0.2em]">Direct Threads</h3>
                  </div>
                  {directMessages.length === 0 && (
                     <p className="text-[9px] text-center py-8 opacity-30 font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">Invite teammates to chat</p>
                  )}
                  {directMessages.map(p => {
                    const dmId = `dm_${[auth.currentUser?.uid, p.id].sort().join('_')}`;
                    const isActive = selectedChannelId === dmId;
                    return (
                      <button 
                        key={p.id} 
                        onClick={() => startDM(p.id)} 
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative",
                          isActive ? "bg-primary text-white shadow-xl translate-x-1" : "hover:bg-white/5"
                        )}
                      >
                        <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                          <AvatarFallback className={cn("text-[10px] font-black", isActive ? "bg-white/20" : "bg-secondary/10 text-secondary")}>
                            {(p.firstName?.[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-black uppercase tracking-wider truncate">{p.firstName} {p.lastName}</span>
                          <span className="text-[8px] font-bold opacity-40 uppercase truncate">Start a private message</span>
                        </div>
                        {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </button>
                    );
                  })}
                </section>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Active Chat View */}
        <main className={cn(
          "flex-1 flex flex-col relative bg-black/10 transition-all duration-300",
          !selectedChannelId ? "hidden lg:flex" : "flex"
        )}>
          {!selectedChannelId ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-6 p-8 text-center">
              <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <MessagesSquare className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.3em]">No Thread Selected</p>
                <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Select a group or teammate to view the conversation</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4 pb-20">
                <div className="max-w-4xl mx-auto space-y-10 py-6">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date} className="space-y-8">
                      <div className="flex justify-center">
                        <div className="bg-white/5 border border-white/10 px-5 py-1.5 rounded-full backdrop-blur-md">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            {date === new Date().toDateString() ? "TODAY" : date}
                          </span>
                        </div>
                      </div>
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

              {/* Chat Input Area */}
              <div className="p-4 bg-card/60 backdrop-blur-3xl border-t border-white/5 space-y-4">
                {replyingTo && (
                  <div className="max-w-4xl mx-auto flex items-center justify-between p-3 bg-primary/10 rounded-2xl border border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col pl-2">
                      <span className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <Reply className="h-3 w-3" /> Replying to {userProfiles[replyingTo.senderId]?.firstName}
                      </span>
                      <span className="text-[11px] font-bold line-clamp-1 opacity-70 mt-0.5">{replyingTo.text || "Attached Media"}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setReplyingTo(null)}><X className="h-4 w-4" /></Button>
                  </div>
                )}
                
                {attachmentUrl && (
                  <div className="max-w-4xl mx-auto flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 w-fit animate-in zoom-in-95 duration-200">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl">
                      <Image src={attachmentUrl} alt="Preview" fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Image Ready</span>
                      <Button variant="destructive" size="sm" className="h-7 text-[8px] font-black uppercase px-3" onClick={() => setAttachmentUrl(null)}>Discard</Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-black/50 p-2 rounded-[24px] border border-white/10 max-w-4xl mx-auto w-full shadow-2xl">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <Button variant="ghost" size="icon" className={cn("h-11 w-11 rounded-full text-muted-foreground hover:text-white", isUploading && "animate-spin")} type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
                  </Button>
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Send a message..." className="bg-transparent border-none focus-visible:ring-0 font-bold text-sm h-12 px-2" />
                  <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-muted-foreground hover:text-white" type="button"><Smile className="h-5 w-5" /></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-3 grid grid-cols-6 gap-2 bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                      {COMMON_EMOJIS.map(e => <button key={e} onClick={() => setNewMessage(p => p + e)} className="h-9 w-9 hover:bg-white/10 rounded-xl text-xl transition-all transform active:scale-90">{e}</button>)}
                    </PopoverContent>
                  </Popover>
                  <Button disabled={(!newMessage.trim() && !attachmentUrl) || isUploading} type="submit" size="icon" className="h-11 w-11 rounded-full bg-primary shadow-lg shadow-primary/30 transition-all transform active:scale-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Channel Management Dialogs */}
      <Dialog open={!!manageTarget && !isRenaming} onOpenChange={(val) => !val && setManageTarget(null)}>
        <DialogContent className="bg-card border-white/10 max-w-xs p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
              <Hash className="h-4 w-4 text-primary" /> {manageTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
             <Button 
               variant="outline" 
               className="justify-start h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/5 bg-black/20 hover:bg-primary/10 hover:text-primary transition-all" 
               onClick={() => { setIsRenaming(true); setRenameValue(manageTarget?.name || ""); }}
             >
                <Pencil className="h-4 w-4 mr-3" /> Rename Group
             </Button>
             <Button 
               variant="outline" 
               className="justify-start h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/5 bg-black/20 hover:bg-secondary/10 hover:text-secondary transition-all" 
               onClick={() => handleArchiveChannel(manageTarget?.id, manageTarget?.isArchived)}
             >
                <Archive className="h-4 w-4 mr-3" /> 
                {manageTarget?.isArchived ? "Restore Thread" : "Archive Thread"}
             </Button>
             <div className="h-px bg-white/5 my-1" />
             <Button 
               variant="outline" 
               className="justify-start h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all" 
               onClick={() => handleDeleteChannel(manageTarget?.id)}
             >
                <Trash2 className="h-4 w-4 mr-3" /> Delete Permanently
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="bg-card border-white/10 max-w-sm rounded-3xl">
          <DialogHeader><DialogTitle className="text-[10px] font-black uppercase tracking-widest">Rename Thread</DialogTitle></DialogHeader>
          <div className="py-6"><Input value={renameValue} onChange={e => setRenameValue(e.target.value)} className="bg-black/20 h-14 rounded-2xl font-bold px-5" /></div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest h-12" onClick={() => setIsRenaming(false)}>Cancel</Button>
            <Button className="font-black uppercase text-[10px] tracking-widest h-12 bg-primary px-8" onClick={handleRenameChannel}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChannelListItem({ channel, isActive, onClick, isAdmin, onManage }: any) {
  const longPress = useLongPress(() => onManage(channel));

  return (
    <div className="relative group">
      <button 
        onClick={onClick} 
        onContextMenu={(e) => { e.preventDefault(); onManage(channel); }}
        {...longPress}
        className={cn(
          "w-full flex items-center justify-between gap-4 p-4 rounded-[20px] transition-all text-left relative",
          isActive ? "bg-primary text-white shadow-2xl translate-x-1" : "hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
            isActive ? "bg-white/20" : "bg-black/40 border border-white/5 text-muted-foreground"
          )}>
            <Hash className={cn("h-5 w-5", isActive ? "text-white" : "opacity-40")} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-black uppercase tracking-wider truncate">{channel.name}</span>
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-widest truncate",
              isActive ? "text-white/60" : "text-muted-foreground"
            )}>
              {channel.isArchived ? "Archived Group" : "Public Channel"}
            </span>
          </div>
        </div>
        {channel.isArchived && <FolderArchive className="h-4 w-4 opacity-40 shrink-0" />}
      </button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => { e.stopPropagation(); onManage(channel); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full opacity-0 group-hover:opacity-40 hover:opacity-100 transition-all hidden lg:flex"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function UATMessagesPage() {
  return <UATGameProvider><UATMessagesContent /></UATGameProvider>;
}
