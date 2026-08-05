
"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Calendar, 
  Megaphone, 
  FileCode, 
  Search, 
  Pencil, 
  Check, 
  X, 
  ArrowRight,
  UserCheck,
  Building
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
import { useUATGame, UATGameProvider, Division, Team } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, deleteDoc, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { cn } from "@/lib/utils";

function AssociationHubContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const { 
    isLoaded, 
    isAssociationAdmin, 
    divisions, 
    saveDivision, 
    deleteDivision 
  } = useUATGame();

  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Division Form
  const [divForm, setDivForm] = useState({ name: "", ageRange: "", description: "" });
  const [editingDivId, setEditingDivId] = useState<string | null>(null);

  // Team Form
  const [teamForm, setTeamForm] = useState({ name: "", divisionId: "" });

  // Load All Teams
  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, "teams_UAT"), (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    });
  }, [db]);

  // Load All Users
  useEffect(() => {
    if (!db) return;
    return onSnapshot(collection(db, "users_UAT"), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [db]);

  const handleSaveDivision = async () => {
    if (!divForm.name) return;
    setIsSaving(true);
    try {
      await saveDivision(divForm, editingDivId || undefined);
      setDivForm({ name: "", ageRange: "", description: "" });
      setEditingDivId(null);
      toast({ title: "Division Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    } finally { setIsSaving(false); }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name) return;
    setIsSaving(true);
    try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let teamCode = "";
      for (let i = 0; i < 10; i++) teamCode += chars.charAt(Math.floor(Math.random() * chars.length));

      await addDoc(collection(db, "teams_UAT"), {
        name: teamForm.name,
        divisionId: teamForm.divisionId,
        code: teamCode,
        createdAt: serverTimestamp()
      });
      setTeamForm({ name: "", divisionId: "" });
      toast({ title: "Team Created", description: `Code: ${teamCode}` });
    } finally { setIsSaving(false); }
  };

  const handleUpdateUserRole = async (uid: string, role: string, teamId?: string) => {
    try {
      await updateDoc(doc(db, "users_UAT", uid), { role, teamId: teamId || null });
      toast({ title: "Role Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center stadium-gradient"><Loader2 className="animate-spin" /></div>;
  if (!isAssociationAdmin) return <div className="h-screen flex items-center justify-center stadium-gradient uppercase font-black text-xs">Access Restricted to Association Admins</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">ASSOCIATION HUB</h1>
            <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Global Management Level</span>
          </div>
        </div>
        <UATNavbar />
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24">
        <Tabs defaultValue="divisions" className="space-y-8">
          <TabsList className="bg-black/20 p-1 border border-white/5 h-12 w-full justify-start overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsTrigger value="divisions" className="text-[10px] font-black uppercase px-6 h-10">Divisions</TabsTrigger>
            <TabsTrigger value="teams" className="text-[10px] font-black uppercase px-6 h-10">Team Management</TabsTrigger>
            <TabsTrigger value="users" className="text-[10px] font-black uppercase px-6 h-10">User Directory</TabsTrigger>
            <TabsTrigger value="announcements" className="text-[10px] font-black uppercase px-6 h-10">Global Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="divisions" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 bg-card/50 border-white/10 h-fit">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                    <Layers className="h-4 w-4 text-primary" /> Division Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Division Name</Label>
                    <Input value={divForm.name} onChange={e => setDivForm({...divForm, name: e.target.value})} placeholder="e.g. Minors" className="bg-black/40 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Age Range</Label>
                    <Input value={divForm.ageRange} onChange={e => setDivForm({...divForm, ageRange: e.target.value})} placeholder="e.g. 9-10" className="bg-black/40 font-bold" />
                  </div>
                  <Button onClick={handleSaveDivision} disabled={isSaving} className="w-full bg-primary font-black uppercase text-[10px]">
                    {isSaving ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} {editingDivId ? "Update Division" : "Create Division"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Active Divisions</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="border-white/5"><TableHead className="text-[10px] font-black uppercase">Name</TableHead><TableHead className="text-[10px] font-black uppercase">Age Group</TableHead><TableHead className="text-[10px] font-black uppercase text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {divisions.map(d => (
                        <TableRow key={d.id} className="border-white/5">
                          <TableCell className="text-xs font-bold">{d.name}</TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground">{d.ageRange} Years</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingDivId(d.id); setDivForm(d); }} className="h-8 w-8 text-primary"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteDivision(d.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 bg-card/50 border-white/10 h-fit">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Bulk Team Builder</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Team Name</Label>
                    <Input value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} className="bg-black/40 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Assign to Division</Label>
                    <Select value={teamForm.divisionId} onValueChange={v => setTeamForm({...teamForm, divisionId: v})}>
                      <SelectTrigger className="bg-black/40 font-bold"><SelectValue placeholder="Select Division" /></SelectTrigger>
                      <SelectContent>
                        {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateTeam} disabled={isSaving} className="w-full bg-secondary text-secondary-foreground font-black uppercase text-[10px]">Generate New Team</Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card/50 border-white/10">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Association Roster</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="border-white/5"><TableHead className="text-[10px] font-black uppercase">Team Name</TableHead><TableHead className="text-[10px] font-black uppercase">Division</TableHead><TableHead className="text-[10px] font-black uppercase">Access Code</TableHead><TableHead className="text-[10px] font-black uppercase text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {teams.map(t => (
                        <TableRow key={t.id} className="border-white/5">
                          <TableCell className="text-xs font-bold">{t.name}</TableCell>
                          <TableCell>
                            <Select value={t.divisionId || "none"} onValueChange={async (v) => await updateDoc(doc(db, "teams_UAT", t.id), { divisionId: v })}>
                              <SelectTrigger className="h-8 text-[10px] bg-black/20 w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-primary">{t.code}</TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db, "teams_UAT", t.id))} className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Global User Directory</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="border-white/5"><TableHead className="text-[10px] font-black uppercase">User</TableHead><TableHead className="text-[10px] font-black uppercase">Global Role</TableHead><TableHead className="text-[10px] font-black uppercase">Assigned Team</TableHead><TableHead className="text-[10px] font-black uppercase text-right">Quick Provision</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {allUsers.map(u => (
                      <TableRow key={u.id} className="border-white/5">
                        <TableCell><div className="flex flex-col"><span className="text-xs font-bold">{u.firstName} {u.lastName}</span><span className="text-[8px] opacity-50 uppercase">{u.email}</span></div></TableCell>
                        <TableCell>
                          <Select value={u.role || "user"} onValueChange={v => handleUpdateUserRole(u.id, v, u.teamId)}>
                            <SelectTrigger className="h-8 text-[10px] w-40 bg-black/20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="association_admin">Association Admin</SelectItem>
                              <SelectItem value="super_admin">Team Super Admin</SelectItem>
                              <SelectItem value="league_admin">League Admin</SelectItem>
                              <SelectItem value="booth_admin">Booth Admin</SelectItem>
                              <SelectItem value="user">User/Parent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={u.teamId || "none"} onValueChange={v => handleUpdateUserRole(u.id, u.role, v === "none" ? undefined : v)}>
                            <SelectTrigger className="h-8 text-[10px] w-40 bg-black/20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleUpdateUserRole(u.id, "super_admin", u.teamId)} className="text-[8px] font-black uppercase">Promote to Super Admin</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-8">
            <Card className="bg-card/50 border-white/10">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Megaphone className="h-4 w-4 text-primary" /> Association Broadcast Center</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
                  <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Announcement Engine Initializing</p>
                  <Button variant="outline" className="mt-4 text-[10px] font-black uppercase">Schedule Multi-Division Notification</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AssociationHubPage() {
  return (
    <UATGameProvider>
      <AssociationHubContent />
    </UATGameProvider>
  );
}
