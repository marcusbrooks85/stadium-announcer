"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  X,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = initializeFirebase();
  const { toast } = useToast();

  const oobCode = searchParams.get("oobCode");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [email, setEmail] = useState("");

  // Validate the reset code on mount
  useEffect(() => {
    if (!oobCode) {
      setIsValidating(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setIsValidating(false);
      })
      .catch((err) => {
        console.error("Invalid reset code", err);
        setIsValidating(false);
      });
  }, [auth, oobCode]);

  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !isPasswordStrong || !passwordsMatch) return;

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetSuccess(true);
      toast({ title: "Password Updated", description: "Your credentials have been successfully reset." });
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/uat");
      }, 3000);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Reset Failed", 
        description: error.message || "Could not update password. The link may have expired." 
      });
    } finally {
      setLoading(false);
    }
  };

  const CriteriaItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className={cn(
      "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter transition-colors",
      met ? "text-green-500" : "text-red-500"
    )}>
      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {label}
    </div>
  );

  if (isValidating) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Validating Request...</p>
      </div>
    );
  }

  if (!oobCode) {
    return (
      <Card className="w-full max-w-lg border-2 border-destructive/20 bg-card/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl font-black uppercase tracking-widest text-destructive">Invalid Link</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase">The password reset link is missing or malformed.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/uat")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (resetSuccess) {
    return (
      <Card className="w-full max-w-lg border-2 border-green-500/20 bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-widest">Success</CardTitle>
          <CardDescription className="text-sm font-bold text-muted-foreground uppercase">
            Your password has been updated. Redirecting to login...
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/uat")} className="w-full h-12 font-black uppercase tracking-widest bg-primary">
            Login Now
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl border-2 border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Lock className="w-6 h-6 text-primary" /> Create New Password
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase">
          Updating credentials for: <span className="text-primary">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
            <div className="relative">
              <Input 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="8+ characters required" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="h-12 bg-black/40 pr-10" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 p-2 bg-black/20 rounded-lg border border-white/5">
              <CriteriaItem met={passwordCriteria.upper} label="Uppercase" />
              <CriteriaItem met={passwordCriteria.lower} label="Lowercase" />
              <CriteriaItem met={passwordCriteria.number} label="Number" />
              <CriteriaItem met={passwordCriteria.special} label="Special Char" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
            <div className="relative">
              <Input 
                required 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Repeat new password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="h-12 bg-black/40 pr-10" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[8px] font-black text-red-500 uppercase ml-1">Passwords do not match</p>
            )}
          </div>

          <Button 
            disabled={loading || !isPasswordStrong || !passwordsMatch} 
            type="submit" 
            className="w-full h-14 font-black uppercase tracking-widest bg-primary"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Update Password"}
          </Button>

          <button 
            type="button" 
            onClick={() => router.push("/uat")} 
            className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white flex items-center justify-center gap-2"
          >
             <ArrowLeft className="h-3 w-3" /> Return to Login
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background stadium-gradient flex items-center justify-center p-4">
      <div className="w-full flex items-center justify-center animate-in fade-in duration-700">
        <Suspense fallback={<Loader2 className="animate-spin text-primary" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
