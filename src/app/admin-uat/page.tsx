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
  Utensils,
  LayoutDashboard,
  Pencil,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Check,
  FileMusic,
  ExternalLink,
  Youtube
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUATGame, UATGameProvider, Song, UploadedTrack, StadiumSong, Game } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore, useAuth } from "@/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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
    organSongs,
    pumpUpSongs,
    saveTeamBranding,
    updateUserProfile,
    deleteUserAccount,
    savePlayer,
    deletePlayer,
    saveGame,
    deleteGame,
    saveStadiumSong,
    deleteStadiumSong
  } = useUATGame();

  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduleUploading, setIsScheduleUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  
  // AI Parsing Review States
  const [parsedGames, setParsedGames] = useState<any[]>([]);
  const [editingParsedIdx, setEditingParsedIdx] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<any>(null);

  // Existing Schedule Editing
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [savedEditForm, setSavedEditForm] = useState<any>(null);

  // Sound FX State
  const [soundEffects, setSoundEffects] = useState<any[]>([]);
  const [fxForm, setFxForm] = useState({ name: "" });
  const [fxFile, setFxFile] = useState<File | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Booth Config Form States
  const [activeAudioCategory, setActiveAudioCategory] = useState<'organ' | 'pumpup'>("organ");
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [songForm, setSongForm] = useState({ title: "", link: "", startTime: 0, order: 0 });

  // Profile/Branding Form States
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phoneNumber: "", playerId: "" });
  const [brandingForm, setBrandingForm] = useState({ name: "", logoUrl: "" });

  // Player Editor State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("none");
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: "",
    announcementAudioUrl: "",
    songs: [] as Song[],
    uploadedTracks: [] as UploadedTrack[]
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Schedule Manager State
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
    if (selectedPlayerId === "none") {
      setPlayerForm({ 
        name: "", 
        number: "", 
        announcementAudioUrl: "", 
        songs: [], 
        uploadedTracks: [] 
      });
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

  const uploadToR2 = async (file: File, folder: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Proxy upload failed");
      const { url } = await res.json();
      return url;
    } catch (err: any) {
      console.error("uploadToR2 error:", err);
      throw err;
    }
  };

  const parseYoutubeId = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
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
      const playerId = selectedPlayerId === "none" ? doc(collection(db, "players_UAT")).id : selectedPlayerId;
      if (audioFile) finalAudioUrl = await uploadToR2(audioFile, "walkup-announcements");
      
      await savePlayer({
        name: playerForm.name,
        number: parseInt(playerForm.number) || 0,
        announcementAudioUrl: finalAudioUrl,
        songs: playerForm.songs.map(s => ({ ...s, videoId: parseYoutubeId(s.videoId) })),
        uploadedTracks: playerForm.uploadedTracks,
        teamId: userTeamId
      }, playerId);
      
      setSelectedPlayerId("none");
      setAudioFile(null);
      toast({ title: "Player Profile Saved" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleAddYoutubeTrack = () => {
    if (playerForm.songs.length >= 3) {
      toast({ variant: "destructive", title: "Limit Reached", description: "Max 3 YouTube tracks allowed." });
      return;
    }
    setPlayerForm({ 
      ...playerForm, 
      songs: [...playerForm.songs, { name: "Walk-Up " + (playerForm.songs.length + 1), videoId: "", startAt: 0 }] 
    });
  };

  const handleAddTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File Type Validation
    if (!file.type.startsWith('audio/')) {
       toast({ variant: "destructive", title: "Invalid file format", description: "Please select an audio file." });
       e.target.value = "";
       return;
    }

    if (playerForm.uploadedTracks.length >= 3) {
      toast({ variant: "destructive", title: "Limit Reached", description: "Max 3 track uploads allowed." });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToR2(file, "walkup-track-files");
      const newTrack: UploadedTrack = { 
        id: Math.random().toString(36).substr(2, 9), 
        name: file.name.split('.')[0], 
        url, 
        storagePath: url,
        startAt: 0
      };
      setPlayerForm({ 
        ...playerForm, 
        uploadedTracks: [...playerForm.uploadedTracks, newTrack] 
      });
      toast({ title: "Track Loaded", description: "Save profile to finalize." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally { 
      setIsUploading(false); 
      e.target.value = "";
    }
  };

  const handleUpdateSongField = (idx: number, field: keyof Song, value: any) => {
    const next = [...playerForm.songs];
    next[idx] = { ...next[idx], [field]: value };
    setPlayerForm({ ...playerForm, songs: next });
  };

  const handleUpdateUploadField = (idx: number, field: keyof UploadedTrack, value: any) => {
    const next = [...playerForm.uploadedTracks];
    next[idx] = { ...next[idx], [field]: value };
    setPlayerForm({ ...playerForm, uploadedTracks: next });
  };

  const handleDeleteYoutubeTrack = (idx: number) => {
    setPlayerForm({ ...playerForm, songs: playerForm.songs.filter((_, i) => i !== idx) });
  };

  const handleDeleteUploadTrack = (idx: number) => {
    setPlayerForm({ ...playerForm, uploadedTracks: playerForm.uploadedTracks.filter((_, i) => i !== idx) });
  };

  const handleAddGameManual = async () => {
    if (!userTeamId || !gameForm.date || !gameForm.away || !gameForm.home) return;
    setIsSaving(true);
    try {
      await saveGame({ ...gameForm, teamId: userTeamId, week: parseInt(gameForm.week) || 0 });
      setGameForm({ date: "", week: "", home: "", away: "", time: "", location: "" });
      toast({ title: "Game Added to Schedule" });
    } finally { setIsSaving(false); }
  };

  const handleScheduleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTeamId || !teamData?.name) return;
    
    setIsScheduleUploading(true);
    try {
      await uploadToR2(file, "schedule-uploads");
      toast({ title: "File Uploaded", description: "AI Extracting Schedule Data..." });
      
      setIsParsing(true);
      const parseFormData = new FormData();
      parseFormData.append('file', file);
      parseFormData.append('teamName', teamData.name);

      const res = await fetch("/api/admin/parse-schedule", { method: "POST", body: parseFormData });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "AI model failed to process.");
      }
      
      const { games } = await res.json();
      setParsedGames(games || []);
      toast({ title: "AI Analysis Complete", description: `Identified ${games?.length || 0} games. Review them below.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Analysis Failed", description: err.message });
    } finally { 
      setIsScheduleUploading(false);
      setIsParsing(false);
    }
  };

  const handleImportParsedGames = async () => {
    if (!userTeamId || parsedGames.length === 0) return;
    setIsSaving(true);
    try {
      for (let i = 0; i < parsedGames.length; i++) {
        const game = parsedGames[i];
        await saveGame({
          date: game.gameDate,
          home: game.homeOrAway === 'home' ? teamData?.name : game.opponent,
          away: game.homeOrAway === 'away' ? teamData?.name : game.opponent,
          time: game.time,
          location: game.location,
          week: i + 1, // Sequential Game Numbering
          teamId: userTeamId
        });
      }
      setParsedGames([]);
      toast({ title: "Schedule Imported", description: "All extracted games have been added to your timeline." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed" });
    } finally { setIsSaving(false); }
  };

  const startEditingParsedRow = (idx: number) => {
    setEditingParsedIdx(idx);
    setEditRowData({ ...parsedGames[idx] });
  };

  const saveParsedRowEdit = () => {
    if (editingParsedIdx === null) return;
    const next = [...parsedGames];
    next[editingParsedIdx] = { ...editRowData };
    setParsedGames(next);
    setEditingParsedIdx(null);
    setEditRowData(null);
    toast({ title: "Draft Updated" });
  };

  const startEditingSavedGame = (game: Game) => {
    setEditingSavedId(game.id);
    setSavedEditForm({ ...game });
  };

  const handleUpdateSavedGame = async () => {
    if (!savedEditForm || !editingSavedId) return;
    setIsSaving(true);
    try {
      await saveGame(savedEditForm, editingSavedId);
      setEditingSavedId(null);
      setSavedEditForm(null);
      toast({ title: "Game Record Updated" });
    } finally { setIsSaving(false); }
  };

  const handleBulkSnackUpdate = async () => {
    if (!snackUpdateText.trim()) return;
    toast({ title: "Updating Snack Duty...", description: "Verifying strings..." });
    setTimeout(() => toast({ title: "Snack Duty Synced", description: "Assignments updated." }), 1500);
  };

  const handleSaveStadiumSong = () => {
    if (!songForm.title || !songForm.link) { toast({ variant: "destructive", title: "Missing Data" }); return; }
    saveStadiumSong(activeAudioCategory, {
      title: songForm.title,
      link: songForm.link,
      startTime: Number(songForm.startTime) || 0,
      order: songForm.order
    }, editingSongId || undefined);
    setEditingSongId(null);
    setSongForm({ title: "", link: "", startTime: 0, order: 0 });
    toast({ title: "Track Registered" });
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
            {isManagement && <TabsTrigger value="builder" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Schedule Manager</TabsTrigger>}
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
                  <div className="pt-6 border-t border-white/5">
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

          <TabsContent value="users" className="space-y-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Users className="h-4 w-4 text-[var(--tenant-primary)]" /> User Management
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase mt-1">Manage team access levels and player associations.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">User Profile</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Linked Player</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                            <Users className="h-8 w-8" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No team users found</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamUsers.map((u) => (
                        <TableRow key={u.id} className="border-white/5 group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarFallback className="bg-primary/20 text-[10px] font-black">{u.firstName?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold">{u.firstName} {u.lastName}</span>
                                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">{u.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={u.playerId || "none"} 
                              onValueChange={async (val) => {
                                try {
                                  await updateUserProfile(u.id, { playerId: val === "none" ? null : val });
                                  toast({ title: "Player Linked" });
                                } catch (e) {
                                  toast({ variant: "destructive", title: "Update Failed" });
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 bg-black/20 border-white/5 text-[9px] font-black uppercase w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-[10px] font-bold uppercase">None / Official</SelectItem>
                                {roster.map(p => (
                                  <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold uppercase">#{p.number} - {p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={u.role || "user"} 
                              onValueChange={async (val) => {
                                try {
                                  await updateUserProfile(u.id, { role: val });
                                  toast({ title: "Role Updated" });
                                } catch (e) {
                                  toast({ variant: "destructive", title: "Update Failed" });
                                }
                              }}
                              disabled={u.id === auth.currentUser?.uid}
                            >
                              <SelectTrigger className="h-9 bg-black/20 border-white/5 text-[9px] font-black uppercase w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="super_admin" className="text-[10px] font-bold uppercase">Super Admin</SelectItem>
                                <SelectItem value="league_admin" className="text-[10px] font-bold uppercase">League Admin</SelectItem>
                                <SelectItem value="booth_admin" className="text-[10px] font-bold uppercase">Booth Admin</SelectItem>
                                <SelectItem value="user" className="text-[10px] font-bold uppercase">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-40 group-hover:opacity-100 transition-opacity"
                              disabled={u.id === auth.currentUser?.uid}
                              onClick={async () => {
                                if (confirm(`Are you sure you want to remove access for ${u.firstName}?`)) {
                                  try {
                                    await deleteUserAccount(u.id);
                                    toast({ title: "User Removed" });
                                  } catch (e) {
                                    toast({ variant: "destructive", title: "Failed to remove user" });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-card/50 border-white/10">
                  <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Calendar className="h-4 w-4 text-[var(--tenant-primary)]" /> Manual Schedule Manager</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Game Number</Label><Input value={gameForm.week} onChange={e => setGameForm({...gameForm, week: e.target.value})} placeholder="e.g. 1" className="bg-black/20" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Game Date</Label><Input type="date" value={gameForm.date} onChange={e => setGameForm({...gameForm, date: e.target.value})} className="bg-black/20" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Home Team</Label><Input value={gameForm.home} onChange={e => setGameForm({...gameForm, home: e.target.value})} placeholder="Home Team Name" className="bg-black/20" /></div>
                      <div className="space-y-2"><Label className="text-[10px) font-black uppercase">Away Team</Label><Input value={gameForm.away} onChange={e => setGameForm({...gameForm, away: e.target.value})} placeholder="Away Team Name" className="bg-black/20" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Start Time</Label><Input value={gameForm.time} onChange={e => setGameForm({...gameForm, time: e.target.value})} placeholder="e.g. 6:00 PM" className="bg-black/20" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Field/Location</Label><Input value={gameForm.location} onChange={e => setGameForm({...gameForm, location: e.target.value})} placeholder="Jim Thorpe - Cordary Field" className="bg-black/20" /></div>
                    </div>
                    <Button onClick={handleAddGameManual} className="w-full h-12 bg-secondary text-secondary-foreground font-black uppercase text-[10px]"><Plus className="h-4 w-4 mr-2" /> Add Sequential Game</Button>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="bg-card/50 border-white/10">
                    <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><FileCode className="h-4 w-4 text-[var(--tenant-primary)]" /> AI Automated Extraction</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3"><AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" /><p className="text-[9px] font-bold text-yellow-500 uppercase leading-relaxed">AI Extraction is experimental. Review results below to correct any errors before importing to your timeline.</p></div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase">Upload Schedule (Image or PDF)</Label>
                        <div className="relative">
                          <input type="file" onChange={handleScheduleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*,application/pdf" />
                          <div className={cn("h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/20 hover:border-primary/50 transition-all", (isScheduleUploading || isParsing) && "opacity-50")}>
                            {isScheduleUploading || isParsing ? (
                              <div className="flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="text-[9px] font-black uppercase text-primary animate-pulse">{isScheduleUploading ? "Uploading..." : "AI analyzing..."}</span></div>
                            ) : (
                              <><BrainCircuit className="h-6 w-6 text-muted-foreground mb-2" /><span className="text-[9px] font-black uppercase text-muted-foreground px-4 text-center">Click or Drag to Analyze Schedule File</span></>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
             </div>

             {/* AI PARSED REVIEW SECTION */}
             {parsedGames.length > 0 && (
               <Card className="bg-card/50 border-primary/20 animate-in slide-in-from-bottom-4">
                 <CardHeader className="bg-primary/5 border-b border-white/5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div><CardTitle className="text-sm font-black uppercase tracking-widest">Review Extracted Games</CardTitle><CardDescription className="text-[10px] font-bold uppercase">Click the pencil to edit individual games before importing.</CardDescription></div>
                       </div>
                       <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => setParsedGames([])} className="text-[10px] font-black uppercase">Cancel</Button>
                          <Button onClick={handleImportParsedGames} disabled={isSaving} className="bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                             {isSaving ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Save className="h-3 w-3 mr-2" />} Import Reviewed Timeline
                          </Button>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader><TableRow className="border-white/5"><TableHead className="text-[10px] font-black uppercase">Date</TableHead><TableHead className="text-[10px] font-black uppercase">Time</TableHead><TableHead className="text-[10px] font-black uppercase">Opponent</TableHead><TableHead className="text-[10px] font-black uppercase">Loc</TableHead><TableHead className="text-[10px] font-black uppercase w-20">Edit</TableHead></TableRow></TableHeader>
                       <TableBody>
                          {parsedGames.map((game, i) => (
                             <TableRow key={i} className="border-white/5 group hover:bg-white/5">
                                {editingParsedIdx === i ? (
                                  <>
                                    <TableCell><Input value={editRowData.gameDate} onChange={e => setEditRowData({...editRowData, gameDate: e.target.value})} className="h-8 text-xs" /></TableCell>
                                    <TableCell><Input value={editRowData.time} onChange={e => setEditRowData({...editRowData, time: e.target.value})} className="h-8 text-xs" /></TableCell>
                                    <TableCell><Input value={editRowData.opponent} onChange={e => setEditRowData({...editRowData, opponent: e.target.value})} className="h-8 text-xs" /></TableCell>
                                    <TableCell><Input value={editRowData.location} onChange={e => setEditRowData({...editRowData, location: e.target.value})} className="h-8 text-xs" /></TableCell>
                                    <TableCell><Button onClick={saveParsedRowEdit} size="icon" variant="ghost" className="h-8 w-8 text-green-500"><Check className="h-4 w-4" /></Button></TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell className="text-xs font-bold">{game.gameDate}</TableCell>
                                    <TableCell className="text-xs font-bold">{game.time}</TableCell>
                                    <TableCell className="text-xs font-bold"><span className={cn(game.homeOrAway === 'away' && "text-primary")}>{game.opponent}</span></TableCell>
                                    <TableCell className="text-xs font-bold text-muted-foreground">{game.location}</TableCell>
                                    <TableCell><Button onClick={() => startEditingParsedRow(i)} size="icon" variant="ghost" className="h-8 w-8 opacity-40 group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                                  </>
                                )}
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </CardContent>
               </Card>
             )}

             {/* EXISTING SCHEDULE MANAGER SECTION */}
             <Card className="bg-card/50 border-white/10">
               <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Trophy className="h-4 w-4 text-secondary" /> Active Team Schedule</CardTitle></CardHeader>
               <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="border-white/5"><TableHead className="text-[10px] font-black uppercase w-16">Game #</TableHead><TableHead className="text-[10px] font-black uppercase">Date</TableHead><TableHead className="text-[10px] font-black uppercase">Matchup</TableHead><TableHead className="text-[10px] font-black uppercase">Time</TableHead><TableHead className="text-[10px] font-black uppercase">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {games.map((g) => (
                        <TableRow key={g.id} className="border-white/5 group hover:bg-white/5">
                          {editingSavedId === g.id ? (
                            <>
                              <TableCell><Input type="number" value={savedEditForm.week} onChange={e => setSavedEditForm({...savedEditForm, week: parseInt(e.target.value) || 0})} className="h-8" /></TableCell>
                              <TableCell><Input type="date" value={savedEditForm.date} onChange={e => setSavedEditForm({...savedEditForm, date: e.target.value})} className="h-8" /></TableCell>
                              <TableCell className="flex gap-1"><Input value={savedEditForm.away} onChange={e => setSavedEditForm({...savedEditForm, away: e.target.value})} className="h-8" /><span className="opacity-40">vs</span><Input value={savedEditForm.home} onChange={e => setSavedEditForm({...savedEditForm, home: e.target.value})} className="h-8" /></TableCell>
                              <TableCell><Input value={savedEditForm.time} onChange={e => setSavedEditForm({...savedEditForm, time: e.target.value})} className="h-8" /></TableCell>
                              <TableCell className="flex gap-1"><Button onClick={handleUpdateSavedGame} size="icon" variant="ghost" className="h-8 w-8 text-green-500"><Check className="h-4 w-4" /></Button><Button onClick={() => setEditingSavedId(null)} size="icon" variant="ghost" className="h-8 w-8 text-destructive"><X className="h-4 w-4" /></Button></TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-xs font-black text-primary">#{g.week}</TableCell>
                              <TableCell className="text-xs font-bold">{g.date}</TableCell>
                              <TableCell className="text-xs font-bold">{g.away} vs {g.home}</TableCell>
                              <TableCell className="text-xs font-bold text-muted-foreground">{g.time}</TableCell>
                              <TableCell className="flex gap-1">
                                <Button onClick={() => startEditingSavedGame(g)} size="icon" variant="ghost" className="h-8 w-8 opacity-40 group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => { if(confirm("Delete Game?")) deleteGame(g.id); }} size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-40 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Users className="h-4 w-4 text-[var(--tenant-primary)]" /> Select Player to Edit</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <Button onClick={() => setSelectedPlayerId("none")} className="w-full h-12 bg-primary/20 text-primary border border-primary/30 font-black uppercase text-[10px] tracking-widest">+ ADD NEW PLAYER</Button>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Existing Roster</Label>
                    <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                      <SelectTrigger className="h-14 bg-black/40 font-black uppercase text-xs tracking-widest border-white/10"><SelectValue placeholder="Select existing player..." /></SelectTrigger>
                      <SelectContent><SelectItem value="none" className="font-black text-muted-foreground">None Selected</SelectItem>{roster.map(p => <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Settings className="h-4 w-4 text-[var(--tenant-primary)]" /> {selectedPlayerId === "none" ? "Add New Player" : `Edit: ${playerForm.name}`}</CardTitle></CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Full Name *</Label><Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Jersey Number *</Label><Input type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} className="h-11 bg-black/40 font-bold" /></div>
                  </div>
                  
                  <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Mic2 className="h-3 w-3" /> Primary Announcement Audio</Label>
                    <div className="flex flex-col gap-2 mt-2">
                      {playerForm.announcementAudioUrl && (
                        <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                           <Play className="h-3 w-3 text-primary" />
                           <span className="text-[8px] font-bold uppercase truncate max-w-[150px]">{playerForm.announcementAudioUrl.split('/').pop()}</span>
                        </div>
                      )}
                      <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="bg-black/20" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2"><Youtube className="h-3 w-3" /> YouTube Walk-Up Tracks</Label>
                      <Button variant="outline" size="sm" onClick={handleAddYoutubeTrack} disabled={playerForm.songs.length >= 3} className="h-7 text-[8px] font-black uppercase border-secondary/20">
                         <Plus className="h-2.5 w-2.5 mr-1" /> Add Track
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {playerForm.songs.map((song, idx) => (
                        <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3 relative group">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteYoutubeTrack(idx)} className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase opacity-50">Track Name</Label>
                            <Input value={song.name} onChange={e => handleUpdateSongField(idx, 'name', e.target.value)} placeholder="Walk-Up 1" className="h-8 bg-black/20 text-xs font-bold" />
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                             <div className="col-span-8 space-y-1">
                               <Label className="text-[8px] font-black uppercase opacity-50">YouTube URL</Label>
                               <Input value={song.videoId} onChange={e => handleUpdateSongField(idx, 'videoId', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-8 bg-black/20 text-xs" />
                             </div>
                             <div className="col-span-4 space-y-1">
                               <Label className="text-[8px] font-black uppercase opacity-50">Start (sec)</Label>
                               <Input type="number" value={song.startAt} onChange={e => handleUpdateSongField(idx, 'startAt', parseInt(e.target.value) || 0)} className="h-8 bg-black/20 text-xs" />
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-[var(--tenant-primary)] tracking-widest flex items-center gap-2"><FileMusic className="h-3 w-3" /> Custom Audio Uploads</Label>
                      <div className="relative">
                         <input type="file" accept="audio/*" onChange={handleAddTrackUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={playerForm.uploadedTracks.length >= 3 || isUploading} />
                         <Button variant="outline" size="sm" disabled={playerForm.uploadedTracks.length >= 3 || isUploading} className="h-7 text-[8px] font-black uppercase border-[var(--tenant-primary)]/20">
                            {isUploading ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" /> : <Upload className="h-2.5 w-2.5 mr-1" />} Add Upload
                         </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {playerForm.uploadedTracks.map((track, idx) => (
                        <div key={track.id} className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3 relative group">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUploadTrack(idx)} className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="h-3 w-3" />
                          </Button>
                          <div className="space-y-2">
                             <Label className="text-[8px] font-black uppercase opacity-50">Track Name</Label>
                             <Input value={track.name} onChange={e => handleUpdateUploadField(idx, 'name', e.target.value)} className="h-8 bg-black/20 text-xs font-bold" />
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 p-2 bg-black/40 rounded border border-white/5 flex items-center gap-2">
                               <FileAudio className="h-3 w-3 text-primary" />
                               <span className="text-[8px] font-bold uppercase truncate">{track.url.split('/').pop()}</span>
                             </div>
                             <div className="w-24 space-y-1">
                               <Label className="text-[8px] font-black uppercase opacity-50">Start (sec)</Label>
                               <Input type="number" value={track.startAt} onChange={e => handleUpdateUploadField(idx, 'startAt', parseInt(e.target.value) || 0)} className="h-8 bg-black/20 text-xs" />
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button disabled={isSaving || isUploading} onClick={handleSavePlayerProfile} className="w-full h-14 bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4 mr-2" />} SAVE PLAYER PROFILE
                  </Button>
                </CardContent>
              </Card>
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
                      await addDoc(collection(db, FX_COLLECTION), { name: fxForm.name || fxFile.name, url, teamId: userTeamId, createdAt: serverTimestamp() });
                      setFxForm({ name: "" }); setFxFile(null); toast({ title: "Sound FX Uploaded" });
                    } catch (err: any) { toast({ variant: "destructive", title: "Upload Failed" }); } finally { setIsUploading(false); }
                  }} className="space-y-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Effect Name</Label><Input value={fxForm.name} onChange={e => setFxForm({ ...fxForm, name: e.target.value })} className="h-11 bg-black/40 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Audio File</Label><Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="bg-black/20" /></div>
                    <Button disabled={!fxFile || isUploading} type="submit" className="w-full h-12 bg-[var(--tenant-primary)] font-black uppercase text-[10px]">Upload Sound FX</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Music className="h-4 w-4 text-[var(--tenant-primary)]" /> Soundboard Inventory</CardTitle></CardHeader>
                <CardContent><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{soundEffects.map((fx) => (<div key={fx.id} className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[var(--tenant-primary)]/30 transition-all"><span className="text-xs font-black uppercase tracking-wider">{fx.name}</span><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-10 w-10 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteDoc(doc(db, FX_COLLECTION, fx.id))}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div></CardContent>
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
