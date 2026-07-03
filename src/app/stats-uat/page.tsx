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
  Music,
  FileDown,
  ClipboardList,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UATGameProvider, useUATGame } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore } from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function UATStatsContent() {
  const db = useFirestore();
  const { toast } = useToast();
  const { userTeamId, isLoaded, roster, userRole, selectedGameId } = useUATGame();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [indexBuilding, setIndexBuilding] = useState(false);
  
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledReport, setCompiledReport] = useState<any>(null);

  const isAdmin = userRole === "super_admin" || userRole === "league_admin";

  useEffect(() => {
    if (!db || !userTeamId) return;

    // Primary query for interactive logs
    const q = query(
      collection(db, "analytics_UAT"),
      where("teamId", "==", userTeamId),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, 
      (snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAnalyticsLoading(false);
        setIndexBuilding(false);
      },
      (error: any) => {
        // Handle missing or building index
        if (error.code === 'failed-precondition') {
          console.warn("Firestore Index Building: Falling back to un-ordered query.");
          setIndexBuilding(true);
          
          // Fallback: Fetch without orderby and sort in memory
          const fallbackQ = query(
            collection(db, "analytics_UAT"),
            where("teamId", "==", userTeamId),
            limit(50)
          );
          
          getDocs(fallbackQ).then((snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort in memory by timestamp
            data.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setLogs(data.slice(0, 20));
            setAnalyticsLoading(false);
          }).catch(() => {
            setAnalyticsLoading(false);
          });
        } else {
          console.error("Analytics stream error", error);
          setAnalyticsLoading(false);
        }
      }
    );

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

  const handleCompileReport = async () => {
    if (!db || !userTeamId || !selectedGameId) return;
    
    setIsCompiling(true);
    try {
      const gameDoc = await getDoc(doc(db, "games_UAT", selectedGameId));
      const gameData = gameDoc.exists() ? gameDoc.data() : { away: "Unknown", home: "Unknown", date: "N/A" };

      const q = query(
        collection(db, "analytics_UAT"),
        where("teamId", "==", userTeamId),
        where("gameId", "==", selectedGameId)
      );
      
      const snap = await getDocs(q);
      let allEvents = snap.docs.map(d => {
        const data = d.data();
        const player = roster.find(p => p.id === data.playerId);
        return {
          ...data,
          playerName: player ? player.name : "N/A",
          timeStr: data.timestamp?.toDate().toLocaleString() || "N/A",
          sortTime: data.timestamp?.seconds || 0
        };
      });

      // Manual sort for report accuracy in case index is missing
      allEvents.sort((a, b) => a.sortTime - b.sortTime);

      const aggregated = {
        game: gameData,
        totalEvents: allEvents.length,
        uniquePlayers: new Set(allEvents.filter(e => e.playerId).map(e => e.playerId)).size,
        events: allEvents,
        compiledAt: new Date().toLocaleString()
      };

      setCompiledReport(aggregated);
      toast({ title: "Report Compiled", description: `${allEvents.length} events analyzed for game.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Compilation Failed", description: e.message });
    } finally {
      setIsCompiling(false);
    }
  };

  const downloadCSV = () => {
    if (!compiledReport) return;

    const headers = ["Timestamp", "Category", "Audio ID", "Player Name", "Triggered By"];
    const rows = compiledReport.events.map((e: any) => [
      `"${e.timeStr}"`,
      `"${e.category}"`,
      `"${e.audioId}"`,
      `"${e.playerName}"`,
      `"${e.triggeredBy}"`
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const fileName = `game_report_${selectedGameId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Successful", description: `Report saved as ${fileName}` });
  };

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
        {indexBuilding && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">
              Workspace Optimization in Progress: Stats may take a moment to refresh.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3" /> Audio Session Triggers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[var(--tenant-primary)]">{stats.triggerCount}</div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Total interactive events (Current View)</p>
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
              {Object.keys(stats.categoryBreakdown).length === 0 && <p className="text-[8px] opacity-40 uppercase text-center py-2">No activity recorded</p>}
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

        {isAdmin && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-[var(--tenant-primary)]" />
                <h2 className="text-sm font-black uppercase tracking-widest">Administrative Reporting</h2>
              </div>
              <Button 
                onClick={handleCompileReport} 
                disabled={isCompiling || !selectedGameId}
                className="bg-[var(--tenant-primary)] text-white font-black uppercase text-[10px] px-6"
              >
                {isCompiling ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Calendar className="mr-2 h-3 w-3" />}
                Compile Game-Day Report
              </Button>
            </div>

            {compiledReport && (
              <Card className="bg-primary/5 border-[var(--tenant-primary)]/20 animate-in fade-in slide-in-from-top-4 duration-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-widest">
                        Compiled Report: {compiledReport.game.away} vs {compiledReport.game.home}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase">
                        Date: {compiledReport.game.date} • Compiled: {compiledReport.compiledAt}
                      </CardDescription>
                    </div>
                    <Button onClick={downloadCSV} variant="outline" size="sm" className="border-[var(--tenant-primary)]/30 text-[var(--tenant-primary)] font-black uppercase text-[10px]">
                      <FileDown className="h-3 w-3 mr-2" /> Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 border-t border-[var(--tenant-primary)]/10 pt-6">
                  <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Total Triggers</span>
                    <span className="text-2xl font-black text-white">{compiledReport.totalEvents}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Active Roster</span>
                    <span className="text-2xl font-black text-white">{compiledReport.uniquePlayers} Players</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-black/20 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</span>
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-black uppercase">Verified</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        )}

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
                        <ZapIcon className="h-4 w-4 text-[var(--tenant-primary)]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                          {log.category} Trigger: {log.audioId?.substring(0, 8)}...
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                          <User className="h-2 w-2" /> {log.triggeredBy?.substring(0, 6)} • {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : "Recent"}
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

function ZapIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.71 14 3v9.29L20 9.29 10 21V11.71L4 14.71Z" />
    </svg>
  )
}
