"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  MessagesSquare,
  Users,
  Lock,
  Globe
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const initials = ((profile?.firstName?.[0] || "") + (profile?.lastName?.[0] || "")).toUpperCase() || "?";
  
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
      <div className={cn("flex flex-col mb-4 opacity-40", isOwn ? "items-end" : "items-start")}>
        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl italic text-[11px]">This message was removed.</div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col group relative mb-6 select-none max-w-[85%] sm:max-w-[70%]",
        isOwn ? "self-end items-end" : "self-start items-start"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset === 0 ? 'transform 0.2s' : 'none' }}
    >
      <div className={cn("flex items-end gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
        <Avatar className="h-9 w-9 border-2 border-background shadow-lg shrink-0">
          <AvatarFallback className={cn("text-[9px] font-black", isOwn ? "bg-primary text-white" : "bg-black/60")}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{displayName}</span>
            <span className="text-[7px] text-muted-foreground opacity-40 uppercase">
              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
            </span>
          </div>

          <div className={cn(
            "relative text-[13px] font-medium leading-relaxed break-words p-3 rounded-2xl shadow-sm border border-white/5",
            isOwn 
              ? "bg-primary text-white rounded-tr-none" 
              : "bg-white/10 text-white/90 rounded-tl-none"
          )}>
            {msg.replyTo && (
              <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-white/40 text-[10px] opacity-70 line-clamp-1">
                {msg.replyTo.text}
              </div>
            )}

            {msg.mediaUrl && (
              <div className="relative w-full aspect-video mb-2 rounded-lg overflow-hidden border border-white/10 shadow-inner bg-black/20">
                <Image src={msg.mediaUrl} alt="Chat" fill className="object-cover" unoptimized />
              </div>
            )}

            {editing ? (
              <div className="space-y-2 min-w-[200px]">
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
              <div className={cn("flex flex-wrap gap-1 mt-2", isOwn ? "justify-end" : "justify-start")}>
                {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                  <button key={emoji} onClick={() => onReact(msg, emoji)} className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-black/40 text-[9px] hover:bg-black/60 transition-colors">
                    <span>{emoji}</span> <span className="font-black">{uids.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild><div className="absolute inset-0 pointer-events-none" /></PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-card border-white/10 shadow-2xl flex gap-1 animate-in zoom-in-95 duration-200">
          {COMMON_EMOJIS.slice(0, 7).map(e => (
            <button key={e} onClick={() => { onReact(msg, e); setIsMenuOpen(false); }} className="h-8 w-8 hover:bg-white/10 rounded text-lg transition-transform active:scale-125">{e}</button>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useUser();
  const { userRole, userTeamId, teamData, isLoaded: gameLoaded, roster } = useUATGame();
  const { toast } = useToast();
  
  const [playSend] = useSound(SEND_SOUND, { volume: 0.5 });
  const [playReaction] = useSound(REACTION_SOUND, { volume: 0.3 });

  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [listSearch, setListSearch] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<"dm" | "channel">("dm");
  const [newChatName, setNewChatName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [userSearchInDialog, setUserSearchInDialog] = useState("");

  const [manageTarget, setManageTarget] = useState<any | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChannelId = searchParams.get('cid');
  const isAdmin = ["super_admin", "league_admin"].includes(userRole || "");

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
      setMessages(newMessages);
      setIsLoadingMessages(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [db, selectedChannelId]);

  const handleSetSelectedChannel = (id: string | null) => {
    if (id) {
      router.push(`/messages-uat?cid=${id}`);
    } else {
      router.push(`/messages-uat`);
    }
  };

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

  const handleCreateNewChat = async () => {
    if (!auth.currentUser || !userTeamId) return;
    if (newChatType === "channel" && !newChatName.trim()) return;
    if (newChatType === "dm" && selectedParticipants.length === 0) return;

    setIsCreating(true);
    try {
      const currentUid = auth.currentUser.uid;
      const allMembers = Array.from(new Set([currentUid, ...selectedParticipants]));

      if (newChatType === "dm" && allMembers.length === 2) {
        const dmId = `dm_${allMembers.sort().join('_')}`;
        const channelRef = doc(db, "channels_UAT", dmId);
        const snap = await getDoc(channelRef);
        if (!snap.exists()) {
          const otherUid = selectedParticipants.find(id => id !== currentUid);
          const otherUser = userProfiles[otherUid!];
          await setDoc(channelRef, {
            name: `${otherUser?.firstName || 'Private'}`,
            type: "private",
            teamId: userTeamId,
            members: allMembers,
            isDM: true,
            createdBy: currentUid,
            createdAt: serverTimestamp()
          });
        }
        handleSetSelectedChannel(dmId);
      } else {
        const isPublic = newChatType === "channel";
        const finalName = newChatType === "dm" 
          ? allMembers.map(uid => userProfiles[uid]?.firstName).filter(Boolean).join(", ")
          : newChatName;

        const docRef = await addDoc(collection(db, "channels_UAT"), {
          name: finalName,
          type: isPublic ? "public" : "private",
          teamId: userTeamId,
          members: allMembers,
          isDM: newChatType === "dm",
          createdBy: currentUid,
          createdAt: serverTimestamp()
        });
        handleSetSelectedChannel(docRef.id);
      }
      
      setIsCreateDialogOpen(false);
      setNewChatName("");
      setSelectedParticipants([]);
      setUserSearchInDialog("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: e.message });
    } finally {
      setIsCreating(false);
    }
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
    if (selectedChannelId === id) handleSetSelectedChannel(null);
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

  // Enhanced Universal Search Logic
  const filteredChannels = useMemo(() => {
    const term = listSearch.toLowerCase();
    return channels.filter(c => {
      if (!!c.isArchived !== showArchived) return false;
      if (!term) return true;

      // 1. Match Channel/DM Name
      if (c.name.toLowerCase().includes(term)) return true;

      // 2. Match Participants Names
      const participantMatch = c.members?.some((uid: string) => {
        const p = userProfiles[uid];
        const fullName = `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase();
        return fullName.includes(term);
      });
      if (participantMatch) return true;

      // 3. Match Content (within current thread if viewing)
      if (selectedChannelId === c.id) {
         const messageMatch = messages.some(m => m.text?.toLowerCase().includes(term));
         if (messageMatch) return true;
      }

      return false;
    });
  }, [channels, showArchived, listSearch, userProfiles, selectedChannelId, messages]);

  const filteredUsersForDialog = useMemo(() => {
    return Object.values(userProfiles).filter(p => {
      if (p.id === auth.currentUser?.uid) return false;
      
      const searchTerm = userSearchInDialog.toLowerCase();
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      
      const player = roster.find(r => r.id === p.playerId);
      const playerName = player?.name.toLowerCase() || "";
      const playerNumber = player?.number.toString() || "";

      return (
        fullName.includes(searchTerm) || 
        playerName.includes(searchTerm) || 
        playerNumber.includes(searchTerm)
      );
    });
  }, [userProfiles, userSearchInDialog, auth.currentUser?.uid, roster]);

  const activeChannel = useMemo(() => channels.find(c => c.id === selectedChannelId), [channels, selectedChannelId]);

  // Resolves the correct name for DMs (the other person)
  const getResolvedChannelName = (c: any) => {
    if (!c.isDM) return c.name;
    const otherUid = c.members?.find((uid: string) => uid !== auth.currentUser?.uid);
    const otherUser = userProfiles[otherUid || ""];
    return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : (c.name || "Chat");
  };

  if (!gameLoaded || authLoading) return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connecting...</span></div>;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {selectedChannelId && (
            <Button variant="ghost" size="icon" onClick={() => handleSetSelectedChannel(null)} className="lg:hidden h-9 w-9 mr-1 text-primary hover:bg-primary/10">
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
               <Avatar className="h-9 w-9 border border-white/10 shadow-lg">
                  <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                    {activeChannel?.isDM ? <User className="h-4 w-4" /> : (activeChannel?.name?.[0] || "#").toUpperCase()}
                  </AvatarFallback>
               </Avatar>
               <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider">{activeChannel ? getResolvedChannelName(activeChannel) : "Chat"}</span>
                  <span className="text-[8px] text-green-500 font-bold uppercase tracking-tighter">Active Thread</span>
               </div>
            </div>
          )}
        </div>
        <UATNavbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={cn(
          "w-full lg:w-80 bg-card/40 border-r border-border backdrop-blur-sm flex flex-col transition-all duration-300",
          selectedChannelId ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                placeholder="Search messages, users, teams..." 
                className="h-10 bg-black/20 text-xs font-bold pl-10 border-white/5" 
              />
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
                  <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Threads & Channels</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {filteredChannels.length === 0 && (
                  <p className="text-[9px] text-center py-8 opacity-30 font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">No {showArchived ? "archived" : "active"} threads found</p>
                )}
                
                {filteredChannels.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleSetSelectedChannel(c.id)}
                    onContextMenu={(e) => { e.preventDefault(); setManageTarget(c); }}
                    className={cn(
                      "w-full flex items-center justify-between gap-4 p-4 rounded-2xl transition-all text-left group",
                      selectedChannelId === c.id ? "bg-primary text-white shadow-xl" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                        <AvatarFallback className={cn("text-[10px] font-black", selectedChannelId === c.id ? "bg-white/20" : "bg-black/40")}>
                          {c.isDM ? <User className="h-4 w-4" /> : (c.name?.[0] || "#").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-black uppercase tracking-wider truncate">{getResolvedChannelName(c)}</span>
                        <span className={cn("text-[8px] font-bold uppercase tracking-widest truncate", selectedChannelId === c.id ? "text-white/60" : "text-muted-foreground")}>
                          {c.type === 'public' ? 'Public Channel' : 'Private Thread'}
                        </span>
                      </div>
                    </div>
                    {c.isArchived && <FolderArchive className="h-4 w-4 opacity-40 shrink-0" />}
                  </button>
                ))}
              </section>
            </div>
          </ScrollArea>
        </aside>

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
                <p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Select a group or teammate to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4 pb-20">
                <div className="max-w-4xl mx-auto flex flex-col py-6">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date} className="flex flex-col gap-8 mb-10">
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
                          isAdmin={isAdmin} 
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
                  <div ref={scrollRef} className="h-1" />
                </div>
              </ScrollArea>

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

      <Dialog open={isCreateDialogOpen} onOpenChange={(val) => { setIsCreateDialogOpen(val); if (!val) setUserSearchInDialog(""); }}>
        <DialogContent className="bg-card border-white/10 max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <Plus className="h-5 w-5 text-primary" /> Create New Chat
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground">Select type and participants</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
             {isAdmin && (
                <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setNewChatType("dm")} 
                    className={cn("flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", newChatType === "dm" ? "bg-primary text-white" : "text-muted-foreground")}
                  >
                    <Users className="h-3 w-3 inline mr-2" /> DM / Group
                  </button>
                  <button 
                    onClick={() => setNewChatType("channel")} 
                    className={cn("flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", newChatType === "channel" ? "bg-primary text-white" : "text-muted-foreground")}
                  >
                    <Hash className="h-3 w-3 inline mr-2" /> Channel
                  </button>
                </div>
             )}

             {newChatType === "channel" && (
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase ml-1">Channel Name</Label>
                   <Input value={newChatName} onChange={e => setNewChatName(e.target.value)} placeholder="e.g. game-day-announcements" className="h-12 bg-black/20" />
                </div>
             )}

             <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase ml-1">Find Users</Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    value={userSearchInDialog}
                    onChange={e => setUserSearchInDialog(e.target.value)}
                    placeholder="Search by name or player..." 
                    className="h-10 bg-black/40 text-[11px] pl-10 border-white/5" 
                  />
                </div>
                <ScrollArea className="h-60 rounded-xl border border-white/5 bg-black/20 p-2">
                   <div className="space-y-1">
                      {filteredUsersForDialog.length === 0 ? (
                        <p className="text-[10px] text-center py-10 opacity-30 uppercase font-black">No users found</p>
                      ) : (
                        filteredUsersForDialog.map(u => {
                          const player = roster.find(r => r.id === u.playerId);
                          return (
                            <label key={u.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                               <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-[8px] font-black bg-secondary/10 text-secondary">
                                      {((u.firstName?.[0] || "") + (u.lastName?.[0] || "")).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                     <span className="text-[11px] font-bold text-white group-hover:text-primary transition-colors">{u.firstName} {u.lastName}</span>
                                     <div className="flex items-center gap-2">
                                       <span className="text-[8px] font-black uppercase opacity-40">{u.role?.replace('_', ' ')}</span>
                                       {player && (
                                         <Badge variant="outline" className="text-[7px] h-3 px-1 border-primary/20 text-primary/70 font-black uppercase">
                                           #{player.number} {player.name}
                                         </Badge>
                                       )}
                                     </div>
                                  </div>
                               </div>
                               <Checkbox 
                                  checked={selectedParticipants.includes(u.id)} 
                                  onCheckedChange={(checked) => {
                                    if (checked) setSelectedParticipants(prev => [...prev, u.id]);
                                    else setSelectedParticipants(prev => prev.filter(id => id !== u.id));
                                  }} 
                               />
                            </label>
                          );
                        })
                      )}
                   </div>
                </ScrollArea>
             </div>
          </div>

          <DialogFooter>
            <Button className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-2xl" disabled={isCreating} onClick={handleCreateNewChat}>
              {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initiate Thread"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageTarget && !isRenaming} onOpenChange={(val) => !val && setManageTarget(null)}>
        <DialogContent className="bg-card border-white/10 max-w-xs p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
              <Hash className="h-4 w-4 text-primary" /> {manageTarget ? getResolvedChannelName(manageTarget) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
             <Button variant="outline" className="justify-start h-14 rounded-2xl font-black text-[10px] uppercase border-white/5 bg-black/20 hover:bg-primary/10" onClick={() => { setIsRenaming(true); setRenameValue(manageTarget?.name || ""); }}>
                <Pencil className="h-4 w-4 mr-3" /> Rename Group
             </Button>
             <Button variant="outline" className="justify-start h-14 rounded-2xl font-black text-[10px] uppercase border-white/5 bg-black/20 hover:bg-secondary/10" onClick={() => handleArchiveChannel(manageTarget?.id, manageTarget?.isArchived)}>
                <Archive className="h-4 w-4 mr-3" /> {manageTarget?.isArchived ? "Restore Thread" : "Archive Thread"}
             </Button>
             <div className="h-px bg-white/5 my-1" />
             <Button variant="outline" className="justify-start h-14 rounded-2xl font-black text-[10px] uppercase border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteChannel(manageTarget?.id)}>
                <Trash2 className="h-4 w-4 mr-3" /> Delete Permanently
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="bg-card border-white/10 max-sm rounded-3xl">
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

export default function UATMessagesPage() {
  return <UATGameProvider><UATMessagesContent /></UATGameProvider>;
}
