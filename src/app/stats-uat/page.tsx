"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  ShieldCheck, 
  Lock, 
  Loader2, 
  Activity, 
  TrendingUp, 
  Clock, 
  User, 
  Music
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UATGameProvider, useUATGame } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore } from "@/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

function UATStatsContent() {
  const db = useFirestore();
  const { userTeamId, isLoaded, roster } = useUATGame();
  const [logs, setLogs] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!db || !userTeamId) return;

    const q = query(
      collection(db, "analytics_UAT"),
      where("teamId", "==", userTeamId),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAnalyticsLoading(false);
    });

    return () => unsubscribe();
  }, [db, userTeamId]);

  const stats = useMemo(() => {
    const triggerCount = logs.length;
    const categoryBreakdown = logs.reduce((acc: any, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {});

    const playerLeaderboard = logs.reduce((acc: any, log) => {
      if (log.playerId) {
        acc[log.playerId] = (acc[log.playerId] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedLeaderboard = Object.entries(playerLeaderboard)
      .map(([id, count]) => {
        const player = roster.find(p => p.id === id);
        return { name: player?.name || "Unknown", count };
      })
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    return { triggerCount, categoryBreakdown, sortedLeaderboard };
  }, [logs, roster]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">GAME ANALYTICS</h1>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[var(--tenant-primary)]" />
            <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">Operational Intelligence</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <UATNavbar />
          <Link href="/admin-uat">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-[var(--tenant-primary)]">
              <Lock className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3" /> Audio Session Triggers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[var(--tenant-primary)]">{stats.triggerCount}</div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total interactive events (24h Window)</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(stats.categoryBreakdown).map(([cat, count]: any) => (
                <div key={cat} className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-tighter">{cat}</span>
                  <Badge variant="outline" className="text-[9px] font-bold border-white/10">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Music className="h-3 w-3" /> Top Hype Tracks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.sortedLeaderboard.map((item: any, i) => (
                <div key={i} className="flex justify-between items-center text-[9px] font-black uppercase">
                  <span>{item.name}</span>
                  <span className="text-[var(--tenant-secondary)]">{item.count} Plays</span>
                </div>
              ))}
              {stats.sortedLeaderboard.length === 0 && <p className="text-[8px] opacity-40 uppercase text-center py-2">No player data yet</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-white/5 h-[400px] flex flex-col">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <Clock className="h-4 w-4 text-[var(--tenant-primary)]" /> Live Operational Log
            </CardTitle>
            <CardDescription className="text-[9px] font-bold uppercase tracking-widest">Recent audio interactions in this workspace</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {analyticsLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : logs.length === 0 ? (
                <p className="text-center text-[10px] opacity-40 uppercase font-black py-20">No analytics data recorded yet</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-[var(--tenant-primary)]/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-[var(--tenant-primary)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                          {log.category} Trigger: {log.audioId.substring(0, 8)}...
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <User className="h-2 w-2" /> {log.triggeredBy.substring(0, 6)} • {log.timestamp?.toDate().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {log.playerId && (
                      <Badge variant="secondary" className="text-[8px] font-black uppercase px-2">
                        {roster.find(p => p.id === log.playerId)?.name || "Player Track"}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </main>
    </div>
  );
}

export default function UATStatsPage() {
  return (
    <UATGameProvider>
      <UATStatsContent />
    </UATGameProvider>
  );
}