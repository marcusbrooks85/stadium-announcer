
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Trophy, 
  ShieldAlert,
  Lock,
  Loader2,
  CheckCircle2,
  Mail,
  Chrome
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

type Step = "acknowledgement" | "setup" | "verification" | "success";

export default function UATOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("acknowledgement");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Extract live authenticated instances from the singleton
  const { auth, firestore: db } = initializeFirebase();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    teamName: ""
  });

  const { toast } = useToast();

  const generateTeamCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "TEAM-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Passwords do not match."
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 2. Trigger Email Verification
      await sendEmailVerification(user);

      // 3. Provision Team (Even if not verified yet, we set up the data)
      const teamCode = generateTeamCode();
      const teamRef = await addDoc(collection(db, "teams"), {
        name: formData.teamName,
        code: teamCode,
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      });

      // 4. Create User Profile
      await setDoc(doc(db, "users", user.uid), {
        email: formData.email,
        role: "admin",
        teamId: teamRef.id,
        teamCode: teamCode,
        createdAt: serverTimestamp()
      });

      setStep("verification");
      toast({
        title: "Verification Sent",
        description: "Please check your email to verify your account."
      });

    } catch (error: any) {
      console.error("UAT Registration Error:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
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

      // Google accounts are pre-verified, so we proceed to workspace setup
      // Note: In a real app we might check if they already have a team
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
      toast({
        title: "Authenticated with Google",
        description: "Your workspace has been provisioned."
      });

    } catch (error: any) {
      console.error("Google Sign-In Error:", error.message);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      });
    } finally {
      setGoogleLoading(false);
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
        <Button onClick={() => setStep("setup")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
          Acknowledge & Proceed <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSetup = () => (
    <Card className="w-full max-w-xl border-2 border-secondary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Trophy className="w-6 h-6 text-secondary" /> Team Setup
        </CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
          Choose your authentication method
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
            <span className="bg-card px-2 text-muted-foreground">OR EMAIL SIGN UP</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
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
              <div className="space-y-2 relative">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm</Label>
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
            </div>
          </div>
          <Button disabled={loading} type="submit" className="w-full h-14 font-black uppercase tracking-widest bg-secondary text-secondary-foreground">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Create Team Workspace"}
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
          We've sent a link to <span className="text-white">{formData.email}</span>.<br />
          Verify your email to activate your workspace.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={() => window.location.reload()} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
          I've Verified My Email
        </Button>
        <Button variant="ghost" onClick={() => setStep("setup")} className="text-[10px] font-black uppercase tracking-widest opacity-50">
          Back to Setup
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
      {step === "setup" && renderSetup()}
      {step === "verification" && renderVerification()}
      {step === "success" && renderSuccess()}
    </div>
  );
}
