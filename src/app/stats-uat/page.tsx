"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Minus, 
  Target, 
  Table as TableIcon,
  Home,
  Mail,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUATGame, GAME_SCHEDULE_LIST, UATGameProvider } from "@/app/context/uat-game-context";
import { cn } from "@/lib/utils";
import { UATNavbar } from "@/components/UATNavbar";

function UATStatsContent() {
  const { 
    roster, 
    selectedGameId, 
    setSelectedGameId, 
    homeScore, 
    awayScore, 
    updateTeamScore, 
    updatePlayerStat, 
    emailStats,
    isAdmin
  } = useUATGame();
  
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-y-auto">
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT STATS CENTER</h1>
          
          <div className="flex items-center gap-2">
            <UATNavbar />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-10 max-w-7xl mx-auto w-full pb-40">
          <section className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-primary">Target UAT Game</span></div>
            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
              <SelectTrigger className="w-full max-w-md h-12 bg-card/50 border-primary/30 font-black uppercase text-xs"><SelectValue placeholder="Select Game..." /></SelectTrigger>
              <SelectContent>{GAME_SCHEDULE_LIST.map((game) => <SelectItem key={game.id} value={game.id} className="font-bold">{game.label}</SelectItem>)}</SelectContent>
            </Select>
          </section>

          <section className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center justify-center gap-8 w-full max-w-2xl">
              <div className="flex-1 flex flex-col items-center bg-secondary/10 px-6 py-4 rounded-2xl border-2 border-secondary/20">
                <span className="text-[10px] font-black tracking-widest text-secondary uppercase mb-3">Away Team</span>
                <div className="digit-font text-5xl font-black text-secondary">{awayScore}</div>
              </div>
              <div className="flex-1 flex flex-col items-center bg-primary/10 px-6 py-4 rounded-2xl border-2 border-primary/20">
                <span className="text-[10px] font-black tracking-widest text-primary uppercase mb-3">Home Team</span>
                <div className="digit-font text-5xl font-black text-primary">{homeScore}</div>
              </div>
            </div>
            <Button onClick={emailStats} size="lg" className="h-12 px-10 bg-primary font-black uppercase tracking-widest gap-3 shadow-lg">
              <Mail className="h-5 w-5" /> Export UAT Game Report
            </Button>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3"><TableIcon className="h-5 w-5 text-secondary" /><h2 className="text-base font-black uppercase tracking-widest text-secondary">UAT Summary</h2></div>
            <Card className="bg-card/60 border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="w-[40px] text-center font-black">#</TableHead>
                    <TableHead className="font-black">PLAYER</TableHead>
                    <TableHead className="text-center font-black">AB</TableHead>
                    <TableHead className="text-center font-black">HITS</TableHead>
                    <TableHead className="text-center font-black">RUNS</TableHead>
                    <TableHead className="text-center font-black">RBI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((player) => {
                    const s = player.stats || { ab: 0, h: 0, r: 0, rbi: 0 };
                    return (
                      <TableRow key={player.id} className="border-white/5">
                        <TableCell className="text-center digit-font font-bold text-muted-foreground">{player.number}</TableCell>
                        <TableCell className="font-bold">{player.name}</TableCell>
                        <TableCell className="text-center digit-font">{s.ab}</TableCell>
                        <TableCell className="text-center digit-font text-primary">{s.h}</TableCell>
                        <TableCell className="text-center digit-font text-secondary">{s.r}</TableCell>
                        <TableCell className="text-center digit-font text-primary">{s.rbi}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default function UATStatsPage() {
  return (
    <UATGameProvider>
      <UATStatsContent />
    </UATGameProvider>
  );
}