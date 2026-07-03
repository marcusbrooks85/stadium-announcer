"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Mail,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import { useAuth, useFirestore } from "@/firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

type Step = "acknowledgement" | "setup";

export default function UATOnboardingPage() {
  const auth = useAuth();
  const db = useFirestore();
  const [step, setStep] = useState<Step>("acknowledgement");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form State
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
    
    if (!auth || !db) return;

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Passwords do not match. Please verify your entry."
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 6 characters long."
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Create User using auth hook
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Generate Unique Team Code
      const teamCode = generateTeamCode();

      // 3. Create Team Document
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

      toast({
        title: "Success!",
        description: `Team created successfully. Your code is: ${teamCode}`
      });
      
      // Clean up & advance state
      setStep("acknowledgement");
      setFormData({ email: "", password: "", confirmPassword: "", teamName: "" });

    } catch (error: any) {
      console.error("UAT Registration Error:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not complete registration."
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAcknowledgement = () => (
    <Card className="w-full max-w-lg border-2 border-primary/20 bg-card/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-widest">UAT Workspace</CardTitle>
        <CardDescription className="text-sm font-bold text-muted-foreground uppercase leading-relaxed">
          You are entering the User Acceptance Testing environment. All data entered here is for testing purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
            <p className="text-[11px] font-bold uppercase text-muted-foreground">Sandbox environment isolation enabled</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
            <p className="text-[11px] font-bold uppercase text-muted-foreground">Automatic team code generation</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
            <p className="text-[11px] font-bold uppercase text-muted-foreground">Real-time database permissions audit</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => setStep("setup")} 
          className="w-full h-12 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all group"
        >
          Acknowledge & Proceed <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderSetup = () => (
    <Card className="w-full max-w-xl border-2 border-secondary/20 bg-card/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Trophy className="w-6 h-6 text-secondary" /> Team Workspace Setup
        </CardTitle>
        <CardDescription className="font-bold text-[10px] uppercase tracking-tighter text-muted-foreground">
          Complete the fields below to provision your dedicated baseball workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Team Details</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  required
                  placeholder="League or Team Name" 
                  className="pl-10 h-12 bg-black/40 border-white/10 font-bold"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Account</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  required
                  type="email"
                  placeholder="Admin Email Address" 
                  className="pl-10 h-12 bg-black/40 border-white/10 font-bold"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className="pl-10 pr-12 h-12 bg-black/40 border-white/10 font-bold"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    className={cn(
                      "pl-10 pr-12 h-12 bg-black/40 border-white/10 font-bold transition-all",
                      formData.confirmPassword && formData.password !== formData.confirmPassword && "border-destructive/50 ring-1 ring-destructive/20"
                    )}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-[9px] font-black uppercase text-destructive tracking-widest text-center animate-in fade-in slide-in-from-top-1">
                Passwords do not match
              </p>
            )}
          </div>

          <Button 
            disabled={loading || !formData.email || !formData.password || formData.password !== formData.confirmPassword}
            type="submit" 
            className="w-full h-14 font-black uppercase tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10"
          >
            {loading ? "Provisioning Workspace..." : "Create Team Workspace"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4 border-t border-white/5 pt-6">
        <Button variant="ghost" size="sm" onClick={() => setStep("acknowledgement")} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white">
          Back to Disclaimer
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background stadium-gradient flex items-center justify-center p-4">
      <div className="w-full flex justify-center">
        {step === "acknowledgement" ? renderAcknowledgement() : renderSetup()}
      </div>
    </div>
  );
}
