"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  Home, 
  BarChart3, 
  MapPin, 
  Clock, 
  Trophy,
  MessageSquare,
  Ban,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UtensilsCrossed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useGame } from "@/app/context/game-context";
import { AdminPanel } from "@/components/AdminPanel";

const gameSchedule = [
  { week: 1, date: "2026-06-20", time: "2:00 PM", home: "Coach Alexis", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { week: 2, date: "2026-06-27", time: "9:00 AM", home: "Coach Matt & Rene", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { week: 3, date: "2026-06-30", time: "6:00 PM", home: "Coach Chewy", away: "Coach Manny", location: "Jim Thorpe - Prairie Field" },
  { week: 4, date: "2026-07-07", time: "6:00 PM", home: "Coach Chewy", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 5, date: "2026-07-11", time: "11:00 AM", home: "Coach Chewy", away: "Coach Matt & Rene", location: "Jim Thorpe - Cordary Field" },
  { week: 6, date: "2026-07-14", time: "6:00 PM", home: "Coach Manny", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { week: 7, date: "2026-07-18", time: "9:00 AM", home: "Coach Alexis", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { week: 8, date: "2026-07-21", time: "6:00 PM", home: "Coach Chewy", away: "Coach Matt & Rene", location: "Jim Thorpe - Prairie Field" },
  { week: 9, date: "2026-07-25", time: "9:00 AM", home: "Coach Manny", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { week: 10, date: "2026-07-28", time: "6:00 PM", home: "Coach Matt & Rene", away: "Coach Chewy", location: "Jim Thorpe - Prairie Field" },
  { week: 11, date: "2026-08-01", time: "9:00 AM", home: "#1 Seed", away: "#4 Seed", location: "Jim Thorpe - Cordary Field", notes: "Playoffs" },
  { week: 11, date: "2026-08-01", time: "11:00 AM", home: "#2 Seed", away: "#3 Seed", location: "Jim Thorpe - Cordary Field", notes: "Playoffs" },
  { week: 12, date: "2026-08-08", time: "9:00 AM", home: "Consolation", away: "Consolation", location: "Jim Thorpe - Cordary Field", notes: "Finals" },
  { week: 12, date: "2026-08-08", time: "11:00 AM", home: "Championship", away: "Championship", location: "Jim Thorpe - Cordary Field", notes: "Finals" }
];

interface GameStatus {
  won?: boolean;
  cancelled?: boolean;
  snackPlayerId?: string;
}

export default function GameSchedulePage() {
  const db = useFirestore();
  const { isAdmin, roster } = useGame();
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!db) return;

    const winsRef = collection(db, "game_wins");
    const unsubscribe = onSnapshot(
      winsRef,
      (snapshot) => {
        const statuses: Record<string, GameStatus> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          statuses[doc.id] = {
            won: data.won || false,
            cancelled: data.cancelled || false,
            snackPlayerId: data.snackPlayerId || ""
          };
        });
        setGameStatuses(statuses);
      },
      async (error) => {
        const permissionError = new FirestorePermissionError({
          path: winsRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [db]);

  const isGameConcluded = (dateStr: string, timeStr: string) => {
    try {
      // Create a date object for the game
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const gameDate = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      const conclusionTime = new Date(gameDate.getTime() + 2 * 60 * 60 * 1000);
      return now >= conclusionTime;
    } catch (e) {
      return false;
    }
  };

  const record = useMemo(() => {
    let w = 0;
    let l = 0;
    gameSchedule.forEach((game, index) => {
      const gameKey = `game_${game.week}_${game.date}_${index}`;
      const status = gameStatuses[gameKey];
      if (status?.cancelled) return;

      if (isGameConcluded(game.date, game.time)) {
        if (status?.won) {
          w++;
        } else {
          l++;
        }
      }
    });
    return { w, l };
  }, [gameStatuses, now]);

  const handleUpdateStatus = async (gameKey: string, updates: Partial<GameStatus>) => {
    if (!isAdmin || !db) return;
    const docRef = doc(db, "game_wins", gameKey);
    setDoc(docRef, { 
      ...updates,
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  };

  const handleUpdateSnack = async (gameKey: string, playerId: string) => {
    if (!isAdmin || !db) return;
    const docRef = doc(db, "game_wins", gameKey);
    setDoc(docRef, { 
      snackPlayerId: playerId,
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary transition-colors hover:bg-primary/10">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">
              2026 Schedule
            </h1>
            {isAdmin && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Booth Operations Mode</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
          <a href="https://groupme.com/join_group/115533519/bxlMSOlb" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </a>
          <AdminPanel />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-40">
        <section className="flex flex-col items-center md:items-start space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Season Standings</h2>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-lg shadow-primary/5 relative">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Wins</span>
              <span className="text-3xl font-black digit-font text-primary">{record.w}</span>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-lg shadow-destructive/5 relative">
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">Losses</span>
              <span className="text-3xl font-black digit-font text-destructive">{record.l}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Season Timeline</h2>
          </div>

          <div className="grid gap-4">
            {gameSchedule.map((game, index) => {
              const gameKey = `game_${game.week}_${game.date}_${index}`;
              const statusData = gameStatuses[gameKey] || {};
              const isWon = statusData.won || false;
              const isCancelled = statusData.cancelled || false;
              const isLoss = !isWon && !isCancelled && isGameConcluded(game.date, game.time);
              const isHome = game.home === "Coach Chewy" || game.notes === "Playoffs" || game.notes === "Finals";
              const snackPlayer = roster.find(p => p.id === statusData.snackPlayerId);
              
              return (
                <Card 
                  key={gameKey} 
                  className={cn(
                    "transition-all duration-300 relative overflow-hidden",
                    isHome ? "bg-blue-950/40 border-blue-800/60" : "bg-slate-800/50 border-slate-700/60",
                    isCancelled && "opacity-60 border-destructive/40"
                  )}
                >
                  <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-2">
                    {isCancelled && <Badge variant="destructive" className="font-black uppercase text-[8px] tracking-widest">Cancelled</Badge>}
                    {isWon && !isCancelled && <span className="text-2xl md:text-3xl animate-trophy-breathe">🏆</span>}
                  </div>

                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Week, Date, Time & Location */}
                      <div className="md:col-span-3 flex flex-col border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 h-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-black uppercase">Week {game.week}</Badge>
                          {game.notes && <Badge className="bg-secondary text-secondary-foreground text-[10px] font-black uppercase">{game.notes}</Badge>}
                        </div>
                        <p className="mt-2 text-sm font-black uppercase tracking-wider text-white">
                          {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1 mb-2">
                          <Clock className="h-3 w-3" /> {game.time}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase leading-tight bg-black/20 p-2 rounded-lg border border-white/5 mt-auto">
                          <MapPin className="h-3 w-3 shrink-0" /> {game.location}
                        </div>
                      </div>

                      {/* Jersey Visual */}
                      <div className="md:col-span-2 flex flex-col items-center justify-center space-y-2 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 h-full">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">Jersey</span>
                        <div className="relative w-12 h-12 md:w-16 md:h-16">
                          <Image 
                            src={isHome ? "/Blue_Jersey.png" : "/Grey_Jersey.png"} 
                            alt={isHome ? "Home Jersey" : "Away Jersey"}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className={cn("text-[9px] font-black uppercase", isHome ? "text-primary" : "text-muted-foreground")}>
                          {isHome ? "Home Blue" : "Away Grey"}
                        </span>
                      </div>

                      {/* Matchup & Snack */}
                      <div className="md:col-span-4 flex flex-col space-y-4 h-full justify-center">
                        <div className="flex items-center justify-between gap-4 p-3 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex-1 text-center">
                            <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Away</p>
                            <p className={cn("text-xs font-bold truncate", game.away === "Coach Chewy" ? "text-primary" : "text-white")}>{game.away}</p>
                          </div>
                          <span className="text-[8px] font-black text-muted-foreground">VS</span>
                          <div className="flex-1 text-center">
                            <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Home</p>
                            <p className={cn("text-xs font-bold truncate", game.home === "Coach Chewy" ? "text-primary" : "text-white")}>{game.home}</p>
                          </div>
                        </div>

                        {/* Snack Duty */}
                        <div className="flex flex-col space-y-1.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Snack Assignment</span>
                          {isAdmin ? (
                            <Select 
                              value={statusData.snackPlayerId || ""} 
                              onValueChange={(val) => handleUpdateSnack(gameKey, val)}
                            >
                              <SelectTrigger className="h-9 bg-background/50 border-white/10 text-[10px] font-bold">
                                <SelectValue placeholder="Assign Player..." />
                              </SelectTrigger>
                              <SelectContent>
                                {roster.map(p => (
                                  <SelectItem key={p.id} value={p.id} className="text-xs font-bold">#{p.number} - {p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20 w-max">
                              <UtensilsCrossed className="h-3 w-3" />
                              SNACK - {snackPlayer ? snackPlayer.name : "TBD"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admin Controls */}
                      <div className="md:col-span-3 flex flex-col justify-center h-full">
                        {isAdmin && (
                          <div className="flex items-center gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant={isWon ? "default" : "outline"} 
                              className={cn("flex-1 h-10 text-[10px] font-black", isWon && "bg-yellow-500 hover:bg-yellow-600")}
                              onClick={() => handleUpdateStatus(gameKey, { won: true, cancelled: false })}
                            >
                              <Trophy className="h-3 w-3 mr-1" /> W
                            </Button>
                            <Button 
                              size="sm" 
                              variant={isLoss ? "default" : "outline"} 
                              className={cn("flex-1 h-10 text-[10px] font-black", isLoss && "bg-destructive hover:bg-destructive/90")}
                              onClick={() => handleUpdateStatus(gameKey, { won: false, cancelled: false })}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> L
                            </Button>
                            <Button 
                              size="sm" 
                              variant={isCancelled ? "destructive" : "outline"} 
                              className="flex-1 h-10 text-[10px] font-black"
                              onClick={() => handleUpdateStatus(gameKey, { won: false, cancelled: true })}
                            >
                              <Ban className="h-3 w-3 mr-1" /> C
                            </Button>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}