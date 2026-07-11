"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Hash, 
  Plus, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  ShieldCheck,
  Search,
  Loader2,
  Lock,
  Megaphone,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  serverTimestamp, 
  doc, 
  getDoc,
  limit
} from "firebase/firestore";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function UATMessagesContent() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { userRole, userTeamId, teamData, isLoaded: gameLoaded } = useUATGame();
  const { toast } = useToast();
  
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  const isAnnouncements = selectedChannel?.name === "Announcements";
  const canPostInSelected = !isAnnouncements || (userRole === "super_admin" || userRole === "league_admin");

  // Fetch Channels
  useEffect(() => {
    if (!db || !userTeamId) return;

    const q = query(
      collection(db, "channels_UAT"),
      where("teamId", "==", userTeamId),
      orderBy("name", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const channelList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Auto-create Announcements if missing
      if (channelList.length === 0 && userRole === "super_admin") {
        addDoc(collection(db, "channels_UAT"), {
          name: "Announcements",
          teamId: userTeamId,
          type: "broadcast",
          createdAt: serverTimestamp()
        });
      }
      
      setChannels(channelList);
      if (!selectedChannelId && channelList.length > 0) {
        setSelectedChannelId(channelList[0].id);
      }
    });

    return () => unsubscribe();
  }, [db, userTeamId, userRole, selectedChannelId]);

  // Fetch Messages for Selected Channel
  useEffect(() => {
    if (!db || !selectedChannelId) return;

    setIsLoadingMessages(true);
    const q = query(
      collection(db, "channels_UAT", selectedChannelId, "messages_UAT"),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoadingMessages(false);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [db, selectedChannelId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = user || auth.currentUser;
    if (!newMessage.trim() || !selectedChannelId || !activeUser || !canPostInSelected) return;

    try {
      const userDoc = await getDoc(doc(db, "users_UAT", activeUser.uid));
      const userData = userDoc.data();

      addDoc(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), {
        text: newMessage,
        senderId: activeUser.uid,
        senderName: userData?.fullName || activeUser.email?.split('@')[0],
        senderRole: userRole,
        timestamp: serverTimestamp()
      });

      setNewMessage("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Message Failed", description: err.message });
    }
  };

  const handleCreateChannel = async () => {
    // Robust UID Guard
    const activeUser = user || auth.currentUser;
    
    if (!activeUser) {
      if (!authLoading) {
        toast({ variant: "destructive", title: "Access Denied", description: "You must be signed in to create channels." });
      }
      return;
    }

    // Workspace Guard
    if (!userTeamId) {
      toast({ variant: "destructive", title: "Missing Workspace", description: "Your account is not linked to a team workspace." });
      return;
    }

    const name = prompt("Enter Channel Name:");
    if (!name) return;

    try {
      await addDoc(collection(db, "channels_UAT"), {
        name: name.replace(/\s+/g, '-').toLowerCase(),
        teamId: userTeamId || '',
        type: "public",
        createdBy: activeUser.uid || '',
        createdAt: serverTimestamp()
      });
      toast({ title: "Channel Created" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (!gameLoaded || authLoading) {
    return <div className="min-h-screen flex items-center justify-center stadium-gradient"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--tenant-primary)]" />
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">Team Communications</h1>
            <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">Verified Workspace: {teamData?.name}</span>
          </div>
        </div>
        <UATNavbar />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-black/20 border-r border-white/5 hidden md:flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Channels</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateChannel} disabled={authLoading}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(channel.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                    selectedChannelId === channel.id 
                      ? "bg-[var(--tenant-primary)] text-white shadow-lg" 
                      : "hover:bg-white/5 text-muted-foreground"
                  )}
                >
                  {channel.name === "Announcements" ? <Megaphone className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  <span className="text-xs font-black uppercase tracking-widest">{channel.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col relative bg-black/10">
          <div className="p-4 border-b border-white/5 bg-card/30 backdrop-blur-sm flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-[var(--tenant-primary)]" />
                <h2 className="text-sm font-black uppercase tracking-widest">{selectedChannel?.name || "Select Channel"}</h2>
                {isAnnouncements && <Badge variant="outline" className="text-[8px] font-black uppercase border-yellow-500/50 text-yellow-500">Read-Only</Badge>}
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40"><Search className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40"><MoreVertical className="h-4 w-4" /></Button>
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
                <div key={msg.id} className="flex gap-4 group">
                  <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                    <AvatarFallback className="bg-black/40 text-[10px] font-black uppercase">
                      {msg.senderName?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider">{msg.senderName}</span>
                      <Badge variant="secondary" className="text-[7px] font-black uppercase px-1.5 py-0 bg-white/5 border-white/10 text-muted-foreground">
                        {msg.senderRole?.replace('_', ' ') || "User"}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground opacity-40 uppercase">
                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white/90 leading-relaxed break-words bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 bg-card/50 backdrop-blur-xl border-t border-white/5">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
              <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-white/5 opacity-40" type="button">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  disabled={!canPostInSelected}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={canPostInSelected ? "Type a message..." : "Only administrators can broadcast in this channel"}
                  className="bg-transparent border-none focus-visible:ring-0 font-bold text-sm h-10 px-0"
                />
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-white/5 opacity-40" type="button">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button 
                  disabled={!newMessage.trim() || !canPostInSelected}
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 shrink-0 bg-[var(--tenant-primary)] shadow-lg hover:brightness-110"
                >
                  <Send className="h-4 w-4" />
                </Button>
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