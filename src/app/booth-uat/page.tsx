"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Users, 
  Activity, 
  Volume2,
  VolumeX,
  ChevronRight,
  Music2,
  Zap,
  ShieldCheck,
  Lock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  TooltipProvider, 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUATGame, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore, useAuth } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function UATBoothContent() {
  const { 
    roster, 
    organSongs, 
    pumpUpSongs, 
    userRole,
    userTeamId,
    isLoaded,
    teamBranding,
    selectedGameId
  } = useUATGame();
  
  const db = useFirestore();
  const auth = useAuth();
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [playbackPhase, setPlaybackPhase] = useState<'idle' | 'announcing' | 'walkup'>('idle');
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [playerReady, setPlayerReady] = useState(false);
  
  const ytPlayerRef = useRef<any>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const isReadOnly = userRole === "user";

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  const selectedSong = useMemo(() => {
    if (!activePlayer || selectedSongIndex === -1) return null;
    return activePlayer.songs[selectedSongIndex] || activePlayer.songs[0];
  }, [activePlayer, selectedSongIndex]);

  const logAudioTrigger = useCallback(async (audioId: string, category: string, playerId?: string) => {
    if (!db || !userTeamId || !auth.currentUser) return;
    try {
      await addDoc(collection(db, "analytics_UAT"), {
        timestamp: serverTimestamp(),
        teamId: userTeamId,
        gameId: selectedGameId,
        playerId: playerId || null,
        audioId: audioId,
        category: category,
        triggeredBy: auth.currentUser.uid
      });
    } catch (e) {
      console.error("Analytics log failed", e);
    }
  }, [db, userTeamId, auth.currentUser, selectedGameId]);

  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player('stadium-yt-player-uat', {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 1,
          controls: 0,
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            event.target.unMute();
            event.target.setVolume(volume * 100);
          }
        }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else if ((window as any).YT.Player) {
      onYouTubeIframeAPIReady();
    }
  }, [volume]);

  const stopEverything = useCallback(() => {
    if (isReadOnly) return;
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (ytPlayerRef.current && playerReady) { 
      try { ytPlayerRef.current.stopVideo(); } catch (e) {} 
    }
    setActiveTrackName(null);
    setPlaybackPhase('idle');
  }, [playerReady, isReadOnly]);

  const playYoutubeTrack = (videoId: string, songName: string, category: string, startAt: number = 0) => {
    if (isReadOnly) {
      toast({ variant: "destructive", title: "Access Denied", description: "Read-only accounts cannot trigger audio." });
      return;
    }
    stopEverything();
    setVolume(0.8);
    setActiveTrackName(songName);
    logAudioTrigger(videoId, category);
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(80);
        ytPlayerRef.current.loadVideoById({ videoId, startSeconds: startAt });
        ytPlayerRef.current.playVideo();
      } catch (e) {}
    }
  };

  const triggerWalkonSequence = () => {
    if (isReadOnly) {
      toast({ variant: "destructive", title: "Access Denied", description: "Read-only accounts cannot trigger audio." });
      return;
    }
    if (!activePlayer) return;
    stopEverything();
    
    setPlaybackPhase('walkup');
    if (selectedSong) {
      setActiveTrackName(selectedSong.name);
      logAudioTrigger(selectedSong.videoId, "Walk-up", activePlayer.id);
      if (ytPlayerRef.current && playerReady) {
        ytPlayerRef.current.loadVideoById({ 
          videoId: selectedSong.videoId, 
          startSeconds: selectedSong.startAt 
        });
      }
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
        <header className="sticky top-0 z-50 flex flex-col p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md gap-4">
          <div className="flex items-center justify-between w-full relative gap-2">
            <div className="flex flex-col shrink-0">
              <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">UAT BOOTH</h1>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-[var(--tenant-primary)]" />
                <span className="text-[8px] font-black uppercase text-[var(--tenant-primary)] tracking-tighter">
                  Role: {userRole.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 md:gap-8 flex-1">
              {activeTrackName ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                  <Badge variant="secondary" className="font-black text-[9px] md:text-xs uppercase tracking-widest px-3 py-1">
                    <Activity className="h-3 w-3 mr-2 animate-pulse text-[var(--tenant-primary)]" />
                    {activeTrackName}
                  </Badge>
                </div>
              ) : (
                <UATNavbar />
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-3 shrink-0">
              <Link href="/admin-uat">
                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-[var(--tenant-primary)]">
                  <Lock className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full flex items-center gap-2 md:gap-4 bg-[var(--tenant-primary)]/5 p-1.5 md:p-2 rounded-lg border border-[var(--tenant-primary)]/10">
            <div className="flex items-center gap-2 min-w-max">
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />}
            </div>
            <Slider 
              disabled={isReadOnly}
              value={[volume * 100]} 
              onValueChange={(vals) => setVolume(vals[0] / 100)} 
              max={100} 
              step={1} 
              className="flex-1" 
            />
            <div className="flex items-center gap-1 ml-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopEverything} 
                disabled={isReadOnly}
                className="h-8 md:h-9 border-destructive/20 text-destructive px-2 md:px-4 font-black text-[9px] uppercase"
              >
                STOP
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 bg-card/40 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3"><Users className="h-5 w-5 text-[var(--tenant-primary)]" /><h2 className="font-headline font-bold uppercase tracking-widest text-sm">Test Roster</h2></div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {roster.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Roster Empty</p>
                    <Link href="/admin-uat">
                      <Button variant="link" className="text-[10px] text-[var(--tenant-primary)] p-0 h-auto mt-2">Add Test Players</Button>
                    </Link>
                  </div>
                ) : (
                  roster.map((player) => (
                    <button 
                      key={player.id} 
                      onClick={() => { setActivePlayerId(player.id); setSelectedSongIndex(0); }}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-200",
                        activePlayerId === player.id ? "bg-[var(--tenant-primary)] border-[var(--tenant-primary)]" : "bg-background/40 border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-base leading-tight">{player.name}</h3>
                          <span className="text-[10px] font-black bg-black/20 px-1.5 py-0.5 rounded">#{player.number}</span>
                        </div>
                        {activePlayerId === player.id && <ChevronRight className="h-5 w-5" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </aside>

          <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-8 bg-black/10">
            <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-8 pb-40">
              {isReadOnly && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Dashboard in View-Only Mode</span>
                </div>
              )}
              
              <section className="flex justify-center">
                <Card className="w-full md:max-w-2xl bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
                  <CardHeader className="pb-3 md:pb-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">Walk-On Sequence (UAT)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6 pt-4 md:pt-6">
                    <Select value={activePlayerId || ""} onValueChange={(val) => { setActivePlayerId(val); setSelectedSongIndex(0); }}>
                      <SelectTrigger className="h-10 md:h-12 text-sm md:text-lg font-black bg-background/50 border-white/10">
                        <SelectValue placeholder="Select Batter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roster.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      disabled={!activePlayer || isReadOnly} 
                      onClick={triggerWalkonSequence} 
                      className="w-full h-14 md:h-16 text-sm md:text-base font-black bg-[var(--tenant-primary)]"
                    >
                      <Zap className="mr-2 fill-white" /> TRIGGER WALK-ON
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <Card className="bg-card/80 border-white/10">
                  <CardHeader className="py-3 border-b border-white/5">
                    <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">🎹 Organ Master (UAT)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pt-4">
                    {organSongs.length === 0 && <p className="col-span-2 text-center text-[8px] opacity-40 py-4 uppercase font-black">No tracks configured</p>}
                    {organSongs.map((song) => (
                      <Button 
                        key={song.id}
                        variant="outline" 
                        disabled={isReadOnly}
                        onClick={() => playYoutubeTrack(song.link, song.title, "Organ", song.startTime)} 
                        className="w-full h-12 border-[var(--tenant-secondary)]/20 font-black uppercase text-[8px] justify-start px-3"
                      >
                        🎹 {song.title}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-white/10">
                  <CardHeader className="py-3 border-b border-white/5">
                    <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">📣 Crowd Pump-Up (UAT)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pt-4">
                    {pumpUpSongs.length === 0 && <p className="col-span-2 text-center text-[8px] opacity-40 py-4 uppercase font-black">No tracks configured</p>}
                    {pumpUpSongs.map((song) => (
                      <Button 
                        key={song.id}
                        variant="outline" 
                        disabled={isReadOnly}
                        onClick={() => playYoutubeTrack(song.link, song.title, "Hype", song.startTime)} 
                        className="w-full h-12 border-[var(--tenant-secondary)]/20 font-black uppercase text-[8px] justify-start px-3"
                      >
                        📣 {song.title}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          </main>
        </div>
        <div id="stadium-yt-player-uat" className="fixed -bottom-40 -right-40 opacity-0 pointer-events-none w-40 h-40 overflow-hidden"></div>
      </div>
    </TooltipProvider>
  );
}

export default function UATBoothDashboard() {
  return (
    <UATGameProvider>
      <UATBoothContent />
    </UATGameProvider>
  );
}