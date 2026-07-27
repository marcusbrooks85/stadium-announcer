
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
  Ban,
  ShieldCheck,
  XCircle,
  Zap,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { onSnapshot, collection } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useToast } from "@/hooks/use-toast";

interface GameStatus {
  won?: boolean | null;
  cancelled?: boolean;
  snackPlayerId?: string;
  autoSynced?: boolean;
}

function UATScheduleContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin, roster, triggerSync, userRole, games } = useUATGame();
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!db) return;

    const winsRef = collection(db, "game_wins_UAT");
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
    if (!games.length) return null;
    const now = new Date();
    const convertTimeTo24h = (timeStr: string) => {
      const parts = timeStr.split(' ');
      if (parts.length < 2) return "00:00:00";
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const sorted = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const active = sorted.find(g => {
      const gameStart = new Date(`${g.date}T${convertTimeTo24h(g.time)}`);
      return gameStart.getTime() + (2 * 60 * 60 * 1000) > now.getTime();
    }) || sorted[sorted.length - 1];

    return active?.id;
  }, [games]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerSync();
    setIsSyncing(false);
    toast({ title: "UAT Standings Synced" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">
              UAT SEASON TIMELINE
            </h1>
            {isAdmin && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Verified {userRole?.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UATNavbar />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-40">
        <section className="sticky top-[69px] md:top-[88px] z-40 bg-background/95 backdrop-blur-md py-3 md:py-4 border-b border-white/5 space-y-2 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              <h2 className="text-xs md:text-base font-black uppercase tracking-widest text-primary">Live UAT Standings</h2>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleManualSync} disabled={isSyncing} className="h-7 md:h-8 border-primary/20 text-primary uppercase text-[8px] md:text-[10px] tracking-widest gap-2">
                <RefreshCw className={cn("h-2.5 w-2.5 md:h-3 md:w-3", isSyncing && "animate-spin")} /> {isSyncing ? "Syncing..." : "Sync UAT Stats"}
              </Button>
            )}
          </div>
          <div className="flex justify-center sm:justify-start gap-2 md:gap-4">
            <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center min-w-[60px] md:min-w-[100px]">
              <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-primary mb-0.5 md:mb-1">Wins</span>
              <span className="text-lg md:text-3xl font-black digit-font text-primary">{record.w}</span>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center min-w-[60px] md:min-w-[100px]">
              <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-destructive mb-0.5 md:mb-1">Losses</span>
              <span className="text-lg md:text-3xl font-black digit-font text-destructive">{record.l}</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Current Schedule</h2>
          </div>

          <div className="grid gap-4">
            {games.length === 0 ? (
              <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">No games scheduled yet.</p>
                {isAdmin && (
                  <Link href="/admin-uat">
                    <Button variant="link" className="text-primary mt-2 uppercase text-[10px] font-black">Open Schedule Manager</Button>
                  </Link>
                )}
              </div>
            ) : (
              games.map((game) => {
                const statusData = gameStatuses[game.id] || {};
                const isWon = statusData.won === true;
                const isLoss = statusData.won === false;
                const isCancelled = statusData.cancelled || false;
                const isHome = game.home === (teamData?.name || "Home Team");
                const snackPlayer = roster.find(p => p.id === statusData.snackPlayerId);
                
                return (
                  <Card id={game.id} key={game.id} className={cn("relative overflow-hidden transition-all duration-300", isHome ? "bg-blue-950/40 border-blue-800/60" : "bg-slate-800/50 border-slate-700/60", isCancelled && "opacity-60", activeGameId === game.id && "ring-2 ring-primary shadow-[0_0_20px_rgba(66,133,255,0.3)]")}>
                    <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-2">
                      {isWon && !isCancelled && <span className="text-2xl md:text-3xl animate-bounce">🏆</span>}
                      {isLoss && !isCancelled && <XCircle className="h-6 w-6 md:h-8 md:w-8 text-destructive" />}
                      {isCancelled && <Badge variant="destructive" className="font-black uppercase text-[8px]">Cancelled</Badge>}
                    </div>

                    <CardContent className="p-4 md:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-3 flex flex-col border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0">
                          <Badge variant="outline" className="w-fit text-[10px] font-black uppercase">{game.week ? `Game ${game.week}` : 'Official Match'}</Badge>
                          <p className="mt-2 text-sm font-black uppercase text-white">
                            {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                          </p>
                          <div className="text-xs font-bold text-muted-foreground mt-1"><Clock className="h-3 w-3 inline mr-1" /> {game.time}</div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mt-2 bg-black/20 p-2 rounded-lg border border-white/5 inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {game.location}</div>
                        </div>

                        <div className="md:col-span-9 flex flex-col space-y-4">
                          <div className="flex items-center justify-between gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                            <div className="flex-1 text-center">
                              <p className="text-[8px] font-black uppercase text-muted-foreground">Away</p>
                              <p className={cn("text-xs font-bold", game.away === teamData?.name ? "text-primary" : "text-white")}>{game.away}</p>
                            </div>
                            <span className="text-[8px] font-black text-muted-foreground px-2 py-1 bg-white/5 rounded-full">VS</span>
                            <div className="flex-1 text-center">
                              <p className="text-[8px] font-black uppercase text-muted-foreground">Home</p>
                              <p className={cn("text-xs font-bold", game.home === teamData?.name ? "text-primary" : "text-white")}>{game.home}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20 w-fit">
                            SNACK DUTY: {snackPlayer ? snackPlayer.name : "Unassigned"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function UATSchedulePage() {
  return (
    <UATGameProvider>
      <UATScheduleContent />
    </UATGameProvider>
  );
}
