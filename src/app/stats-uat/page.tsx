
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Minus, 
  Target, 
  Table as TableIcon,
  Mail,
  ShieldCheck,
  Lock,
  Loader2
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
import { UATGameProvider, useUATGame, PlayerStats } from "@/app/context/uat-game-context";
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
    userRole,
    isLoaded
  } = useUATGame();
  
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  const canEdit = userRole === "super_admin" || userRole === "league_admin";

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-y-auto">
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT STATS</h1>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-[var(--tenant-primary)]" />
              <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">
                Role: {userRole.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <UATNavbar />
            <Link href="/admin-uat">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-[var(--tenant-primary)]">
                <Lock className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full pb-40">
          <section className="flex flex-col items-center justify-center space-y-4">
            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
              <SelectTrigger className="w-full max-w-md h-12 bg-card/50 border-[var(--tenant-primary)]/30 font-black uppercase text-xs">
                <SelectValue placeholder="Select UAT Game..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uat_game_1" className="font-bold">UAT TEST GAME #1</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <section className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center justify-center gap-2 md:gap-8 w-full max-w-2xl">
                <div className="flex-1 flex flex-col items-center bg-[var(--tenant-secondary)]/10 px-2 py-4 md:px-6 rounded-2xl border-2 border-[var(--tenant-secondary)]/20 shadow-inner">
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest text-[var(--tenant-secondary)] uppercase mb-2 md:mb-3">Away Team</span>
                  <div className="flex items-center gap-1 md:gap-4">
                    {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--tenant-secondary)]/20" onClick={() => updateTeamScore('away', -1)}><Minus className="h-4 w-4" /></Button>}
                    <div className="w-10 md:w-16 text-center digit-font text-3xl md:text-5xl font-black text-[var(--tenant-secondary)]">{awayScore}</div>
                    {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--tenant-secondary)]/20" onClick={() => updateTeamScore('away', 1)}><Plus className="h-4 w-4" /></Button>}
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center bg-[var(--tenant-primary)]/10 px-2 py-4 md:px-6 rounded-2xl border-2 border-[var(--tenant-primary)]/20 shadow-inner">
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest text-[var(--tenant-primary)] uppercase mb-2 md:mb-3">Home Team</span>
                  <div className="flex items-center gap-1 md:gap-4">
                    {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--tenant-primary)]/20" onClick={() => updateTeamScore('home', -1)}><Minus className="h-4 w-4" /></Button>}
                    <div className="w-10 md:w-16 text-center digit-font text-3xl md:text-5xl font-black text-[var(--tenant-primary)]">{homeScore}</div>
                    {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--tenant-primary)]/20" onClick={() => updateTeamScore('home', 1)}><Plus className="h-4 w-4" /></Button>}
                  </div>
                </div>
            </div>
          </section>

          {canEdit && (
            <section className="flex flex-col items-center justify-center">
              <Card className="w-full md:max-w-2xl bg-card/80 border-2 border-[var(--tenant-primary)]/30 overflow-hidden shadow-2xl">
                <CardHeader className="pb-3 md:pb-4 border-b border-[var(--tenant-primary)]/10 bg-[var(--tenant-primary)]/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--tenant-primary)] flex items-center gap-2">
                      <Target className="h-3 w-3" /> UAT Live Stats Editor
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Select value={activePlayerId || ""} onValueChange={setActivePlayerId}>
                    <SelectTrigger className="h-12 text-sm md:text-lg font-black bg-background/50 border-white/10">
                      <SelectValue placeholder="Select UAT Batter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roster.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "ab", label: "At Bats", color: "white" },
                      { key: "h", label: "Total Hits", color: "var(--tenant-primary)" },
                      { key: "r", label: "Runs Scored", color: "var(--tenant-secondary)" },
                      { key: "rbi", label: "RBI", color: "var(--tenant-primary)" }
                    ].map((stat) => (
                      <div key={stat.key} className="flex flex-col gap-2 bg-background/50 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                          <span className="text-xl md:text-2xl font-black digit-font" style={{ color: stat.color }}>
                            {activePlayer?.stats ? (activePlayer.stats as any)[stat.key] : 0}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updatePlayerStat(activePlayerId!, stat.key as any, -1)} className="flex-1 h-9 border-white/5 hover:text-destructive"><Minus className="h-3 w-3" /></Button>
                          <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updatePlayerStat(activePlayerId!, stat.key as any, 1)} className="flex-1 h-9 border-white/5 hover:text-[var(--tenant-primary)]"><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          <section className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <TableIcon className="h-5 w-5 text-[var(--tenant-secondary)]" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--tenant-secondary)]">UAT Performance Summary</h2>
            </div>
            <Card className="bg-card/60 border-white/5 shadow-2xl overflow-hidden">
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
                        <TableCell className="text-center digit-font text-[var(--tenant-primary)] text-sm">{s.h}</TableCell>
                        <TableCell className="text-center digit-font text-[var(--tenant-secondary)] text-sm">{s.r}</TableCell>
                        <TableCell className="text-center digit-font text-[var(--tenant-primary)] text-sm">{s.rbi}</TableCell>
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
