
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Users, 
  Activity, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  BarChart3, 
  Music2, 
  Zap, 
  ArrowDownWideNarrow, 
  Ban, 
  Home, 
  ShieldCheck 
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUATGame, StadiumSong, UATGameProvider } from "@/app/context/uat-game-context";
import { UATNavbar } from "@/components/UATNavbar";
import { useFirestore, useAuth } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Soundboard } from "@/components/Soundboard";

function UATBoothContent() {
  const db = useFirestore();
  const auth = useAuth();
  const { 
    roster, 
    organSongs, 
    pumpUpSongs, 
    isAdmin,
    userTeamId,
    selectedGameId,
    userRole,
    teamData
  } = useUATGame();
  
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [playbackPhase, setPlaybackPhase] = useState<'idle' | 'announcing' | 'walkup'>('idle');
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentAnnouncementUrl, setCurrentAnnouncementUrl] = useState<string | null>(null);
  
  const announcementAudioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  const selectedSong = useMemo(() => {
    if (!activePlayer || selectedSongIndex === -1) return null;
    return activePlayer.songs[selectedSongIndex] || activePlayer.songs[0];
  }, [activePlayer, selectedSongIndex]);

  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player('uat-stadium-yt-player', {
        height: '200', width: '200',
        playerVars: { autoplay: 1, controls: 0, enablejsapi: 1, playsinline: 1 },
        events: {
          onReady: (event: any) => { setPlayerReady(true); event.target.setVolume(volume * 100); },
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

  const logTrigger = async (category: string, audioId: string, playerId?: string) => {
    if (!userTeamId || !auth.currentUser) return;
    try {
      addDoc(collection(db, "analytics_UAT"), {
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
  };

  const stopEverything = useCallback(() => {
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (announcementAudioRef.current) { announcementAudioRef.current.pause(); announcementAudioRef.current.currentTime = 0; }
    setCurrentAnnouncementUrl(null);
    if (ytPlayerRef.current && playerReady) { try { ytPlayerRef.current.stopVideo(); } catch (e) {} }
    setActiveTrackName(null);
    setPlaybackPhase('idle');
  }, [playerReady]);

  const handleFadeOut = () => {
    if (fadeIntervalRef.current) return;
    const duration = 3000; const interval = 50; const steps = duration / interval; const volumeStep = volume / steps;
    fadeIntervalRef.current = setInterval(() => {
      setVolume((prev) => {
        const next = prev - volumeStep;
        if (next <= 0.01) { stopEverything(); return 0; }
        return next;
      });
    }, interval);
  };

  const playYoutubeTrack = (videoId: string, songName: string, startAt: number = 0, category: string = "Hype") => {
    stopEverything(); setVolume(0.8); setActiveTrackName(songName);
    logTrigger(category, videoId);
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.unMute(); ytPlayerRef.current.setVolume(80);
        ytPlayerRef.current.loadVideoById({ videoId, startSeconds: startAt });
      } catch (e) {}
    }
  };

  const triggerWalkonSequence = () => {
    if (!activePlayer) return;
    stopEverything(); setVolume(0.8); setPlaybackPhase('announcing');
    setActiveTrackName(selectedSongIndex === -1 ? "UAT Announcement ONLY" : `Announcing: ${activePlayer.name}`);
    setCurrentAnnouncementUrl(activePlayer.announcementAudioUrl);
    logTrigger("Walk-up", activePlayer.announcementAudioUrl || "voice", activePlayer.id);
  };

  const handleAnnouncementEnded = () => {
    if (playbackPhase === 'announcing' && activePlayer && selectedSongIndex !== -1 && selectedSong) {
      setPlaybackPhase('walkup'); setActiveTrackName(selectedSong.name);
      if (ytPlayerRef.current && playerReady) {
        try {
          ytPlayerRef.current.loadVideoById({ videoId: selectedSong.videoId, startSeconds: selectedSong.startAt });
        } catch (e) {}
      }
    } else {
      setPlaybackPhase('idle'); setActiveTrackName(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
        {currentAnnouncementUrl && (
          <audio ref={announcementAudioRef} src={currentAnnouncementUrl} autoPlay onEnded={handleAnnouncementEnded} className="hidden" />
        )}

        <header className="sticky top-0 z-50 flex flex-col p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md gap-4">
          <div className="flex items-center justify-between w-full relative gap-2">
            <div className="flex items-center gap-3 shrink-0">
              {teamData?.logoUrl ? (
                <div className="relative w-8 h-8 md:w-10 md:h-10">
                  <Image src={teamData.logoUrl} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">
                  {teamData?.name ? `${teamData.name} BOOTH` : "UAT BOOTH"}
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                    <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Ops Mode: {userRole?.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex justify-center">
              {activeTrackName && (
                <Badge variant="secondary" className="font-black text-[9px] md:text-xs uppercase tracking-widest px-3 py-1">
                  <Activity className="h-3 w-3 mr-2 animate-pulse text-primary" /> {activeTrackName}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <UATNavbar />
            </div>
          </div>

          <div className="w-full flex items-center gap-2 md:gap-4 bg-primary/5 p-1.5 md:p-2 rounded-lg border border-primary/10">
            <Slider value={[volume * 100]} onValueChange={(vals) => setVolume(vals[0] / 100)} max={100} className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleFadeOut} className="h-8 md:h-9 border-primary/20 text-primary px-4 font-black text-[9px] uppercase">FADE</Button>
            <Button variant="outline" size="sm" onClick={stopEverything} className="h-8 md:h-9 border-destructive/20 text-destructive px-4 font-black text-[9px] uppercase">STOP</Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 bg-card/40 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {roster.map((player) => (
                  <button key={player.id} onClick={() => { setActivePlayerId(player.id); setSelectedSongIndex(0); }} className={cn("w-full text-left p-4 rounded-xl border transition-all", activePlayerId === player.id ? "bg-primary border-primary" : "bg-background/40 border-white/5")}>
                    <h3 className="font-bold text-base">#{player.number} - {player.name}</h3>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-8 bg-black/10">
            <div className="max-w-5xl mx-auto w-full space-y-8 pb-40">
              
              <Card className="bg-card/80 border-2 border-white/5 shadow-2xl">
                <CardHeader><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">UAT Walk-On Sequence</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <Select value={activePlayerId || ""} onValueChange={(val) => { setActivePlayerId(val); setSelectedSongIndex(0); }}>
                    <SelectTrigger className="h-12 text-lg font-black bg-background/50"><SelectValue placeholder="Select Batter..." /></SelectTrigger>
                    <SelectContent>{roster.map((p) => <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>)}</SelectContent>
                  </Select>

                  {activePlayer && (
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant={selectedSongIndex === -1 ? "default" : "outline"} onClick={() => setSelectedSongIndex(-1)} className="h-10 text-[9px] font-black uppercase">NO TRACK</Button>
                      {activePlayer.songs.map((_, idx) => (
                        <Button key={idx} variant={selectedSongIndex === idx ? "default" : "outline"} onClick={() => setSelectedSongIndex(idx)} className="h-10 text-[9px] font-black uppercase">Track #{idx + 1}</Button>
                      ))}
                    </div>
                  )}
                  
                  <Button disabled={!activePlayer || playbackPhase === 'announcing'} onClick={triggerWalkonSequence} className="w-full h-16 text-base font-black bg-primary">
                    {playbackPhase === 'announcing' ? <Activity className="animate-pulse mr-2" /> : <Zap className="mr-2 fill-white" />}
                    {playbackPhase === 'announcing' ? "STADIUM ANNOUNCING..." : "TRIGGER UAT WALK-ON"}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                  <Soundboard />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-card/80 border-white/10">
                  <CardHeader><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">🎹 UAT Organ Master</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {organSongs.map((hit) => (
                      <Button key={hit.id} variant="outline" onClick={() => playYoutubeTrack(hit.link, hit.title, hit.startTime, "Game-Event")} className="w-full h-12 text-[8px] font-black uppercase text-left justify-start">🎹 {hit.title}</Button>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-white/10">
                  <CardHeader><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">📣 UAT Pump-Up</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {pumpUpSongs.map((song) => (
                      <Button key={song.id} variant="outline" onClick={() => playYoutubeTrack(song.link, song.title, song.startTime, "Hype")} className="w-full h-12 text-[8px] font-black uppercase text-left justify-start">📣 {song.title}</Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
        <div id="uat-stadium-yt-player" className="fixed -bottom-40 -right-40 opacity-0 pointer-events-none"></div>
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
