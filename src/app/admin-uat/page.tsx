
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldAlert,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

function UATAdminContent() {
  const { 
    roster, 
    savePlayer, 
    deletePlayer 
  } = useUATGame();
  
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Player Form
  const [playerForm, setPlayerForm] = useState({ name: "", number: 0 });

  // Game Form
  const [gameForm, setGameForm] = useState({ home: "", away: "", time: "", location: "" });

  const handleAddPlayer = async () => {
    if (!playerForm.name) return;
    setIsSaving(true);
    try {
      savePlayer({
        name: playerForm.name,
        number: playerForm.number,
        announcementAudioUrl: "",
        songs: []
      });
      setPlayerForm({ name: "", number: 0 });
      toast({ title: "Test Player Added" });
    } finally { setIsSaving(false); }
  };

  const handleAddGame = async () => {
    if (!gameForm.home || !gameForm.away || !db) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "games_UAT"), {
        ...gameForm,
        createdAt: new Date().toISOString()
      });
      setGameForm({ home: "", away: "", time: "", location: "" });
      toast({ title: "Test Game Added" });
    } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground stadium-gradient p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-40">
        <header className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-lg flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-primary" /> UAT MANAGEMENT
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Isolated Test Configuration</p>
          </div>
          <Link href="/uat">
            <Button variant="outline" className="font-black uppercase tracking-widest text-[10px]">Back to Onboarding</Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4" /> Add Test Player
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Player Name</Label>
                <Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Jersey Number</Label>
                <Input type="number" value={playerForm.number || ""} onChange={e => setPlayerForm({...playerForm, number: parseInt(e.target.value) || 0})} className="h-10" />
              </div>
              <Button onClick={handleAddPlayer} className="w-full bg-primary font-black uppercase" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />} Add Player
              </Button>

              <div className="mt-6 space-y-2">
                <Label className="text-[10px] uppercase font-black opacity-50">Current UAT Roster</Label>
                {roster.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                    <span className="text-xs font-bold">#{p.number} - {p.name}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlayer(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Add Test Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black">Home Team</Label>
                  <Input value={gameForm.home} onChange={e => setGameForm({...gameForm, home: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black">Away Team</Label>
                  <Input value={gameForm.away} onChange={e => setGameForm({...gameForm, away: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="e.g. 2:00 PM" className="pl-10" value={gameForm.time} onChange={e => setGameForm({...gameForm, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Field Name" className="pl-10" value={gameForm.location} onChange={e => setGameForm({...gameForm, location: e.target.value})} />
                </div>
              </div>
              <Button onClick={handleAddGame} className="w-full bg-secondary text-secondary-foreground font-black uppercase" disabled={isSaving}>
                <Plus className="h-4 w-4 mr-2" /> Schedule UAT Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-md border-t border-white/5 flex justify-center gap-4">
        <Link href="/schedule-uat"><Button variant="ghost" size="sm" className="font-black uppercase text-[10px]"><Calendar className="h-4 w-4 mr-2" /> UAT Schedule</Button></Link>
        <Link href="/booth-uat"><Button variant="ghost" size="sm" className="font-black uppercase text-[10px]"><Zap className="h-4 w-4 mr-2" /> UAT Booth</Button></Link>
      </footer>
    </div>
  );
}

export default function UATAdminPage() {
  return (
    <UATGameProvider>
      <UATAdminContent />
    </UATGameProvider>
  );
}
