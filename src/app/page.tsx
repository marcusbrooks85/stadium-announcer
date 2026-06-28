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
  XCircle,
  RotateCcw,
  Zap
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
import { doc, setDoc, onSnapshot, collection, deleteDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useGame, FULL_GAME_SCHEDULE } from "@/app/context/game-context";
import { AdminPanel } from "@/components/AdminPanel";
import { useToast } from "@/hooks/use-toast";

interface GameStatus {
  won?: boolean | null;
  cancelled?: boolean;
  snackPlayerId?: string;
}

export default function GameSchedulePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin, roster } = useGame();
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});

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
            won: data.won,
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

  const record = useMemo(() => {
    let w = 0;
    let l = 0;
    Object.values(gameStatuses).forEach((status) => {
      if (status.cancelled) return;
      if (status.won === true) w++;
      else if (status.won === false) l++; 
    });
    return { w, l };
  }, [gameStatuses]);

  const activeGameId = useMemo(() => {
    const now = new Date();
    const convertTimeTo24h = (timeStr: string) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const sorted = [...FULL_GAME_SCHEDULE].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const active = sorted.find(g => {
      const gameStart = new Date(`${g.date}T${convertTimeTo24h(g.time)}`);
      return gameStart.getTime() + (2 * 60 * 60 * 1000) > now.getTime();
    }) || sorted[sorted.length - 1];

    return active.id;
  }, []);

  useEffect(() => {
    if (activeGameId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(activeGameId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeGameId]);

  const handleUpdateStatus = async (gameId: string, type: 'W' | 'L' | 'C') => {
    if (!isAdmin || !db) return;
    const current = gameStatuses[gameId] || {};
    const docRef = doc(db, "game_wins", gameId);
    
    let updates: any = { updatedAt: new Date().toISOString() };
    
    if (type === 'W') {
      updates.won = current.won === true ? null : true;
      updates.cancelled = false;
    } else if (type === 'L') {
      updates.won = current.won === false ? null : false;
      updates.cancelled = false;
    } else if (type === 'C') {
      updates.cancelled = !current.cancelled;
      if (updates.cancelled) updates.won = null;
    }

    setDoc(docRef, updates, { merge: true }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: updates
      }));
    });
  };

  const handleResetSeason = async () => {
    if (!isAdmin || !db || !confirm("Are you sure you want to reset all game results and standings? This cannot be undone.")) return;
    
    const promises = Object.keys(gameStatuses).map(gameId => 
      deleteDoc(doc(db, "game_wins", gameId))
    );
    
    try {
      await Promise.all(promises);
      toast({
        title: "Season Reset",
        description: "All game records and standings have been cleared.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not clear all records. Please try again.",
      });
    }
  };

  const handleUpdateSnack = async (gameId: string, playerId: string) => {
    if (!isAdmin || !db) return;
    const docRef = doc(db, "game_wins", gameId);
    setDoc(docRef, { 
      snackPlayerId: playerId,
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
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
          <Link href="/booth">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary/80">
              <Zap className="h-4 w-4" />
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
        <section className="sticky top-[69px] md:top-[88px] z-40 bg-background/95 backdrop-blur-md py-3 md:py-4 border-b border-white/5 space-y-2 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              <h2 className="text-xs md:text-base font-black uppercase tracking-widest text-primary">Season Standings</h2>
            </div>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetSeason}
                className="h-7 md:h-8 border-destructive/20 text-destructive hover:bg-destructive/10 font-black uppercase text-[8px] md:text-[10px] tracking-widest gap-2 mx-auto sm:mx-0"
              >
                <RotateCcw className="h-2.5 w-2.5 md:h-3 md:w-3" /> Reset Season
              </Button>
            )}
          </div>
          <div className="flex justify-center sm:justify-start gap-2 md:gap-4">
            <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center min-w-[60px] md:min-w-[100px] shadow-lg shadow-primary/5 relative">
              <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-primary mb-0.5 md:mb-1">Wins</span>
              <span className="text-lg md:text-3xl font-black digit-font text-primary">{record.w}</span>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center min-w-[60px] md:min-w-[100px] shadow-lg shadow-destructive/5 relative">
              <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-destructive mb-0.5 md:mb-1">Losses</span>
              <span className="text-lg md:text-3xl font-black digit-font text-destructive">{record.l}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Season Timeline</h2>
          </div>

          <div className="grid gap-4">
            {FULL_GAME_SCHEDULE.map((game) => {
              const statusData = gameStatuses[game.id] || {};
              const isWon = statusData.won === true;
              const isLoss = statusData.won === false;
              const isCancelled = statusData.cancelled || false;
              const isHome = game.home === "Coach Chewy" || game.notes === "Playoffs" || game.notes === "Finals";
              const snackPlayer = roster.find(p => p.id === statusData.snackPlayerId);
              
              return (
                <Card 
                  id={game.id}
                  key={game.id} 
                  className={cn(
                    "transition-all duration-300 relative overflow-hidden scroll-mt-[180px] md:scroll-mt-[260px]",
                    isHome ? "bg-blue-950/40 border-blue-800/60" : "bg-slate-800/50 border-slate-700/60",
                    isCancelled && "opacity-60 border-destructive/40",
                    activeGameId === game.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-2">
                    {isCancelled && <Badge variant="destructive" className="font-black uppercase text-[8px] tracking-widest">Cancelled</Badge>}
                    {isWon && !isCancelled && <span className="text-2xl md:text-3xl animate-trophy-breathe">🏆</span>}
                    {isLoss && !isCancelled && <XCircle className="h-6 w-6 md:h-8 md:w-8 text-destructive animate-in zoom-in duration-300" />}
                  </div>

                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-3 flex flex-col border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 h-full">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-black uppercase">{game.notes || `Week ${game.week}`}</Badge>
                          {activeGameId === game.id && <Badge className="bg-primary text-[8px] font-black uppercase">Active Week</Badge>}
                        </div>
                        <p className="mt-2 text-sm font-black uppercase tracking-wider text-white">
                          {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1 mb-1">
                          <Clock className="h-3 w-3" /> {game.time}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase leading-tight bg-black/20 p-2 rounded-lg border border-white/5">
                          <MapPin className="h-3 w-3 shrink-0" /> {game.location}
                        </div>
                      </div>

                      {/* Jersey & Teams Section (Inline for Mobile) */}
                      <div className="md:col-span-6 flex flex-row items-center gap-4 md:grid md:grid-cols-6 md:gap-6 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 h-full">
                        
                        {/* Jersey Indicator */}
                        <div className="flex flex-col items-center justify-center space-y-1 md:space-y-2 md:col-span-2 min-w-[70px] md:min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">Jersey</span>
                          <div className="relative w-10 h-10 md:w-16 md:h-16">
                            <Image 
                              src={isHome ? "/Blue_Jersey.png" : "/Grey_Jersey.png"} 
                              alt={isHome ? "Home Jersey" : "Away Jersey"}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className={cn("text-[9px] font-black uppercase", isHome ? "text-primary" : "text-muted-foreground")}>
                            {isHome ? "Home" : "Away"}
                          </span>
                        </div>

                        {/* Home vs Away Section */}
                        <div className="flex-1 md:col-span-4 flex flex-col space-y-2 md:space-y-4 justify-center">
                          <div className="flex flex-row items-center justify-between gap-2 p-2 md:p-4 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex-1 text-center">
                              <p className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground mb-0.5 md:mb-1">Away</p>
                              <p className={cn("text-[10px] md:text-xs font-bold whitespace-normal leading-tight", game.away === "Coach Chewy" ? "text-primary" : "text-white")}>{game.away}</p>
                            </div>
                            <span className="text-[7px] md:text-[8px] font-black text-muted-foreground shrink-0 py-0.5 px-1.5 md:py-1 md:px-2 bg-white/5 rounded-full">VS</span>
                            <div className="flex-1 text-center">
                              <p className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground mb-0.5 md:mb-1">Home</p>
                              <p className={cn("text-[10px] md:text-xs font-bold whitespace-normal leading-tight", game.home === "Coach Chewy" ? "text-primary" : "text-white")}>{game.home}</p>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-1">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground ml-1">Snack Assignment</span>
                            {isAdmin ? (
                              <Select 
                                value={statusData.snackPlayerId || ""} 
                                onValueChange={(val) => handleUpdateSnack(game.id, val)}
                              >
                                <SelectTrigger className="h-8 md:h-9 bg-background/50 border-white/10 text-[9px] md:text-[10px] font-bold">
                                  <SelectValue placeholder="Assign Player..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {roster.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-xs font-bold">#{p.number} - {p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-secondary bg-secondary/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-secondary/20 w-max">
                                SNACK - {snackPlayer ? snackPlayer.name : "TBD"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-3 flex flex-col justify-center h-full">
                        {isAdmin && (
                          <div className="flex items-center gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant={isWon ? "default" : "outline"} 
                              className={cn("flex-1 h-10 text-[10px] font-black", isWon && "bg-yellow-500 hover:bg-yellow-600")}
                              onClick={() => handleUpdateStatus(game.id, 'W')}
                            >
                              <Trophy className="h-3 w-3 mr-1" /> W
                            </Button>
                            <Button 
                              size="sm" 
                              variant={isLoss ? "default" : "outline"} 
                              className={cn("flex-1 h-10 text-[10px] font-black", isLoss && "bg-destructive hover:bg-destructive/90")}
                              onClick={() => handleUpdateStatus(game.id, 'L')}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> L
                            </Button>
                            <Button 
                              size="sm" 
                              variant={isCancelled ? "destructive" : "outline"} 
                              className="flex-1 h-10 text-[10px] font-black"
                              onClick={() => handleUpdateStatus(game.id, 'C')}
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

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50">
        <div className="flex items-center justify-center gap-3 bg-card/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
          <Link href="/booth" className="flex-1">
            <div className="flex items-center justify-center gap-2 h-11 border border-white/10 rounded-xl bg-white/5 text-secondary hover:bg-white/10 transition-all">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Booth</span>
            </div>
          </Link>
          <Link href="/stats" className="flex-1">
            <div className="flex items-center justify-center gap-2 h-11 border border-white/10 rounded-xl bg-white/5 text-secondary hover:bg-white/10 transition-all">
              <BarChart3 className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Stats</span>
            </div>
          </Link>
        </div>
      </footer>
    </div>
  );
}
