
"use client";

import React from "react";
import { 
  ShieldCheck, 
  Activity,
} from "lucide-react";
import { StadiumScoreboard } from "@/components/StadiumScoreboard";
import { UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";

function UATScoreboardContent() {
  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden stadium-gradient">
      <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-sm md:text-lg">UAT SCOREBOARD</h1>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-3 w-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Isolated Test Environment</span>
            </div>
          </div>
        </div>

        <UATNavbar />
      </header>

      <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-700">
        <StadiumScoreboard adminMode={false} />
      </div>

      <footer className="fixed bottom-8 flex items-center gap-3 opacity-30">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">UAT Simulation Active</span>
      </footer>
    </div>
  );
}

export default function UATScoreboardPage() {
  return (
    <UATGameProvider>
      <UATScoreboardContent />
    </UATGameProvider>
  );
}
