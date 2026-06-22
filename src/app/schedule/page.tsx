
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  Home, 
  BarChart2, 
  MapPin, 
  Clock, 
  Trophy 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const gameSchedule = [
  { week: 1, date: "2026-06-20", time: "12:00 PM", home: "Coach Matt & Rene", away: "Coach Manny", location: "Jim Thorpe - Cordary Field" },
  { week: 1, date: "2026-06-20", time: "2:00 PM", home: "Coach Alexis", away: "Coach Nate", location: "Jim Thorpe - Cordary Field" },
  { week: 2, date: "2026-06-27", time: "9:00 AM", home: "Coach Matt & Rene", away: "Coach Nate", location: "Jim Thorpe - Cordary Field" },
  { week: 2, date: "2026-06-27", time: "11:00 AM", home: "Coach Manny", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 3, date: "2026-06-30", time: "6:00 PM", home: "Coach Nate", away: "Coach Manny", location: "Jim Thorpe - Prairie Field" },
  { week: 3, date: "2026-06-30", time: "6:00 PM", home: "Coach Matt & Rene", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 4, date: "2026-07-07", time: "6:00 PM", home: "Coach Manny", away: "Coach Matt & Rene", location: "Jim Thorpe - Prairie Field" },
  { week: 4, date: "2026-07-07", time: "6:00 PM", home: "Coach Nate", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 5, date: "2026-07-11", time: "9:00 AM", home: "Coach Alexis", away: "Coach Manny", location: "Jim Thorpe - Cordary Field" },
  { week: 5, date: "2026-07-11", time: "11:00 AM", home: "Coach Nate", away: "Coach Matt & Rene", location: "Jim Thorpe - Cordary Field" },
  { week: 6, date: "2026-07-14", time: "6:00 PM", home: "Coach Alexis", away: "Coach Matt & Rene", location: "Jim Thorpe - Prairie Field" },
  { week: 6, date: "2026-07-14", time: "6:00 PM", home: "Coach Manny", away: "Coach Nate", location: "Jim Thorpe - Cordary Field" },
  { week: 7, date: "2026-07-18", time: "9:00 AM", home: "Coach Alexis", away: "Coach Nate", location: "Jim Thorpe - Cordary Field" },
  { week: 7, date: "2026-07-18", time: "11:00 AM", home: "Coach Matt & Rene", away: "Coach Manny", location: "Jim Thorpe - Cordary Field" },
  { week: 8, date: "2026-07-21", time: "6:00 PM", home: "Coach Nate", away: "Coach Matt & Rene", location: "Jim Thorpe - Prairie Field" },
  { week: 8, date: "2026-07-21", time: "6:00 PM", home: "Coach Manny", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 9, date: "2026-07-25", time: "9:00 AM", home: "Coach Manny", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 9, date: "2026-07-25", time: "11:00 AM", home: "Coach Alexis", away: "Coach Matt & Rene", location: "Jim Thorpe - Cordary Field" },
  { week: 10, date: "2026-07-28", time: "6:00 PM", home: "Coach Matt & Rene", away: "Coach Nate", location: "Jim Thorpe - Prairie Field" },
  { week: 10, date: "2026-07-28", time: "6:00 PM", home: "Coach Manny", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { week: 11, date: "2026-08-01", time: "9:00 AM", home: "#1 Seed", away: "#4 Seed", location: "Jim Thorpe - Cordary Field", notes: "Playoffs" },
  { week: 11, date: "2026-08-01", time: "11:00 AM", home: "#2 Seed", away: "#3 Seed", location: "Jim Thorpe - Cordary Field", notes: "Playoffs" },
  { week: 12, date: "2026-08-08", time: "9:00 AM", home: "Consolation", away: "Consolation", location: "Jim Thorpe - Cordary Field", notes: "Finals" },
  { week: 12, date: "2026-08-08", time: "11:00 AM", home: "Championship", away: "Championship", location: "Jim Thorpe - Cordary Field", notes: "Finals" }
];

export default function GameSchedulePage() {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const getStatus = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const gameDate = new Date(y, m - 1, d);
    gameDate.setHours(0, 0, 0, 0);

    if (gameDate < today) return "past";
    if (gameDate.getTime() === today.getTime()) return "today";
    return "future";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10 border-primary/20 text-primary">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-xs md:text-sm">
            2026 Game Schedule
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-secondary">
              <BarChart2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Season Timeline</h2>
          </div>

          <div className="grid gap-4">
            {gameSchedule.map((game, index) => {
              const status = getStatus(game.date);
              const isPast = status === "past";
              const isToday = status === "today";

              return (
                <Card 
                  key={`${game.date}-${index}`} 
                  className={cn(
                    "bg-card/80 border-white/5 transition-all duration-300",
                    isPast && "opacity-40 grayscale-[0.5] shadow-none",
                    isToday && "border-primary shadow-[0_0_20px_rgba(66,133,255,0.2)] bg-primary/5"
                  )}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className={cn(
                      "grid grid-cols-1 md:grid-cols-12 gap-4 items-center",
                      isPast && "line-through decoration-muted-foreground/50"
                    )}>
                      {/* Date & Week */}
                      <div className="md:col-span-3 flex flex-col">
                        <div className="flex items-center gap-2">
                          <Badge variant={isToday ? "default" : "outline"} className="text-[10px] font-black tracking-widest uppercase">
                            Week {game.week}
                          </Badge>
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

                      {/* Time & Location */}
                      <div className="md:col-span-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Clock className="h-3 w-3" /> {game.time}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {game.location}
                        </div>
                      </div>

                      {/* Matchup */}
                      <div className="md:col-span-6 flex items-center justify-between gap-4 p-3 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex-1 text-center">
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Away</p>
                          <p className="text-xs md:text-sm font-bold text-white truncate">{game.away}</p>
                        </div>
                        <div className="flex-none flex flex-col items-center">
                           <Trophy className={cn("h-4 w-4", isToday ? "text-primary animate-bounce" : "text-muted-foreground/30")} />
                           <span className="text-[8px] font-black text-muted-foreground uppercase">VS</span>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Home</p>
                          <p className="text-xs md:text-sm font-bold text-white truncate">{game.home}</p>
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

      {/* FOOTER NAV FOR MOBILE */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 lg:hidden bg-background/80 backdrop-blur-md border-t border-white/5 z-50">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/">
            <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary font-black uppercase text-[10px]">
              <Home className="h-4 w-4" /> Booth
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="outline" className="w-full gap-2 border-secondary/20 text-secondary font-black uppercase text-[10px]">
              <BarChart2 className="h-4 w-4" /> Stats
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
