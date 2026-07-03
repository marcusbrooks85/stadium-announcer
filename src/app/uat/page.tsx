
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Trophy, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Chrome,
  ArrowLeft,
  KeyRound,
  RefreshCw
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
  User
} from "firebase/auth";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

type Step = "acknowledgement" | "auth" | "verification" | "success" | "forgot-password";

/**
 * Helper stub for future account deletion logic.
 * Execution Strategy: Account deletion will require a 2-step verification layout: 
 * App confirmation prompt -> email payload dispatch -> destructive batch-delete verification execution.
 */
export async function initiateSecureAccountDeletion(user: User | null) {
  if (!user) return;
  console.log("Secure account deletion process initiated for:", user.uid);
}

export default function UATOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("acknowledgement");
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { auth, firestore: db } = initializeFirebase();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    teamName: ""
  });

  const generateTeamCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "TEAM-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegisterMode) {
      if (formData.password.length < 6) {
        toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 6 characters." });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
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

        const teamCode = generateTeamCode();
        const teamRef = await addDoc(collection(db, "teams"), {
          name: formData.teamName || "New Team",
          code: teamCode,
          ownerUid: user.uid,
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "users", user.uid), {
          email: formData.email,
          role: "admin",
          teamId: teamRef.id,
          teamCode: teamCode,
          createdAt: serverTimestamp()
        });

        setStep("verification");
        toast({ title: "Verification Sent", description: "Please check your email to verify your account." });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push("/booth");
        toast({ title: "Signed In", description: "Welcome back to the booth." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const teamCode = generateTeamCode();
      const teamRef = await addDoc(collection(db, "teams"), {
        name: `${user.displayName || "New"}'s Team`,
        code: teamCode,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "admin",
        teamId: teamRef.id,
        teamCode: teamCode,
        createdAt: serverTimestamp()
      }, { merge: true });

      setStep("success");
      toast({ title: "Authenticated", description: "Workspace provisioned with Google." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Failed", description: error.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({ variant: "destructive", title: "Error", description: "Please enter your email address first." });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast({ title: "Reset Email Sent", description: "Check your inbox for the password reset link." });
      setStep("auth");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: "Email Resent", description: "Check your inbox for the new link." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
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
          <Trophy className="w-6 h-6 text-secondary" /> {isRegisterMode ? "Team Setup" : "Admin Login"}
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
          {isRegisterMode ? "Create your workspace" : "Access your existing booth"}
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
            <span className="bg-card px-2 text-muted-foreground">OR USE EMAIL</span>
          </div>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-6">
          <div className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Team Name</Label>
                <Input 
                  required
                  placeholder="e.g. Eastside Dodgers"
                  className="h-12 bg-black/40 border-white/10 font-bold"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Email</Label>
              <Input 
                required
                type="email"
                placeholder="admin@team.com"
                className="h-12 bg-black/40 border-white/10 font-bold"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                  {!isRegisterMode && (
                    <button type="button" onClick={() => setStep("forgot-password")} className="text-[9px] font-black uppercase tracking-tighter text-primary hover:underline">
                      Forgot Password?
                    </button>
                  )}
                </div>
                <Input 
                  required
                  type={showPassword ? "text" : "password"}
                  className="h-12 bg-black/40 border-white/10 font-bold pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isRegisterMode && (
                <div className="space-y-2 relative">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                  <Input 
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    className="h-12 bg-black/40 border-white/10 font-bold pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[38px] text-muted-foreground">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
          <Button disabled={loading} type="submit" className="w-full h-14 font-black uppercase tracking-widest bg-secondary text-secondary-foreground">
            {loading ? <Loader2 className="animate-spin mr-2" /> : (isRegisterMode ? "Create Team Workspace" : "Sign In to Booth")}
          </Button>
        </form>
        <div className="text-center">
          <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
            {isRegisterMode ? "Already have an admin account? Sign In" : "Need a new team workspace? Register"}
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderForgotPassword = () => (
    <Card className="w-full max-w-lg border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">Reset Password</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase">
          Enter your email to receive a recovery link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Email</Label>
            <Input 
              required
              type="email"
              placeholder="admin@team.com"
              className="h-12 bg-black/40 border-white/10 font-bold"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Button disabled={loading} type="submit" className="w-full h-12 font-black uppercase tracking-widest bg-primary">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Send Reset Link"}
          </Button>
          <button type="button" onClick={() => setStep("auth")} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white mt-2">
            <ArrowLeft className="h-3 w-3" /> Back to Login
          </button>
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
          We've sent a link to <span className="text-white">{formData.email}</span>.<br />
          Verify your email to activate your workspace.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={handleResendVerification} className="w-full h-12 font-black uppercase tracking-widest bg-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Resend Verification Email
        </Button>
        <button onClick={() => { setIsRegisterMode(false); setStep("auth"); }} className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
          Return to Login
        </button>
      </CardFooter>
    </Card>
  );

  const renderSuccess = () => (
    <Card className="w-full max-w-lg border-2 border-green-500/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">Provisioned</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase">
          Your team workspace is ready for logistics operations.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => router.push("/booth")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
          Enter Booth Dashboard <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background stadium-gradient flex items-center justify-center p-4">
      {step === "acknowledgement" && renderAcknowledgement()}
      {step === "auth" && renderAuth()}
      {step === "verification" && renderVerification()}
      {step === "success" && renderSuccess()}
      {step === "forgot-password" && renderForgotPassword()}
    </div>
  );
}
