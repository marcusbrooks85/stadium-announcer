
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
        {/* HEADER */}
        <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md h-auto md:h-24">
          <div className="flex items-center gap-4">
             <Link href="/">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary transition-colors hover:bg-primary/10">
                 <ChevronLeft className="h-5 w-5" />
               </div>
             </Link>
             <h1 className="font-headline font-black uppercase tracking-[0.2em] text-xs md:text-sm hidden lg:block">Stats Center</h1>
          </div>
          
          {/* Centered Scores in Header */}
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-1">
              <div className="flex flex-col items-center bg-secondary/10 px-3 md:px-6 py-1 rounded-xl border border-secondary/20 shadow-inner min-w-[80px] md:min-w-[120px]">
                <span className="text-[7px] md:text-[9px] font-black tracking-widest text-secondary/70 uppercase mb-0.5">Away</span>
                <div className="flex items-center gap-1 md:gap-3">
                  <Button variant="ghost" size="icon" className="h-5 w-5 md:h-7 md:w-7 hover:bg-secondary/20" onClick={() => setAwayScore(Math.max(0, awayScore - 1))}><Minus className="h-3 w-3 md:h-4 md:w-4" /></Button>
                  <div className="w-6 md:w-10 text-center digit-font text-lg md:text-3xl font-black text-secondary">{awayScore}</div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 md:h-7 md:w-7 hover:bg-secondary/20" onClick={() => setAwayScore(awayScore + 1)}><Plus className="h-3 w-3 md:h-4 md:w-4" /></Button>
                </div>
              </div>

              <div className="flex flex-col items-center bg-primary/10 px-3 md:px-6 py-1 rounded-xl border border-primary/20 shadow-inner min-w-[80px] md:min-w-[120px]">
                <span className="text-[7px] md:text-[9px] font-black tracking-widest text-primary/70 uppercase mb-0.5">Home</span>
                <div className="flex items-center gap-1 md:gap-3">
                  <Button variant="ghost" size="icon" className="h-5 w-5 md:h-7 md:w-7 hover:bg-primary/20" onClick={() => setHomeScore(Math.max(0, homeScore - 1))}><Minus className="h-3 w-3 md:h-4 md:w-4" /></Button>
                  <div className="w-6 md:w-10 text-center digit-font text-lg md:text-3xl font-black text-primary">{homeScore}</div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 md:h-7 md:w-7 hover:bg-primary/20" onClick={() => setHomeScore(homeScore + 1)}><Plus className="h-3 w-3 md:h-4 md:w-4" /></Button>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors">
                <Calendar className="h-5 w-5" />
              </Button>
            </Link>
            <a href="https://groupme.com/join_group/115533519/bxlMSOlb" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-10 max-w-7xl mx-auto w-full pb-32">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* STAT TRACKER COMMAND */}
            <Card className="bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
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

            {/* QUICK ACTIONS */}
            <Card className="bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl flex flex-col">
               <CardHeader className="pb-3 md:pb-4 border-b border-white/5 bg-white/5">
                  <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Quick Actions
                  </CardTitle>
               </CardHeader>
               <CardContent className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <TableIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-headline font-bold uppercase text-lg">Performance Sync</h3>
                    <p className="text-xs text-muted-foreground max-w-[280px]">Stats update automatically in the booth.</p>
                  </div>
                  <Button onClick={emailStats} className="w-full h-12 gap-2 font-black uppercase tracking-widest text-xs">
                    <Mail className="h-4 w-4" /> Export Game Report
                  </Button>
               </CardContent>
            </Card>
          </section>

          {/* PERFORMANCE TABLE */}
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

        {/* MOBILE FOOTER NAVIGATION */}
        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50">
          <div className="flex items-center justify-center gap-3 bg-card/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
            <Link href="/" className="flex-1">
              <div className="flex items-center justify-center gap-2 h-11 border border-white/5 rounded-xl bg-white/5 text-muted-foreground">
                <Home className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Booth</span>
              </div>
            </Link>
            <Link href="/schedule" className="flex-1">
              <div className="flex items-center justify-center gap-2 h-11 border border-white/5 rounded-xl bg-white/5 text-muted-foreground">
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
