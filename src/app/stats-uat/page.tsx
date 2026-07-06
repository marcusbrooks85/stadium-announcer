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
import { UATAdminPanel } from "@/components/UATAdminPanel";

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
          
          <div className="flex items-center gap-1 md:gap-3">
            <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5 mr-1 md:mr-2">
              <Link href="/schedule-uat"><Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary/80"><Home className="h-4 w-4" /></Button></Link>
              <Link href="/booth-uat"><Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary/80"><Zap className="h-4 w-4" /></Button></Link>
              <Link href="/stats-uat"><Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-primary"><BarChart3 className="h-4 w-4" /></Button></Link>
            </div>
            <UATAdminPanel />
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
                <div className="flex items-center gap-4">
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => updateTeamScore('away', -1)}><Minus /></Button>}
                  <div className="digit-font text-5xl font-black text-secondary">{awayScore}</div>
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => updateTeamScore('away', 1)}><Plus /></Button>}
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center bg-primary/10 px-6 py-4 rounded-2xl border-2 border-primary/20">
                <span className="text-[10px] font-black tracking-widest text-primary uppercase mb-3">Home Team</span>
                <div className="flex items-center gap-4">
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => updateTeamScore('home', -1)}><Minus /></Button>}
                  <div className="digit-font text-5xl font-black text-primary">{homeScore}</div>
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => updateTeamScore('home', 1)}><Plus /></Button>}
                </div>
              </div>
            </div>
            <Button onClick={emailStats} size="lg" className="h-12 px-10 bg-primary font-black uppercase tracking-widest gap-3 shadow-lg">
              <Mail className="h-5 w-5" /> Export UAT Game Report
            </Button>
          </section>

          {isAdmin && (
            <section className="flex justify-center">
              <Card className="w-full md:max-w-2xl bg-card/80 border-2 border-primary/30 shadow-2xl">
                <CardHeader className="bg-primary/5 border-b border-primary/10"><CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2"><Target className="h-4 w-4" /> UAT Live Editor</CardTitle></CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Select value={activePlayerId || ""} onValueChange={setActivePlayerId}>
                    <SelectTrigger className="h-12 text-lg font-black"><SelectValue placeholder="Select Batter..." /></SelectTrigger>
                    <SelectContent>{roster.map((p) => <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>)}</SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: "ab", label: "At Bats" }, { key: "h", label: "Hits" }, { key: "r", label: "Runs" }, { key: "rbi", label: "RBI" }].map((stat) => (
                      <div key={stat.key} className="bg-background/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">{stat.label}</span>
                          <span className="text-2xl font-black digit-font">{activePlayer?.stats ? (activePlayer.stats as any)[stat.key] : 0}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updatePlayerStat(activePlayerId!, stat.key as any, -1)} className="flex-1 h-9"><Minus className="h-3 w-3" /></Button>
                          <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updatePlayerStat(activePlayerId!, stat.key as any, 1)} className="flex-1 h-9"><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

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
