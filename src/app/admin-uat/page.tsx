"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Home, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UATAdminPanel } from "@/components/UATAdminPanel";
import { UATGameProvider } from "@/app/context/uat-game-context";

function UATAdminContent() {
  return (
    <div className="min-h-screen bg-background text-foreground stadium-gradient p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-40">
        <header className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-lg flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-primary" /> UAT MANAGEMENT
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Isolated Test Environment</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/schedule-uat"><Button variant="outline" size="sm" className="font-black uppercase text-[10px]">Back</Button></Link>
            <UATAdminPanel />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="bg-primary/10 p-8 rounded-full border border-primary/20 animate-pulse">
            <ShieldAlert className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-widest">UAT Admin Console</h2>
            <p className="text-muted-foreground font-bold uppercase text-xs max-w-md mx-auto leading-relaxed">
              Use the UAT Admin button in the header to manage roster profiles, audio clips, and stadium tracks within this isolated sandbox.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <Link href="/booth-uat">
              <Button variant="secondary" className="font-black uppercase tracking-widest gap-2">
                <Zap className="h-4 w-4" /> Enter Booth
              </Button>
            </Link>
            <Link href="/stats-uat">
              <Button variant="secondary" className="font-black uppercase tracking-widest gap-2">
                <BarChart3 className="h-4 w-4" /> View Stats
              </Button>
            </Link>
          </div>
        </div>
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
