"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Settings, 
  Users, 
  Calendar, 
  Music, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Lock,
  Palette,
  AlertTriangle,
  FileAudio,
  ShieldAlert,
  ChevronLeft
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
import { useFirestore } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function UATAdminPortalContent() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const { 
    isLoaded, 
    userRole, 
    userTeamId, 
    teamData, 
    roster, 
    games,
    saveTeamBranding,
    updateUserRole,
    deleteUserAccount,
    savePlayer,
    deletePlayer,
    saveGame,
    deleteGame
  } = useUATGame();

  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [brandingForm, setBrandingForm] = useState({ name: "", primary: "", secondary: "" });

  useEffect(() => {
    if (teamData) {
      setBrandingForm({
        name: teamData.name || "",
        primary: teamData.primaryColor || "#4285FF",
        secondary: teamData.secondaryColor || "#2EB1D9"
      });
    }
  }, [teamData]);

  // Fetch users for Super Admin
  useEffect(() => {
    if (userRole === "super_admin" && userTeamId) {
      const q = query(collection(db, "users_UAT"), where("teamId", "==", userTeamId));
      return onSnapshot(q, (snap) => {
        setTeamUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [userRole, userTeamId, db]);

  const handleUpdateBranding = async () => {
    setIsSaving(true);
    try {
      await saveTeamBranding({
        name: brandingForm.name,
        primaryColor: brandingForm.primary,
        secondaryColor: brandingForm.secondary
      });
      toast({ title: "Branding Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Admin Environment...</span>
    </div>;
  }

  // Final role check for the portal
  const hasAccess = ["super_admin", "league_admin", "booth_admin"].includes(userRole || "");
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center stadium-gradient p-4 text-center">
        <div className="bg-card/50 border border-white/10 p-12 rounded-3xl backdrop-blur-xl max-w-md w-full shadow-2xl">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Access Denied</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed mb-8">
            You do not have administrative clearance to access the management workspace.
          </p>
          <Link href="/uat">
            <Button className="w-full h-14 font-black uppercase tracking-widest bg-primary">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground stadium-gradient overflow-hidden flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT ADMIN PORTAL</h1>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[var(--tenant-primary)]" />
            <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">Verified: {userRole?.replace('_', ' ')}</span>
          </div>
        </div>
        <UATNavbar />
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24">
        <Tabs defaultValue="logistics" className="space-y-8">
          <TabsList className="bg-black/20 p-1 border border-white/5 h-12 w-full justify-start overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(userRole === "super_admin") && <TabsTrigger value="branding" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Branding</TabsTrigger>}
            {(userRole === "super_admin") && <TabsTrigger value="users" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Team Users</TabsTrigger>}
            {(userRole === "super_admin" || userRole === "league_admin") && <TabsTrigger value="logistics" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Logistics & Schedule</TabsTrigger>}
            {(userRole === "super_admin" || userRole === "booth_admin") && <TabsTrigger value="booth" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Booth Config</TabsTrigger>}
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Card className="bg-card/50 border-white/10 max-w-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <Palette className="h-4 w-4 text-[var(--tenant-primary)]" /> Visual Identity
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold">Configure workspace colors and name.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Team Name</Label>
                  <Input value={brandingForm.name} onChange={e => setBrandingForm({...brandingForm, name: e.target.value})} className="h-12 bg-black/40 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Primary Color</Label>
                    <div className="flex gap-3">
                      <Input type="color" value={brandingForm.primary} onChange={e => setBrandingForm({...brandingForm, primary: e.target.value})} className="w-12 h-12 p-1" />
                      <Input value={brandingForm.primary} onChange={e => setBrandingForm({...brandingForm, primary: e.target.value})} className="h-12 uppercase font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Secondary Color</Label>
                    <div className="flex gap-3">
                      <Input type="color" value={brandingForm.secondary} onChange={e => setBrandingForm({...brandingForm, secondary: e.target.value})} className="w-12 h-12 p-1" />
                      <Input value={brandingForm.secondary} onChange={e => setBrandingForm({...brandingForm, secondary: e.target.value})} className="h-12 uppercase font-mono" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                   <Label className="text-[10px] font-black uppercase text-primary mb-2 block">Workspace Access Code</Label>
                   <code className="text-xl font-black tracking-[0.2em] text-white bg-black/40 px-4 py-2 rounded-lg border border-white/5 block text-center">
                     {teamData?.code}
                   </code>
                </div>
                <Button onClick={handleUpdateBranding} disabled={isSaving} className="w-full h-14 bg-primary font-black uppercase tracking-widest">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Identity
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
             <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <Users className="h-4 w-4 text-[var(--tenant-primary)]" /> User Management
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold">Manage permissions for team administrators and users.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-[10px] font-black uppercase">User</TableHead>
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
                          <Select defaultValue={u.role} onValueChange={(val) => updateUserRole(u.id, val)}>
                            <SelectTrigger className="w-[160px] h-9 bg-black/40 text-[10px] font-black uppercase border-white/10">
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
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteUserAccount(u.id)}><Trash2 className="h-4 w-4" /></Button>
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
              {/* Schedule Management */}
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

              {/* Roster Management */}
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
                  
                  <div className="p-6 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center"><Music className="h-6 w-6 text-secondary" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-widest">Stadium Soundboard</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Configure organ hits and hype tracks.</span>
                      </div>
                    </div>
                    <Button className="bg-secondary text-secondary-foreground font-black uppercase text-[10px] tracking-widest h-10 px-6">Edit Soundboard</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-md border-t border-white/5 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
           <AlertTriangle className="h-3 w-3 text-amber-500" /> Administrative Sandbox
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