
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Trophy, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Chrome,
  Copy,
  Check,
  Building2,
  Users,
  Music,
  Calendar,
  ChevronRight,
  ShieldAlert,
  BarChart3,
  Settings,
  Lock,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc, updateDoc, query, where, getDocs, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Step = "acknowledgement" | "auth" | "verification" | "team-setup" | "success" | "forgot-password" | "tutorial";

export default function UATOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("acknowledgement");
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  const { auth, firestore: db } = initializeFirebase();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    teamName: "",
    city: "",
    state: ""
  });

  // Password Strength Logic
  const passwordCriteria = useMemo(() => {
    const p = formData.password;
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  }, [formData.password]);

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  const generateTeamCode = (teamName: string) => {
    const sanitizedName = teamName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 4);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${sanitizedName}-${randomPart}`;
  };

  const checkUserTeamStatus = async (user: User) => {
    const userDoc = await getDoc(doc(db, "users_UAT", user.uid));
    const userData = userDoc.data();
    
    if (!userDoc.exists() || !userData?.teamId || !userData?.teamCode) {
      setStep("team-setup");
      return false;
    }
    
    if (!userData?.hasCompletedTutorial) {
      setStep("tutorial");
      return false;
    }
    
    router.push("/booth-uat");
    return true;
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegisterMode) {
      if (!isPasswordStrong) {
        toast({ variant: "destructive", title: "Security Error", description: "Password does not meet strength requirements." });
        return;
      }
      if (!passwordsMatch) {
        toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        setStep("verification");
        toast({ title: "Account Created", description: "Please verify your email to proceed to team setup." });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        await checkUserTeamStatus(userCredential.user);
      }
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/configuration-not-found') {
        errorMessage = "Email/Password authentication is not enabled.";
      }
      toast({ variant: "destructive", title: "Auth Failed", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await checkUserTeamStatus(userCredential.user);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Failed", description: error.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your email address first." });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast({ title: "Reset Email Sent", description: "Check your inbox for the password recovery link." });
      setIsRegisterMode(false);
      setStep("auth");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    if (!formData.teamName || !formData.city || !formData.state) {
      toast({ variant: "destructive", title: "Missing Details", description: "Please fill out all team workspace fields." });
      return;
    }

    setLoading(true);
    try {
      let teamCode = generateTeamCode(formData.teamName);
      
      // Ensure absolute uniqueness
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        const q = query(collection(db, "teams_UAT"), where("code", "==", teamCode), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          isUnique = true;
        } else {
          teamCode = generateTeamCode(formData.teamName);
          attempts++;
        }
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

      await setDoc(doc(db, "users_UAT", user.uid), {
        email: user.email,
        role: "league_admin", 
        teamId: teamRef.id,
        teamCode: teamCode,
        hasCompletedTutorial: false,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setGeneratedCode(teamCode);
      setStep("success");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Setup Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTutorial = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "users_UAT", user.uid), {
        hasCompletedTutorial: true,
        tutorialCompletedAt: serverTimestamp()
      });
      router.push("/booth-uat");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not save tutorial progress." });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast({ title: "Copied!", description: "Team code copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const renderAcknowledgement = () => (
    <Card className="w-full max-w-lg border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">UAT Workspace</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase">
          Provisioning a dedicated baseball logistics environment.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => setStep("auth")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
          Acknowledge & Proceed <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderAuth = () => (
    <Card className="w-full max-w-xl border-2 border-secondary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Trophy className="w-6 h-6 text-secondary" /> {isRegisterMode ? "Admin Account" : "Admin Login"}
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
          {isRegisterMode ? "Register to start your team" : "Access your existing booth"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button 
          variant="outline" 
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full h-12 border-white/10 bg-black/20 font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black/40"
        >
          {googleLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Chrome className="h-4 w-4" />}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/5"></span>
          </div>
          <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]">
            <span className="bg-card px-2 text-muted-foreground">OR EMAIL</span>
          </div>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
            <Input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-black/40" />
          </div>
          
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
              {!isRegisterMode && (
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black uppercase text-primary hover:underline">
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Input required type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12 bg-black/40 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors" >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isRegisterMode && (
              <div className="pt-2 grid grid-cols-5 gap-1">
                {Object.entries(passwordCriteria).map(([key, valid]) => (
                   <div key={key} className={cn("h-1 rounded-full", valid ? "bg-green-500" : "bg-white/10")} />
                ))}
              </div>
            )}
          </div>

          {isRegisterMode && (
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                {formData.confirmPassword && (
                  <span className={cn("text-[9px] font-black uppercase flex items-center gap-1", passwordsMatch ? "text-green-500" : "text-destructive")}>
                    {passwordsMatch ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                    {passwordsMatch ? "Match" : "Mismatch"}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input required type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="h-12 bg-black/40 pr-10" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Button disabled={loading} type="submit" className="w-full h-14 font-black uppercase tracking-widest bg-secondary text-secondary-foreground">
            {loading ? <Loader2 className="animate-spin mr-2" /> : (isRegisterMode ? "Register & Setup Team" : "Sign In")}
          </Button>
        </form>
        <div className="text-center">
          <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">
            {isRegisterMode ? "Already have an admin account? Sign In" : "Need a new team workspace? Register"}
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTeamSetup = () => (
    <Card className="w-full max-w-xl border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" /> Team Workspace Setup
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
          Complete your profile to access the booth dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTeam} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Team Name</Label>
              <Input required placeholder="e.g. Eastside Dodgers" value={formData.teamName} onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} className="h-12 bg-black/40 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                <Input required placeholder="Los Angeles" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-12 bg-black/40 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">State</Label>
                <Input required placeholder="CA" maxLength={2} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })} className="h-12 bg-black/40 font-bold" />
              </div>
            </div>
          </div>
          <Button disabled={loading} type="submit" className="w-full h-14 font-black uppercase tracking-widest bg-primary">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Finalize Team Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderVerification = () => (
    <Card className="w-full max-w-lg border-2 border-yellow-500/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-yellow-500" />
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">Verify Email</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">
          Check your inbox. Verify your email to continue setup.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-3">
        <Button variant="ghost" onClick={async () => {
          if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
            toast({ title: "Email Sent", description: "Verification link resent." });
          }
        }} className="w-full h-12 text-[10px] font-black uppercase tracking-widest">
          Resend Verification Email
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="w-full max-w-lg border-2 border-green-500/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">Workspace Ready</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase">
          Your team workspace is provisioned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Team Access Code</Label>
          <div className="flex gap-2">
            <Input readOnly value={generatedCode} className="h-12 bg-black/40 font-mono text-lg text-center font-black" />
            <Button size="icon" className="h-12 w-12 bg-primary" onClick={copyToClipboard}>
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setStep("tutorial")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
          Continue to Tutorial <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderTutorial = () => {
    const slides = [
      {
        icon: <Building2 className="w-12 h-12 text-primary" />,
        title: "Home: Workspace Dashboard",
        description: "Welcome to your command center. This landing page provides an overview of your team's status and quick navigation to all modules.",
      },
      {
        icon: <Music className="w-12 h-12 text-secondary" />,
        title: "Booth: Live Soundboard",
        description: "Control the atmosphere. Use the booth to trigger walk-up cues, organ hits, and stadium hype tracks in real-time during games.",
      },
      {
        icon: <BarChart3 className="w-12 h-12 text-accent" />,
        title: "Stats: Live Game Metrics",
        description: "Track performance on the fly. Record at-bats, hits, and runs as they happen to keep your roster metrics accurate and up to date.",
      },
      {
        icon: <Calendar className="w-12 h-12 text-primary" />,
        title: "Schedule: Seasonal Timeline",
        description: "Manage your season. View upcoming games, track results, and assign snack duties to ensure your team is always prepared.",
      },
      {
        icon: <Settings className="w-12 h-12 text-secondary" />,
        title: "Admin: Workspace Configuration",
        description: "Full control. Update your team branding, manage your player roster, and configure custom audio settings in one central hub.",
      }
    ];

    const currentSlide = slides[tutorialStep];
    const isLastSlide = tutorialStep === slides.length - 1;

    return (
      <Card className="w-full max-w-xl border-2 border-primary/30 bg-card/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(66,133,255,0.2)]">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 animate-in zoom-in duration-500">
            {currentSlide.icon}
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-[0.1em] mb-2">{currentSlide.title}</CardTitle>
          <div className="flex justify-center gap-1.5 mb-2">
            {slides.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === tutorialStep ? "w-8 bg-primary" : "w-1.5 bg-white/20")} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10 text-center space-y-6">
          <p className="text-sm font-bold text-muted-foreground uppercase leading-relaxed tracking-tight">
            {currentSlide.description}
          </p>
          <div className="pt-4">
            <Progress value={((tutorialStep + 1) / slides.length) * 100} className="h-1 bg-white/5" />
          </div>
        </CardContent>
        <CardFooter className="p-0 border-t border-white/5">
          <Button 
            disabled={loading}
            onClick={() => isLastSlide ? handleCompleteTutorial() : setTutorialStep(prev => prev + 1)} 
            className={cn(
              "w-full h-16 font-black uppercase tracking-[0.2em] rounded-none rounded-b-lg text-lg",
              isLastSlide ? "bg-green-600 hover:bg-green-700" : "bg-primary"
            )}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : (isLastSlide ? "Finish & Enter Booth" : "Next Slide")}
            {!isLastSlide && <ChevronRight className="ml-2 w-5 h-5" />}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background stadium-gradient flex items-center justify-center p-4">
      <div className="w-full flex items-center justify-center animate-in fade-in duration-700">
        {step === "acknowledgement" && renderAcknowledgement()}
        {step === "auth" && renderAuth()}
        {step === "verification" && renderVerification()}
        {step === "team-setup" && renderTeamSetup()}
        {step === "success" && renderSuccess()}
        {step === "tutorial" && renderTutorial()}
      </div>
    </div>
  );
}
