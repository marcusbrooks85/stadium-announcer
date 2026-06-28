
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  Mic2, 
  Play, 
  Activity, 
  Music,
  Volume2,
  Loader2,
  Music2,
  Zap,
  VolumeX,
  ChevronRight,
  FileAudio,
  Search,
  ArrowDownWideNarrow,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useGame } from "./context/game-context";
import { InstallButton } from "@/components/InstallButton";
import { AdminPanel } from "@/components/AdminPanel";

const ORGAN_HITS = [
  { name: "BULLFIGHTER", videoId: "melJslO0IJY" },
  { name: "JAWS", videoId: "QPwozG816lk" },
  { name: "LET'S GO TEAM", videoId: "kzTfu6LwbD8" },
  { name: "TAKE ME OUT", videoId: "QamKhi1cxIs" },
  { name: "THREE CHARGES", videoId: "jcylen-X1no" },
  { name: "CAVALRY CHARGE", videoId: "1aQ3nk-W0GI" },
];

const HYPE_SONGS = [
  { name: "DODGERS", videoId: "4KwFuGtGU6c", startAt: 10 },
  { name: "ROCK YOU", videoId: "TXGbhniTBrU" },
  { name: "PUMP IT", videoId: "fSvPktHcxtg" },
  { name: "DANCE NOW", videoId: "l5Zox5O3jh4" },
  { name: "CAN'T STOP", videoId: "0Ui-QzihJGo" },
  { name: "PASSO BEM", videoId: "KgayxOF4Y7E" },
  { name: "HEY SONG", videoId: "EBohdltpVUY" },
  { name: "OOOOOOO SONG", videoId: "IqCwFuHqb0o" },
  { name: "CLAP YOUR HANDS", videoId: "eekVbkhY4kI" },
  { name: "START ME UP", videoId: "7JR10AThY8M" },
  { name: "TROPHIES", videoId: "vkSFh6HMUtQ" },
  { name: "BRING EM OUT", videoId: "vn7iMXF5R_4" },
];

