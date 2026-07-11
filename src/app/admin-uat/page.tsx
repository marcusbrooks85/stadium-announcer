"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  Music, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Palette,
  AlertTriangle,
  FileAudio,
  ShieldAlert,
  Upload,
  Trophy,
  Phone,
  UserCircle,
  Settings
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
import { useToast } from "@/hooks/use-toast";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore, useStorage, useAuth } from "@/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

function UATAdminPortalContent() {
  const router = useRouter();
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

  // Profile/Branding Form States
  const [profileForm, setProfileForm] = useState({ fullName: "", phoneNumber: "" });
  const [brandingForm, setBrandingForm] = useState({ name: "", primary: "", secondary: "", logoUrl: "" });

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

  // Load active user's own profile info
  useEffect(() => {
    if (auth.currentUser && isLoaded) {
      const unsub = onSnapshot(doc(db, "users_UAT", auth.currentUser.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfileForm({
            fullName: data.fullName || "",
            phoneNumber: data.phoneNumber || ""
          });
        }
      });
      return () => unsub();
    }
  }, [auth.currentUser, db, isLoaded]);

  // Fetch users for authorized roles
  useEffect(() => {
    const isAdmin = ["super_admin", "league_admin"].includes(userRole || "");
    if (isAdmin && userTeamId) {
      const q = query(collection(db, "users_UAT"), where("teamId", "==", userTeamId));
      return onSnapshot(q, (snap) => {
        setTeamUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [userRole, userTeamId, db]);

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
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber
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

  const handleUpdateUserPlayer = async (userId: string, playerId: string) => {
    try {
      await updateUserProfile(userId, { playerId: playerId === "none" ? null : playerId });
      toast({ title: "Profile Linked" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleUpdateUserPhone = async (userId: string, phone: string) => {
    try {
      await updateUserProfile(userId, { phoneNumber: phone });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed" });
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
            {isManagement && <TabsTrigger value="logistics" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Logistics & Schedule</TabsTrigger>}
            {(isManagement || isBoothAdmin) && <TabsTrigger value="booth" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Booth Config</TabsTrigger>}
          </TabsList>

          <TabsContent value="identity" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Profile Section */}
              <Card className="bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <UserCircle className="h-4 w-4 text-[var(--tenant-primary)]" /> Personal Profile
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold">Manage your user information within this workspace.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                    <Input value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} className="h-11 bg-black/40 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                    <Input value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="h-11 bg-black/40 font-bold" />
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
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-12 w-12 border-white/10" 
                            onClick={() => { navigator.clipboard.writeText(teamData?.code || ""); toast({ title: "Code Copied" }); }}
                          >
                             <Trophy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase text-center mt-3 tracking-widest">Share this code with team members to join.</p>
                     </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Branding - Super Admin Only */}
              <Card className={cn("bg-card/50 border-white/10", !isSuperAdmin && "opacity-50 pointer-events-none")}>
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Palette className="h-4 w-4 text-[var(--tenant-primary)]" /> Visual Identity
                  </CardTitle>
                  {!isSuperAdmin && <Badge variant="secondary" className="w-fit text-[8px] font-black uppercase">Owner Only</Badge>}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Team Logo</Label>
                    <div className="flex items-center gap-6">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/5 bg-black/40 flex items-center justify-center">
                        {brandingForm.logoUrl ? (
                          <Image src={brandingForm.logoUrl} alt="Logo Preview" fill className="object-contain" />
                        ) : (
                          <Trophy className="h-8 w-8 opacity-20" />
                        )}
                        {isUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="relative">
                           <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" disabled={!isSuperAdmin} />
                           <Label htmlFor="logo-upload">
                             <Button asChild variant="outline" className="h-10 text-[10px] font-black uppercase border-white/10 w-full cursor-pointer">
                               <span><Upload className="h-3 w-3 mr-2" /> Upload New Logo</span>
                             </Button>
                           </Label>
                         </div>
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
                <CardDescription className="text-[10px] uppercase font-bold">Manage permissions and profile links for team members.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-[10px] font-black uppercase">User Profile</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Linked Player</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Contact</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Role</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamUsers.map(u => (
                      <TableRow key={u.id} className="border-white/5">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{u.fullName || "Unnamed User"}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={u.playerId || "none"} onValueChange={(val) => handleUpdateUserPlayer(u.id, val)}>
                            <SelectTrigger className="w-[180px] h-9 bg-black/40 text-[10px] font-black uppercase border-white/10">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="none">None / Official</SelectItem>
                               {roster.map(p => (
                                 <SelectItem key={p.id} value={p.id}>#{p.number} - {p.name}</SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Phone className="h-3 w-3 opacity-40" />
                             <Input 
                               className="h-8 w-32 bg-black/20 text-[10px] border-white/5" 
                               defaultValue={u.phoneNumber || ""} 
                               onBlur={(e) => handleUpdateUserPhone(u.id, e.target.value)}
                             />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={u.role} onValueChange={(val) => updateUserProfile(u.id, { role: val })}>
                            <SelectTrigger className="w-[140px] h-9 bg-black/40 text-[10px] font-black uppercase border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="booth_admin">Booth Admin</SelectItem>
                              <SelectItem value="league_admin">League Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => { if(confirm("Delete this user account?")) deleteUserAccount(u.id); }}><Trash2 className="h-4 w-4" /></Button>
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
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-[var(--tenant-primary)]" /> Season Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {games.map(g => (
                    <div key={g.id} className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-primary">Week {g.week} • {g.date}</span>
                        <span className="text-xs font-bold">{g.away} vs {g.home}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase">Edit</Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteGame(g.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-dashed h-12 font-black uppercase text-[10px] tracking-widest">
                    <Plus className="h-4 w-4 mr-2" /> Schedule New Game
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/10">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Users className="h-4 w-4 text-[var(--tenant-primary)]" /> Team Roster
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roster.map(p => (
                    <div key={p.id} className="p-3 bg-black/20 rounded-lg border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black">#{p.number}</div>
                        <span className="text-xs font-bold uppercase">{p.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deletePlayer(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-dashed h-12 font-black uppercase text-[10px] tracking-widest">
                    <Plus className="h-4 w-4 mr-2" /> Add Player to Roster
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
                <CardDescription className="text-[10px] uppercase font-bold">Assign walk-up music and stadium sound effects.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"><FileAudio className="h-6 w-6 text-primary" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-widest">Dynamic Walk-Up Engine</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Integrated with workspace roster.</span>
                      </div>
                    </div>
                    <Button className="bg-primary font-black uppercase text-[10px] tracking-widest h-10 px-6">Manage Audio</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
