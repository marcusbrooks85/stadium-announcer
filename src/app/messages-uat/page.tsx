"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Pin,
  X,
  Check,
  User as UserIcon,
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
  setDoc,
  updateDoc,
  doc,
  serverTimestamp, 
  limit
} from "firebase/firestore";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const COMMON_EMOJIS = ["👍", "❤️", "🔥", "⚾", "😂", "😮", "😢"];

function UATMessagesContent() {
  const db = useFirestore();
  const auth = useAuth();
  const { user: authUser, loading: authLoading } = useUser();
  const { userRole, userTeamId, teamData, isLoaded: gameLoaded, roster } = useUATGame();
  const { toast } = useToast();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  
  // Mentions State
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);

  // Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const isAnnouncements = selectedChannel?.name === "Announcements";
  const canPostInSelected = !isAnnouncements || (userRole === "super_admin" || userRole === "league_admin");
  const isAdmin = userRole === "super_admin" || userRole === "league_admin";

  // Listen for Channels
  useEffect(() => {
    if (!db || !userTeamId) return;
    const q = query(collection(db, "channels_UAT"), where("teamId", "==", userTeamId), orderBy("name", "asc"));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChannels(list);
      if (!selectedChannelId && list.length > 0) setSelectedChannelId(list[0].id);
    });
  }, [db, userTeamId, selectedChannelId]);

  // Listen for User Profiles in the team
  useEffect(() => {
    if (!db || !userTeamId) return;
    const q = query(collection(db, "users_UAT"), where("teamId", "==", userTeamId));
    return onSnapshot(q, (snap) => {
      const profiles: Record<string, any> = {};
      snap.forEach(d => profiles[d.id] = d.data());
      setUserProfiles(profiles);
    });
  }, [db, userTeamId]);

  // Listen for Messages
  useEffect(() => {
    if (!db || !selectedChannelId) return;
    setIsLoadingMessages(true);
    const q = query(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), orderBy("timestamp", "asc"), limit(50));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoadingMessages(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [db, selectedChannelId]);

  const resolveRichName = (senderId: string) => {
    const profile = userProfiles[senderId];
    if (!profile) return "Unknown User";
    const firstName = profile.firstName || "User";
    if (!profile.playerId) return firstName;
    const player = roster.find(p => p.id === profile.playerId);
    return player ? `${firstName} [#${player.number} ${player.name}]` : firstName;
  };

  const getInitials = (senderId: string) => {
    const profile = userProfiles[senderId];
    if (!profile) return "??";
    const f = profile.firstName?.[0] || "";
    const l = profile.lastName?.[0] || "";
    return (f + l).toUpperCase() || "??";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setNewMessage(val);

    const lastAt = val.lastIndexOf("@", pos - 1);
    if (lastAt !== -1 && !val.slice(lastAt, pos).includes(" ")) {
      setShowMentionDropdown(true);
      setMentionSearch(val.slice(lastAt + 1, pos).toLowerCase());
      setMentionCursorPos(lastAt);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (profile: any) => {
    const before = newMessage.slice(0, mentionCursorPos);
    const after = newMessage.slice(inputRef.current?.selectionStart || 0);
    const inserted = `@${profile.firstName} `;
    setNewMessage(before + inserted + after);
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = authUser || auth.currentUser;
    if (!activeUser?.uid || !newMessage.trim() || !selectedChannelId || !canPostInSelected) return;

    try {
      await addDoc(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), {
        text: newMessage,
        senderId: activeUser.uid,
        timestamp: serverTimestamp(),
        teamId: userTeamId || "",
        isEdited: false,
        isDeleted: false,
        reactions: {}
      });
      setNewMessage("");
    } catch (err) {
      toast({ variant: "destructive", title: "Message Failed" });
    }
  };

  const handleEditMessage = async (msgId: string) => {
    if (!editValue.trim() || !selectedChannelId) return;
    try {
      await updateDoc(doc(db, "channels_UAT", selectedChannelId, "messages_UAT", msgId), {
        text: editValue,
        isEdited: true
      });
      setEditingMessageId(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Edit Failed" });
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!selectedChannelId || !confirm("Mark this message as deleted?")) return;
    try {
      await updateDoc(doc(db, "channels_UAT", selectedChannelId, "messages_UAT", msgId), {
        isDeleted: true
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const handleReaction = async (msg: any, emoji: string) => {
    if (!selectedChannelId || !authUser) return;
    const currentReactions = msg.reactions || {};
    const users = currentReactions[emoji] || [];
    const newUsers = users.includes(authUser.uid)
      ? users.filter((u: string) => u !== authUser.uid)
      : [...users, authUser.uid];

    const updatedReactions = { ...currentReactions };
    if (newUsers.length === 0) {
      delete updatedReactions[emoji];
    } else {
      updatedReactions[emoji] = newUsers;
    }

    try {
      await updateDoc(doc(db, "channels_UAT", selectedChannelId, "messages_UAT", msg.id), {
        reactions: updatedReactions
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Reaction Failed" });
    }
  };

  const renderMessageText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-[var(--tenant-primary)] font-black bg-[var(--tenant-primary)]/10 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  if (!gameLoaded || authLoading) {
    return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing Communications...</span>
    </div>;
  }

  const filteredMentions = Object.values(userProfiles).filter((p: any) => 
    p.firstName?.toLowerCase().includes(mentionSearch) || 
    p.lastName?.toLowerCase().includes(mentionSearch)
  ).slice(0, 5);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {teamData?.logoUrl ? (
            <div className="relative w-6 h-6 md:w-8 md:h-8"><Image src={teamData.logoUrl} alt="Logo" fill className="object-contain" /></div>
          ) : (<ShieldCheck className="h-5 w-5 text-[var(--tenant-primary)]" />)}
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">Team Chat</h1>
            <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">{teamData?.name || "Workspace"}</span>
          </div>
        </div>
        <UATNavbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-black/20 border-r border-white/5 hidden md:flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Channels</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
              const name = prompt("Enter Channel Name:");
              if (name) addDoc(collection(db, "channels_UAT"), {
                name: name.replace(/\s+/g, '-').toLowerCase(),
                teamId: userTeamId || "",
                type: "public",
                createdBy: authUser?.uid || "",
                createdAt: serverTimestamp()
              });
            }} disabled={!authUser}><Plus className="h-4 w-4" /></Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels.map((channel) => (
                <button key={channel.id} onClick={() => setSelectedChannelId(channel.id)} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-all", selectedChannelId === channel.id ? "bg-[var(--tenant-primary)] text-white" : "hover:bg-white/5 text-muted-foreground")}>
                  {channel.name === "Announcements" ? <Megaphone className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  <span className="text-xs font-black uppercase tracking-widest">{channel.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col relative bg-black/10">
          <div className="p-4 border-b border-white/5 bg-card/30 backdrop-blur-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-[var(--tenant-primary)]" />
                <h2 className="text-sm font-black uppercase tracking-widest">{selectedChannel?.name || "Select Channel"}</h2>
                {isAnnouncements && <Badge variant="outline" className="text-[8px] font-black uppercase border-yellow-500/50 text-yellow-500">Read-Only</Badge>}
             </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.length === 0 && !isLoadingMessages && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No messages in this workspace yet</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-4 group relative">
                  <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                    <AvatarFallback className="bg-black/40 text-[10px] font-black uppercase">
                      {getInitials(msg.senderId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {resolveRichName(msg.senderId)}
                      </span>
                      <Badge variant="secondary" className="text-[7px] font-black uppercase px-1.5 py-0 bg-white/5 text-muted-foreground">
                        {userProfiles[msg.senderId]?.role?.replace('_', ' ') || "User"}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground opacity-40 uppercase">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                        {msg.isEdited && <span className="ml-1 text-[7px] italic">(edited)</span>}
                      </span>
                    </div>
                    
                    {msg.isDeleted ? (
                      <div className="text-xs italic text-muted-foreground border border-white/5 bg-white/5 p-3 rounded-2xl rounded-tl-none">
                        This message was deleted
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-white/90 leading-relaxed break-words bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                          {editingMessageId === msg.id ? (
                            <div className="space-y-2">
                              <Input 
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)} 
                                className="bg-black/40 border-primary/20 text-sm h-8"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 text-[8px] font-black" onClick={() => handleEditMessage(msg.id)}><Check className="h-3 w-3 mr-1" /> SAVE</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-[8px] font-black" onClick={() => setEditingMessageId(null)}>CANCEL</Button>
                              </div>
                            </div>
                          ) : (
                            renderMessageText(msg.text)
                          )}
                        </div>
                        
                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                              <button 
                                key={emoji} 
                                onClick={() => handleReaction(msg, emoji)}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] transition-all",
                                  uids.includes(authUser?.uid) ? "bg-[var(--tenant-primary)]/20 border-[var(--tenant-primary)]/40" : "bg-white/5 border-white/10 hover:bg-white/10"
                                )}
                              >
                                <span>{emoji}</span>
                                <span className="font-black">{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message Actions Bar (Hover) */}
                  {!msg.isDeleted && !editingMessageId && (
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-card border border-white/10 rounded-lg shadow-xl translate-y-[-50%] p-1 gap-1 z-10">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Smile className="h-4 w-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 grid grid-cols-7 gap-1 bg-card border-white/10">
                          {COMMON_EMOJIS.map(e => (
                            <button key={e} onClick={() => handleReaction(msg, e)} className="h-8 w-8 hover:bg-white/10 rounded text-lg">{e}</button>
                          ))}
                        </PopoverContent>
                      </Popover>
                      
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Reply className="h-4 w-4" /></Button>
                      
                      {authUser?.uid === msg.senderId && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditValue(msg.text);
                        }}><Pencil className="h-4 w-4" /></Button>
                      )}
                      
                      {(isAdmin || authUser?.uid === msg.senderId) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMessage(msg.id)}><Trash2 className="h-4 w-4" /></Button>
                      )}
                      
                      {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7"><Pin className="h-4 w-4" /></Button>}
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-card/50 backdrop-blur-xl border-t border-white/5 relative">
            {/* Mention Dropdown */}
            {showMentionDropdown && (
              <div className="absolute bottom-full left-4 w-64 bg-card border border-primary/20 rounded-xl shadow-2xl mb-2 overflow-hidden z-20">
                <div className="p-2 border-b border-white/5 bg-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Team Members</span>
                </div>
                {filteredMentions.length === 0 ? (
                  <div className="p-4 text-center text-[10px] opacity-40 uppercase">No members found</div>
                ) : (
                  filteredMentions.map((p: any) => (
                    <button 
                      key={p.uid || p.id} 
                      onClick={() => selectMention(p)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[8px] font-black">{p.firstName?.[0]}{p.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase">{p.firstName} {p.lastName}</span>
                        <span className="text-[8px] font-bold opacity-40 uppercase">{p.role?.replace('_', ' ')}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                <Button variant="ghost" size="icon" className="opacity-40" type="button"><Paperclip className="h-5 w-5" /></Button>
                <Input 
                  ref={inputRef}
                  disabled={!canPostInSelected || !authUser} 
                  value={newMessage} 
                  onChange={handleInputChange} 
                  placeholder={canPostInSelected ? (authUser ? "Type a message... (@ for team)" : "Waiting for auth...") : "Announcements are read-only"} 
                  className="bg-transparent border-none focus-visible:ring-0 font-bold text-sm h-10 px-0" 
                />
                <Button variant="ghost" size="icon" className="opacity-40" type="button"><Smile className="h-5 w-5" /></Button>
                <Button disabled={!newMessage.trim() || !canPostInSelected || !authUser} type="submit" size="icon" className="h-10 w-10 bg-[var(--tenant-primary)]"><Send className="h-4 w-4" /></Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function UATMessagesPage() {
  return (
    <UATGameProvider>
      <UATMessagesContent />
    </UATGameProvider>
  );
}
