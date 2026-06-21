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
  Hash
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
import { cn } from "@/lib/utils";
import { generateAnnouncerAudio } from "@/ai/flows/announcer-tts-flow";

/**
 * Roster Data with static scripts to eliminate AI text generation calls.
 * Track 1 updated with specific provided titles, YouTube IDs, and start times.
 */
const INITIAL_ROSTER = [
  { 
    id: "1", 
    name: "Max Camargo", 
    number: 6, 
    announcementScript: "NOW BATTING, NUMBER 6, MAX CAMARGO!",
    songs: [
      { name: "Miss You (Bonus Track)", videoId: "2S5Ku0mVkzI", startAt: 0 },
      { name: "Thunder - Imagine Dragons", videoId: "fKopy74weus", startAt: 0 },
      { name: "Seven Nation Army", videoId: "0J2QdDbelmY", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "2", 
    name: "Diomedes Plata", 
    number: 4, 
    announcementScript: "NOW BATTING, NUMBER 4, DIOMEDES PLATA!",
    songs: [
      { name: "WE LA (EAST LA Remix)", videoId: "l-eMsVOTCY4", startAt: 80 },
      { name: "Level Up - Ciara", videoId: "Dh-ULbQmmF8", startAt: 0 },
      { name: "God's Plan - Drake", videoId: "xpVfcZ0ZcFM", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "3", 
    name: "Jimena Briones", 
    number: 12, 
    announcementScript: "NOW BATTING, NUMBER 12, JIMENA BRIONES!",
    songs: [
      { name: "Watermelon Sugar", videoId: "KPM_BYl-EaQ", startAt: 0 },
      { name: "Flowers - Miley Cyrus", videoId: "G7KNmW9a75Y", startAt: 0 },
      { name: "Espresso - Sabrina Carpenter", videoId: "eVli-tstM5E", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "4", 
    name: "Alexa Franco", 
    number: 7, 
    announcementScript: "NOW BATTING, NUMBER 7, ALEXA FRANCO!",
    songs: [
      { name: "BATTER UP", videoId: "olDWm2veCrM", startAt: 58 },
      { name: "Shake It Off - T-Swift", videoId: "nfWlot6h_JM", startAt: 0 },
      { name: "Girls Just Want To Have Fun", videoId: "PIb6AZdTr-A", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "5", 
    name: "Camila Brooks", 
    number: 10, 
    announcementScript: "NOW BATTING, NUMBER 10, CAMILA BROOKS!",
    songs: [
      { name: "Not Like Us", videoId: "Xx1SrbxH1JU", startAt: 0 },
      { name: "California Love", videoId: "mwgZalAFNhM", startAt: 0 },
      { name: "HUMBLE. - Kendrick", videoId: "tvTRZJ-4EyI", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "6", 
    name: "Ezekiel Jacobo", 
    number: 8, 
    announcementScript: "NOW BATTING, NUMBER 8, EZEKIEL JACOBO!",
    songs: [
      { name: "Under Control", videoId: "in8rYZQrwnw", startAt: 55 },
      { name: "Titanium - David Guetta", videoId: "JRfuAukYTKg", startAt: 0 },
      { name: "Levels - Avicii", videoId: "_ovdm2yX4MA", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "7", 
    name: "Aldrich Munoz", 
    number: 11, 
    announcementScript: "NOW BATTING, NUMBER 11, ALDRICH MUNOZ!",
    songs: [
      { name: "MONTAGEM SUPERSONIC", videoId: "iI6Ypo8D-Pg", startAt: 0 },
      { name: "Sicko Mode - Travis Scott", videoId: "d-JBBNg8YKs", startAt: 0 },
      { name: "Superhero - Metro Boomin", videoId: "6XFpXidjKz8", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
];

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
  const [isStreamingAudio, setIsStreamingAudio] = useState(false);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePlayer = useMemo(() => 
    roster.find((p) => p.id === activePlayerId),
    [roster, activePlayerId]
  );

  const selectedSong = useMemo(() => {
    if (!activePlayer) return null;
    return activePlayer.songs[selectedSongIndex] || activePlayer.songs[0];
  }, [activePlayer, selectedSongIndex]);

  // Reset song selection when player changes
  useEffect(() => {
    setSelectedSongIndex(0);
  }, [activePlayerId]);

  const updateStat = (type: "ab" | "h" | "r" | "rbi", delta: number) => {
    if (!activePlayerId) return;
    setRoster((prev) =>
      prev.map((p) =>
        p.id === activePlayerId
          ? { ...p, stats: { ...p.stats, [type]: Math.max(0, p.stats[type] + delta) } }
          : p
      )
    );
  };

  const stopEverything = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setActiveAudioUrl(null);
    setIsAnnouncing(false);
    setIsStreamingAudio(false);
  };

  const playSoundboard = (videoId: string) => {
    stopEverything();
    // Use timeout to ensure the state transition is handled by React before remounting the iframe
    setTimeout(() => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const timestamp = Date.now();
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&enablejsapi=1&origin=${origin}&t=${timestamp}`;
      setActiveAudioUrl(embedUrl);
    }, 50);
  };

  const triggerSequence = async () => {
    if (!activePlayer || isAnnouncing || isStreamingAudio || !selectedSong) return;

    stopEverything();
    setIsStreamingAudio(true);

    try {
      // Use the archived script directly from the roster data
      const announcementText = activePlayer.announcementScript;

      const { media } = await generateAnnouncerAudio({
        text: announcementText,
        voice: "Algenib"
      });

      setIsStreamingAudio(false);
      setIsAnnouncing(true);

      const audio = new Audio(media);
      audioRef.current = audio;

      audio.onended = () => {
        setIsAnnouncing(false);
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const timestamp = Date.now();
        const embedUrl = `https://www.youtube.com/embed/${selectedSong.videoId}?autoplay=1&start=${selectedSong.startAt}&mute=0&rel=0&enablejsapi=1&origin=${origin}&t=${timestamp}`;
        setActiveAudioUrl(embedUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("Sequence failed", error);
      setIsStreamingAudio(false);
      setIsAnnouncing(false);
      // Fallback to song only
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const timestamp = Date.now();
      const embedUrl = `https://www.youtube.com/embed/${selectedSong.videoId}?autoplay=1&start=${selectedSong.startAt}&mute=0&rel=0&enablejsapi=1&origin=${origin}&t=${timestamp}`;
      setActiveAudioUrl(embedUrl);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground stadium-gradient overflow-hidden">
      {/* SCOREBOARD */}
      <header className="flex justify-center p-4 border-b border-border shadow-2xl relative z-20 bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-12 md:gap-24 bg-background/50 px-8 py-4 rounded-2xl border border-white/5 shadow-inner">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Away Team</span>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-9 w-9 border-white/10" onClick={() => setAwayScore(Math.max(0, awayScore - 1))}><Minus className="h-4 w-4" /></Button>
              <div className="w-20 text-center digit-font text-5xl font-black text-secondary drop-shadow-[0_0_10px_rgba(46,177,217,0.3)]">{awayScore.toString().padStart(2, "0")}</div>
              <Button variant="outline" size="icon" className="h-9 w-9 border-white/10" onClick={() => setAwayScore(awayScore + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Home Team</span>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-9 w-9 border-white/10" onClick={() => setHomeScore(Math.max(0, homeScore - 1))}><Minus className="h-4 w-4" /></Button>
              <div className="w-20 text-center digit-font text-5xl font-black text-primary drop-shadow-[0_0_10px_rgba(66,133,255,0.3)]">{homeScore.toString().padStart(2, "0")}</div>
              <Button variant="outline" size="icon" className="h-9 w-9 border-white/10" onClick={() => setHomeScore(homeScore + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* TEAM ROSTER */}
        <aside className="w-80 bg-card/40 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><h2 className="font-headline font-bold uppercase tracking-widest text-sm">Team Roster</h2></div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {roster.map((player) => (
                <button 
                  key={player.id} 
                  onClick={() => setActivePlayerId(player.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                    activePlayerId === player.id 
                      ? "bg-primary border-primary shadow-[0_8px_16px_rgba(66,133,255,0.2)]" 
                      : "bg-background/40 border-white/5 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h3 className="font-bold text-base leading-tight group-hover:translate-x-1 transition-transform">{player.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black bg-black/20 px-1.5 py-0.5 rounded">#{player.number}</span>
                        <span className="text-[9px] font-bold uppercase text-white/60">HITS: {player.stats.h} | RBI: {player.stats.rbi}</span>
                      </div>
                    </div>
                    {activePlayerId === player.id && <ChevronRight className="h-5 w-5 animate-pulse" />}
                  </div>
                  {activePlayerId === player.id && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN DASHBOARD */}
        <main className="flex-1 flex flex-col p-8 overflow-y-auto space-y-8 bg-black/10">
          <div className="max-w-5xl mx-auto w-full space-y-8">
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* BATTER CONTROL CARD */}
              <Card className="bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
                <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Mic2 className="h-4 w-4" /> Booth Operations
                    </CardTitle>
                    {activePlayer && <Badge variant="secondary" className="font-black text-[9px]">{activePlayer.name.toUpperCase()}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Current Batter</span>
                    <Select value={activePlayerId || ""} onValueChange={(val) => setActivePlayerId(val)}>
                      <SelectTrigger className="h-14 text-lg font-black bg-background/50 border-white/10">
                        <SelectValue placeholder="Waiting for Batter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roster.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="font-bold">
                            #{p.number} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activePlayer && (
                    <div className="space-y-3 p-4 bg-background/40 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Choose Walk-Up Song</span>
                      <div className="grid grid-cols-3 gap-2">
                        {activePlayer.songs.map((song, idx) => (
                          <Button
                            key={idx}
                            variant={selectedSongIndex === idx ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSongIndex(idx)}
                            className={cn(
                              "h-12 text-[10px] uppercase font-black px-2 leading-tight flex flex-col items-center justify-center",
                              selectedSongIndex === idx ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20" : "border-white/10 hover:bg-white/5"
                            )}
                          >
                            <span className="opacity-60 text-[8px] mb-0.5">TRACK</span>
                            {idx + 1}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2 px-2 text-[10px] font-bold text-secondary animate-in fade-in slide-in-from-left-2">
                        <Music2 className="h-3 w-3" />
                        <span className="truncate">{selectedSong?.name}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-6 rounded-xl bg-black/40 border-2 border-white/5 text-xl font-headline font-bold min-h-[120px] flex items-center justify-center text-center leading-snug tracking-tight",
                    !activePlayer && "text-muted-foreground text-sm italic"
                  )}>
                    {activePlayer ? activePlayer.announcementScript : "SELECT A PLAYER FROM THE ROSTER TO LOAD ARCHIVED ANNOUNCEMENT"}
                  </div>

                  <Button 
                    disabled={!activePlayer || isAnnouncing || isStreamingAudio} 
                    onClick={triggerSequence}
                    className="w-full h-20 text-xl font-black bg-primary hover:bg-primary/90 shadow-[0_12px_24px_-8px_rgba(66,133,255,0.4)] transition-all active:scale-[0.98] group"
                  >
                    {isStreamingAudio ? (
                      <Loader2 className="animate-spin mr-3 h-6 w-6" />
                    ) : isAnnouncing ? (
                      <Activity className="animate-pulse mr-3 h-6 w-6" />
                    ) : (
                      <Zap className="mr-3 h-6 w-6 fill-white group-hover:scale-125 transition-transform" />
                    )}
                    {isStreamingAudio ? "PREPARING AUDIO..." : isAnnouncing ? "STADIUM ANNOUNCING..." : "START WALK-UP SEQUENCE"}
                  </Button>
                </CardContent>
              </Card>

              {/* GAME STATS CARD */}
              <Card className="bg-card/80 border-2 border-white/5 overflow-hidden shadow-2xl">
                <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Game Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 pt-6">
                  {[
                    { key: "ab", label: "At Bats", color: "white" },
                    { key: "h", label: "Total Hits", color: "primary" },
                    { key: "r", label: "Runs Scored", color: "secondary" },
                    { key: "rbi", label: "Runs Batted In", color: "primary" }
                  ].map((stat) => (
                    <div key={stat.key} className="flex flex-col gap-2">
                       <Button 
                        disabled={!activePlayer}
                        onClick={() => updateStat(stat.key as any, 1)}
                        className="h-20 flex flex-col border-2 border-white/10 bg-background/50 hover:bg-primary/10 hover:border-primary/50 transition-all group relative overflow-hidden"
                      >
                        <Plus className="h-4 w-4 mb-2 text-primary group-hover:scale-150 transition-transform relative z-10" />
                        <span className="text-xs font-black uppercase tracking-widest relative z-10">{stat.label}</span>
                        <div className="absolute bottom-0 right-0 p-1 opacity-5">
                           <Hash className="h-12 w-12" />
                        </div>
                      </Button>
                      <div className="flex justify-between items-center bg-black/20 px-4 py-2 rounded-lg border border-white/5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{stat.key}</span>
                        <span className={cn("text-2xl font-black digit-font", stat.color === 'primary' ? 'text-primary' : stat.color === 'secondary' ? 'text-secondary' : 'text-white')}>
                          {activePlayer ? (activePlayer.stats as any)[stat.key] : 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            {/* SOUNDBOARD SECTION */}
            <section className="space-y-6 pb-20">
              <div className="flex items-center justify-between bg-card/40 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-6 w-6 text-secondary animate-bounce" />
                  <h2 className="text-xl font-black uppercase tracking-widest">Stadium Soundboard</h2>
                </div>
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={stopEverything}
                  className="font-black px-6 h-12 border-2 border-white/10 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse hover:animate-none"
                >
                  <VolumeX className="mr-3 h-5 w-5" /> EMERGENCY STOP
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organ Hits */}
                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-4 border-b border-white/5">
                    <CardTitle className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                      <Music className="h-4 w-4 text-secondary" /> Organ Master
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 pt-5">
                    {ORGAN_HITS.map((hit) => (
                      <Button 
                        key={hit.videoId}
                        variant="outline"
                        onClick={() => playSoundboard(hit.videoId)}
                        className="h-14 border-secondary/20 text-secondary hover:bg-secondary/20 hover:border-secondary transition-all font-black uppercase text-xs"
                      >
                        🎹 {hit.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Hype Songs */}
                <Card className="bg-card/80 border-white/10 shadow-xl">
                  <CardHeader className="py-4 border-b border-white/5">
                    <CardTitle className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" /> Crowd Pump-Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 pt-5">
                    {HYPE_SONGS.map((song) => (
                      <Button 
                        key={song.videoId}
                        variant="outline"
                        onClick={() => playSoundboard(song.videoId)}
                        className="h-14 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary transition-all font-black uppercase text-xs"
                      >
                        📣 {song.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* PERSISTENT HIDDEN AUDIO PLAYER */}
      <div className={cn(
        "fixed bottom-8 right-8 w-64 h-24 bg-card border-2 border-primary rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50 transition-all duration-500",
        activeAudioUrl ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0"
      )}>
        <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-md pointer-events-none z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1 items-end h-6">
               <div className="w-1 bg-primary animate-[bounce_0.6s_infinite] h-4" />
               <div className="w-1 bg-primary animate-[bounce_0.8s_infinite] h-6" />
               <div className="w-1 bg-primary animate-[bounce_0.5s_infinite] h-3" />
               <div className="w-1 bg-primary animate-[bounce_0.7s_infinite] h-5" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Stadium Audio Live</span>
          </div>
        </div>
        
        {activeAudioUrl ? (
          <iframe 
            key={activeAudioUrl}
            src={activeAudioUrl} 
            className="w-1 h-1 absolute opacity-0 pointer-events-none" 
            allow="autoplay; encrypted-media" 
          />
        ) : null}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-white/10 text-muted-foreground hover:text-white z-20" 
          onClick={() => setActiveAudioUrl(null)}
        >
          <VolumeX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
