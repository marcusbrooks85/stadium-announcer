"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
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
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { doc, setDoc, onSnapshot, collection, deleteDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

const SNACK_SCHEDULE: Record<string, string> = {
  "2026-06-27": "Jacob",
  "2026-06-30": "Camila",
  "2026-07-07": "Jimena",
  "2026-07-11": "Zeke",
  "2026-07-14": "Alexa",
  "2026-07-25": "Dominic",
};

interface GameStatus {
  won?: boolean;
  cancelled?: boolean;
}

export default function GameSchedulePage() {
  const db = useFirestore();
  const [gameStatuses, setGameStatuses] = useState<Record<string, GameStatus>>({});
  const [todayPST, setTodayPST] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    const pstDateStr = now.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    const d = new Date(pstDateStr);
    d.setHours(0, 0, 0, 0);
    setTodayPST(d);
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
            cancelled: data.cancelled || false
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

  const getGameStatusLabel = (dateStr: string) => {
    if (!todayPST) return "future";
    const [y, m, d] = dateStr.split("-").map(Number);
    const gameDate = new Date(y, m - 1, d);
    gameDate.setHours(0, 0, 0, 0);

    if (gameDate < todayPST) return "past";
    if (gameDate.getTime() === todayPST.getTime()) return "today";
    return "future";
  };

  const record = useMemo(() => {
    if (!todayPST) return { w: 0, l: 0 };
    let w = 0;
    let l = 0;
    gameSchedule.forEach((game, index) => {
      const gameKey = `game_${game.week}_${game.date}_${index}`;
      const status = gameStatuses[gameKey];
      
      // Completely ignore cancelled games for stats
      if (status?.cancelled) return;

      const isWon = status?.won || false;
      const timelineStatus = getGameStatusLabel(game.date);
      
      if (timelineStatus !== "future") {
        if (isWon) {
          w++;
        } else if (timelineStatus === "past") {
          l++;
        }
      }
    });
    return { w, l };
  }, [gameStatuses, todayPST]);

  const nextUpcomingGameIndex = useMemo(() => {
    if (!todayPST) return -1;
    return gameSchedule.findIndex(game => {
      const label = getGameStatusLabel(game.date);
      return label === "today" || label === "future";
    });
  }, [todayPST]);

  const verifyAdmin = () => {
    const password = window.prompt("Enter Admin Password to update game status:");
    if (password === "Chewy2026") return true;
    if (password !== null) alert("Incorrect Password");
    return false;
  };

  const handleToggleWin = async (gameKey: string, currentWon: boolean) => {
    if (!verifyAdmin()) return;
    if (!db) return;

    const docRef = doc(db, "game_wins", gameKey);
    const currentCancelled = gameStatuses[gameKey]?.cancelled || false;

    // Mutually exclusive: cannot win a cancelled game
    if (!currentWon) {
      setDoc(docRef, { 
        won: true, 
        cancelled: false,
        updatedAt: new Date().toISOString() 
      }, { merge: true })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'write',
            requestResourceData: { won: true, cancelled: false },
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    } else {
      // If we are un-checking win, but it wasn't cancelled, we can just delete if we want to reset
      // or set won: false
      setDoc(docRef, { 
        won: false,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    }
  };

  const handleToggleCancelled = async (gameKey: string, currentCancelled: boolean) => {
    if (!verifyAdmin()) return;
    if (!db) return;

    const docRef = doc(db, "game_wins", gameKey);

    if (!currentCancelled) {
      setDoc(docRef, { 
        cancelled: true,
        won: false, // Mutually exclusive
        updatedAt: new Date().toISOString() 
      }, { merge: true })
        .catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'write',
            requestResourceData: { cancelled: true, won: false },
          });
          errorEmitter.emit('permission-error', permissionError);
        });
    } else {
      setDoc(docRef, { 
        cancelled: false,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    }
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
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-xs md:text-sm">
            2026 Schedule
          </h1>
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
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-40">
        <section className="flex flex-col items-center md:items-start space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Season Record</h2>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-lg shadow-primary/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">W</span>
              <span className="text-3xl font-black digit-font text-primary">{record.w}</span>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-lg shadow-destructive/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">L</span>
              <span className="text-3xl font-black digit-font text-destructive">{record.l}</span>
            </div>
          </div>
          <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">* Cancelled games are excluded from record</p>
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
              const label = getGameStatusLabel(game.date);
              const isPast = label === "past";
              const isNextUpcoming = index === nextUpcomingGameIndex;
              const isHome = game.home === "Coach Chewy" || game.notes === "Playoffs" || game.notes === "Finals";
              const snackDuty = SNACK_SCHEDULE[game.date];

              return (
                <Card 
                  key={gameKey} 
                  className={cn(
                    "transition-all duration-300 relative overflow-hidden",
                    isHome ? "bg-blue-950/40 border-blue-800/60" : "bg-slate-800/50 border-slate-700/60",
                    isNextUpcoming && !isCancelled && "scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-2 ring-blue-500 border-t-white/30",
                    isCancelled && "opacity-60 border-destructive/40"
                  )}
                >
                  {/* Cancel Button */}
                  <div className="absolute top-2 left-2 z-20">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className={cn(
                         "h-7 w-7 rounded-full transition-colors",
                         isCancelled ? "bg-destructive text-white hover:bg-destructive/80" : "bg-white/5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                       )}
                       onClick={() => handleToggleCancelled(gameKey, isCancelled)}
                     >
                       <Ban className="h-3.5 w-3.5" />
                     </Button>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-2">
                    {isCancelled && (
                      <Badge variant="destructive" className="font-black uppercase text-[8px] md:text-[9px] tracking-widest animate-pulse">
                        <XCircle className="h-3 w-3 mr-1" /> Cancelled
                      </Badge>
                    )}
                    {isWon && !isCancelled && (
                      <div className="filter drop-shadow-[0_0_12px_rgba(234,179,8,0.9)] animate-trophy-breathe">
                        <span className="text-2xl md:text-3xl">🏆</span>
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    "transition-all duration-300",
                    (isPast || isCancelled) && "line-through opacity-40 grayscale"
                  )}>
                    <CardContent className="p-4 md:p-6 pt-10 md:pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-3 flex flex-col">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 not-line-through isolation">
                              <Checkbox 
                                checked={isWon} 
                                disabled={isCancelled}
                                onCheckedChange={() => handleToggleWin(gameKey, isWon)}
                                className="pointer-events-auto border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                              />
                              <Badge variant={isNextUpcoming && !isCancelled ? "default" : "outline"} className="text-[10px] font-black tracking-widest uppercase">
                                Week {game.week}
                              </Badge>
                            </div>
                            {game.notes && (
                              <Badge className="bg-secondary text-secondary-foreground text-[10px] font-black uppercase">
                                {game.notes}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-black uppercase tracking-wider text-white">
                            {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>

                        <div className="md:col-span-3 flex flex-col space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <Clock className="h-3 w-3" /> {game.time}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase truncate">
                            <MapPin className="h-3 w-3 shrink-0" /> {game.location}
                          </div>
                          
                          {snackDuty && !isCancelled && (
                            <div className="bg-slate-800/90 text-slate-100 border border-slate-700 font-bold px-2 py-1 rounded-md inline-flex items-center gap-1.5 text-[10px] mt-2 self-start shadow-sm not-line-through isolation">
                              <span>🍴</span>
                              <span className="uppercase tracking-tighter">SNACK: {snackDuty}</span>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-6 flex items-center justify-between gap-4 p-3 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex-1 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Away</p>
                            <p className={cn("text-xs md:text-sm font-bold truncate", game.away === "Coach Chewy" ? "text-primary" : "text-white")}>
                              {game.away}
                            </p>
                          </div>
                          <div className="flex-none flex flex-col items-center">
                             <span className="text-[8px] font-black text-muted-foreground uppercase">VS</span>
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Home</p>
                            <p className={cn("text-xs md:text-sm font-bold truncate", game.home === "Coach Chewy" ? "text-primary" : "text-white")}>
                              {game.home}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
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
