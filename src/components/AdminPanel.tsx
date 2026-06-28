
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
  AlertCircle
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
      setAuthError(false);
    } else {
      setAuthError(true);
    }
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

  // Unauthenticated View
  if (!isAdmin) {
    return (
      <div className="relative z-50">
        <Button 
          onClick={() => { setShowLoginFields(!showLoginFields); setAuthError(false); }} 
          className="bg-primary hover:bg-primary/90 font-black uppercase h-10 px-6 shadow-lg tracking-widest transition-all transform active:scale-95"
        >
          {showLoginFields ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />} 
          {showLoginFields ? "CLOSE" : "UNLOCK"}
        </Button>
        
        {showLoginFields && (
          <div className="absolute top-12 right-0 w-72 bg-card border-2 border-primary/20 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] animate-in slide-in-from-top-4 fade-in duration-300">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Booth Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter password..." 
                    className={cn(
                      "pl-10 pr-12 h-12 text-xs bg-black/40 border-white/10 transition-colors",
                      authError && "border-destructive/50 bg-destructive/5"
                    )}
                    value={authPassword} 
                    onChange={e => { setAuthPassword(e.target.value); setAuthError(false); }} 
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {authError && (
                  <div className="flex items-center gap-1.5 text-destructive animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase">Incorrect Password. Please try again.</span>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full h-11 font-black uppercase text-xs tracking-widest shadow-lg">Verify Access</Button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Authenticated View
  return (
    <div className="flex items-center gap-3 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary bg-primary/10 border border-primary/20 shadow-lg hover:bg-primary/20 transition-all rounded-full transform hover:rotate-45">
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
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Category</Label>
              <Select value={activeSection} onValueChange={(v) => setActiveSection(v as AdminSection)}>
                <SelectTrigger className="h-12 bg-black/20 font-bold border-white/5">
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
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Player</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="h-12 bg-black/20 font-bold border-white/5">
                      <SelectValue placeholder="Add New Player..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="font-black text-primary">+ ADD NEW PLAYER</SelectItem>
                      {roster.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Full Name</Label>
                    <Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} placeholder="Player Name" className="font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Jersey Number</Label>
                    <Input type="number" value={playerForm.number || ""} onChange={e => setPlayerForm({...playerForm, number: parseInt(e.target.value) || 0})} placeholder="Jersey #" className="font-bold" />
                  </div>
                </div>
                <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                    <Mic2 className="h-3 w-3" /> Announcement Audio
                  </Label>
                  <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="bg-black/20 cursor-pointer border-dashed border-white/10" />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                    <Music className="h-3 w-3" /> Walk-Up Tracks (YouTube)
                  </Label>
                  {playerForm.songs.map((song, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
                      <Input className="col-span-4 h-9 text-[10px] font-bold" placeholder="Track Name" value={song.name} onChange={e => {
                        const next = [...playerForm.songs]; next[idx].name = e.target.value; setPlayerForm({...playerForm, songs: next});
                      }} />
                      <Input className="col-span-5 h-9 text-[10px] font-bold" placeholder="YouTube URL/ID" value={song.videoId} onChange={e => {
                        const next = [...playerForm.songs]; next[idx].videoId = e.target.value; setPlayerForm({...playerForm, songs: next});
                      }} />
                      <Input className="col-span-3 h-9 text-[10px] font-bold" placeholder="Start (s)" type="number" value={song.startAt || ""} onChange={e => {
                        const next = [...playerForm.songs]; next[idx].startAt = parseInt(e.target.value) || 0; setPlayerForm({...playerForm, songs: next});
                      }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 h-14 font-black uppercase tracking-widest bg-primary shadow-lg shadow-primary/20" onClick={handleSavePlayer} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5 mr-2" />} SAVE PLAYER
                  </Button>
                  {selectedPlayerId !== "new" && (
                    <Button variant="destructive" className="h-14 w-14 shadow-lg shadow-destructive/20" onClick={() => { if(confirm("Delete this player?")) { deletePlayer(selectedPlayerId); setSelectedPlayerId("new"); } }}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-black/20 rounded-2xl space-y-4 border border-white/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase opacity-50 tracking-tighter">Track Title</Label>
                      <Input placeholder="Enter title..." value={songForm.title} onChange={e => setSongForm({...songForm, title: e.target.value})} className="font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase opacity-50 tracking-tighter">Start Offset (s)</Label>
                      <Input type="number" placeholder="0" value={songForm.startTime || ""} onChange={e => setSongForm({...songForm, startTime: parseInt(e.target.value) || 0})} className="font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase opacity-50 tracking-tighter">YouTube Link or ID</Label>
                    <Input placeholder="https://www.youtube.com/watch?v=..." value={songForm.link} onChange={e => setSongForm({...songForm, link: e.target.value})} />
                  </div>
                  <Button className="w-full h-12 font-black uppercase tracking-widest bg-secondary text-secondary-foreground shadow-lg shadow-secondary/10" onClick={handleSaveStadiumSong}>
                    <Plus className="h-5 w-5 mr-2" /> ADD TO STADIUM
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Current Stadium Tracks</Label>
                  <div className="grid gap-2">
                    {(activeSection === "organ" ? organSongs : pumpUpSongs).map(song => (
                      <div key={song.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase tracking-wider">{song.title}</span>
                          <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">Starts @ {song.startTime}s</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive opacity-40 group-hover:opacity-100 transition-opacity hover:bg-destructive/10" onClick={() => { if(confirm("Remove this track?")) deleteStadiumSong(activeSection === "organ" ? "organ" : "pumpup", song.id); }}>
                          <Trash2 className="h-4 w-4" />
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
      
      <Button 
        variant="outline" 
        onClick={adminLogout} 
        className="h-10 px-5 border-destructive/20 text-destructive hover:bg-destructive/10 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg transition-all"
      >
        <LogOut className="h-3.5 w-3.5 mr-2" /> LOGOUT
      </Button>
    </div>
  );
}
