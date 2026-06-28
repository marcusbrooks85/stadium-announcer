"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { useGame, Player, Song } from "@/app/context/game-context";
import { initializeFirebase } from "@/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Music, 
  Mic2, 
  ShieldAlert,
  Loader2,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel() {
  const { roster, isAdmin, adminLogin, savePlayer, deletePlayer } = useGame();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("new");

  const [formData, setFormData] = useState({
    name: "",
    number: 0,
    announcementAudioUrl: "",
    songs: [
      { name: "", videoId: "", startAt: 0 },
      { name: "", videoId: "", startAt: 0 },
      { name: "", videoId: "", startAt: 0 }
    ]
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedPlayerId === "new") {
      setFormData({
        name: "",
        number: 0,
        announcementAudioUrl: "",
        songs: [
          { name: "", videoId: "", startAt: 0 },
          { name: "", videoId: "", startAt: 0 },
          { name: "", videoId: "", startAt: 0 }
        ]
      });
      setAudioFile(null);
    } else {
      const p = roster.find(player => player.id === selectedPlayerId);
      if (p) {
        setFormData({
          name: p.name,
          number: p.number,
          announcementAudioUrl: p.announcementAudioUrl,
          songs: p.songs.length >= 3 ? p.songs : [...p.songs, ...Array(3 - p.songs.length).fill({ name: "", videoId: "", startAt: 0 })]
        });
        setAudioFile(null);
      }
    }
  }, [selectedPlayerId, roster]);

  const parseYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const parseStartTime = (timeStr: string) => {
    if (!timeStr) return 0;
    if (typeof timeStr === 'number') return timeStr;
    const match = timeStr.match(/(?:(\d+)m)?(?:(\d+)s)?/);
    if (!match) return parseInt(timeStr) || 0;
    const minutes = parseInt(match[1]) || 0;
    const seconds = parseInt(match[2]) || 0;
    return (minutes * 60) + seconds;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let audioUrl = formData.announcementAudioUrl;

      if (audioFile) {
        const { firebaseApp } = initializeFirebase();
        const storage = getStorage(firebaseApp);
        const fileName = `announcements/${Date.now()}-${audioFile.name}`;
        const storageRef = ref(storage, fileName);
        const uploadResult = await uploadBytes(storageRef, audioFile);
        audioUrl = await getDownloadURL(uploadResult.ref);
      }

      const playerToSave = {
        ...formData,
        announcementAudioUrl: audioUrl,
        songs: formData.songs.map(s => ({
          name: s.name,
          videoId: parseYoutubeId(s.videoId),
          startAt: parseStartTime(s.startAt.toString())
        }))
      };

      // Initiate save and close immediately for better UX
      savePlayer(playerToSave, selectedPlayerId === "new" ? undefined : selectedPlayerId);
      toast({ title: "Stadium Updated", description: `${formData.name} is ready for walk-on.` });
      setIsOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync with stadium database." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (deletePassword !== "Chewy2026") {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect master password." });
      return;
    }
    deletePlayer(selectedPlayerId);
    toast({ title: "Player Removed", description: "Numerical roster updated." });
    setIsDeleting(false);
    setSelectedPlayerId("new");
  };

  if (!isAdmin) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary"><Settings className="h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogHeader><DialogTitle className="text-primary uppercase tracking-widest text-sm font-black">Booth Access</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="Enter Booth Password..." 
                className="pl-10"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
            <Button className="w-full font-black uppercase" onClick={() => adminLogin(authPassword)}>Enter Booth</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary animate-pulse"><Settings className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-widest text-sm font-black flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Stadium Management Panel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Player to Edit</Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="h-12 bg-black/20 font-bold">
                <SelectValue placeholder="Add New Player..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new" className="font-black text-primary"><Plus className="h-3 w-3 inline mr-2" /> ADD NEW PLAYER</SelectItem>
                {roster.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Player Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mike Trout" className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Jersey #</Label>
              <Input 
                type="number" 
                value={isNaN(formData.number) ? "" : formData.number} 
                onChange={(e) => setFormData({...formData, number: parseInt(e.target.value) || 0})} 
                className="font-bold digit-font" 
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
              <Mic2 className="h-3 w-3" /> Stadium Announcement
            </Label>
            <div className="space-y-2">
              <Input 
                type="file" 
                accept="audio/*" 
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="bg-black/20 text-[10px] cursor-pointer"
              />
              {formData.announcementAudioUrl && !audioFile && (
                <p className="text-[9px] text-muted-foreground truncate">Current: {formData.announcementAudioUrl}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase text-secondary flex items-center gap-2">
              <Music className="h-3 w-3" /> Walk-Up Tracks
            </Label>
            {formData.songs.map((song, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="col-span-4 space-y-1">
                  <Label className="text-[8px] uppercase text-muted-foreground">Track {idx + 1} Name</Label>
                  <Input value={song.name} onChange={(e) => {
                    const newSongs = [...formData.songs];
                    newSongs[idx].name = e.target.value;
                    setFormData({...formData, songs: newSongs});
                  }} className="h-8 text-[10px] font-bold" placeholder="Track Name" />
                </div>
                <div className="col-span-5 space-y-1">
                  <Label className="text-[8px] uppercase text-muted-foreground">YouTube URL / Video ID</Label>
                  <Input value={song.videoId} onChange={(e) => {
                    const newSongs = [...formData.songs];
                    newSongs[idx].videoId = e.target.value;
                    setFormData({...formData, songs: newSongs});
                  }} className="h-8 text-[10px]" placeholder="https://..." />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[8px] uppercase text-muted-foreground">Start (e.g. 1m30s)</Label>
                  <Input 
                    value={song.startAt} 
                    onChange={(e) => {
                      const newSongs = [...formData.songs];
                      newSongs[idx].startAt = e.target.value as any;
                      setFormData({...formData, songs: newSongs});
                    }} 
                    className="h-8 text-[10px] digit-font" 
                    placeholder="0" 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1 h-12 font-black uppercase bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {selectedPlayerId === "new" ? "Add to Stadium" : "Update Stadium"}
            </Button>
            
            {selectedPlayerId !== "new" && (
              <Button variant="destructive" className="h-12 px-6" onClick={() => setIsDeleting(true)}><Trash2 className="h-4 w-4" /></Button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
          <DialogContent className="sm:max-w-md bg-destructive text-white border-none shadow-2xl">
            <DialogHeader><DialogTitle className="text-white font-black uppercase text-center">Security Confirmation</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4 text-center">
              <p className="text-xs font-bold opacity-90">Warning: This will permanently remove {formData.name} from the stadium database.</p>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase">Type 'Chewy2026' to Confirm</Label>
                <Input 
                  type="password" 
                  className="bg-white/20 border-white/20 text-white placeholder:text-white/50" 
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button variant="outline" className="text-destructive font-black uppercase" onClick={handleDelete}>Finalize Deletion</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
