"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ShieldCheck, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Palette,
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
  Square
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
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore, useStorage, useAuth } from "@/firebase";
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { cn } from "@/lib/utils";

function UATAdminPortalContent() {
  const db = useFirestore();
  const auth = useAuth();
  const storage = useStorage();
  const { toast } = useToast();
  const { 
    isLoaded, 
    userRole, 
    userTeamId, 
    teamData, 
    roster, 
    saveTeamBranding,
    updateUserProfile,
    deleteUserAccount,
    savePlayer,
    deletePlayer,
  } = useUATGame();

  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sound FX State
  const [soundEffects, setSoundEffects] = useState<any[]>([]);
  const [fxForm, setFxForm] = useState({ name: "" });
  const [fxFile, setFxFile] = useState<File | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Profile/Branding Form States
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phoneNumber: "", playerId: "" });
  const [brandingForm, setBrandingForm] = useState({ name: "", primary: "", secondary: "", logoUrl: "" });

  // Player Editor State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState({
    name: "",
    number: "",
    announcementAudioUrl: "",
    songs: [{ name: "", videoId: "", startAt: 0 }]
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Determine environment-based collection/path suffixes
  const suffix = userTeamId?.includes('uat') || true ? "_UAT" : "";
  const FX_COLLECTION = `sound_fx${suffix}`;
  const FX_STORAGE_PATH = `sound_fx${suffix}`;

  useEffect(() => {
    if (teamData) {
      setBrandingForm({
        name: teamData.name || "",
        primary: teamData.primaryColor || "#4285FF",
        secondary: teamData.secondaryColor || "#2EB1D9",
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

  // Listen for Sound FX
  useEffect(() => {
    if (userTeamId && ["super_admin", "league_admin", "booth_admin"].includes(userRole || "")) {
      // Fix: Removed orderBy("name", "asc") to avoid index requirement
      const q = query(
        collection(db, FX_COLLECTION), 
        where("teamId", "==", userTeamId)
      );
      return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Client-side sort
        data.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        setSoundEffects(data);
      });
    }
  }, [db, userTeamId, userRole, FX_COLLECTION]);

  const handleUpdateBranding = async () => {
    if (userRole !== "super_admin") return;
    setIsSaving(true);
    try {
      await saveTeamBranding({
        name: brandingForm.name,
        primaryColor: brandingForm.primary,
        secondaryColor: brandingForm.secondary
      });
      toast({ title: "Workspace Updated" });
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
      const storageRef = ref(storage, `logos_UAT/${userTeamId}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await saveTeamBranding({ logoUrl: url });
      setBrandingForm(prev => ({ ...prev, logoUrl: url }));
      toast({ title: "Logo Successfully Uploaded" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Logo Upload Failed", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPlayer = (player: any) => {
    setEditingPlayerId(player.id);
    setPlayerForm({
      name: player.name || "",
      number: player.number?.toString() || "",
      announcementAudioUrl: player.announcementAudioUrl || "",
      songs: player.songs?.length ? player.songs : [{ name: "", videoId: "", startAt: 0 }]
    });
    setAudioFile(null);
  };

  const handleSavePlayerProfile = async () => {
    if (!userTeamId) return;
    setIsSaving(true);
    try {
      let finalAudioUrl = playerForm.announcementAudioUrl;
      const playerId = editingPlayerId || doc(collection(db, "players_UAT")).id;

      if (audioFile) {
        const audioRef = ref(storage, `announcement_audio_UAT/${playerId}_${Date.now()}`);
        await uploadBytes(audioRef, audioFile);
        finalAudioUrl = await getDownloadURL(audioRef);
      }

      const cleanSongs = playerForm.songs.filter(s => s.name && s.videoId);

      await savePlayer({
        name: playerForm.name,
        number: parseInt(playerForm.number) || 0,
        announcementAudioUrl: finalAudioUrl,
        songs: cleanSongs,
        teamId: userTeamId
      }, playerId);

      setEditingPlayerId(null);
      toast({ title: "Player Saved Successfully" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleUploadFX = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fxFile || !fxForm.name || !userTeamId) return;
    
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${fxFile.name}`;
      const storageRef = ref(storage, `${FX_STORAGE_PATH}/${fileName}`);
      await uploadBytes(storageRef, fxFile);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, FX_COLLECTION), {
        name: fxForm.name,
        url: url,
        storagePath: storageRef.fullPath,
        teamId: userTeamId,
        uploadedBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });

      setFxForm({ name: "" });
      setFxFile(null);
      toast({ title: "Sound Effect Added" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFX = async (fx: any) => {
    if (!confirm(`Delete "${fx.name}"?`)) return;
    try {
      if (fx.storagePath) {
        const storageRef = ref(storage, fx.storagePath);
        await deleteObject(storageRef);
      }
      await deleteDoc(doc(db, FX_COLLECTION, fx.id));
      toast({ title: "Effect Removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const togglePreview = (fx: any) => {
    if (previewingId === fx.id) {
      audioPreviewRef.current?.pause();
      setPreviewingId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = fx.url;
        audioPreviewRef.current.play();
        setPreviewingId(fx.id);
      }
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Workspace...</span>
    </div>;
  }

  const isSuperAdmin = userRole === "super_admin";
  const isLeagueAdmin = userRole === "league_admin";
  const isBoothAdmin = userRole === "booth_admin";
  const isManagement = isSuperAdmin || isLeagueAdmin;

  return (
    <div className="min-h-screen bg-background text-foreground stadium-gradient overflow-hidden flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {teamData?.logoUrl ? (
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <Image src={teamData.logoUrl} alt="Logo" fill className="object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded flex items-center justify-center">
               <ShieldCheck className="h-5 w-5 text-[var(--tenant-primary)]" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">
              {teamData?.name || "UAT WORKSPACE"}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">Verified {userRole?.replace('_', ' ') || "User"}</span>
            </div>
          </div>
        </div>
        <UATNavbar />
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24">
        <Tabs defaultValue="identity" className="space-y-8">
          <TabsList className="bg-black/20 p-1 border border-white/5 h-12 w-full justify-start overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsTrigger value="identity" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Identity</TabsTrigger>
            {isManagement && <TabsTrigger value="users" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Team Users</TabsTrigger>}
            {isManagement && <TabsTrigger value="logistics" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Team Roster</TabsTrigger>}
            {(isManagement || isBoothAdmin) && <TabsTrigger value="booth" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Booth Config</TabsTrigger>}
            {(isManagement || isBoothAdmin) && <TabsTrigger value="soundfx" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Sound FX</TabsTrigger>}
          </TabsList>

          <TabsContent value="identity" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <UserCircle className="h-4 w-4 text-[var(--tenant-primary)]" /> Personal Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">First Name</Label>
                      <Input value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="h-11 bg-black/40 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Last Name</Label>
                      <Input value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="h-11 bg-black/40 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                    <Input value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="h-11 bg-black/40 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Associate with Player</Label>
                    <Select value={profileForm.playerId} onValueChange={(val) => setProfileForm({ ...profileForm, playerId: val })}>
                      <SelectTrigger className="h-11 bg-black/40 font-bold border-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="font-bold">None / Official (No Associated Player)</SelectItem>
                        {roster.map(p => (
                          <SelectItem key={p.id} value={p.id} className="font-bold">{p.name} (Jersey #{p.number})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={isSaving} className="w-full h-12 bg-secondary text-secondary-foreground font-black uppercase text-[10px] tracking-widest">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Profile
                  </Button>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <Label className="text-[10px] font-black uppercase text-primary mb-2 block">Team Workspace Access Code</Label>
                        <div className="flex items-center justify-between">
                          <code className="text-lg font-black tracking-[0.2em] text-white bg-black/40 px-4 py-2 rounded-lg border border-white/5 block flex-1 text-center mr-2">
                            {teamData?.code}
                          </code>
                          <Button variant="outline" size="icon" className="h-12 w-12 border-white/10" onClick={() => { navigator.clipboard.writeText(teamData?.code || ""); toast({ title: "Code Copied" }); }}>
                             <Trophy className="h-4 w-4" />
                          </Button>
                        </div>
                     </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("bg-card/50 border-white/10", !isSuperAdmin && "opacity-50 pointer-events-none")}>
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Palette className="h-4 w-4 text-[var(--tenant-primary)]" /> Visual Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Team Logo</Label>
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 flex items-center justify-center">
                        {brandingForm.logoUrl ? <Image src={brandingForm.logoUrl} alt="Logo" fill className="object-contain" /> : <Trophy className="h-8 w-8 opacity-20" />}
                        {isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" disabled={!isSuperAdmin} />
                        <Label htmlFor="logo-upload"><Button asChild variant="outline" className="h-10 text-[10px] font-black uppercase border-white/10 w-full cursor-pointer"><span><Upload className="h-3 w-3 mr-2" /> Upload New Logo</span></Button></Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Team Name</Label>
                    <Input value={brandingForm.name} onChange={e => setBrandingForm({...brandingForm, name: e.target.value})} className="h-11 bg-black/40 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={brandingForm.primary} onChange={e => setBrandingForm({...brandingForm, primary: e.target.value})} className="w-10 h-10 p-1" />
                        <Input value={brandingForm.primary} onChange={e => setBrandingForm({...brandingForm, primary: e.target.value})} className="h-10 uppercase font-mono text-[10px]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={brandingForm.secondary} onChange={e => setBrandingForm({...brandingForm, secondary: e.target.value})} className="w-10 h-10 p-1" />
                        <Input value={brandingForm.secondary} onChange={e => setBrandingForm({...brandingForm, secondary: e.target.value})} className="h-10 uppercase font-mono text-[10px]" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleUpdateBranding} disabled={isSaving || !isSuperAdmin} className="w-full h-12 bg-primary font-black uppercase tracking-widest text-[10px]">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Update Identity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
             <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <Users className="h-4 w-4 text-[var(--tenant-primary)]" /> User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-[10px] font-black uppercase">User Profile</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Linked Player</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Role</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamUsers.map(u => (
                      <TableRow key={u.id} className="border-white/5">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{u.firstName} {u.lastName}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={u.playerId || "none"} onValueChange={(val) => updateUserProfile(u.id, { playerId: val === "none" ? null : val })}>
                            <SelectTrigger className="w-[200px] h-9 bg-black/40 text-[10px] font-black uppercase border-white/10">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="none">None / Official</SelectItem>
                               {roster.map(p => <SelectItem key={p.id} value={p.id}>#{p.number} - {p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={u.role} onValueChange={(val) => updateUserProfile(u.id, { role: val })}>
                            <SelectTrigger className="w-[140px] h-9 bg-black/40 text-[10px] font-black uppercase border-white/10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="booth_admin">Booth Admin</SelectItem>
                              <SelectItem value="league_admin">League Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => { if(confirm("Delete user?")) deleteUserAccount(u.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Users className="h-4 w-4 text-[var(--tenant-primary)]" /> Team Roster
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase" onClick={() => {
                    setEditingPlayerId(null);
                    setPlayerForm({ name: "", number: "", announcementAudioUrl: "", songs: [{ name: "", videoId: "", startAt: 0 }] });
                    setAudioFile(null);
                  }}>
                    <Plus className="h-3 w-3 mr-1" /> Add Player
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roster.map(p => (
                    <div key={p.id} className="p-3 bg-black/20 rounded-lg border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black">#{p.number}</div>
                        <span className="text-xs font-bold uppercase">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditPlayer(p)}><ChevronRight className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if(confirm("Delete player?")) deletePlayer(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Settings className="h-4 w-4 text-[var(--tenant-primary)]" /> 
                    {editingPlayerId ? `Edit: ${playerForm.name}` : "Manage Player Profile"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                      <Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} className="h-11 bg-black/40 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jersey Number</Label>
                      <Input type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} className="h-11 bg-black/40 font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Mic2 className="h-3 w-3" /> Announcement Audio
                    </Label>
                    <Input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="bg-black/20 cursor-pointer border-dashed border-white/10" />
                    {playerForm.announcementAudioUrl && <p className="text-[8px] font-black text-green-500 uppercase">Existing audio clip linked.</p>}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                      <Music className="h-3 w-3" /> Walk-Up Tracks (YouTube)
                    </Label>
                    {playerForm.songs.map((song, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-black/20 rounded-lg border border-white/5 relative">
                        <Input className="col-span-4 h-9 text-[10px] font-bold" placeholder="Track Name" value={song.name} onChange={e => {
                          const n = [...playerForm.songs]; n[idx].name = e.target.value; setPlayerForm({...playerForm, songs: n});
                        }} />
                        <Input className="col-span-5 h-9 text-[10px] font-bold" placeholder="YouTube URL/ID" value={song.videoId} onChange={e => {
                          const n = [...playerForm.songs]; n[idx].videoId = e.target.value; setPlayerForm({...playerForm, songs: n});
                        }} />
                        <Input className="col-span-3 h-9 text-[10px] font-bold" placeholder="Start (s)" type="number" value={song.startAt || ""} onChange={e => {
                          const n = [...playerForm.songs]; n[idx].startAt = parseInt(e.target.value) || 0; setPlayerForm({...playerForm, songs: n});
                        }} />
                        {playerForm.songs.length > 1 && (
                          <button onClick={() => {
                            const n = playerForm.songs.filter((_, i) => i !== idx); setPlayerForm({...playerForm, songs: n});
                          }} className="absolute -right-2 -top-2 bg-destructive text-white rounded-full p-1 shadow-lg"><X className="h-3 w-3" /></button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full h-10 border-dashed text-[10px] font-black uppercase" onClick={() => setPlayerForm({...playerForm, songs: [...playerForm.songs, { name: "", videoId: "", startAt: 0 }]})}>
                      <Plus className="h-3 w-3 mr-2" /> Add Track Option
                    </Button>
                  </div>

                  <Button disabled={isSaving} onClick={handleSavePlayerProfile} className="w-full h-14 bg-primary text-white font-black uppercase text-[10px] tracking-widest">
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Player Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="booth" className="space-y-6">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <Music className="h-4 w-4 text-[var(--tenant-primary)]" /> Audio Configurations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                   <p className="text-[10px] font-black uppercase tracking-widest">Booth Engine configuration pending deployment.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="soundfx" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 bg-card/50 border-white/10 h-fit">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-[var(--tenant-primary)]" /> Register Sound FX
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase">Add quick-hit audio clips to the booth.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUploadFX} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Effect Name</Label>
                      <Input placeholder="e.g. Mario Coin" value={fxForm.name} onChange={e => setFxForm({ ...fxForm, name: e.target.value })} className="h-11 bg-black/40 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Audio File (MP3/WAV)</Label>
                      <div className="relative group">
                        <Input 
                          type="file" 
                          accept="audio/*" 
                          onChange={e => setFxFile(e.target.files?.[0] || null)} 
                          className="h-14 bg-black/40 font-bold opacity-0 absolute inset-0 z-10 cursor-pointer" 
                        />
                        <div className="h-14 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center bg-black/20 group-hover:border-[var(--tenant-primary)]/50 transition-colors">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">
                            {fxFile ? fxFile.name : "Choose or Drop Audio"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button disabled={isUploading || !fxFile || !fxForm.name} type="submit" className="w-full h-12 bg-[var(--tenant-primary)] font-black uppercase tracking-widest text-[10px]">
                      {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Upload Sound FX
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Music className="h-4 w-4 text-[var(--tenant-primary)]" /> Soundboard Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {soundEffects.length === 0 ? (
                      <div className="col-span-full py-20 text-center opacity-20">
                        <Volume2 className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No sound effects configured</p>
                      </div>
                    ) : (
                      soundEffects.map((fx) => (
                        <div key={fx.id} className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-[var(--tenant-primary)]/30 transition-all">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-wider">{fx.name}</span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Uploaded {fx.createdAt?.toDate ? fx.createdAt.toDate().toLocaleDateString() : "Just now"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => togglePreview(fx)} 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-10 w-10 rounded-full transition-all",
                                previewingId === fx.id ? "bg-red-500/20 text-red-500" : "bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]"
                              )}
                            >
                              {previewingId === fx.id ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                            </Button>
                            <Button onClick={() => handleDeleteFX(fx)} variant="ghost" size="icon" className="h-10 w-10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <audio ref={audioPreviewRef} className="hidden" onEnded={() => setPreviewingId(null)} />

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
           <ShieldAlert className="h-3 w-3 text-primary" /> Workspace Access Control Active
        </div>
      </footer>
    </div>
  );
}

export default function UATAdminPortalPage() {
  return (
    <UATGameProvider>
      <UATAdminPortalContent />
    </UATGameProvider>
  );
}
