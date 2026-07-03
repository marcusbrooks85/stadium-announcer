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
  Zap,
  AlertTriangle,
  Lock,
  Trash,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { useFirestore, useAuth } from "@/firebase";
import { collection, addDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UATNavbar } from "@/components/UATNavbar";

function UATAdminContent() {
  const { 
    roster, 
    savePlayer, 
    deletePlayer,
    userRole,
    userTeamId,
    isLoaded,
    teamBranding,
    updateBranding
  } = useUATGame();
  
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [playerForm, setPlayerForm] = useState({ name: "", number: 0 });
  const [gameForm, setGameForm] = useState({ home: "", away: "", time: "", location: "" });
  const [brandForm, setBrandForm] = useState({ primary: teamBranding.primary, secondary: teamBranding.secondary });

  const validateRosterEntry = (name: string, number: number) => {
    if (!name || name.trim().length < 2) {
      toast({ variant: "destructive", title: "Validation Error", description: "Player Name must be at least 2 characters." });
      return false;
    }
    if (number < 0 || number > 99) {
      toast({ variant: "destructive", title: "Validation Error", description: "Jersey Number must be between 0 and 99." });
      return false;
    }
    return true;
  };

  const handleAddPlayer = async () => {
    if (!validateRosterEntry(playerForm.name, playerForm.number)) return;
    
    if (userRole === "user") {
      toast({ variant: "destructive", title: "Access Denied", description: "Read-only accounts cannot add players." });
      return;
    }
    setIsSaving(true);
    try {
      savePlayer({
        name: playerForm.name,
        number: playerForm.number,
        announcementAudioUrl: "",
        songs: [],
        teamId: userTeamId!
      });
      setPlayerForm({ name: "", number: 0 });
      toast({ title: "Test Player Added", description: "Profile schema validated successfully." });
    } finally { setIsSaving(false); }
  };

  const handleAddGame = async () => {
    if (!gameForm.home || !gameForm.away || !db || !userTeamId) return;
    if (userRole !== "super_admin" && userRole !== "league_admin") {
      toast({ variant: "destructive", title: "Access Denied", description: "Only admins can schedule games." });
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "games_UAT"), {
        ...gameForm,
        teamId: userTeamId,
        createdAt: new Date().toISOString()
      });
      setGameForm({ home: "", away: "", time: "", location: "" });
      toast({ title: "Test Game Added" });
    } finally { setIsSaving(false); }
  };

  const handleUpdateBranding = async () => {
    setIsSaving(true);
    try {
      await updateBranding(brandForm.primary, brandForm.secondary);
      toast({ title: "Branding Updated", description: "Workspace colors have been refreshed." });
    } finally { setIsSaving(false); }
  };

  const handleSecureDeletion = async () => {
    if (deleteConfirmText !== "DELETE" || !auth?.currentUser || !db) return;
    
    setIsDeleting(true);
    try {
      const user = auth.currentUser;
      const batch = writeBatch(db);
      
      batch.delete(doc(db, "users_UAT", user.uid));
      if (userTeamId) {
        batch.delete(doc(db, "teams_UAT", userTeamId));
      }

      await batch.commit();
      await deleteUser(user);
      
      toast({ title: "Account Scrubbed", description: "Your UAT workspace data has been permanently deleted." });
      router.push("/uat");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Deletion Failed", 
        description: error.code === 'auth/requires-recent-login' 
          ? "For security, please logout and sign in again before deleting your account."
          : error.message 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (userRole === "user") {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl font-black uppercase">Access Denied</CardTitle>
            <CardDescription className="font-bold text-muted-foreground uppercase">
              Read-only accounts do not have administrative configuration privileges.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <UATNavbar />
            <Link href="/booth-uat" className="w-full">
              <Button variant="outline" className="w-full font-black uppercase tracking-widest">Back to Booth</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground stadium-gradient p-4 md:p-8" style={{ '--primary': teamBranding.primary } as any}>
      <div className="max-w-4xl mx-auto space-y-8 pb-40">
        <header className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-lg flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-[var(--tenant-primary)]" /> UAT MANAGEMENT
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className="text-[9px] font-black uppercase border-[var(--tenant-primary)]/30 text-[var(--tenant-primary)]">
                Role: {userRole.replace('_', ' ').toUpperCase()}
               </Badge>
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Isolated Test Configuration
               </span>
            </div>
          </div>
          <UATNavbar />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(userRole === "super_admin" || userRole === "league_admin") && (
            <Card className="bg-card/50 border-white/10 col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Workspace Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black">Primary Color (Tenant)</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandForm.primary} onChange={e => setBrandForm({...brandForm, primary: e.target.value})} className="w-12 h-10 p-1" />
                    <Input value={brandForm.primary} onChange={e => setBrandForm({...brandForm, primary: e.target.value})} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black">Secondary Color (Tenant)</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandForm.secondary} onChange={e => setBrandForm({...brandForm, secondary: e.target.value})} className="w-12 h-10 p-1" />
                    <Input value={brandForm.secondary} onChange={e => setBrandForm({...brandForm, secondary: e.target.value})} className="flex-1" />
                  </div>
                </div>
                <Button onClick={handleUpdateBranding} className="w-full bg-[var(--tenant-primary)] text-white font-black uppercase md:col-span-2">
                  <Save className="h-4 w-4 mr-2" /> Update Tenant Branding
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4" /> Roster Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Player Full Name</Label>
                <Input value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black">Jersey Number (0-99)</Label>
                <Input type="number" min="0" max="99" value={playerForm.number || ""} onChange={e => setPlayerForm({...playerForm, number: parseInt(e.target.value) || 0})} className="h-10" />
              </div>
              <Button onClick={handleAddPlayer} className="w-full bg-[var(--tenant-primary)] text-white font-black uppercase" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />} Validate & Add Player
              </Button>

              <div className="mt-6 space-y-2">
                <Label className="text-[10px] uppercase font-black opacity-50">Current UAT Roster</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                  {roster.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5 group">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">#{p.number} - {p.name}</span>
                        <span className="text-[8px] uppercase font-black text-muted-foreground">Validated Profile</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deletePlayer(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  {roster.length === 0 && <p className="text-[8px] text-center opacity-40 py-4 uppercase font-black">No test players found</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {(userRole === "super_admin" || userRole === "league_admin") && (
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Add Test Game
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input placeholder="Home Team" value={gameForm.home} onChange={e => setGameForm({...gameForm, home: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="Away Team" value={gameForm.away} onChange={e => setGameForm({...gameForm, away: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Input placeholder="e.g. 2:00 PM" value={gameForm.time} onChange={e => setGameForm({...gameForm, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Field Name" value={gameForm.location} onChange={e => setGameForm({...gameForm, location: e.target.value})} />
                </div>
                <Button onClick={handleAddGame} className="w-full bg-[var(--tenant-secondary)] text-white font-black uppercase" disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-2" /> Schedule UAT Game
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {userRole === "super_admin" && (
          <section className="pt-12">
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> DANGER ZONE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full font-black uppercase tracking-widest">
                      <Trash className="h-4 w-4 mr-2" /> Delete My Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-destructive/20">
                    <DialogHeader>
                      <DialogTitle className="text-destructive font-black uppercase tracking-widest">Irreversible Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input 
                        placeholder="Type DELETE to confirm" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="bg-black/20 font-black text-center text-destructive"
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        disabled={deleteConfirmText !== "DELETE" || isDeleting}
                        onClick={handleSecureDeletion}
                        variant="destructive" 
                        className="w-full font-black uppercase"
                      >
                        {isDeleting ? <Loader2 className="animate-spin mr-2" /> : "Confirm Destructive Wipe"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
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
