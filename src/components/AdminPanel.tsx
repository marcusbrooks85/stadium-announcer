"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useGame, Player, StadiumSong } from "@/app/context/game-context";
import { useStorage, useFirestore } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc } from "firebase/firestore";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Music, 
  Mic2, 
  ShieldAlert,
  Loader2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AdminSection = "players" | "organ" | "pumpup";

export function AdminPanel() {
  const { 
    roster, 
    organSongs, 
    pumpUpSongs, 
    isAdmin, 
    adminLogin, 
    adminLogout, 
    savePlayer, 
    deletePlayer,
    saveStadiumSong,
    deleteStadiumSong 
  } = useGame();
  
  const storage = useStorage();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<AdminSection>("players");
  const [showLoginFields, setShowLoginFields] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form States
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("new");
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: 0,
    announcementAudioUrl: "",
    songs: [{ name: "", videoId: "", startAt: 0 }, { name: "", videoId: "", startAt: 0 }, { name: "", videoId: "", startAt: 0 }]
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const [songForm, setSongForm] = useState({ title: "", link: "", startTime: 0 });

  useEffect(() => {
    if (activeSection === "players") {
      if (selectedPlayerId === "new") {
        setPlayerForm({ name: "", number: 0, announcementAudioUrl: "", songs: Array(3).fill({ name: "", videoId: "", startAt: 0 }) });
      } else {
        const p = roster.find(player => player.id === selectedPlayerId);
        if (p) setPlayerForm({ name: p.name, number: p.number, announcementAudioUrl: p.announcementAudioUrl, songs: [...p.songs, ...Array(Math.max(0, 3 - p.songs.length)).fill({ name: "", videoId: "", startAt: 0 })].slice(0,3) });
      }
    }
  }, [selectedPlayerId, roster, activeSection]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(authPassword)) {
      toast({ title: "Booth Access Granted" });
      setAuthPassword("");
      setShowLoginFields(false);
    } else setAuthError(true);
  };

  const parseYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleSavePlayer = async () => {
    if (!db || !storage) return;
    setIsSaving(true);
    try {
      let playerId = selectedPlayerId === "new" ? doc(collection(db, "players")).id : selectedPlayerId;
      let audioUrl = playerForm.announcementAudioUrl;

      if (audioFile) {
        const storageRef = ref(storage, `audio/${playerId}.mp3`);
        await uploadBytes(storageRef, audioFile);
        audioUrl = `${await getDownloadURL(storageRef)}?t=${Date.now()}`;
      }

      const data = {
        name: playerForm.name,
        number: playerForm.number,
        announcementAudioUrl: audioUrl,
        songs: playerForm.songs.map(s => ({ name: s.name, videoId: parseYoutubeId(s.videoId), startAt: Number(s.startAt) || 0 }))
      };

      savePlayer(data, playerId);
      toast({ title: "Player Profile Saved" });
      setSelectedPlayerId("new");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleSaveStadiumSong = () => {
    if (!songForm.title || !songForm.link) { toast({ variant: "destructive", title: "Missing Data" }); return; }
    const category = activeSection === "organ" ? "organ" : "pumpup";
    saveStadiumSong(category, {
      title: songForm.title,
      link: parseYoutubeId(songForm.link),
      startTime: Number(songForm.startTime) || 0
    });
    setSongForm({ title: "", link: "", startTime: 0 });
    toast({ title: "Track Added to Stadium" });
  };

  if (!isAdmin) {
    return (
      <div className="relative">
        <Button onClick={() => setShowLoginFields(!showLoginFields)} className="bg-primary hover:bg-primary/90 font-black uppercase h-10 px-6 shadow-lg">
          {showLoginFields ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />} ADMIN
        </Button>
        {showLoginFields && (
          <div className="absolute top-12 right-0 w-64 bg-card border border-primary/20 p-4 rounded-xl shadow-2xl z-[60] animate-in slide-in-from-top-2">
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} placeholder="Password..." className="pl-10 h-10 text-xs" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-9 font-black uppercase text-[10px]">Verify</Button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary bg-primary/10 border border-primary/20 shadow-lg">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-widest text-sm font-black flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Stadium Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Category</Label>
              <Select value={activeSection} onValueChange={(v) => setActiveSection(v as AdminSection)}>
                <SelectTrigger className="h-12 bg-black/20 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="players" className="font-bold">Players & Roster</SelectItem>
                  <SelectItem value="organ" className="font-bold">Organ Master Hits</SelectItem>
                  <SelectItem value="pumpup" className="font-bold">Crowd Pump-Up Hype</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeSection === "players" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Player</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="h-12 bg-black/20 font-bold">
                      <SelectValue placeholder="Add New Player..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="font-black text-primary">+ ADD NEW PLAYER</SelectItem>
                      {roster.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} placeholder="Player Name" className="font-bold" />
                  <Input type="number" value={playerForm.number || ""} onChange={e => setPlayerForm({...playerForm, number: parseInt(e.target.value) || 0})} placeholder="Jersey #" className="font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Announcement Audio</Label>
                  <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="bg-black/20 cursor-pointer" />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-secondary">Walk-Up Tracks (YouTube)</Label>
                  {playerForm.songs.map((song, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-black/20 rounded-lg">
                      <Input className="col-span-4 h-8 text-[10px]" placeholder="Name" value={song.name} onChange={e => {
                        const next = [...playerForm.songs]; next[idx].name = e.target.value; setPlayerForm({...playerForm, songs: next});
                      }} />
                      <Input className="col-span-5 h-8 text-[10px]" placeholder="YouTube Link" value={song.videoId} onChange={e => {
                        const next = [...playerForm.songs]; next[idx].videoId = e.target.value; setPlayerForm({...playerForm, songs: next});
                      }} />
                      <Input className="col-span-3 h-8 text-[10px]" placeholder="Start (sec)" type="number" value={song.startAt || ""} onChange={e => {
                        const next = [...playerForm.songs]; next[idx].startAt = parseInt(e.target.value) || 0; setPlayerForm({...playerForm, songs: next});
                      }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-12 font-black uppercase bg-primary" onClick={handleSavePlayer} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />} SAVE PLAYER
                  </Button>
                  {selectedPlayerId !== "new" && (
                    <Button variant="destructive" className="h-12 w-12" onClick={() => { deletePlayer(selectedPlayerId); setSelectedPlayerId("new"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-black/20 rounded-xl space-y-4 border border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase opacity-50">Title</Label>
                      <Input placeholder="Track Title" value={songForm.title} onChange={e => setSongForm({...songForm, title: e.target.value})} className="font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase opacity-50">Start (sec)</Label>
                      <Input type="number" placeholder="0" value={songForm.startTime || ""} onChange={e => setSongForm({...songForm, startTime: parseInt(e.target.value) || 0})} className="font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[8px] font-black uppercase opacity-50">YouTube Link</Label>
                    <Input placeholder="https://..." value={songForm.link} onChange={e => setSongForm({...songForm, link: e.target.value})} />
                  </div>
                  <Button className="w-full h-10 font-black uppercase bg-secondary text-secondary-foreground" onClick={handleSaveStadiumSong}>
                    <Plus className="h-4 w-4 mr-2" /> ADD TO STADIUM
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Current Tracks</Label>
                  <div className="space-y-2">
                    {(activeSection === "organ" ? organSongs : pumpUpSongs).map(song => (
                      <div key={song.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{song.title}</span>
                          <span className="text-[8px] text-muted-foreground font-mono">Starts @ {song.startTime}s</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteStadiumSong(activeSection === "organ" ? "organ" : "pumpup", song.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Button variant="ghost" onClick={adminLogout} className="text-[9px] font-black uppercase text-muted-foreground hover:text-destructive">
        <LogOut className="h-3 w-3 mr-1" /> LOGOUT
      </Button>
    </div>
  );
}
