
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Home, 
  Zap,
  ShieldCheck,
  Trophy,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { UATGameProvider } from "@/app/context/uat-game-context";

function UATScheduleContent() {
  const db = useFirestore();
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "games_UAT"), (snap) => {
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [db]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT SCHEDULE</h1>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Isolated Environment</span>
            </div>
          </div>
        </div>
        <Link href="/uat">
          <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest">
            Back
          </Button>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black uppercase tracking-widest text-primary">Test Timeline</h2>
          </div>

          <div className="grid gap-4">
            {games.length === 0 ? (
              <Card className="bg-card/40 border-dashed border-white/10 p-12 text-center">
                <p className="text-sm font-black uppercase text-muted-foreground">No test games configured</p>
                <Link href="/admin_UAT">
                  <Button className="mt-4 bg-primary font-black uppercase tracking-widest text-[10px]">Add Games in Admin</Button>
                </Link>
              </Card>
            ) : (
              games.map((game) => (
                <Card key={game.id} className="bg-card/80 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] font-black uppercase">UAT GAME</Badge>
                        <h3 className="text-lg font-black uppercase">{game.away} vs {game.home}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {game.time || "TBD"}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {game.location || "Test Field"}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-8 w-8 text-white/10" />
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