export default function StadiumBoothDashboard() {
  const { roster } = useGame();
  
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [playbackPhase, setPlaybackPhase] = useState<'idle' | 'announcing' | 'walkup'>('idle');
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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
    if (!activePlayer) return null;
    return activePlayer.songs[selectedSongIndex] || activePlayer.songs[0];
  }, [activePlayer, selectedSongIndex]);

  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player('stadium-yt-player', {
        height: '200',
        width: '200',
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 1,
          controls: 0,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            event.target.unMute();
            event.target.setVolume(volume * 100);
          },
          onError: (event: any) => {
            const errorCode = event.data;
            if (errorCode === 101 || errorCode === 150) {
              toast({
                variant: "destructive",
                title: "Playback Restricted",
                description: "The owner of this track has restricted embedding. Try a Topic or Lyric version.",
              });
            }
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
  }, [toast, volume]);

  useEffect(() => {
    if (announcementAudioRef.current) announcementAudioRef.current.volume = volume;
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }
  }, [volume, playerReady]);

  const stopEverything = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (announcementAudioRef.current) {
      announcementAudioRef.current.pause();
    }
    setCurrentAnnouncementUrl(null);
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.stopVideo();
      } catch (e) {}
    }
    setActiveTrackName(null);
    setPlaybackPhase('idle');
  };

  const handleFadeOut = () => {
    if (fadeIntervalRef.current) return;
    const duration = 3000;
    const interval = 50;
    const steps = duration / interval;
    const volumeStep = volume / steps;

    fadeIntervalRef.current = setInterval(() => {
      setVolume((prev) => {
        const next = prev - volumeStep;
        if (next <= 0.01) {
          stopEverything();
          return 0;
        }
        return next;
      });
    }, interval);
  };

  const playYoutubeTrack = (videoId: string, songName: string, startAt: number = 0) => {
    if (playbackPhase !== 'announcing') stopEverything();
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
    if (!activePlayer || playbackPhase === 'announcing' || !selectedSong) return;
    stopEverything();
    setVolume(0.8);
    setPlaybackPhase('announcing');
    setActiveTrackName(`Announcing: ${activePlayer.name}`);
    setCurrentAnnouncementUrl(activePlayer.announcementAudioUrl);
  };

  const handleAnnouncementEnded = () => {
    if (playbackPhase === 'announcing' && activePlayer && selectedSong) {
      setPlaybackPhase('walkup');
      playYoutubeTrack(selectedSong.videoId, selectedSong.name, selectedSong.startAt);
    } else {
      setPlaybackPhase('idle');
      setActiveTrackName(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
        {currentAnnouncementUrl && (
          <audio
            ref={announcementAudioRef}
            src={currentAnnouncementUrl}
            autoPlay
            onEnded={handleAnnouncementEnded}
            onError={() => handleAnnouncementEnded()}
            className="hidden"
          />
        )}

        <header className="sticky top-0 z-50 flex flex-col gap-2 p-2 md:p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full relative h-10 md:h-16 gap-2">
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <h1 className="font-headline font-black uppercase tracking-[0.2em] text-xs md:text-sm text-primary">ON DECK</h1>
              <InstallButton />
            </div>
            
            <div className="flex items-center justify-center gap-1.5 md:gap-8 flex-1">
               <Button variant="outline" size="sm" onClick={handleFadeOut} className="h-8 md:h-12 border-primary/20 text-primary px-3 md:px-8 font-black text-[9px] md:text-xs uppercase shadow-lg">
                 <ArrowDownWideNarrow className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" /> <span className="hidden xs:inline">FADE</span>
               </Button>
               <Button variant="destructive" size="sm" onClick={stopEverything} className="h-8 md:h-12 px-3 md:px-8 font-black text-[9px] md:text-xs uppercase shadow-lg">
                 <VolumeX className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" /> <span className="hidden xs:inline">STOP ALL</span>
               </Button>
            </div>

            <div className="flex items-center gap-1 md:gap-3 shrink-0">
              <Link href="/stats"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80"><BarChart3 className="h-4 w-4" /></Button></Link>
              <Link href="/schedule"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80"><Calendar className="h-4 w-4" /></Button></Link>
              <AdminPanel />
            </div>
          </div>

          <div className="max-w-7xl mx-auto w-full flex items-center gap-2 md:gap-6 bg-primary/5 p-1.5 md:p-2 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 min-w-max">
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5 text-primary" />}
            </div>
            <Slider value={[volume * 100]} onValueChange={(vals) => setVolume(vals[0] / 100)} max={100} step={1} className="flex-1" />
            <Badge variant="outline" className="font-mono text-[9px] md:text-xs border-primary/30 text-primary w-9 md:w-10 text-center px-1">{Math.round(volume * 100)}%</Badge>
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
                      activePlayerId === player.id ? "bg-primary border-primary" : "bg-background/40 border-white/5 hover:bg-white/5"
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
                      {activePlayer && <Badge variant="secondary" className="font-black text-[8px] md:text-[9px]">{activePlayer.name.toUpperCase()}</Badge>}
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
                      <div className="space-y-3 p-3 md:p-4 bg-background/40 rounded-xl border border-white/5">
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {activePlayer.songs.map((song, idx) => (
                            <Button
                              key={idx} variant={selectedSongIndex === idx ? "default" : "outline"} size="sm"
                              onClick={() => setSelectedSongIndex(idx)}
                              className={cn("h-9 md:h-10 text-[8px] md:text-[9px] uppercase font-black", selectedSongIndex === idx && "bg-secondary text-secondary-foreground")}
                            >Track #{idx + 1}</Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-secondary truncate">
                          <Music2 className="h-3 w-3" /> {selectedSong?.name}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      disabled={!activePlayer || playbackPhase === 'announcing'} 
                      onClick={triggerWalkonSequence} 
                      className="w-full h-14 md:h-16 text-sm md:text-base font-black bg-primary"
                    >
                      {playbackPhase === 'announcing' ? <Activity className="animate-pulse mr-2" /> : <Zap className="mr-2 fill-white" />}
                      {playbackPhase === 'announcing' ? "STADIUM ANNOUNCING..." : "TRIGGER WALK-ON"}
                    </Button>
                  </CardContent>
                </Card>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                <Card className="bg-card/80 border-white/10">
                  <CardHeader className="py-3 border-b border-white/5"><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">🎹 Organ Master</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pt-4">
                    {ORGAN_HITS.map((hit) => (
                      <Button key={hit.name} variant="outline" onClick={() => playYoutubeTrack(hit.videoId, hit.name)} className="h-10 border-secondary/20 text-secondary font-black uppercase text-[9px]">🎹 {hit.name}</Button>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-white/10">
                  <CardHeader className="py-3 border-b border-white/5"><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">📣 Crowd Pump-Up</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pt-4">
                    {HYPE_SONGS.map((song) => (
                      <Button 
                        key={song.name} 
                        variant="outline" 
                        onClick={() => playYoutubeTrack(song.videoId, song.name, (song as any).startAt || 0)} 
                        className="h-10 border-primary/20 text-primary font-black uppercase text-[9px]"
                      >
                        📣 {song.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-card/80 border-white/10">
                   <CardHeader className="py-3 border-b border-white/5"><CardTitle className="text-[9px] font-black uppercase tracking-[0.3em]">Search Tracks</CardTitle></CardHeader>
                   <CardContent className="pt-4 space-y-2">
                     <Input placeholder="URL or Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 text-xs" />
                     <Button onClick={() => playYoutubeTrack(searchQuery, "Custom")} className="w-full h-10">Play Now</Button>
                   </CardContent>
                </Card>
              </section>
            </div>
          </main>
        </div>

        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50">
          <div className="flex items-center justify-center gap-3 bg-card/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
            <Link href="/stats" className="flex-1"><div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/5 text-secondary"><BarChart3 className="h-4 w-4" /><span className="text-[10px] font-black uppercase">Stats</span></div></Link>
            <Link href="/schedule" className="flex-1"><div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/5 text-secondary"><Calendar className="h-4 w-4" /><span className="text-[10px] font-black uppercase">Schedule</span></div></Link>
          </div>
        </footer>

        <div className={cn(
          "fixed bottom-24 left-4 w-64 md:w-80 h-16 md:h-20 bg-card border border-primary/40 rounded-2xl z-[100] transition-all",
          activeTrackName ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"
        )}>
          <div className="absolute inset-0 flex items-center px-4 bg-background/95 backdrop-blur-xl border-t border-white/5">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 animate-pulse">Live Feed Active</p>
                <p className="text-[9px] font-bold text-white/70 truncate uppercase">{activeTrackName || "Standby..."}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={stopEverything}><VolumeX className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Hidden but non-zero sized YouTube Player to satisfy embedding requirements */}
        <div id="stadium-yt-player" className="fixed -bottom-40 -right-40 opacity-0 pointer-events-none w-40 h-40 overflow-hidden"></div>
      </div>
    </TooltipProvider>
  );
}
