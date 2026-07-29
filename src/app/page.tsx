"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
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
  RefreshCw,
  Shirt
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
  const { isAdmin, roster, triggerSync, updateSnackDuty } = useGame();
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
      const parts = timeStr.split(' ');
      if (parts.length < 2) return "00:00:00";
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const sorted = [...FULL_GAME_SCHEDULE].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const active = sorted.find(g => {
      if ((g as any).isPostseason) {
        const d = new Date(`${g.date}T09:00:00`);
        return d.getTime() + (4 * 60 * 60 * 1000) > now.getTime();
      }
      const gameStart = new Date(`${g.date}T${convertTimeTo24h((g as any).time)}`);
      return gameStart.getTime() + (2 * 60 * 60 * 1000) > now.getTime();
    }) || sorted[sorted.length - 1];

    return active.id;
  }, []);

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
            {FULL_GAME_SCHEDULE.map((game: any) => {
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
                    "transition-all duration-300 relative overflow-hidden scroll-mt-[180px] md:scroll-mt-[260px] flex flex-row items-center justify-between gap-2 px-2 py-2",
                    isHome || game.isPostseason ? "bg-blue-950/40 border-blue-800/60" : "bg-slate-800/50 border-slate-700/60",
                    isCancelled && "opacity-60",
                    activeGameId === game.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <div className="absolute top-1 right-1 z-20 flex flex-col items-end gap-1">
                    {isWon && !isCancelled && <span className="text-xl md:text-2xl animate-trophy-breathe">🏆</span>}
                    {isLoss && !isCancelled && <XCircle className="h-4 w-4 md:h-6 md:w-6 text-destructive" />}
                    {isCancelled && <Badge variant="destructive" className="font-black uppercase text-[7px]">Cancelled</Badge>}
                  </div>

                  <CardContent className="p-0 w-full flex flex-row items-center gap-2">
                    {/* Date / Location Section */}
                    <div className="flex flex-col shrink-0 border-r border-white/5 pr-2 min-w-[70px] md:min-w-[150px]">
                      <Badge variant="outline" className="w-fit text-[7px] md:text-[9px] font-black uppercase px-1 h-3.5 md:h-4">{game.notes || `Week ${game.week}`}</Badge>
                      <p className="mt-1 text-[10px] md:text-sm font-black uppercase text-white leading-tight">
                        <span className="md:hidden">
                          {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="hidden md:inline">
                          {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                        </span>
                      </p>
                      {!game.isPostseason && <div className="flex items-center gap-1 text-[8px] md:text-xs font-bold text-muted-foreground mt-0.5"><Clock className="h-2 w-2 md:h-3 md:w-3" /> {game.time}</div>}
                      <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-bold text-muted-foreground uppercase mt-1 md:mt-1.5 bg-black/20 p-1 md:p-1.5 rounded border border-white/5">
                        <MapPin className="h-2 w-2 md:h-3 md:w-3 shrink-0" /> <span className="truncate">{game.location}</span>
                      </div>
                    </div>

                    {/* Jersey Section */}
                    <div className="flex flex-col items-center justify-center shrink-0 border-r border-white/5 pr-2 min-w-[45px] md:min-w-[80px]">
                       <span className="text-[6px] md:text-[8px] font-black uppercase text-muted-foreground mb-0.5 tracking-widest">JERSEY</span>
                       {game.isPostseason ? (
                         <div className="flex flex-col items-center">
                           <Trophy className="h-5 w-5 md:h-10 md:w-10 text-primary/40" />
                           <span className="text-[6px] md:text-[8px] font-black uppercase text-primary mt-0.5">Finals</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center">
                           <img 
                             src={isHome ? "/Blue_Jersey.png" : "/Grey_Jersey.png"} 
                             alt={isHome ? "Home Jersey" : "Away Jersey"} 
                             className="w-8 h-8 md:w-14 md:h-14 object-contain" 
                           />
                           <span className={cn("text-[7px] md:text-[9px] font-black uppercase mt-0.5", isHome ? "text-primary" : "text-slate-400")}>
                             {isHome ? "Home" : "Away"}
                           </span>
                         </div>
                       )}
                    </div>

                    {/* Matchup & Snack Duty Section */}
                    <div className="flex-1 flex flex-col min-w-0">
                      {game.isPostseason ? (
                        <div className="space-y-2">
                             {game.subGames.map((sg: any) => {
                               const sgStatus = gameStatuses[sg.id] || {};
                               const sgSnackPlayer = roster.find(p => p.id === sgStatus.snackPlayerId);

                               return (
                                 <div key={sg.id} className="space-y-1">
                                   <div className="flex items-center justify-between gap-1 p-1 bg-black/30 rounded border border-white/5">
                                     <div className="flex flex-col items-start min-w-[35px] md:min-w-[70px]">
                                       <span className="text-[6px] md:text-[7px] font-black text-primary uppercase leading-none">{sg.gameNum.split(' ')[1]}</span>
                                       <span className="text-[7px] md:text-[9px] font-bold text-white mt-0.5">{sg.time}</span>
                                     </div>
                                     <div className="flex-1 flex items-center justify-center gap-1 min-w-0 whitespace-normal">
                                       <span className="text-[9px] md:text-xs font-bold text-white leading-tight">{sg.away}</span>
                                       <span className="text-[6px] md:text-[7px] font-black text-muted-foreground shrink-0 px-0.5 bg-white/5 rounded">VS</span>
                                       <span className="text-[9px] md:text-xs font-bold text-white leading-tight">{sg.home}</span>
                                     </div>
                                   </div>
                                   
                                   {isAdmin ? (
                                     <div className="flex items-center gap-1 bg-secondary/5 p-0.5 rounded border border-secondary/20 w-fit">
                                       <span className="text-[6px] md:text-[7px] font-black uppercase text-secondary ml-1">SNACK:</span>
                                       <Select 
                                         value={sgStatus.snackPlayerId || "none"} 
                                         onValueChange={(val) => updateSnackDuty(sg.id, val === "none" ? null : val)}
                                       >
                                         <SelectTrigger className="h-5 bg-black/40 border-none text-[6px] md:text-[7px] font-black uppercase w-[75px] md:w-[110px] focus:ring-0 px-1">
                                           <SelectValue placeholder="Assign..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="none" className="text-[8px] font-bold uppercase">TBD</SelectItem>
                                           {roster.map(p => (
                                             <SelectItem key={p.id} value={p.id} className="text-[8px] font-bold uppercase">{p.name}</SelectItem>
                                           ))}
                                         </SelectContent>
                                       </Select>
                                     </div>
                                   ) : (
                                     <div className="flex items-center gap-1 text-[7px] md:text-[8px] font-black uppercase text-secondary bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20 w-fit whitespace-nowrap">
                                       SNACK DUTY: {sgSnackPlayer ? sgSnackPlayer.name : "TBD"}
                                     </div>
                                   )}
                                 </div>
                               );
                             })}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1 p-2 bg-black/30 rounded border border-white/5 whitespace-normal">
                            <div className="flex-1 text-center min-w-0">
                              <p className="text-[6px] md:text-[7px] font-black uppercase text-muted-foreground">Away</p>
                              <p className={cn("text-[10px] md:text-xs font-bold leading-tight", game.away === "Coach Chewy" ? "text-primary" : "text-white")}>{game.away}</p>
                            </div>
                            <div className="flex flex-col items-center shrink-0">
                               <span className="text-[6px] md:text-[7px] font-black text-muted-foreground px-1 py-0.5 bg-white/5 rounded-full">VS</span>
                            </div>
                            <div className="flex-1 text-center min-w-0">
                              <p className="text-[6px] md:text-[7px] font-black uppercase text-muted-foreground">Home</p>
                              <p className={cn("text-[10px] md:text-xs font-bold leading-tight", game.home === "Coach Chewy" ? "text-primary" : "text-white")}>{game.home}</p>
                            </div>
                          </div>
                          
                          {isAdmin ? (
                            <div className="flex items-center gap-1 bg-secondary/5 p-0.5 rounded border border-secondary/20 w-fit">
                              <span className="text-[6px] md:text-[7px] font-black uppercase text-secondary ml-1">SNACK DUTY</span>
                              <Select 
                                value={statusData.snackPlayerId || "none"} 
                                onValueChange={(val) => updateSnackDuty(game.id, val === "none" ? null : val)}
                              >
                                <SelectTrigger className="h-6 bg-black/40 border-none text-[7px] font-black uppercase w-[90px] md:w-[150px] focus:ring-0 px-1.5">
                                  <SelectValue placeholder="Assign..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" className="text-[8px] font-bold uppercase">Unassigned</SelectItem>
                                  {roster.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-[8px] font-bold uppercase">{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[7px] md:text-[9px] font-black uppercase text-secondary bg-secondary/10 px-2 py-1 rounded border border-secondary/20 w-fit whitespace-nowrap">
                              SNACK DUTY: {snackPlayer ? snackPlayer.name : "TBD"}
                            </div>
                          )}
                        </div>
                      )}
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
