
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar as CalendarIcon, 
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
  Zap,
  RefreshCw
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
import { InstallButton } from "@/components/InstallButton";

interface GameStatus {
  won?: boolean | null;
  cancelled?: boolean;
  snackPlayerId?: string;
  autoSynced?: boolean;
}

export default function GameSchedulePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin, roster, triggerSync } = useGame();
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});
  const [isSyncing, setIsSyncing] = useState(false);

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
            snackPlayerId: data.snackPlayerId || "",
            autoSynced: data.autoSynced || false
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

  // Roll to current/upcoming game on load
  useEffect(() => {
    if (activeGameId) {
      setTimeout(() => {
        const element = document.getElementById(activeGameId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 800);
    }
  }, [activeGameId]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerSync();
    setIsSyncing(false);
    toast({ title: "Standings Synced", description: "Season records have been updated based on latest game stats." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">
              2026 SCHEDULE
            </h1>
            {isAdmin && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Booth Operations Mode</span>
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <InstallButton />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5 mr-1 md:mr-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-primary">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/booth">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary">
                <Zap className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/stats">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://groupme.com/join_group/115533519/bxlMSOlb" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </a>
          </div>
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
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="h-7 md:h-8 border-primary/20 text-primary font-black uppercase text-[8px] md:text-[10px] tracking-widest gap-2"
                >
                  <RefreshCw className={cn("h-2.5 w-2.5 md:h-3 md:w-3", isSyncing && "animate-spin")} /> Sync Stats
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-center sm:justify-start gap-2 md:gap-4">
            <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center min-w-[60px] md:min-w-[100px]">
              <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Wins</span>
              <span className="text-lg md:text-3xl font-black digit-font text-primary">{record.w}</span>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center min-w-[60px] md:min-w-[100px]">
              <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-destructive mb-0.5">Losses</span>
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
              const isHome = game.home === "Coach Chewy";
              const snackPlayer = roster.find(p => p.id === statusData.snackPlayerId);
              
              return (
                <Card 
                  id={game.id}
                  key={game.id} 
                  className={cn(
                    "transition-all duration-300 relative overflow-hidden scroll-mt-[180px] md:scroll-mt-[260px]",
                    isHome ? "bg-blue-950/40 border-blue-800/60" : "bg-slate-800/50 border-slate-700/60",
                    isCancelled && "opacity-60",
                    activeGameId === game.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-2">
                    {isWon && !isCancelled && <span className="text-2xl md:text-3xl animate-trophy-breathe">🏆</span>}
                    {isLoss && !isCancelled && <XCircle className="h-6 w-6 md:h-8 md:w-8 text-destructive" />}
                    {isCancelled && <Badge variant="destructive" className="font-black uppercase text-[8px]">Cancelled</Badge>}
                  </div>

                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-3 flex flex-col border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0">
                        <Badge variant="outline" className="w-fit text-[10px] font-black uppercase">{game.notes || `Week ${game.week}`}</Badge>
                        <p className="mt-2 text-sm font-black uppercase text-white">
                          {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1"><Clock className="h-3 w-3" /> {game.time}</div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                          <MapPin className="h-3 w-3" /> {game.location}
                        </div>
                      </div>

                      <div className="md:col-span-9 flex flex-col space-y-4">
                        <div className="flex items-center justify-between gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex-1 text-center">
                            <p className="text-[8px] font-black uppercase text-muted-foreground">Away</p>
                            <p className={cn("text-xs font-bold", game.away === "Coach Chewy" ? "text-primary" : "text-white")}>{game.away}</p>
                          </div>
                          <span className="text-[8px] font-black text-muted-foreground px-2 py-1 bg-white/5 rounded-full">VS</span>
                          <div className="flex-1 text-center">
                            <p className="text-[8px] font-black uppercase text-muted-foreground">Home</p>
                            <p className={cn("text-xs font-bold", game.home === "Coach Chewy" ? "text-primary" : "text-white")}>{game.home}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20 w-fit">
                          SNACK - {snackPlayer ? snackPlayer.name : "TBD"}
                        </div>
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
            <div className="flex items-center justify-center gap-2 h-11 border border-white/10 rounded-xl bg-white/5 text-secondary">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Booth</span>
            </div>
          </Link>
          <Link href="/stats" className="flex-1">
            <div className="flex items-center justify-center gap-2 h-11 border border-white/10 rounded-xl bg-white/5 text-primary">
              <BarChart3 className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
          </Link>
        </div>
      </footer>
    </div>
  );
}
