
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  MapPin,
  Clock,
  Loader2,
  Plus,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { UATGameProvider, useUATGame } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";

function UATScheduleContent() {
  const db = useFirestore();
  const { userRole, userTeamId, isLoaded } = useUATGame();
  const [games, setGames] = useState<any[]>([]);

  const canEdit = userRole === "super_admin" || userRole === "league_admin";

  useEffect(() => {
    if (!db || !userTeamId) return;
    const q = query(
      collection(db, "games_UAT"), 
      where("teamId", "==", userTeamId),
      orderBy("date", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db, userTeamId]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT SCHEDULE</h1>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[var(--tenant-primary)]" />
            <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">Isolated Environment</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <UATNavbar />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-[var(--tenant-primary)]" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--tenant-primary)]">Test Timeline</h2>
            </div>
            {canEdit && (
              <Link href="/admin-uat">
                <Button size="sm" className="bg-[var(--tenant-primary)] font-black uppercase text-[10px] tracking-widest">
                  <Plus className="h-3 w-3 mr-1" /> Add Games
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-4">
            {games.length === 0 ? (
              <Card className="bg-card/40 border-dashed border-white/10 p-12 text-center">
                <p className="text-sm font-black uppercase text-muted-foreground">No test games configured</p>
              </Card>
            ) : (
              games.map((game) => (
                <Card key={game.id} className="bg-card/80 border-white/10 overflow-hidden relative group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[9px] font-black uppercase border-[var(--tenant-primary)]/20 text-[var(--tenant-primary)]">
                             Week {game.week || "N/A"}
                           </Badge>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase">
                             {game.date ? new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : "Date TBD"}
                           </span>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">
                          <span className={cn(game.away === "Coach Chewy" ? "text-[var(--tenant-primary)]" : "text-white")}>{game.away}</span>
                          <span className="mx-2 text-muted-foreground/30 text-sm">VS</span>
                          <span className={cn(game.home === "Coach Chewy" ? "text-[var(--tenant-primary)]" : "text-white")}>{game.home}</span>
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-[var(--tenant-primary)]" /> {game.time || "TBD"}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-[var(--tenant-primary)]" /> {game.location || "Test Field"}</span>
                        </div>
                      </div>
                      <div className="opacity-10 group-hover:opacity-20 transition-opacity">
                         <Trophy className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
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
