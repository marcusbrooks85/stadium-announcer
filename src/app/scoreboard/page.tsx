
"use client";

import React from "react";
import Link from "next/link";
import { 
  Trophy, 
  ChevronLeft, 
  Home, 
  Zap, 
  BarChart3,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StadiumScoreboard } from "@/components/StadiumScoreboard";
import { GameProvider } from "@/app/context/game-context";

function ScoreboardContent() {
  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden stadium-gradient">
      <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-sm md:text-lg">STADIUM SCOREBOARD</h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Feed</span>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/booth">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
              <Zap className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary">
              <BarChart3 className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-700">
        <StadiumScoreboard adminMode={false} />
      </div>

      <footer className="fixed bottom-8 flex items-center gap-3 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Stadium Engine v2.0 • Data Verified</span>
      </footer>
    </div>
  );
}

export default function ScoreboardPage() {
  return (
    <GameProvider>
      <ScoreboardContent />
    </GameProvider>
  );
}
