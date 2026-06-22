
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Trophy, 
  Users, 
  Mic2, 
  Play, 
  Plus, 
  Minus, 
  Activity, 
  Music,
  Volume2,
  Loader2,
  Music2,
  Zap,
  VolumeX,
  Target,
  ChevronRight,
  AlertCircle,
  Hash,
  Volume1,
  Volume,
  FileAudio,
  CheckCircle2,
  Mail,
  Table as TableIcon,
  ShieldCheck,
  Search,
  ArrowDownWideNarrow
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Types
interface Song {
  name: string;
  videoId: string;
  startAt: number;
}

interface Player {
  id: string;
  name: string;
  number: number;
  announcementAudioUrl: string;
  songs: Song[];
  stats: { ab: number; h: number; r: number; rbi: number };
}

const INITIAL_ROSTER: Player[] = [
  { 
    id: "2", 
    name: "Diomedes Plata", 
    number: 4, 
    announcementAudioUrl: "/audio/Diomedes.mp3",
    songs: [
      { name: "WE LA (EAST LA Remix)", videoId: "l-eMsVOTCY4", startAt: 80 },
      { name: "Level Up - Ciara", videoId: "Dh-ULbQmmF8", startAt: 0 },
      { name: "God's Plan - Drake", videoId: "xpVfcZ0ZcFM", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "1", 
    name: "Max Camargo", 
    number: 6, 
    announcementAudioUrl: "/audio/Max.mp3",
    songs: [
      { name: "Miss You (Bonus Track)", videoId: "2S5Ku0mVkzI", startAt: 0 },
      { name: "Thunder - Imagine Dragons", videoId: "fKopy74weus", startAt: 0 },
      { name: "Seven Nation Army", videoId: "0J2QdDbelmY", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "4", 
    name: "Alexa Franco", 
    number: 7, 
    announcementAudioUrl: "/audio/Alexa.mp3",
    songs: [
      { name: "BATTER UP", videoId: "olDWm2veCrM", startAt: 60 },
      { name: "Shake It Off - T-Swift", videoId: "nfWlot6h_JM", startAt: 0 },
      { name: "Girls Just Want To Have Fun", videoId: "PIb6AZdTr-A", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "6", 
    name: "Zeke Jacobo", 
    number: 8, 
    announcementAudioUrl: "/audio/Zeke.mp3",
    songs: [
      { name: "Under Control", videoId: "in8rYZQrwnw", startAt: 55 },
      { name: "Titanium - David Guetta", videoId: "JRfuAukYTKg", startAt: 0 },
      { name: "Levels - Avicii", videoId: "_ovdm2yX4MA", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "5", 
    name: "Camila Brooks", 
    number: 10, 
    announcementAudioUrl: "/audio/Camila.mp3",
    songs: [
      { name: "Not Like Us", videoId: "T6eK-2OQtew", startAt: 0 },
      { name: "California Love", videoId: "LRt6TdSvHag", startAt: 0 },
      { name: "HUMBLE. - Kendrick", videoId: "tvTRZJ-4EyI", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "9", 
    name: "Jacob Vieyra", 
    number: 11, 
    announcementAudioUrl: "/audio/Jacob.mp3",
    songs: [
      { name: "Tennessee Whiskey", videoId: "4zAThXFOy2c", startAt: 0 },
      { name: "Blow the Whistle", videoId: "W_dJPUWdB_A", startAt: 0 },
      { name: "Uprising", videoId: "Sk2Qd13GA7g", startAt: 107 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "7", 
    name: "Aldrich Munoz", 
    number: 11, 
    announcementAudioUrl: "/audio/Aldrich.mp3",
    songs: [
      { name: "MONTAGEM SUPERSONIC", videoId: "iI6Ypo8D-Pg", startAt: 0 },
      { name: "Sicko Mode - Travis Scott", videoId: "d-JBBNg8YKs", startAt: 0 },
      { name: "Superhero - Metro Boomin", videoId: "6XFpXidjKz8", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "3", 
    name: "Jimena Briones", 
    number: 12, 
    announcementAudioUrl: "/audio/Jimena.mp3",
    songs: [
      { name: "Watermelon Sugar", videoId: "KPM_BYl-EaQ", startAt: 0 },
      { name: "Flowers - Miley Cyrus", videoId: "G7KNmW9a75Y", startAt: 0 },
      { name: "Espresso - Sabrina Carpenter", videoId: "eVli-tstM5E", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
].sort((a, b) => a.number - b.number);

const ORGAN_HITS = [
  { name: "BULLFIGHTER", videoId: "melJslO0IJY" },
  { name: "JAWS", videoId: "QPwozG816lk" },
  { name: "LET'S GO TEAM", videoId: "kzTfu6LwbD8" },
  { name: "TAKE ME OUT", videoId: "QamKhi1cxIs" },
  { name: "THREE CHARGES", videoId: "jcylen-X1no" },
  { name: "CAVALRY CHARGE", videoId: "1aQ3nk-W0GI" },
];

const HYPE_SONGS = [
  { name: "HEY SONG", videoId: "EBohdltpVUY" },
  { name: "OOOOOOO SONG", videoId: "IqCwFuHqb0o" },
  { name: "CLAP YOUR HANDS", videoId: "eekVbkhY4kI" },
  { name: "START ME UP", videoId: "7JR10AThY8M" },
  { name: "TROPHIES", videoId: "vkSFh6HMUtQ" },
  { name: "BRING EM OUT", videoId: "vn7iMXF5R_4" },
];

export default function StadiumBoothDashboard() {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [activeTrackName, setActiveTrackName] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{id: string, title: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const sortedRoster = useMemo(() => 
    [...roster].sort((a, b) => a.number - b.number),
    [roster]
  );

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  const selectedSong = useMemo(() => {
    if (!activePlayer) return null;
    return activePlayer.songs[selectedSongIndex] || activePlayer.songs[0];
  }, [activePlayer, selectedSongIndex]);

  // Handle Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLocked(true);
        } catch (err) {
          console.warn("Wake lock failed", err);
        }
      }
    };
    requestWakeLock();
  }, []);

  // YouTube API initialization
  useEffect(() => {
    const onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new (window as any).YT.Player('stadium-yt-player', {
        height: '1',
        width: '1',
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            event.target.unMute();
            event.target.setVolume(volume * 100);
          },
          onError: (event: any) => {
            const errorCode = event.data;
            console.warn("YouTube Player Error Code:", errorCode);
            if (errorCode === 101 || errorCode === 150) {
              toast({
                variant: "destructive",
                title: "Playback Restricted",
                description: "This video owner does not allow embedding. Use a different version (like a Stadium Organ version).",
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

  // Update volume for both local and YT
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.stopVideo();
      } catch (e) {}
    }
    setActiveTrackName(null);
    setIsAnnouncing(false);
  };

  const restoreVolume = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (volume < 0.1) setVolume(0.8);
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
    restoreVolume();
    // Only stop music if we aren't currently "announcing" (to allow announcement overlay)
    // but in most soundboard cases, we want to clear the deck.
    if (!isAnnouncing) stopEverything();
    
    setActiveTrackName(songName);
    
    if (ytPlayerRef.current && playerReady) {
      try {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
        ytPlayerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: startAt
        });
        ytPlayerRef.current.playVideo();
      } catch (e) {
        console.warn("YouTube Load Failed", e);
      }
    }
  };

  const playLocalAnnouncement = (url: string, playerName: string) => {
    restoreVolume();
    stopEverything();
    setActiveTrackName(`Announcing: ${playerName}`);
    
    const audio = new Audio(url);
    audio.volume = volume;
    audioRef.current = audio;
    
    audio.play().catch(e => {
      console.warn("Local Announcement missing/blocked", e);
      // If intro fails, we should still allow the sequence to potentially continue
    });
    return audio;
  };

  const triggerWalkonSequence = async () => {
    if (!activePlayer || isAnnouncing || !selectedSong) return;
    
    stopEverything();
    setIsAnnouncing(true);
    
    const announcementUrl = activePlayer.announcementAudioUrl;
    const song = selectedSong;
    
    const audio = playLocalAnnouncement(announcementUrl, activePlayer.name);
    
    let handoffTriggered = false;
    const triggerMusic = () => {
      if (handoffTriggered) return;
      handoffTriggered = true;
      setIsAnnouncing(false);
      playYoutubeTrack(song.videoId, song.name, song.startAt);
    };

    audio.onended = triggerMusic;
    audio.onerror = () => {
      console.warn("Announcement file error, skipping to music");
      setTimeout(triggerMusic, 500);
    };

    // Safety timeout in case audio context hangs or file is missing
    setTimeout(() => {
      if (!handoffTriggered && isAnnouncing) triggerMusic();
    }, 6500);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    let videoId = searchQuery;
    if (searchQuery.includes("v=")) {
      videoId = searchQuery.split("v=")[1].split("&")[0];
    } else if (searchQuery.includes("youtu.be/")) {
      videoId = searchQuery.split("youtu.be/")[1].split("?")[0];
    }

    if (videoId.length === 11 && !videoId.includes(" ")) {
      playYoutubeTrack(videoId, "Custom Loaded Track");
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      setSearchResults([
        { id: "T6eK-2OQtew", title: "Not Like Us - Instrumental" },
        { id: "4zAThXFOy2c", title: "Tennessee Whiskey - Audio Only" },
        { id: "QamKhi1cxIs", title: "Take Me Out to the Ballgame" },
        { id: "melJslO0IJY", title: "Stadium Organ Charge" }
      ]);
      setIsSearching(false);
    }, 800);
  };

  const updateStat = (type: keyof Player['stats'], delta: number) => {
    if (!activePlayerId) return;
    setRoster((prev) =>
      prev.map((p) =>
        p.id === activePlayerId
          ? { ...p, stats: { ...p.stats, [type]: Math.max(0, p.stats[type] + delta) } }
          : p
      )
    );
  };

  const emailStats = () => {
    const scoreText = `STADIUM REPORT\nAway: ${awayScore} | Home: ${homeScore}\n\n`;
    const rosterStatsText = sortedRoster.map(p => 
      `${p.name} (#${p.number}): AB: ${p.stats.ab}, H: ${p.stats.h}, R: ${p.stats.r}, RBI: ${p.stats.rbi}`
    ).join('\n');
    const mailtoUrl = `mailto:?subject=Little League Game Report&body=${encodeURIComponent(scoreText + rosterStatsText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
        {/* COMMAND HEADER */}
        <header className="sticky top-0 z-50 flex flex-col gap-2 p-3 md:p-4 border-b border-border shadow-2xl bg-card/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto w-full relative">
            <div className="flex-none flex items-center gap-2">
              <Button 
                variant="outline" size="sm" 
                className="border-primary/30 text-primary font-black uppercase tracking-widest text-[8px] md:text-[10px] h-8 md:h-10 px-2"
                onClick={emailStats}
              >
                <Mail className="h-3 w-3 sm:mr-2" /> <span className="hidden sm:inline">Export Stats</span>
              </Button>
              {isWakeLocked && (
                <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <ShieldCheck className="h-3 w-3 text-green-500" />
                  <span className="text-[8px] font-black uppercase text-green-500 tracking-tighter">BOOTH ONLINE</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex justify-center items-center gap-6 md:gap-12">
              <div className="flex flex-col items-center bg-secondary/10 px-3 md:px-5 py-1 rounded-xl border border-secondary/20 shadow-inner min-w-[70px] md:min-w-[110px]">
                <span className="text-[7px] md:text-[9px] font-black tracking-widest text-secondary/70 uppercase mb-0.5">Away</span>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="icon" className="h-4 w-4 md:h-6 md:w-6 hover:bg-secondary/20" onClick={() => setAwayScore(Math.max(0, awayScore - 1))}><Minus className="h-2 w-2 md:h-3 md:w-3" /></Button>
                  <div className="w-5 md:w-8 text-center digit-font text-base md:text-2xl font-black text-secondary">{awayScore}</div>
                  <Button variant="ghost" size="icon" className="h-4 w-4 md:h-6 md:w-6 hover:bg-secondary/20" onClick={() => setAwayScore(awayScore + 1)}><Plus className="h-2 w-2 md:h-3 md:w-3" /></Button>
                </div>
              </div>

              <div className="flex flex-col items-center bg-primary/10 px-3 md:px-5 py-1 rounded-xl border border-primary/20 shadow-inner min-w-[70px] md:min-w-[110px]">
                <span className="text-[7px] md:text-[9px] font-black tracking-widest text-primary/70 uppercase mb-0.5">Home</span>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="icon" className="h-4 w-4 md:h-6 md:w-6 hover:bg-primary/20" onClick={() => setHomeScore(Math.max(0, homeScore - 1))}><Minus className="h-2 w-2 md:h-3 md:w-3" /></Button>
                  <div className="w-5 md:w-8 text-center digit-font text-base md:text-2xl font-black text-primary">{homeScore}</div>
                  <Button variant="ghost" size="icon" className="h-4 w-4 md:h-6 md:w-6 hover:bg-primary/20" onClick={() => setHomeScore(homeScore + 1)}><Plus className="h-2 w-2 md:h-3 md:w-3" /></Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFadeOut} className="font-black px-4 h-10 border-2 border-primary/20 text-[10px] uppercase shadow-lg">
                <ArrowDownWideNarrow className="mr-2 h-4 w-4" /> FADE OUT
              </Button>
              <Button variant="destructive" size="sm" onClick={stopEverything} className="font-black px-4 h-10 border-2 border-white/10 text-[10px] uppercase shadow-lg">
                <VolumeX className="mr-2 h-4 w-4" /> STOP ALL
              </Button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto w-full flex items-center gap-2 md:gap-6 bg-primary/5 p-2 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2">
              {volume === 0 ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-primary" />}
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Master Gain</span>
            </div>
            <Slider value={[volume * 100]} onValueChange={(vals) => setVolume(vals[0] / 100)} max={100} step={1} className="flex-1" />
            <Badge variant="outline" className="font-mono text-[10px] md:text-xs border-primary/30 text-primary w-10 text-center">{Math.round(volume * 100)}%</Badge>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-80 bg-card/40 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><h2 className="font-headline font-bold uppercase tracking-widest text-sm">Numerical Roster</h2></div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {sortedRoster.map((player) => (
                  <button 
                    key={player.id} 
                    onClick={() => setActivePlayerId(player.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                      activePlayerId === player.id ? "bg-primary border-primary" : "bg-background/40 border-white/5 hover:bg-white/5"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base leading-tight">{player.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black bg-black/20 px-1.5 py-0.5 rounded">#{player.number}</span>
                          <span className="text-[9px] font-bold uppercase text-white/60">HITS: {player.stats.h}</span>
                        </div>
                      </div>
                      {activePlayerId === player.id && <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          {/* DASHBOARD */}
          <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-8 bg-black/10">
            <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* PLAYER CONTROL */}
                <Card className="bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
                  <CardHeader className="pb-3 md:pb-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mic2 className="h-3 w-3 md:h-4 md:w-4" /> Walk-On Sequence
                      </CardTitle>
                      {activePlayer && <Badge variant="secondary" className="font-black text-[8px] md:text-[9px]">{activePlayer.name.toUpperCase()}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6 pt-4 md:pt-6">
                    <div className="space-y-2">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Active Batter</span>
                      <Select value={activePlayerId || ""} onValueChange={(val) => setActivePlayerId(val)}>
                        <SelectTrigger className="h-10 md:h-12 text-sm md:text-lg font-black bg-background/50 border-white/10">
                          <SelectValue placeholder="Select Batter..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedRoster.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="font-bold">#{p.number} - {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {activePlayer && (
                      <div className="space-y-3 p-3 md:p-4 bg-background/40 rounded-xl border border-white/5">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Setlist Selection</span>
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          {activePlayer.songs.map((song, idx) => (
                            <Button
                              key={idx} variant={selectedSongIndex === idx ? "default" : "outline"} size="sm"
                              onClick={() => setSelectedSongIndex(idx)}
                              className={cn(
                                "h-9 md:h-10 text-[8px] md:text-[9px] uppercase font-black px-1",
                                selectedSongIndex === idx ? "bg-secondary text-secondary-foreground" : "border-white/10"
                              )}
                            >
                              T{idx + 1}
                            </Button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1 text-[9px] md:text-[10px] font-bold text-secondary">
                          <Music2 className="h-3 w-3" /> <span className="truncate">{selectedSong?.name}</span>
                        </div>
                      </div>
                    )}
                    
                    <Button disabled={!activePlayer || isAnnouncing} onClick={triggerWalkonSequence} className="w-full h-14 md:h-16 text-sm md:text-base font-black bg-primary hover:bg-primary/90 shadow-[0_8px_16px_-4px_rgba(66,133,255,0.4)]">
                      {isAnnouncing ? <Activity className="animate-pulse mr-2" /> : <Zap className="mr-2 fill-white" />}
                      {isAnnouncing ? "STADIUM ANNOUNCING..." : "TRIGGER WALK-ON"}
                    </Button>
                  </CardContent>
                </Card>

                {/* GAME TRACKER */}
                <Card className="bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
                  <CardHeader className="pb-3 md:pb-4 border-b border-white/5 bg-white/5">
                    <CardTitle className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Target className="h-3 w-3 md:h-4 md:w-4" /> Live Game Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6">
                    {[
                      { key: "ab", label: "At Bats", color: "white" },
                      { key: "h", label: "Total Hits", color: "primary" },
                      { key: "r", label: "Runs Scored", color: "secondary" },
                      { key: "rbi", label: "RBI", color: "primary" }
                    ].map((stat) => (
                      <div key={stat.key} className="flex flex-col gap-1 md:gap-2 bg-background/50 p-2 md:p-3 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                          <span className={cn("text-xl md:text-2xl font-black digit-font", stat.color === 'primary' ? 'text-primary' : stat.color === 'secondary' ? 'text-secondary' : 'text-white')}>
                            {activePlayer ? (activePlayer.stats as any)[stat.key] : 0}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updateStat(stat.key as any, -1)} className="flex-1 h-8 md:h-9 border-white/5 hover:text-destructive"><Minus className="h-3 w-3" /></Button>
                          <Button disabled={!activePlayer} variant="outline" size="sm" onClick={() => updateStat(stat.key as any, 1)} className="flex-1 h-8 md:h-9 border-white/5 hover:text-primary"><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              {/* SOUNDBOARDS */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-3 md:py-4 border-b border-white/5">
                    <CardTitle className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                      <Music className="h-3 w-3 md:h-4 md:w-4 text-secondary" /> Organ Master
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 md:gap-3 pt-4 md:pt-5">
                    {ORGAN_HITS.map((hit) => (
                      <Button key={hit.name} variant="outline" onClick={() => playYoutubeTrack(hit.videoId, hit.name)} className="h-10 md:h-12 border-secondary/20 text-secondary hover:bg-secondary/20 font-black uppercase text-[9px]">🎹 {hit.name}</Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-3 md:py-4 border-b border-white/5">
                    <CardTitle className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                      <Play className="h-3 w-3 md:h-4 md:w-4 text-primary" /> Crowd Pump-Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 md:gap-3 pt-4 md:pt-5">
                    {HYPE_SONGS.map((song) => (
                      <Button key={song.name} variant="outline" onClick={() => playYoutubeTrack(song.videoId, song.name)} className="h-10 md:h-12 border-primary/20 text-primary hover:bg-primary/20 font-black uppercase text-[9px]">📣 {song.name}</Button>
                    ))}
                  </CardContent>
                </Card>

                {/* SEARCH */}
                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-3 md:py-4 border-b border-white/5">
                    <CardTitle className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                      <Search className="h-3 w-3 md:h-4 md:w-4 text-white" /> Stadium Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 md:pt-5 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <Input 
                        placeholder="Link or Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 text-xs bg-background/50 border-white/10"
                      />
                      <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </form>
                    <div className="space-y-2">
                      {searchResults.map((res) => (
                        <button 
                          key={res.id} 
                          onClick={() => playYoutubeTrack(res.id, res.title)}
                          className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Play className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-[10px] font-bold text-white/80 truncate uppercase tracking-wider">{res.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* QUICK ANNOUNCEMENTS */}
              <section className="space-y-3 md:space-y-4 pt-6 md:pt-10 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-primary">Batter Intro Quick-Tap</h2>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-1.5 md:gap-2">
                  {sortedRoster.map((player) => (
                    <Button 
                      key={player.id} variant="outline"
                      onClick={() => playLocalAnnouncement(player.announcementAudioUrl, player.name)}
                      className="flex flex-col h-11 md:h-12 gap-0.5 border-white/10 hover:border-primary/50 bg-card/60 px-1"
                    >
                      <span className="text-[7px] md:text-[8px] font-black leading-tight text-center">#{player.number} {player.name.split(' ')[0]}</span>
                      <FileAudio className="h-2 w-2 md:h-2.5 md:w-2.5 text-primary/60" />
                    </Button>
                  ))}
                </div>
              </section>

              {/* TABLE */}
              <section className="space-y-3 md:space-y-4 pt-6 md:pt-10 border-t border-white/10 pb-24">
                <div className="flex items-center gap-3">
                  <TableIcon className="h-4 w-4 md:h-5 md:w-5 text-secondary" />
                  <h2 className="text-sm md:text-base font-black uppercase tracking-widest text-secondary">Team Performance Summary</h2>
                </div>
                <Card className="bg-card/60 border-white/5 shadow-2xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="w-[40px] text-center font-black text-[8px] md:text-[10px]">#</TableHead>
                        <TableHead className="font-black text-[8px] md:text-[10px]">PLAYER</TableHead>
                        <TableHead className="text-center font-black text-[8px] md:text-[10px]">AB</TableHead>
                        <TableHead className="text-center font-black text-[8px] md:text-[10px]">HITS</TableHead>
                        <TableHead className="text-center font-black text-[8px] md:text-[10px]">RUNS</TableHead>
                        <TableHead className="text-center font-black text-[8px] md:text-[10px]">RBI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRoster.map((player) => (
                        <TableRow key={player.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="text-center digit-font font-bold text-muted-foreground text-[10px] md:text-sm">{player.number}</TableCell>
                          <TableCell className="font-bold text-[10px] md:text-sm">{player.name}</TableCell>
                          <TableCell className="text-center digit-font text-white text-[10px] md:text-sm">{player.stats.ab}</TableCell>
                          <TableCell className="text-center digit-font text-primary text-[10px] md:text-sm">{player.stats.h}</TableCell>
                          <TableCell className="text-center digit-font text-secondary text-[10px] md:text-sm">{player.stats.r}</TableCell>
                          <TableCell className="text-center digit-font text-primary text-[10px] md:text-sm">{player.stats.rbi}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </section>
            </div>
          </main>
        </div>

        {/* STATUS BAR */}
        <div className={cn(
          "fixed bottom-4 right-4 w-64 md:w-80 h-16 md:h-20 bg-card border border-primary/40 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-[100] transition-all duration-700 ease-in-out transform",
          activeTrackName ? "translate-y-0 opacity-100 scale-100" : "translate-y-32 opacity-0 scale-95"
        )}>
          <div className="absolute inset-0 flex items-center px-4 bg-background/95 backdrop-blur-xl border-t border-white/5">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-none flex gap-1 items-end h-4 w-6">
                 <div className="w-1 bg-primary animate-[bounce_0.6s_infinite] h-2 rounded-full" />
                 <div className="w-1 bg-primary animate-[bounce_0.8s_infinite] h-4 rounded-full" />
                 <div className="w-1 bg-primary animate-[bounce_0.5s_infinite] h-3 rounded-full" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 animate-pulse">Live Feed Active</p>
                <p className="text-[9px] font-bold text-white/70 truncate uppercase">{activeTrackName || "Standby..."}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive" onClick={stopEverything}>
                <VolumeX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* HIDDEN AUDIO BRIDGE - 1x1 to keep active context */}
        <div id="stadium-yt-player" className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden top-0 left-0"></div>
      </div>
    </TooltipProvider>
  );
}
