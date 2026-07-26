
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
  Users, 
  Play, 
  Activity, 
  Volume2,
  VolumeX,
  ChevronRight,
  Calendar,
  BarChart3,
  Music2,
  Zap,
  ArrowDownWideNarrow,
  Ban,
  Home,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  X,
  MessageSquare,
  ShieldCheck,
  Trophy
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
  Tooltip,
  TooltipContent,
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useGame } from "@/app/context/game-context";
import { AdminPanel } from "@/components/AdminPanel";
import { Soundboard } from "@/components/Soundboard";

export default function StadiumBoothDashboard() {
  const { 
    roster, 
    organSongs, 
    pumpUpSongs, 
    isAdmin 
  } = useGame();
  
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [playbackPhase, setPlaybackPhase] = useState<'idle' | 'announcing' | 'walkup'>('idle');
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [playerReady, setPlayerReady] = useState(false);
  
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
    const initYT = () => {
      if ((window as any).YT && (window as any).YT.Player && !ytPlayerRef.current) {
        ytPlayerRef.current = new (window as any).YT.Player('stadium-yt-player', {
          height: '200',
          width: '200',
          playerVars: {
            autoplay: 1,
            controls: 0,
            enablejsapi: 1,
            origin: window.location.origin,
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
      }
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initYT;
    } else if ((window as any).YT.Player) {
      initYT();
    }
  }, [volume]);

  useEffect(() => {
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }
  }, [volume, playerReady]);

  const stopEverything = useCallback(() => {
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (announcementAudioRef.current) {
      announcementAudioRef.current.pause();
      announcementAudioRef.current.currentTime = 0;
    }
    if (ytPlayerRef.current && playerReady) { 
      try { ytPlayerRef.current.stopVideo(); } catch (e) {} 
    }
    setActiveTrackName(null);
    setPlaybackPhase('idle');
  }, [playerReady]);

  const handleFadeOut = () => {
    if (fadeIntervalRef.current) return;
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    const volStep = volume / steps;
    let currentVol = volume;

    fadeIntervalRef.current = setInterval(() => {
      currentVol = Math.max(0, currentVol - volStep);
      setVolume(currentVol);
      
      if (ytPlayerRef.current && playerReady) {
        try {
          ytPlayerRef.current.setVolume(currentVol * 100);
        } catch (e) {}
      }

      if (currentVol <= 0.01) {
        stopEverything();
      }
    }, interval);
  };

  const playYoutubeTrack = (videoId: string, songName: string, startAt: number = 0) => {
    stopEverything();
    setVolume(0.8);
    setActiveTrackName(songName);
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
    if (!activePlayer) return;
    stopEverything();
    setVolume(0.8);
    setPlaybackPhase('announcing');
    setActiveTrackName(`Announcing: ${activePlayer.name}`);
    if (announcementAudioRef.current) {
      announcementAudioRef.current.src = activePlayer.announcementAudioUrl;
      announcementAudioRef.current.play().catch(e => console.error("Audio Play Error", e));
    }
  };

  const handleAnnouncementEnded = () => {
    if (playbackPhase === 'announcing' && activePlayer && selectedSongIndex !== -1 && selectedSong) {
      setPlaybackPhase('walkup');
      setActiveTrackName(selectedSong.name);
      if (ytPlayerRef.current && playerReady) {
        try {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(80);
          ytPlayerRef.current.loadVideoById({ 
            videoId: selectedSong.videoId, 
            startSeconds: selectedSong.startAt 
          });
          ytPlayerRef.current.playVideo();
        } catch (e) {}
      }
    } else {
      setPlaybackPhase('idle');
      setActiveTrackName(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
        <audio ref={announcementAudioRef} onEnded={handleAnnouncementEnded} className="hidden" />

        <header className="sticky top-0 z-50 flex flex-col p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md gap-4">
          <div className="flex items-center justify-between w-full relative gap-2">
            <div className="flex flex-col shrink-0">
              <h1 className="font-headline font-black uppercase tracking-[0.2em] text-[10px] md:text-sm">BOOTH ANNOUNCER</h1>
              {isAdmin && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  <span className="text-[8px] font-black uppercase text-primary tracking-tighter">Booth Operations Mode</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-1.5 md:gap-8 flex-1">
              {activeTrackName && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                  <Badge variant="secondary" className="font-black text-[9px] md:text-xs uppercase tracking-widest px-3 py-1">
                    <Activity className="h-3 w-3 mr-2 animate-pulse text-primary" />
                    {activeTrackName}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-3 shrink-0">
              <div className="flex items-center bg-black/20 rounded-full p-1 border border-white/5 mr-1 md:mr-2">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary">
                    <Home className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/booth">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-primary">
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
          </div>

          <div className="w-full flex items-center gap-2 md:gap-4 bg-primary/5 p-1.5 md:p-2 rounded-lg border border-primary/10">
            <Slider value={[volume * 100]} onValueChange={(vals) => setVolume(vals[0] / 100)} max={100} className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleFadeOut} className="h-8 md:h-9 border-primary/20 text-primary px-4 font-black text-[9px] uppercase tracking-widest">FADE</Button>
            <Button variant="outline" size="sm" onClick={stopEverything} className="h-8 md:h-9 border-destructive/20 text-destructive px-4 font-black text-[9px] uppercase tracking-widest">STOP</Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 bg-card/40 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><h2 className="font-headline font-bold uppercase tracking-widest text-sm">Roster</h2></div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {roster.map((player) => (
                  <button 
                    key={player.id} 
                    onClick={() => { setActivePlayerId(player.id); setSelectedSongIndex(0); }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200",
                      activePlayerId === player.id ? "bg-primary border-primary shadow-lg" : "bg-background/40 border-white/5 hover:bg-white/5"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base leading-tight">{player.name}</h3>
                        <span className="text-[10px] font-black bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-tighter">#{player.number}</span>
                      </div>
                      {activePlayerId === player.id && <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-8 bg-black/10">
            <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-8 pb-40">
              
              <section className="flex justify-center">
                <Card className="w-full md:max-w-2xl bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
                  <CardHeader className="pb-3 md:pb-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground">Walk-On Sequence</CardTitle>
                      {activePlayer && <Badge variant="secondary" className="font-black text-[8px] md:text-[9px] uppercase">{activePlayer.name}</Badge>}
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

                    {activePlayer && (
                      <div className="space-y-4 p-3 md:p-4 bg-background/40 rounded-xl border border-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
                          <Button
                            variant={selectedSongIndex === -1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSongIndex(-1)}
                            className={cn("h-9 md:h-12 text-[8px] md:text-[10px] uppercase font-black px-2", selectedSongIndex === -1 && "bg-secondary text-secondary-foreground")}
                          >
                            NO TRACK
                          </Button>
                          {[0, 1, 2].map((idx) => (
                            <Button
                              key={idx} 
                              variant={selectedSongIndex === idx ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setSelectedSongIndex(idx)}
                              disabled={!activePlayer.songs[idx]}
                              className={cn(
                                "h-9 md:h-12 text-[8px] md:text-[10px] uppercase font-black px-2", 
                                selectedSongIndex === idx && "bg-secondary text-secondary-foreground",
                                !activePlayer.songs[idx] && "opacity-30"
                              )}
                            >
                              Track {idx + 1}
                            </Button>
                          ))}
                        </div>
                        {selectedSong && (
                          <div className="text-center animate-in fade-in slide-in-from-top-1 duration-300">
                             <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                               Selected: <span className="text-white">{selectedSong.name}</span>
                             </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      disabled={!activePlayer || playbackPhase === 'announcing'} 
                      onClick={triggerWalkonSequence} 
                      className="w-full h-14 md:h-16 text-sm md:text-base font-black bg-primary tracking-widest shadow-xl shadow-primary/20"
                    >
                      {playbackPhase === 'announcing' ? <Activity className="animate-pulse mr-2" /> : <Zap className="mr-2 fill-white" />}
                      {playbackPhase === 'announcing' ? "STADIUM ANNOUNCING..." : "TRIGGER WALK-ON"}
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section className="flex justify-center">
                <div className="w-full md:max-w-2xl">
                  <Soundboard />
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-3 border-b border-white/5">
                    <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">🎹 Organ Master</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pt-4">
                    {organSongs.map((hit) => (
                      <Button key={hit.id} variant="outline" onClick={() => playYoutubeTrack(hit.link, hit.title, hit.startTime)} className="w-full h-12 border-secondary/20 font-black uppercase text-[8px] justify-start px-3 text-left overflow-hidden">
                        <span className="truncate">🎹 {hit.title}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-3 border-b border-white/5">
                    <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">📣 Crowd Pump-Up</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pt-4">
                    {pumpUpSongs.map((song) => (
                      <Button key={song.id} variant="outline" onClick={() => playYoutubeTrack(song.link, song.title, song.startTime)} className="w-full h-12 border-secondary/20 font-black uppercase text-[8px] justify-start px-3 text-left overflow-hidden">
                        <span className="truncate">📣 {song.title}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>
          </main>
        </div>
        <div id="stadium-yt-player" className="fixed -bottom-40 -right-40 opacity-0 pointer-events-none w-40 h-40 overflow-hidden"></div>
      </div>
    </TooltipProvider>
  );
}
