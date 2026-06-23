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
  MessageSquare,
  ChevronLeft
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
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useGame } from "@/app/context/game-context";
import { cn } from "@/lib/utils";

export default function GameStatsPage() {
  const { roster, updateStat, emailStats, homeScore, setHomeScore, awayScore, setAwayScore } = useGame();
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  const sortedRoster = useMemo(() => 
    [...roster].sort((a, b) => a.number - b.number),
    [roster]
  );

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-y-auto">
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <Link href="/">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary transition-colors hover:bg-primary/10">
                 <ChevronLeft className="h-5 w-5" />
               </div>
             </Link>
             <h1 className="font-headline font-black uppercase tracking-[0.2em] text-xs md:text-sm">Stats Center</h1>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
                <Calendar className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://groupme.com/join_group/115533519/bxlMSOlb" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full pb-32">
          <section className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center justify-center gap-2 md:gap-8 w-full max-w-2xl">
                <div className="flex-1 flex flex-col items-center bg-secondary/10 px-2 py-4 md:px-6 rounded-2xl border-2 border-secondary/20 shadow-inner">
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest text-secondary uppercase mb-2 md:mb-3">Away Team</span>
                  <div className="flex items-center gap-1 md:gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 hover:bg-secondary/20" onClick={() => setAwayScore(Math.max(0, awayScore - 1))}><Minus className="h-4 w-4 md:h-6 md:w-6" /></Button>
                    <div className="w-10 md:w-16 text-center digit-font text-3xl md:text-5xl font-black text-secondary">{awayScore}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 hover:bg-secondary/20" onClick={() => setAwayScore(awayScore + 1)}><Plus className="h-4 w-4 md:h-6 md:w-6" /></Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center bg-primary/10 px-2 py-4 md:px-6 rounded-2xl border-2 border-primary/20 shadow-inner">
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest text-primary uppercase mb-2 md:mb-3">Home Team</span>
                  <div className="flex items-center gap-1 md:gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 hover:bg-primary/20" onClick={() => setHomeScore(Math.max(0, homeScore - 1))}><Minus className="h-4 w-4 md:h-6 md:w-6" /></Button>
                    <div className="w-10 md:w-16 text-center digit-font text-3xl md:text-5xl font-black text-primary">{homeScore}</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 hover:bg-primary/20" onClick={() => setHomeScore(homeScore + 1)}><Plus className="h-4 w-4 md:h-6 md:w-6" /></Button>
                  </div>
                </div>
            </div>
            
            <Button onClick={emailStats} size="lg" className="h-12 px-10 bg-primary hover:bg-primary/90 text-xs font-black uppercase tracking-widest gap-3 shadow-lg shadow-primary/20">
              <Mail className="h-5 w-5" /> Export Game Report
            </Button>
          </section>

          <section className="flex flex-col items-center justify-center">
            <Card className="w-full md:max-w-2xl bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
              <CardHeader className="pb-3 md:pb-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="h-3 w-3 md:h-4 md:w-4" /> Live Game Stats
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Active Batter</span>
                  <Select value={activePlayerId || ""} onValueChange={(val) => setActivePlayerId(val)}>
                    <SelectTrigger className="h-12 text-sm md:text-lg font-black bg-background/50 border-white/10">
                      <SelectValue placeholder="Select Batter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedRoster.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "ab", label: "At Bats", color: "white" },
                    { key: "h", label: "Total Hits", color: "primary" },
                    { key: "r", label: "Runs Scored", color: "secondary" },
                    { key: "rbi", label: "RBI", color: "primary" }
                  ].map((stat) => (
                    <div key={stat.key} className="flex flex-col gap-2 bg-background/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                        <span className={cn("text-xl md:text-2xl font-black digit-font", stat.color === 'primary' ? 'text-primary' : stat.color === 'secondary' ? 'text-secondary' : 'text-white')}>
                          {activePlayer ? (activePlayer.stats as any)[stat.key] : 0}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updateStat(activePlayerId!, stat.key as any, -1)} className="flex-1 h-9 border-white/5 hover:text-destructive"><Minus className="h-3 w-3" /></Button>
                        <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updateStat(activePlayerId!, stat.key as any, 1)} className="flex-1 h-9 border-white/5 hover:text-primary"><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4 pt-6 pb-24">
            <div className="flex items-center gap-3">
              <TableIcon className="h-5 w-5 text-secondary" />
              <h2 className="text-base font-black uppercase tracking-widest text-secondary">Team Performance Summary</h2>
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
                  {sortedRoster.map((player) => (
                    <TableRow key={player.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="text-center digit-font font-bold text-muted-foreground text-sm">{player.number}</TableCell>
                      <TableCell className="font-bold text-sm">{player.name}</TableCell>
                      <TableCell className="text-center digit-font text-white text-sm">{player.stats.ab}</TableCell>
                      <TableCell className="text-center digit-font text-primary text-sm">{player.stats.h}</TableCell>
                      <TableCell className="text-center digit-font text-secondary text-sm">{player.stats.r}</TableCell>
                      <TableCell className="text-center digit-font text-primary text-sm">{player.stats.rbi}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        </main>

        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50">
          <div className="flex items-center justify-center gap-3 bg-card/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
            <Link href="/" className="flex-1">
              <div className="flex items-center justify-center gap-2 h-11 border border-white/10 rounded-xl bg-white/5 text-secondary hover:bg-white/10 transition-all">
                <Home className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Booth</span>
              </div>
            </Link>
            <Link href="/schedule" className="flex-1">
              <div className="flex items-center justify-center gap-2 h-11 border border-white/10 rounded-xl bg-white/5 text-secondary hover:bg-white/10 transition-all">
                <Calendar className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
              </div>
            </Link>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
