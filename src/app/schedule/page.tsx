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
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  const { isAdmin } = useGame();
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
      if (status?.cancelled) return;
      const isWon = status?.won || false;
      const timelineStatus = getGameStatusLabel(game.date);
      if (timelineStatus !== "future") {
        if (isWon) w++;
        else if (timelineStatus === "past") l++;
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

  const handleToggleWin = async (gameKey: string, currentWon: boolean) => {
    if (!isAdmin || !db) return;
    const docRef = doc(db, "game_wins", gameKey);
    setDoc(docRef, { 
      won: !currentWon, 
      cancelled: false,
      updatedAt: new Date().toISOString() 
    }, { merge: true });
  };

  const handleToggleCancelled = async (gameKey: string, currentCancelled: boolean) => {
    if (!isAdmin || !db) return;
    const docRef = doc(db, "game_wins", gameKey);
    setDoc(docRef, { 
      cancelled: !currentCancelled,
      won: false,
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
                <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Edit Mode Active</span>
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
                    isNextUpcoming && !isCancelled && "scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-2 ring-blue-500",
                    isCancelled && "opacity-60 border-destructive/40"
                  )}
                >
                  {/* Admin Toggles */}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 z-20">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className={cn(
                           "h-7 w-7 rounded-full transition-colors",
                           isCancelled ? "bg-destructive text-white" : "bg-white/5 text-muted-foreground hover:bg-destructive/20"
                         )}
                         onClick={() => handleToggleCancelled(gameKey, isCancelled)}
                       >
                         <Ban className="h-3.5 w-3.5" />
                       </Button>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-2">
                    {isCancelled && <Badge variant="destructive" className="font-black uppercase text-[8px] tracking-widest">Cancelled</Badge>}
                    {isWon && !isCancelled && <span className="text-2xl md:text-3xl animate-trophy-breathe">🏆</span>}
                  </div>

                  <div className={cn("transition-all duration-300", (isPast || isCancelled) && "opacity-40")}>
                    <CardContent className="p-4 md:p-6 pt-10 md:pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-3 flex flex-col">
                          <div className="flex items-center gap-3">
                            {isAdmin && (
                              <Checkbox 
                                checked={isWon} 
                                disabled={isCancelled}
                                onCheckedChange={() => handleToggleWin(gameKey, isWon)}
                                className="border-white/20 data-[state=checked]:bg-yellow-500"
                              />
                            )}
                            <Badge variant={isNextUpcoming && !isCancelled ? "default" : "outline"} className="text-[10px] font-black uppercase">Week {game.week}</Badge>
                            {game.notes && <Badge className="bg-secondary text-secondary-foreground text-[10px] font-black uppercase">{game.notes}</Badge>}
                          </div>
                          <p className="mt-2 text-sm font-black uppercase tracking-wider text-white">
                            {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                          </p>
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Clock className="h-3 w-3" /> {game.time}</div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase truncate"><MapPin className="h-3 w-3" /> {game.location}</div>
                          {snackDuty && !isCancelled && <div className="bg-slate-800 text-slate-100 px-2 py-1 rounded-md inline-flex items-center gap-1 text-[10px] mt-2 uppercase font-black tracking-tighter">🍴 {snackDuty}</div>}
                        </div>

                        <div className="md:col-span-6 flex items-center justify-between gap-4 p-3 bg-black/30 rounded-xl border border-white/5">
                          <div className="flex-1 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Away</p>
                            <p className={cn("text-xs md:text-sm font-bold truncate", game.away === "Coach Chewy" ? "text-primary" : "text-white")}>{game.away}</p>
                          </div>
                          <span className="text-[8px] font-black text-muted-foreground">VS</span>
                          <div className="flex-1 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Home</p>
                            <p className={cn("text-xs md:text-sm font-bold truncate", game.home === "Coach Chewy" ? "text-primary" : "text-white")}>{game.home}</p>
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
    </div>
  );
}
