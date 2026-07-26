
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Trophy, 
  Loader2, 
  CheckCircle2, 
  Copy,
  Check,
  Building2,
  ChevronRight,
  Lock,
  UserPlus,
  Phone,
  User as UserIcon,
  X,
  Mail,
  ArrowLeft,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  ActionCodeSettings
} from "firebase/auth";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDocs, updateDoc, query, where, limit, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";

type Step = "auth" | "tos" | "team-setup" | "success" | "tutorial" | "forgot-password";

export default function UATOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("auth");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isJoinMode, setIsJoinMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [fetchingPlayers, setFetchingPlayers] = useState(false);
  
  const { auth, firestore: db } = initializeFirebase();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "",
    teamName: "", city: "", state: "", accessCode: "", phoneNumber: "", playerId: "none"
  });

  const passwordCriteria = useMemo(() => ({
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordStrong = formData.password.length >= 8 && Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  useEffect(() => {
    let unsub: any;
    const fetchPlayers = async () => {
      if (isJoinMode && isRegisterMode && formData.accessCode.length >= 6) {
        setFetchingPlayers(true);
        try {
          const q = query(collection(db, "teams_UAT"), where("code", "==", formData.accessCode.trim().toUpperCase()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const teamId = snap.docs[0].id;
            unsub = onSnapshot(query(collection(db, "players_UAT"), where("teamId", "==", teamId)), (pSnap) => {
              setAvailablePlayers(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
              setFetchingPlayers(false);
            });
          } else { setAvailablePlayers([]); setFetchingPlayers(false); }
        } catch (e) { setFetchingPlayers(false); }
      } else { setAvailablePlayers([]); }
    };
    fetchPlayers(); return () => unsub?.();
  }, [formData.accessCode, isJoinMode, isRegisterMode, db]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode && (!isPasswordStrong || !passwordsMatch || !formData.phoneNumber)) return;
    setLoading(true);
    try {
      if (isRegisterMode) {
        let teamIdToJoin = "";
        let teamCodeToJoin = "";
        if (isJoinMode) {
          const q = query(collection(db, "teams_UAT"), where("code", "==", formData.accessCode.trim().toUpperCase()));
          const snap = await getDocs(q);
          if (snap.empty) { toast({ variant: "destructive", title: "Invalid Code" }); setLoading(false); return; }
          teamIdToJoin = snap.docs[0].id;
          teamCodeToJoin = snap.docs[0].data().code;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDoc(doc(db, "users_UAT", userCredential.user.uid), {
          email: formData.email, firstName: formData.firstName, lastName: formData.lastName,
          phoneNumber: formData.phoneNumber, playerId: formData.playerId === "none" ? null : formData.playerId,
          role: isJoinMode ? "user" : "super_admin", teamId: teamIdToJoin || null, teamCode: teamCodeToJoin || null,
          createdAt: serverTimestamp()
        });
        setStep("tos");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push("/booth-uat");
      }
    } catch (error: any) { toast({ variant: "destructive", title: "Auth Failed", description: error.message }); }
    finally { setLoading(false); }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !formData.teamName) return;
    setLoading(true);
    try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let teamCode = "";
      for (let i = 0; i < 10; i++) teamCode += chars.charAt(Math.floor(Math.random() * chars.length));
      const teamRef = await addDoc(collection(db, "teams_UAT"), {
        name: formData.teamName, city: formData.city, state: formData.state, code: teamCode, ownerUid: user.uid, createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "users_UAT", user.uid), { teamId: teamRef.id, teamCode: teamCode });
      setGeneratedCode(teamCode);
      setStep("success");
    } finally { setLoading(false); }
  };

  const CriteriaItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase", met ? "text-green-500" : "text-red-500")}>
      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />} {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-background stadium-gradient flex items-center justify-center p-4 overflow-y-auto">
      {step === "auth" && (
        <Card className="w-full max-w-xl border-2 border-secondary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><Trophy className="w-6 h-6 text-secondary" /> {isRegisterMode ? (isJoinMode ? "Join Team" : "Register Owner") : "Booth Operator Login"}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAuthAction} className="space-y-4">
              {isRegisterMode && <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">First Name</Label><Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 bg-black/40" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Last Name</Label><Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 bg-black/40" /></div>
              </div>}
              {isRegisterMode && <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Phone Number</Label><Input placeholder="xxx-xxx-xxxx" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="h-12 bg-black/40" /></div>}
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Email</Label><Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-black/40" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Password</Label>
                <div className="relative"><Input required type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="h-12 bg-black/40" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">{showPassword ? <EyeOff /> : <Eye />}</button></div>
                {isRegisterMode && <div className="grid grid-cols-2 gap-1 pt-2"><CriteriaItem met={passwordCriteria.upper} label="Upper" /><CriteriaItem met={passwordCriteria.lower} label="Lower" /><CriteriaItem met={passwordCriteria.number} label="Number" /><CriteriaItem met={passwordCriteria.special} label="Special" /></div>}
              </div>
              {isRegisterMode && isJoinMode && <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Team Access Code</Label><Input value={formData.accessCode} onChange={(e) => setFormData({...formData, accessCode: e.target.value.toUpperCase()})} className="h-12 bg-black/40 text-center font-black" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Associate with Player</Label>
                  <Select value={formData.playerId} onValueChange={(val) => setFormData({...formData, playerId: val})}>
                    <SelectTrigger className="h-12 bg-black/40">{fetchingPlayers ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : <SelectValue placeholder="Select Player..." />}</SelectTrigger>
                    <SelectContent><SelectItem value="none">None / Official</SelectItem>{availablePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (#{p.number})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>}
              <Button disabled={loading} type="submit" className="w-full h-14 bg-secondary font-black uppercase">{loading ? <Loader2 className="animate-spin" /> : (isRegisterMode ? "Create Account" : "Secure Sign In")}</Button>
            </form>
            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
              {!isRegisterMode ? <><button onClick={() => { setIsRegisterMode(true); setIsJoinMode(true); }} className="h-12 border border-primary/20 rounded-xl text-[10px] font-black uppercase text-primary">I have a team code</button>
              <button onClick={() => { setIsRegisterMode(true); setIsJoinMode(false); }} className="h-12 border border-white/10 rounded-xl text-[10px] font-black uppercase text-muted-foreground">Register new team</button></>
              : <button onClick={() => setIsRegisterMode(false)} className="text-[10px] font-black uppercase text-muted-foreground">Back to Sign In</button>}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "tos" && (
        <Card className="w-full max-w-lg border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4"><div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-primary" /></div>
          <CardTitle className="text-2xl font-black uppercase">Acknowledgement Required</CardTitle>
          <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Please review and accept our stadium operations protocol.</CardDescription></CardHeader>
          <CardContent className="space-y-4 py-4 text-[11px] font-medium leading-relaxed uppercase opacity-70">
            <p>1. This platform is for recreational team management and entertainment purposes only.</p>
            <p>2. Users are responsible for all media playback and adherence to stadium guidelines.</p>
            <p>3. Privacy is maintained within your isolated team workspace.</p>
          </CardContent>
          <CardFooter><Button onClick={() => isJoinMode ? setStep("tutorial") : setStep("team-setup")} className="w-full h-12 bg-primary font-black uppercase">Accept & Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter>
        </Card>
      )}

      {step === "team-setup" && (
        <Card className="w-full max-w-xl border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><Trophy className="w-6 h-6 text-primary" /> Team Workspace Setup</CardTitle></CardHeader>
          <CardContent><form onSubmit={handleCreateTeam} className="space-y-6">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Team Name</Label><Input required value={formData.teamName} onChange={(e) => setFormData({...formData, teamName: e.target.value})} className="h-12 bg-black/40" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase">City</Label><Input required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="h-12 bg-black/40" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase">State</Label><Input required maxLength={2} value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})} className="h-12 bg-black/40" /></div>
            </div>
            <Button disabled={loading} type="submit" className="w-full h-14 bg-primary font-black uppercase">Generate Team Workspace</Button>
          </form></CardContent>
        </Card>
      )}

      {step === "success" && (
        <Card className="w-full max-w-lg border-2 border-green-500/20 bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4"><div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-green-500" /></div>
          <CardTitle className="text-2xl font-black uppercase">Workspace Ready</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Team Access Code</Label>
              <div className="flex gap-2"><Input readOnly value={generatedCode} className="h-12 bg-black/40 text-lg font-black text-center" />
              <Button size="icon" className="h-12 w-12" onClick={() => { navigator.clipboard.writeText(generatedCode); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>{copied ? <Check /> : <Copy />}</Button></div>
            </div>
          </CardContent>
          <CardFooter><Button onClick={() => setStep("tutorial")} className="w-full h-12 bg-primary font-black uppercase">Start Tutorial</Button></CardFooter>
        </Card>
      )}

      {step === "tutorial" && (
        <Card className="w-full max-w-xl border-2 border-primary/30 bg-card/80 backdrop-blur-2xl">
          <CardHeader className="text-center pt-8 pb-4"><CardTitle className="text-2xl font-black uppercase">Welcome to the Booth</CardTitle></CardHeader>
          <CardContent className="px-8 pb-10 text-center"><p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">Your workspace is active. Manage your roster, schedule games, and control the atmosphere.</p></CardContent>
          <CardFooter className="p-0 border-t border-white/5"><Button disabled={loading} onClick={() => router.push("/booth-uat")} className="w-full h-16 bg-primary font-black uppercase text-lg">Enter Booth</Button></CardFooter>
        </Card>
      )}
    </div>
  );
}
