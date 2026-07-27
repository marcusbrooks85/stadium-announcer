
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
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { cn } from "@/lib/utils";
import { UATNavbar } from "@/components/UATNavbar";
import { StadiumScoreboard } from "@/components/StadiumScoreboard";

function UATStatsContent() {
  const { 
    roster, 
    games,
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

  const gameScheduleOptions = useMemo(() => {
    return games.map(g => ({
      id: g.id,
      label: `${g.week ? `Game ${g.week}` : 'Game'} - ${new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}`
    }));
  }, [games]);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-y-auto">
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT STATS & SCOREBOARD</h1>
          
          <div className="flex items-center gap-2">
            <UATNavbar />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-10 max-w-7xl mx-auto w-full pb-40">
          
          {/* Stadium Scoreboard Unified View */}
          <section className="animate-in fade-in zoom-in duration-500">
            <StadiumScoreboard adminMode={isAdmin} />
          </section>

          <section className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Active UAT Game</span>
            </div>
            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
              <SelectTrigger className="w-full max-w-md h-12 bg-card/50 border-primary/30 font-black uppercase text-xs">
                <SelectValue placeholder="Select Game..." />
              </SelectTrigger>
              <SelectContent>
                {gameScheduleOptions.length === 0 ? (
                  <SelectItem value="none" disabled>No games found</SelectItem>
                ) : (
                  gameScheduleOptions.map((game) => (
                    <SelectItem key={game.id} value={game.id} className="font-bold">{game.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </section>

          <section className="flex flex-col items-center justify-center gap-6">
            <Button onClick={emailStats} size="lg" className="h-12 px-10 bg-primary font-black uppercase tracking-widest gap-3 shadow-lg hover:bg-primary/90 transition-all">
              <Mail className="h-5 w-5" /> Export UAT Game Report
            </Button>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <TableIcon className="h-5 w-5 text-secondary" />
              <h2 className="text-base font-black uppercase tracking-widest text-secondary">UAT Player Summary</h2>
            </div>
            <Card className="bg-card/60 border-white/5 overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-[40px] text-center font-black text-[10px] uppercase">#</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">PLAYER</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">AB</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">HITS</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">RUNS</TableHead>
                    <TableHead className="text-center font-black text-[10px] uppercase">RBI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((player) => {
                    const s = player.stats || { ab: 0, h: 0, r: 0, rbi: 0 };
                    return (
                      <TableRow key={player.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-center digit-font font-bold text-muted-foreground text-sm">{player.number}</TableCell>
                        <TableCell className="font-bold text-sm">{player.name}</TableCell>
                        <TableCell className="text-center digit-font text-white text-sm">{s.ab}</TableCell>
                        <TableCell className="text-center digit-font text-primary text-sm">{s.h}</TableCell>
                        <TableCell className="text-center digit-font text-secondary text-sm">{s.r}</TableCell>
                        <TableCell className="text-center digit-font text-primary text-sm">{s.rbi}</TableCell>
                      </TableRow>
                    );
                  })}
                  {roster.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-xs font-black uppercase opacity-40">No roster data found</TableCell>
                    </TableRow>
                  )}
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
