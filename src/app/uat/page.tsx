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
  ArrowLeft
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

type Step = "acknowledgement" | "auth" | "verification" | "team-setup" | "success" | "tutorial" | "forgot-password";

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
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    teamName: "",
    city: "",
    state: "",
    accessCode: "",
    phoneNumber: "",
    playerId: "none"
  });

  const passwordCriteria = useMemo(() => {
    const p = formData.password;
    return {
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  }, [formData.password]);

  const isPasswordStrong = formData.password.length >= 8 && Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  useEffect(() => {
    let unsub: any;
    const fetchPlayers = async () => {
      if (isJoinMode && isRegisterMode && formData.accessCode.length >= 8) {
        setFetchingPlayers(true);
        try {
          const q = query(collection(db, "teams_UAT"), where("code", "==", formData.accessCode.toUpperCase()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const teamId = snap.docs[0].id;
            const pq = query(collection(db, "players_UAT"), where("teamId", "==", teamId));
            unsub = onSnapshot(pq, (pSnap) => {
              setAvailablePlayers(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
              setFetchingPlayers(false);
            });
          } else {
            setAvailablePlayers([]);
            setFetchingPlayers(false);
          }
        } catch (e) {
          setFetchingPlayers(false);
        }
      } else {
        setAvailablePlayers([]);
      }
    };

    fetchPlayers();
    return () => unsub?.();
  }, [formData.accessCode, isJoinMode, isRegisterMode, db]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const formatted = formatPhoneNumber(digits);
    setFormData({ ...formData, phoneNumber: formatted });
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      if (!isPasswordStrong || !passwordsMatch || !formData.phoneNumber || !formData.firstName || !formData.lastName) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please complete all fields and meet security requirements." });
        return;
      }
      if (isJoinMode && !formData.accessCode) {
        toast({ variant: "destructive", title: "Missing Code" });
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        let teamIdToJoin = "";
        let teamCodeToJoin = "";

        if (isJoinMode) {
          const q = query(collection(db, "teams_UAT"), where("code", "==", formData.accessCode.trim().toUpperCase()));
          const snap = await getDocs(q);
          if (snap.empty) {
            toast({ variant: "destructive", title: "Invalid Team Code" });
            setLoading(false);
            return;
          }
          teamIdToJoin = snap.docs[0].id;
          teamCodeToJoin = snap.docs[0].data().code;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await setDoc(doc(db, "users_UAT", user.uid), {
          email: user.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          playerId: formData.playerId === "none" ? null : formData.playerId,
          role: isJoinMode ? "user" : "super_admin",
          teamId: teamIdToJoin || null,
          teamCode: teamCodeToJoin || null,
          hasCompletedTutorial: false,
          createdAt: serverTimestamp()
        });

        await sendEmailVerification(user);
        if (isJoinMode) setStep("tutorial"); else setStep("team-setup");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push("/booth-uat");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Failed", description: error.message });
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;
    setLoading(true);
    try {
      const q = query(collection(db, "users_UAT"), where("email", "==", formData.email), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Email Not Found", description: "No account matched this email address." });
        setLoading(false);
        return;
      }

      const actionCodeSettings: ActionCodeSettings = {
        url: 'https://stadium-announcer.vercel.app/auth/reset-password',
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, formData.email, actionCodeSettings);
      
      console.log(`Password reset email triggered for: ${formData.email} with custom redirect URL.`);
      
      toast({ 
        title: "Reset Email Sent", 
        description: "A secure link has been sent to your email to update your password. Please also check your spam folder." 
      });
      setStep("auth");
      setIsRegisterMode(false);
    } catch (err: any) {
      console.error("Failed to trigger password reset email:", err);
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally { setLoading(false); }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !formData.teamName || !formData.city || !formData.state) return;

    setLoading(true);
    try {
      const sanitizedName = formData.teamName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 6);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let teamCode = "";
      let isUnique = false;
      while (!isUnique) {
        let randomPart = "";
        for (let i = 0; i < 4; i++) randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        teamCode = `${sanitizedName}-${randomPart}`;
        const q = query(collection(db, "teams_UAT"), where("code", "==", teamCode), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) isUnique = true;
      }

      const teamRef = await addDoc(collection(db, "teams_UAT"), {
        name: formData.teamName,
        city: formData.city,
        state: formData.state,
        code: teamCode,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        primaryColor: "#4285FF",
        secondaryColor: "#2EB1D9"
      });

      await updateDoc(doc(db, "users_UAT", user.uid), {
        teamId: teamRef.id,
        teamCode: teamCode
      });

      setGeneratedCode(teamCode);
      setStep("success");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Setup Failed" });
    } finally { setLoading(false); }
  };

  const handleCompleteTutorial = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users_UAT", user.uid), { hasCompletedTutorial: true });
      router.push("/booth-uat");
    } finally { setLoading(false); }
  };

  const CriteriaItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className={cn(
      "flex items-center gap-1.5 text-[8px] md:text-[9px] font-black uppercase tracking-tighter transition-colors",
      met ? "text-green-500" : "text-red-500"
    )}>
      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {label}
    </div>
  );

  const renderAuth = () => (
    <Card className="w-full max-w-xl border-2 border-secondary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Trophy className="w-6 h-6 text-secondary" /> 
          {isRegisterMode ? (isJoinMode ? "Join Team Workspace" : "Register Team Owner") : "Booth Operator Login"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAuthAction} className="space-y-4">
          {isRegisterMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name</Label>
                  <Input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="h-12 bg-black/40" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name</Label>
                  <Input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="h-12 bg-black/40" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                <Input 
                  required 
                  placeholder="xxx-xxx-xxxx" 
                  value={formData.phoneNumber} 
                  onChange={handlePhoneChange} 
                  maxLength={12}
                  className="h-12 bg-black/40 font-mono" 
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
            <Input required type="email" placeholder="coach@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-black/40" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
              {!isRegisterMode && (
                <button type="button" onClick={() => setStep("forgot-password")} className="text-[8px] font-black uppercase tracking-widest text-primary hover:underline">Forgot Password?</button>
              )}
            </div>
            <div className="relative">
              <Input 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="8+ characters required" 
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                className="h-12 bg-black/40 pr-10" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white" >{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
            
            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 p-2 bg-black/20 rounded-lg border border-white/5">
                <CriteriaItem met={passwordCriteria.upper} label="Uppercase" />
                <CriteriaItem met={passwordCriteria.lower} label="Lowercase" />
                <CriteriaItem met={passwordCriteria.number} label="Number" />
                <CriteriaItem met={passwordCriteria.special} label="Special Char" />
              </div>
            )}
          </div>
          {isRegisterMode && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
              <div className="relative">
                <Input required type={showConfirmPassword ? "text" : "password"} placeholder="Repeat password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="h-12 bg-black/40 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white" >{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {formData.confirmPassword && !passwordsMatch && <p className="text-[8px] font-black text-red-500 uppercase ml-1">Passwords do not match</p>}
            </div>
          )}
          {isRegisterMode && isJoinMode && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2"><Lock className="h-3 w-3" /> Team Access Code</Label>
                <Input required placeholder="XXXXXX-XXXX" value={formData.accessCode} onChange={(e) => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })} className="h-12 bg-black/40 font-mono text-center tracking-widest font-black" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2"><UserIcon className="h-3 w-3" /> Associate with Player</Label>
                <Select value={formData.playerId} onValueChange={(val) => setFormData({ ...formData, playerId: val })}>
                  <SelectTrigger className="h-12 bg-black/40 font-bold border-white/5">{fetchingPlayers ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <SelectValue placeholder="Select Player..." />}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="font-bold">None / Official (No Associated Player)</SelectItem>
                    {availablePlayers.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-bold">{p.name} (Jersey #{p.number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button disabled={loading} type="submit" className="w-full h-14 font-black uppercase tracking-widest bg-secondary text-secondary-foreground">{loading ? <Loader2 className="animate-spin mr-2" /> : (isRegisterMode ? (isJoinMode ? "Join Team Workspace" : "Register Team Owner") : "Secure Sign In")}</Button>
        </form>

        <div className="flex flex-col gap-3 text-center border-t border-white/5 pt-6">
          {!isRegisterMode ? (
             <>
               <button onClick={() => { setIsRegisterMode(true); setIsJoinMode(true); }} className="h-12 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 flex items-center justify-center gap-2">
                  <UserPlus className="h-3.5 w-3.5" /> I have a team code
               </button>
               <button onClick={() => { setIsRegisterMode(true); setIsJoinMode(false); }} className="h-12 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 flex items-center justify-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> Register a new team
               </button>
             </>
          ) : (
            <button onClick={() => setIsRegisterMode(false)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">
              Back to Sign In
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderForgotPassword = () => (
    <Card className="w-full max-w-lg border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Mail className="w-6 h-6 text-primary" /> Reset Password
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase">Enter your email to receive a secure recovery link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
            <Input required type="email" placeholder="coach@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-black/40" />
          </div>
          <Button disabled={loading} type="submit" className="w-full h-12 font-black uppercase tracking-widest bg-primary">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Send Reset Link"}
          </Button>
          <button type="button" onClick={() => setStep("auth")} className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white flex items-center justify-center gap-2">
             <ArrowLeft className="h-3 w-3" /> Return to Login
          </button>
        </form>
      </CardContent>
    </Card>
  );

  const renderTeamSetup = () => (
    <Card className="w-full max-w-xl border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader><CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><Trophy className="w-6 h-6 text-primary" /> Team Workspace Setup</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTeam} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Team Name</Label><Input required placeholder="Hawthorne Hawks" value={formData.teamName} onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} className="h-12 bg-black/40 font-bold" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">City</Label><Input required placeholder="Los Angeles" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-12 bg-black/40 font-bold" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">State</Label><Input required placeholder="CA" maxLength={2} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })} className="h-12 bg-black/40 font-bold" /></div>
            </div>
          </div>
          <Button disabled={loading} type="submit" className="w-full h-14 font-black uppercase tracking-widest bg-primary">{loading ? <Loader2 className="animate-spin mr-2" /> : "Generate Team Workspace"}</Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="w-full max-w-lg border-2 border-green-500/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-green-500" /></div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">Workspace Ready</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Team Access Code</Label>
          <div className="flex gap-2">
            <Input readOnly value={generatedCode} className="h-12 bg-black/40 font-mono text-lg text-center font-black" />
            <Button size="icon" className="h-12 w-12 bg-primary" onClick={() => { navigator.clipboard.writeText(generatedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</Button>
          </div>
        </div>
      </CardContent>
      <CardFooter><Button onClick={() => setStep("tutorial")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">Start Tutorial <ChevronRight className="ml-2 w-4 h-4" /></Button></CardFooter>
    </Card>
  );

  const renderTutorial = () => (
    <Card className="w-full max-w-xl border-2 border-primary/30 bg-card/80 backdrop-blur-2xl">
      <CardHeader className="text-center pt-8 pb-4"><CardTitle className="text-2xl font-black uppercase tracking-[0.1em] mb-2">Welcome to the Booth</CardTitle></CardHeader>
      <CardContent className="px-8 pb-10 text-center"><p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">Your workspace is active. Manage your roster, schedule games, and control the atmosphere.</p></CardContent>
      <CardFooter className="p-0 border-t border-white/5"><Button disabled={loading} onClick={handleCompleteTutorial} className="w-full h-16 font-black uppercase tracking-[0.2em] rounded-none rounded-b-lg text-lg bg-primary">{loading ? <Loader2 className="animate-spin mr-2" /> : "Enter Booth"}</Button></CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background stadium-gradient flex items-center justify-center p-4">
      <div className="w-full flex items-center justify-center animate-in fade-in duration-700">
        {step === "acknowledgement" && renderAcknowledgement()}
        {step === "auth" && renderAuth()}
        {step === "forgot-password" && renderForgotPassword()}
        {step === "team-setup" && renderTeamSetup()}
        {step === "success" && renderSuccess()}
        {step === "tutorial" && renderTutorial()}
      </div>
    </div>
  );

  function renderAcknowledgement() {
    return (
      <Card className="w-full max-w-lg border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"><ShieldCheck className="w-8 h-8 text-primary" /></div>
          <CardTitle className="text-2xl font-black uppercase tracking-widest">UAT Workspace</CardTitle>
          <CardDescription className="text-sm font-bold text-muted-foreground uppercase">Provisioning a dedicated baseball logistics environment.</CardDescription>
        </CardHeader>
        <CardFooter><Button onClick={() => setStep("auth")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">Acknowledge & Proceed <ArrowRight className="ml-2 w-4 h-4" /></Button></CardFooter>
      </Card>
    );
  }
}
