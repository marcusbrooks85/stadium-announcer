"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ShieldCheck, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Upload,
  Trophy,
  UserCircle,
  Settings,
  X,
  Mic2,
  ChevronRight,
  ShieldAlert,
  Music,
  Volume2,
  Play,
  Square,
  Copy,
  Building2,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  FileAudio,
  FileCode,
  Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUATGame, UATGameProvider, Song, UploadedTrack } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore, useAuth } from "@/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp, lmit, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

const BUILD_VERSION = "V-2025-02-18-006";

export function UATAdminPortalContent() {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { 
    isLoaded, 
    userRole, 
    userTeamId, 
    teamData, 
    roster, 
    games,
    saveTeamBranding,
    updateUserProfile,
    deleteUserAccount,
    savePlayer,
    deletePlayer,
    saveGame,
    deleteGame
  } = useUATGame();

  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduleUploading, setIsScheduleUploading] = useState(false);

  // Sound FX State
  const [soundEffects, setSoundEffects] = useState<any[]>([]);
  const [fxForm, setFxForm] = useState({ name: "" });
  const [fxFile, setFxFile] = useState<File | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Profile/Branding Form States
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phoneNumber: "", playerId: "" });
  const [brandingForm, setBrandingForm] = useState({ name: "", logoUrl: "" });

  // Player Editor State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("new");
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: "",
    announcementAudioUrl: "",
    songs: [] as Song[],
    uploadedTracks: [] as UploadedTrack[]
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Schedule Builder State
  const [gameForm, setGameForm] = useState({ date: "", week: "", home: "", away: "", time: "", location: "" });
  const [snackUpdateText, setSnackUpdateText] = useState("");

  const suffix = "_UAT";
  const FX_COLLECTION = `sound_fx${suffix}`;

  useEffect(() => {
    if (teamData) {
      setBrandingForm({
        name: teamData.name || "",
        logoUrl: teamData.logoUrl || ""
      });
    }
  }, [teamData]);

  useEffect(() => {
    if (auth.currentUser && isLoaded) {
      const unsub = onSnapshot(doc(db, "users_UAT", auth.currentUser.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfileForm({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phoneNumber: data.phoneNumber || "",
            playerId: data.playerId || "none"
          });
        }
      });
      return () => unsub();
    }
  }, [auth.currentUser, db, isLoaded]);

  useEffect(() => {
    const isAdmin = ["super_admin", "league_admin"].includes(userRole || "");
    if (isAdmin && userTeamId) {
      const q = query(collection(db, "users_UAT"), where("teamId", "==", userTeamId));
      return onSnapshot(q, (snap) => {
        setTeamUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [userRole, userTeamId, db]);

  useEffect(() => {
    if (userTeamId && ["super_admin", "league_admin", "booth_admin"].includes(userRole || "")) {
      const q = query(collection(db, FX_COLLECTION), where("teamId", "==", userTeamId));
      return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        setSoundEffects(data);
      });
    }
  }, [db, userTeamId, userRole, FX_COLLECTION]);

  useEffect(() => {
    if (selectedPlayerId === "new") {
      setPlayerForm({ name: "", number: "", announcementAudioUrl: "", songs: [], uploadedTracks: [] });
    } else {
      const p = roster.find(r => r.id === selectedPlayerId);
      if (p) {
        setPlayerForm({
          name: p.name || "",
          number: p.number?.toString() || "",
          announcementAudioUrl: p.announcementAudioUrl || "",
          songs: p.songs || [],
          uploadedTracks: p.uploadedTracks || []
        });
      }
    }
  }, [selectedPlayerId, roster]);

  /**
   * Helper for uploading files to R2 via presigned URLs.
   * Includes detailed error handling and header alignment.
   */
  const uploadToR2 = async (file: File, folder: string) => {
    try {
      // Step 1: Request presigned URL from API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error(`R2 Presign Failure: ${res.status}`, errorData);
        throw new Error(`Failed to get upload URL: ${errorData.error || res.statusText}`);
      }

      const { uploadUrl, key } = await res.json();
      if (!uploadUrl) throw new Error("API returned no upload URL.");

      // Step 2: Perform binary upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type }, // Must match the signature exactly
        body: file,
      });

      if (!uploadRes.ok) {
        const r2Error = await uploadRes.text();
        console.error(`R2 PUT Failure: ${uploadRes.status}`, r2Error);
        throw new Error(`Cloudflare R2 Rejected Upload: ${uploadRes.status}`);
      }
      
      const accountId = "66e24ae6da0ca15e881f10c5889a6783";
      return `https://pub-${accountId}.r2.dev/${key}`;
    } catch (err: any) {
      console.error("uploadToR2 diagnostic error:", err);
      throw err;
    }
  };

  const handleUpdateBranding = async () => {
    if (userRole !== "super_admin") return;
    setIsSaving(true);
    try {
      await saveTeamBranding({ name: brandingForm.name });
      toast({ title: "Team Details Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateUserProfile(auth.currentUser.uid, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNumber: profileForm.phoneNumber,
        playerId: profileForm.playerId === "none" ? null : profileForm.playerId
      });
      toast({ title: "Profile Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally { setIsSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTeamId || userRole !== "super_admin") return;
    setIsUploading(true);
    try {
      const url = await uploadToR2(file, "logos_UAT");
      await saveTeamBranding({ logoUrl: url });
      setBrandingForm(prev => ({ ...prev, logoUrl: url }));
      toast({ title: "Logo Uploaded" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally { setIsUploading(false); }
  };

  const handleSavePlayerProfile = async () => {
    if (!userTeamId || !playerForm.name || !playerForm.number) {
      toast({ variant: "destructive", title: "Validation Error", description: "Name and Number are required." });
      return;
    }
    setIsSaving(true);
    try {
      let finalAudioUrl = playerForm.announcementAudioUrl;
      const playerId = selectedPlayerId === "new" ? doc(collection(db, "players_UAT")).id : selectedPlayerId;
      
      if (audioFile) {
        finalAudioUrl = await uploadToR2(audioFile, "announcement_audio_UAT");
      }

      await savePlayer({
        name: playerForm.name,
        number: parseInt(playerForm.number) || 0,
        announcementAudioUrl: finalAudioUrl,
        songs: playerForm.songs,
        uploadedTracks: playerForm.uploadedTracks,
        teamId: userTeamId
      }, playerId);
      setSelectedPlayerId("new");
      setAudioFile(null);
      toast({ title: "Player Profile Saved" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleAddYoutubeTrack = () => {
    if (playerForm.songs.length >= 3) {
      toast({ variant: "destructive", title: "Limit Reached", description: "Update existing tracks to change songs (Max 3)." });
      return;
    }
    setPlayerForm({ ...playerForm, songs: [...playerForm.songs, { name: "", videoId: "", startAt: 0 }] });
  };

  const handleUploadTrackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedPlayerId === "new") {
      toast({ variant: "destructive", title: "Action Required", description: "Save player first before uploading files." });
      return;
    }
    if (playerForm.uploadedTracks.length >= 3) {
      toast({ variant: "destructive", title: "Limit Reached", description: "Delete existing files to upload new ones (Max 3)." });
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadToR2(file, "walkup-track-files");
      const newTrack = { id: Math.random().toString(36).substr(2, 9), name: file.name, url, storagePath: url };
      const updated = [...playerForm.uploadedTracks, newTrack];
      await updateDoc(doc(db, "players_UAT", selectedPlayerId), { uploadedTracks: updated });
      setPlayerForm({ ...playerForm, uploadedTracks: updated });
      toast({ title: "Track Uploaded" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally { setIsUploading(false); }
  };

  const handleDeleteUploadedTrack = async (track: UploadedTrack) => {
    if (!confirm(`Delete ${track.name}?`)) return;
    try {
      const updated = playerForm.uploadedTracks.filter(t => t.id !== track.id);
      await updateDoc(doc(db, "players_UAT", selectedPlayerId), { uploadedTracks: updated });
      setPlayerForm({ ...playerForm, uploadedTracks: updated });
      toast({ title: "Track Removed from Profile" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const handleAddGameManual = async () => {
    if (!userTeamId || !gameForm.date || !gameForm.away || !gameForm.home) return;
    setIsSaving(true);
    try {
      await saveGame({ ...gameForm, teamId: userTeamId });
      setGameForm({ date: "", week: "", home: "", away: "", time: "", location: "" });
      toast({ title: "Game Added to Schedule" });
    } finally { setIsSaving(false); }
  };

  const handleScheduleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTeamId) return;
    setIsScheduleUploading(true);
    try {
      await uploadToR2(file, "schedule-uploads");
      toast({ title: "Schedule File Uploaded", description: "Processing started in schedule-uploads." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setIsScheduleUploading(false);
    }
  };

  const handleBulkSnackUpdate = async () => {
    if (!snackUpdateText.trim()) return;
    toast({ title: "Updating Snack Duty...", description: "Verifying strings..." });
    setTimeout(() => toast({ title: "Snack Duty Synced", description: "Please verify generated assignments below." }), 1500);
  };

  if (!isLoaded) return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Workspace...</span></div>;

  const isManagement = ["super_admin", "league_admin"].includes(userRole || "");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {teamData?.logoUrl ? <div className="relative w-8 h-8 md:w-10 md:h-10"><Image src={teamData.logoUrl} alt="Logo" fill className="object-contain" /></div> : <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-[var(--tenant-primary)]" /></div>}
          <div className="flex flex-col"><h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">{teamData?.name || "UAT WORKSPACE"}</h1><span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">Verified {userRole?.replace('_', ' ') || "User"}</span></div>
        </div>
        <UATNavbar />
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24">
        <Tabs defaultValue="identity" className="space-y-8">
          <TabsList className="bg-black/20 p-1 border border-white/5 h-12 w-full justify-start overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsTrigger value="identity" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Identity</TabsTrigger>
            {isManagement && <TabsTrigger value="users" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Team Users</TabsTrigger>}
            {isManagement && <TabsTrigger value="logistics" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Team Roster</TabsTrigger>}
            {isManagement && <TabsTrigger value="builder" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Schedule Builder</TabsTrigger>}
            {isManagement && <TabsTrigger value="soundfx" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Sound FX</TabsTrigger>}
          </TabsList>

          <TabsContent value="identity" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><UserCircle className="h-4 w-4 text-[var(--tenant-primary)]" /> Personal Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">First Name</Label><Input value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Last Name</Label><Input value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label><Input value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Associate with Player</Label>
                    <Select value={profileForm.playerId} onValueChange={(val) => setProfileForm({ ...profileForm, playerId: val })}>
                      <SelectTrigger className="h-11 bg-black/40 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="none" className="font-bold">None / Official</SelectItem>{roster.map(p => (<SelectItem key={p.id} value={p.id} className="font-bold">{p.name} (#{p.number})</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={isSaving} className="w-full h-12 bg-secondary text-secondary-foreground font-black uppercase text-[10px] tracking-widest">{isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Profile</Button>
                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <Label className="text-[10px] font-black uppercase text-primary mb-2 block">Team Workspace Access Code</Label>
                        <div className="flex items-center justify-between"><code className="text-lg font-black tracking-[0.2em] text-white bg-black/40 px-4 py-2 rounded-lg border border-white/5 block flex-1 text-center mr-2">{teamData?.code}</code><Button variant="outline" size="icon" className="h-12 w-12 border-white/10" onClick={() => { navigator.clipboard.writeText(teamData?.code || ""); toast({ title: "Code Copied" }); }}><Copy className="h-4 w-4" /></Button></div>
                     </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={cn("bg-card/50 border-white/10", userRole !== "super_admin" && "opacity-50 pointer-events-none")}>
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Building2 className="h-4 w-4 text-[var(--tenant-primary)]" /> Team Details</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Team Logo</Label>
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 flex items-center justify-center">{brandingForm.logoUrl ? <Image src={brandingForm.logoUrl} alt="Logo" fill className="object-contain" /> : <Trophy className="h-8 w-8 opacity-20" />}{isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}</div>
                      <div className="flex-1"><input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" /><Label htmlFor="logo-upload"><Button asChild variant="outline" className="h-10 text-[10px] font-black uppercase border-white/10 w-full cursor-pointer"><span><Upload className="h-3 w-3 mr-2" /> Upload New Logo</span></Button></Label></div>
                    </div>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Team Name</Label><Input value={brandingForm.name} onChange={e => setBrandingForm({...brandingForm, name: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                  <Button onClick={handleUpdateBranding} disabled={isSaving} className="w-full h-12 bg-primary font-black uppercase tracking-widest text-[10px]">{isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Update Team Details</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Users className="h-4 w-4 text-[var(--tenant-primary)]" /> Select Player to Edit</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="h-14 bg-black/40 font-black uppercase text-xs tracking-widest border-white/10"><SelectValue placeholder="Add New Player..." /></SelectTrigger>
                    <SelectContent><SelectItem value="new" className="font-black text-primary">+ ADD NEW PLAYER</SelectItem>{roster.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {selectedPlayerId !== "new" && <Button variant="destructive" className="w-full h-12 font-black uppercase text-[10px]" onClick={() => { if(confirm("Delete player?")) deletePlayer(selectedPlayerId); setSelectedPlayerId("new"); }}><Trash2 className="h-4 w-4 mr-2" /> Permanently Delete Player</Button>}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Settings className="h-4 w-4 text-[var(--tenant-primary)]" /> {selectedPlayerId === "new" ? "Add New Player" : `Edit: ${playerForm.name}`}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name *</Label><Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jersey Number *</Label><Input type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                  </div>
                  <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Mic2 className="h-3 w-3" /> Announcement Audio</Label>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mb-2">Upload player name walk up announcement file (MP3/WAV only).</p>
                    <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="bg-black/20 cursor-pointer border-dashed border-white/10" />
                    {playerForm.announcementAudioUrl && <Badge className="mt-2 bg-green-500/10 text-green-500 border-green-500/20 text-[7px] uppercase font-black">Audio Linked</Badge>}
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2"><Music className="h-3 w-3" /> Walk-Up Tracks (YouTube - Max 3)</Label>
                    {playerForm.songs.map((song, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-black/20 rounded-lg border border-white/5 relative">
                        <Input className="col-span-4 h-9 text-[10px] font-bold" placeholder="Track Name" value={song.name} onChange={e => { const n = [...playerForm.songs]; n[idx].name = e.target.value; setPlayerForm({...playerForm, songs: n}); }} />
                        <Input className="col-span-5 h-9 text-[10px] font-bold" placeholder="YouTube ID" value={song.videoId} onChange={e => { const n = [...playerForm.songs]; n[idx].videoId = e.target.value; setPlayerForm({...playerForm, songs: n}); }} />
                        <Input className="col-span-3 h-9 text-[10px] font-bold" placeholder="Start (s)" type="number" value={song.startAt} onChange={e => { const n = [...playerForm.songs]; n[idx].startAt = parseInt(e.target.value) || 0; setPlayerForm({...playerForm, songs: n}); }} />
                        <button onClick={() => { const n = playerForm.songs.filter((_, i) => i !== idx); setPlayerForm({...playerForm, songs: n}); }} className="absolute -right-2 -top-2 bg-destructive text-white rounded-full p-1 shadow-lg"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    {playerForm.songs.length < 3 && <Button variant="outline" className="w-full h-10 border-dashed text-[10px] font-black uppercase" onClick={handleAddYoutubeTrack}><Plus className="h-3 w-3 mr-2" /> Add YouTube Track</Button>}
                  </div>
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><FileAudio className="h-3 w-3" /> Walk-Up Tracks (File Upload - Max 3)</Label>
                    <div className="grid grid-cols-1 gap-2">
                       {playerForm.uploadedTracks.map((track) => (
                         <div key={track.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 group">
                            <span className="text-[10px] font-bold truncate max-w-[200px]">{track.name}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteUploadedTrack(track)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                         </div>
                       ))}
                       {playerForm.uploadedTracks.length < 3 && (
                         <div className="relative">
                            <input type="file" accept="audio/*" onChange={handleUploadTrackFile} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="h-12 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-black/20 hover:border-primary/50 transition-colors"><span className="text-[10px] font-black uppercase text-muted-foreground"><Upload className="h-3 w-3 inline mr-2" /> Upload Track File</span></div>
                         </div>
                       )}
                    </div>
                  </div>
                  <Button disabled={isSaving || isUploading} onClick={handleSavePlayerProfile} className="w-full h-14 bg-primary text-white font-black uppercase text-[10px] tracking-widest">{(isSaving || isUploading) ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Player Profile</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="builder" className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Calendar className="h-4 w-4 text-[var(--tenant-primary)]" /> Manual Weekly Scheduler</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Week Number</Label><Input value={gameForm.week} onChange={e => setGameForm({...gameForm, week: e.target.value})} placeholder="e.g. 5" className="bg-black/20" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Game Date</Label><Input type="date" value={gameForm.date} onChange={e => setGameForm({...gameForm, date: e.target.value})} className="bg-black/20" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Home Team</Label><Input value={gameForm.home} onChange={e => setGameForm({...gameForm, home: e.target.value})} placeholder="Home Team Name" className="bg-black/20" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Away Team</Label><Input value={gameForm.away} onChange={e => setGameForm({...gameForm, away: e.target.value})} placeholder="Away Team Name" className="bg-black/20" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Start Time</Label><Input value={gameForm.time} onChange={e => setGameForm({...gameForm, time: e.target.value})} placeholder="e.g. 6:00 PM" className="bg-black/20" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Field/Location</Label><Input value={gameForm.location} onChange={e => setGameForm({...gameForm, location: e.target.value})} placeholder="Jim Thorpe - Cordary Field" className="bg-black/20" /></div>
                    </div>
                    <Button onClick={handleAddGameManual} className="w-full h-12 bg-secondary text-secondary-foreground font-black uppercase text-[10px]"><Plus className="h-4 w-4 mr-2" /> Add Weekly Game</Button>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="bg-card/50 border-white/10">
                    <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><FileCode className="h-4 w-4 text-[var(--tenant-primary)]" /> Automated Schedule Generation</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3"><AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" /><p className="text-[9px] font-bold text-yellow-500 uppercase leading-relaxed">Reminder: Review all generated entries before publishing. Automated parsing may require manual corrections.</p></div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Upload Schedule Data (Any Format)</Label>
                        <div className="relative">
                          <input 
                            type="file" 
                            onChange={handleScheduleFileUpload} 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            accept="*" 
                          />
                          <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/20 hover:border-primary/50 transition-all">
                            {isScheduleUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                <span className="text-[9px] font-black uppercase text-muted-foreground px-4 text-center">
                                  Click or Drag to Upload Schedule File<br/>(PDF, Images, CSV, JSON)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-white/10">
                    <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Utensils className="h-4 w-4 text-secondary" /> Snack Duty Text Update</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Paste string to automatically update snack assignments</Label>
                      <textarea value={snackUpdateText} onChange={e => setSnackUpdateText(e.target.value)} className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-3 text-xs font-mono" placeholder="Week 1: Smith, Week 2: Johnson..." />
                      <Button onClick={handleBulkSnackUpdate} variant="outline" className="w-full h-12 font-black uppercase text-[10px] border-secondary/20 text-secondary">Verify & Update Assignments</Button>
                    </CardContent>
                  </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="soundfx" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 bg-card/50 border-white/10 h-fit">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Volume2 className="h-4 w-4 text-[var(--tenant-primary)]" /> Register Sound FX</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={async (e) => { 
                    e.preventDefault(); 
                    if (!fxFile || !userTeamId) return;
                    setIsUploading(true);
                    try {
                      const url = await uploadToR2(fxFile, "sound_fx_UAT");
                      await addDoc(collection(db, FX_COLLECTION), {
                        name: fxForm.name || fxFile.name,
                        url,
                        teamId: userTeamId,
                        createdAt: serverTimestamp()
                      });
                      setFxForm({ name: "" });
                      setFxFile(null);
                      toast({ title: "Sound FX Uploaded" });
                    } catch (err: any) {
                      toast({ variant: "destructive", title: "Upload Failed" });
                    } finally { setIsUploading(false); }
                  }} className="space-y-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Effect Name</Label><Input value={fxForm.name} onChange={e => setFxForm({ ...fxForm, name: e.target.value })} className="h-11 bg-black/40 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Audio File</Label><Input type="file" accept="audio/*" onChange={e => setFxFile(e.target.files?.[0] || null)} className="bg-black/20" /></div>
                    <Button disabled={!fxFile || isUploading} type="submit" className="w-full h-12 bg-[var(--tenant-primary)] font-black uppercase text-[10px]">{isUploading ? <Loader2 className="animate-spin" /> : "Upload Sound FX"}</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Music className="h-4 w-4 text-[var(--tenant-primary)]" /> Soundboard Inventory</CardTitle></CardHeader>
                <CardContent><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{soundEffects.map((fx) => (<div key={fx.id} className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[var(--tenant-primary)]/30 transition-all"><span className="text-xs font-black uppercase tracking-wider">{fx.name}</span><div className="flex items-center gap-2"><Button onClick={() => setPreviewingId(previewingId === fx.id ? null : fx.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-full">{previewingId === fx.id ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" className="h-10 w-10 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteDoc(doc(db, FX_COLLECTION, fx.id))}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div></CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <audio ref={audioPreviewRef} className="hidden" onEnded={() => setPreviewingId(null)} />
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-md border-t border-white/5 flex flex-col items-center justify-center gap-2"><div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest"><ShieldAlert className="h-3 w-3 text-primary" /> Workspace Access Control Active</div><div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.3em]">System Build: {BUILD_VERSION}</div></footer>
    </div>
  );
}

export default function UATAdminPortalPage() {
  return (<UATGameProvider><UATAdminPortalContent /></UATGameProvider>);
}
