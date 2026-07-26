"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Send, Plus, Paperclip, Smile, Loader2, MessageSquare, Reply, Pencil, Trash2, X, Check, ArrowLeft, User, Search, Archive, ChevronLeft, MessagesSquare, Users, BarChart2, Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useFirestore, useAuth, useUser } from "@/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp, limit, arrayUnion, arrayRemove } from "firebase/firestore";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useSound from 'use-sound';

const COMMON_EMOJIS = ["👍", "❤️", "🔥", "⚾", "😂", "🙌", "💯", "✅"];
const SEND_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

function PollCard({ poll, onVote, user }: any) {
  const isSnackDuty = poll.type === "snack-duty";
  return (
    <Card className="bg-black/40 border-primary/20 p-4 space-y-4 max-w-sm rounded-2xl">
      <div className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">{poll.question}</span></div>
      <div className="space-y-2">
        {poll.options.map((opt: any) => {
          const votes = poll.votes?.[opt.id] || [];
          const hasVoted = votes.includes(user?.uid);
          return (
            <button key={opt.id} onClick={() => onVote(poll.id, opt)} className={cn("w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left", hasVoted ? "bg-primary border-primary" : "bg-white/5 border-white/10 hover:bg-white/10")}>
              <div className="flex flex-col"><span className="text-xs font-bold">{opt.text}</span>{votes.length > 0 && <span className="text-[8px] font-black uppercase opacity-60 mt-1">{votes.length} Votes</span>}</div>
              {hasVoted && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
      {isSnackDuty && <p className="text-[8px] font-bold text-muted-foreground uppercase text-center">Click a date to sign up for snack duty.</p>}
    </Card>
  );
}

function UATMessagesContent() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useUser();
  const { userRole, userTeamId, teamData, roster, games, saveGame } = useUATGame();
  const { toast } = useToast();
  const [playSend] = useSound(SEND_SOUND, { volume: 0.5 });

  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(searchParams.get('cid'));

  useEffect(() => {
    if (!db || !userTeamId) return;
    return onSnapshot(query(collection(db, "channels_UAT"), where("teamId", "==", userTeamId)), (snap) => {
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [db, userTeamId]);

  useEffect(() => {
    if (!db || !selectedChannelId) return;
    return onSnapshot(query(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), orderBy("timestamp", "asc"), limit(50)), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [db, selectedChannelId]);

  const handleSendMessage = async (e?: React.FormEvent, pollData?: any) => {
    if (e) e.preventDefault();
    if (!auth.currentUser || (!newMessage.trim() && !pollData) || !selectedChannelId) return;
    try {
      playSend();
      await addDoc(collection(db, "channels_UAT", selectedChannelId, "messages_UAT"), {
        text: newMessage,
        type: pollData ? "poll" : "text",
        pollData: pollData || null,
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        teamId: userTeamId || "",
        reactions: {}
      });
      setNewMessage("");
    } catch (e) { toast({ title: "Failed to send" }); }
  };

  const handleCreateSnackDutyPoll = () => {
    const options = games.slice(0, 5).map(g => ({ id: g.id, text: `${new Date(g.date).toLocaleDateString()} @ ${g.time}` }));
    handleSendMessage(undefined, { question: "Snack Duty Sign-up", type: "snack-duty", options, votes: {} });
  };

  const handleVote = async (msgId: string, opt: any) => {
    if (!auth.currentUser || !selectedChannelId) return;
    const msgRef = doc(db, "channels_UAT", selectedChannelId, "messages_UAT", msgId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const poll = data.pollData;
    const currentVotes = poll.votes?.[opt.id] || [];
    
    if (poll.type === "snack-duty") {
      const userSnap = await getDoc(doc(db, "users_UAT", auth.currentUser.uid));
      const userProf = userSnap.exists() ? userSnap.data() : null;
      if (userProf?.playerId) {
        await saveGame({ snackPlayerId: userProf.playerId }, opt.id);
        toast({ title: "Snack Duty Assigned", description: `You have signed up for ${opt.text}` });
      }
    }

    const updatedVotes = { ...poll.votes };
    if (currentVotes.includes(auth.currentUser.uid)) {
      updatedVotes[opt.id] = currentVotes.filter((u:string) => u !== auth.currentUser?.uid);
    } else {
      updatedVotes[opt.id] = [...currentVotes, auth.currentUser.uid];
    }
    await updateDoc(msgRef, { "pollData.votes": updatedVotes });
  };

  if (!userTeamId) return <div className="h-screen flex items-center justify-center stadium-gradient"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3"><h1 className="font-headline font-black uppercase text-sm">TEAM MESSAGES</h1></div>
        <UATNavbar />
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-card/40 border-r border-border hidden lg:flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Conversations</span>
            <Button variant="ghost" size="icon" onClick={() => setIsCreateDialogOpen(true)} className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
          </div>
          <ScrollArea className="flex-1">{channels.map(c => (
            <button key={c.id} onClick={() => setSelectedChannelId(c.id)} className={cn("w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left", selectedChannelId === c.id && "bg-primary")}>
              <Avatar className="h-9 w-9"><AvatarFallback>{(c.name?.[0] || "#").toUpperCase()}</AvatarFallback></Avatar>
              <span className="text-xs font-black uppercase tracking-wider">{c.name}</span>
            </button>
          ))}</ScrollArea>
        </aside>
        <main className="flex-1 flex flex-col relative bg-black/10">
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map(m => (
                <div key={m.id} className={cn("flex flex-col", m.senderId === auth.currentUser?.uid ? "items-end" : "items-start")}>
                  {m.type === "poll" ? <PollCard poll={m.pollData} onVote={(id:string, opt:any) => handleVote(m.id, opt)} user={auth.currentUser} /> : (
                    <div className={cn("p-3 rounded-2xl text-sm max-w-[80%]", m.senderId === auth.currentUser?.uid ? "bg-primary text-white" : "bg-white/10")}>{m.text}</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 bg-card/60 backdrop-blur-xl border-t border-white/5">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-black/50 p-2 rounded-3xl border border-white/10 max-w-4xl mx-auto w-full">
              {["super_admin", "league_admin"].includes(userRole || "") && <Button type="button" onClick={handleCreateSnackDutyPoll} variant="ghost" size="icon" className="h-10 w-10 text-secondary"><Utensils className="h-5 w-5" /></Button>}
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Send a message..." className="bg-transparent border-none focus-visible:ring-0 font-bold" />
              <Button type="submit" size="icon" className="h-10 w-10 bg-primary"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function UATMessagesPage() { return <UATGameProvider><UATMessagesContent /></UATGameProvider>; }
