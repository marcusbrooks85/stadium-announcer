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
  ChevronRight
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
import { runAnnouncementGenerator } from "@/ai/flows/dynamic-announcement-generator";
import { generateAnnouncerAudio } from "@/ai/flows/announcer-tts-flow";

// Roster Data with 3 song choices per player
const INITIAL_ROSTER = [
  { 
    id: "1", 
    name: "Max Camargo", 
    number: 6, 
    songs: [
      { name: "Miss You - Oliver Tree", videoId: "2Vv-BfVoq4g", startAt: 0 },
      { name: "Thunder - Imagine Dragons", videoId: "fKopy74weus", startAt: 0 },
      { name: "Seven Nation Army", videoId: "0J2QdDbelmY", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "2", 
    name: "Diomedes Plata", 
    number: 4, 
    songs: [
      { name: "We LA - Will.I.AM", videoId: "I6vR9v-vTAY", startAt: 80 },
      { name: "Level Up - Ciara", videoId: "Dh-ULbQmmF8", startAt: 0 },
      { name: "God's Plan - Drake", videoId: "xpVfcZ0ZcFM", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "3", 
    name: "Jimena Briones", 
    number: 12, 
    songs: [
      { name: "Watermelon Sugar", videoId: "L0X03zR0rQk", startAt: 0 },
      { name: "Flowers - Miley Cyrus", videoId: "G7KNmW9a75Y", startAt: 0 },
      { name: "Espresso - Sabrina Carpenter", videoId: "eVli-tstM5E", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "4", 
    name: "Alexa Franco", 
    number: 7, 
    songs: [
      { name: "Batter Up - Babymonster", videoId: "m_9H0qLzS7A", startAt: 58 },
      { name: "Shake It Off - T-Swift", videoId: "nfWlot6h_JM", startAt: 0 },
      { name: "Girls Just Want To Have Fun", videoId: "PIb6AZdTr-A", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "5", 
    name: "Camila Brooks", 
    number: 10, 
    songs: [
      { name: "Not Like Us - Kendrick", videoId: "T6eK-mAk_7M", startAt: 0 },
      { name: "California Love", videoId: "mwgZalAFNhM", startAt: 0 },
      { name: "HUMBLE. - Kendrick", videoId: "tvTRZJ-4EyI", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "6", 
    name: "Ezekiel Jacobo", 
    number: 8, 
    songs: [
      { name: "Under Control - Calvin Harris", videoId: "T9K6Z1T2V8g", startAt: 55 },
      { name: "Titanium - David Guetta", videoId: "JRfuAukYTKg", startAt: 0 },
      { name: "Levels - Avicii", videoId: "_ovdm2yX4MA", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "7", 
    name: "Aldrich Munoz", 
    number: 11, 
    songs: [
      { name: "Montagem supersonic - VZSIK", videoId: "_qV_T9v_0U0", startAt: 0 },
      { name: "Sicko Mode - Travis Scott", videoId: "d-JBBNg8YKs", startAt: 0 },
      { name: "Superhero - Metro Boomin", videoId: "6XFpXidjKz8", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
];

const ORGAN_HITS = [
  { name: "CHARGE!", videoId: "h9_2uB83U8Q" },
  { name: "Take Me Out", videoId: "q4-gsdLSSQ0" },
  { name: "JAWS", videoId: "A9QTSyLwd4w" },
  { name: "Let's Go Team", videoId: "7_8A2zC6DqY" },
  { name: "Bullfighter", videoId: "p_hZf1OQ1e8" },
];

const HYPE_SONGS = [
  { name: "The Hey Song", videoId: "7xd44PW78ZE" },
  { name: "The Ooooo Song", videoId: "z5LW07FTJbI" },
  { name: "Start Me Up", videoId: "SGyO74uJDkQ" },
  { name: "La Chona", videoId: "M97XvYn-2vE" },
  { name: "Trophies", videoId: "p7_fD3l_o_U" },
  { name: "Bring Em Out", videoId: "vuyEGVZBy3Y" },
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
  const [aiScript, setAiScript] = useState<string>("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
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

  // Auto-generate script when player or stats change
  useEffect(() => {
    if (activePlayer) {
      const timer = setTimeout(() => {
        generateHypeScript(activePlayer);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAiScript("");
    }
  }, [activePlayerId, activePlayer?.stats.ab, activePlayer?.stats.h, activePlayer?.stats.r, activePlayer?.stats.rbi]);

  const generateHypeScript = async (player: typeof INITIAL_ROSTER[0]) => {
    setIsGeneratingScript(true);
    try {
      const result = await runAnnouncementGenerator({
        playerName: player.name,
        playerNumber: player.number,
        stats: player.stats
      });
      if (result) setAiScript(result);
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

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

  const triggerSequence = async () => {
    if (!activePlayer || isAnnouncing || isStreamingAudio || !selectedSong) return;

    stopEverything();
    setIsStreamingAudio(true);

    try {
      const { media } = await generateAnnouncerAudio({
        text: aiScript || `NOW AT BAT, NUMBER ${activePlayer.number}, ${activePlayer.name.toUpperCase()}!`,
        voice: "Algenib"
      });

      setIsStreamingAudio(false);
      setIsAnnouncing(true);

      const audio = new Audio(media);
      audioRef.current = audio;

      audio.onended = () => {
        setIsAnnouncing(false);
        // Direct trigger of walk-up music after announcer ends
        const embedUrl = `https://www.youtube.com/embed/${selectedSong.videoId}?autoplay=1&start=${selectedSong.startAt}&mute=0&rel=0&enablejsapi=1&t=${Date.now()}`;
        setActiveAudioUrl(embedUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("Sequence failed", error);
      setIsStreamingAudio(false);
      setIsAnnouncing(false);
      // Fallback: Just play the music if TTS fails
      const embedUrl = `https://www.youtube.com/embed/${selectedSong.videoId}?autoplay=1&start=${selectedSong.startAt}&mute=0&rel=0&enablejsapi=1&t=${Date.now()}`;
      setActiveAudioUrl(embedUrl);
    }
  };

  const playSoundboard = (videoId: string) => {
    stopEverything();
    // Use timestamp to force iframe reload for repeat plays
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&enablejsapi=1&t=${Date.now()}`;
    setActiveAudioUrl(embedUrl);
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* SCOREBOARD */}
      <header className="flex justify-center p-4 bg-card border-b border-border shadow-2xl relative z-20">
        <div className="flex items-center gap-12 md:gap-24 bg-background/50 px-6 py-4 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Away Team</span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAwayScore(Math.max(0, awayScore - 1))}><Minus className="h-3 w-3" /></Button>
              <div className="w-16 text-center digit-font text-4xl font-black text-secondary">{awayScore.toString().padStart(2, "0")}</div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setAwayScore(awayScore + 1)}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Home Team</span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setHomeScore(Math.max(0, homeScore - 1))}><Minus className="h-3 w-3" /></Button>
              <div className="w-16 text-center digit-font text-4xl font-black text-primary">{homeScore.toString().padStart(2, "0")}</div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setHomeScore(homeScore + 1)}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* TEAM ROSTER */}
        <aside className="w-72 bg-card/50 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
          <div className="p-4 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h2 className="font-headline font-bold uppercase tracking-wider text-xs">Active Roster</h2></div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {roster.map((player) => (
                <button 
                  key={player.id} 
                  onClick={() => setActivePlayerId(player.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all",
                    activePlayerId === player.id 
                      ? "bg-primary border-primary shadow-lg" 
                      : "bg-background/40 border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{player.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold opacity-70">#{player.number}</span>
                        <span className="text-[9px] font-bold uppercase text-white/60">H: {player.stats.h} | RBI: {player.stats.rbi}</span>
                      </div>
                    </div>
                    {activePlayerId === player.id && <ChevronRight className="h-4 w-4" />}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN DASHBOARD */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* ANNOUNCER CONTROLS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/80 border-2 border-white/5 overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Mic2 className="h-4 w-4" /> Batter Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Select value={activePlayerId || ""} onValueChange={(val) => setActivePlayerId(val)}>
                    <SelectTrigger className="h-12 text-md font-bold bg-background/50 border-white/10">
                      <SelectValue placeholder="Select Batter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roster.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          #{p.number} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {activePlayer && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Choose Walk-Up Song</span>
                      <div className="grid grid-cols-3 gap-1">
                        {activePlayer.songs.map((song, idx) => (
                          <Button
                            key={idx}
                            variant={selectedSongIndex === idx ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSongIndex(idx)}
                            className={cn(
                              "h-10 text-[9px] uppercase font-black px-1 leading-tight",
                              selectedSongIndex === idx ? "bg-secondary text-secondary-foreground" : "border-white/10"
                            )}
                          >
                            Song {idx + 1}
                          </Button>
                        ))}
                      </div>
                      <div className="text-[10px] italic text-center text-white/40 truncate px-2">
                        Selected: {selectedSong?.name}
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-4 rounded-xl bg-background/60 border-2 border-white/5 text-lg font-bold min-h-[90px] flex items-center justify-center text-center leading-tight",
                    !activePlayer && "text-muted-foreground text-sm italic"
                  )}>
                    {isGeneratingScript ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-[10px] uppercase tracking-widest">Regenerating Script...</span>
                      </div>
                    ) : (
                      activePlayer ? aiScript : "Select a batter to begin."
                    )}
                  </div>

                  <Button 
                    disabled={!activePlayer || isAnnouncing || isStreamingAudio} 
                    onClick={triggerSequence}
                    className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 group"
                  >
                    {isStreamingAudio ? (
                      <Loader2 className="animate-spin mr-3 h-5 w-5" />
                    ) : isAnnouncing ? (
                      <Activity className="animate-pulse mr-3 h-5 w-5" />
                    ) : (
                      <Zap className="mr-3 h-5 w-5 fill-white group-hover:animate-bounce" />
                    )}
                    {isStreamingAudio ? "LOADING..." : isAnnouncing ? "LIVE ANNOUNCING" : "START SEQUENCE"}
                  </Button>
                </CardContent>
              </Card>

              {/* STAT UPDATER */}
              <Card className="bg-card/80 border-2 border-white/5">
                <CardHeader className="pb-3 border-b border-white/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Live Game Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 pt-4">
                  {["ab", "h", "r", "rbi"].map((stat) => (
                    <div key={stat} className="flex flex-col gap-1">
                       <Button 
                        disabled={!activePlayer}
                        onClick={() => updateStat(stat as any, 1)}
                        className="h-14 flex flex-col border-2 border-white/5 bg-background/40 hover:bg-primary/20 hover:border-primary/50 transition-all group"
                      >
                        <Plus className="h-3 w-3 mb-1 text-primary group-hover:scale-125 transition-transform" />
                        <span className="text-sm font-black uppercase">{stat}</span>
                      </Button>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">{stat}</span>
                        <span className="text-[10px] font-black text-primary">{activePlayer ? (activePlayer.stats as any)[stat] : 0}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            {/* SOUNDBOARD */}
            <section className="space-y-4 pb-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-secondary" />
                  <h2 className="text-lg font-black uppercase tracking-wider">Stadium Soundboard</h2>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={stopEverything}
                  className="font-black px-4 h-9 border-2 border-white/10"
                >
                  <VolumeX className="mr-2 h-4 w-4" /> KILL ALL AUDIO
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organ Hits */}
                <Card className="bg-card/80 border-white/5">
                  <CardHeader className="py-3">
                    <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Music className="h-3 w-3" /> Classic Organ Hits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {ORGAN_HITS.map((hit) => (
                      <Button 
                        key={hit.name}
                        variant="outline"
                        onClick={() => playSoundboard(hit.videoId)}
                        className="h-11 border-secondary/30 text-secondary hover:bg-secondary/10 font-bold uppercase text-[10px]"
                      >
                        🎹 {hit.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Hype Songs */}
                <Card className="bg-card/80 border-white/5">
                  <CardHeader className="py-3">
                    <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Play className="h-3 w-3" /> Crowd Hype Songs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {HYPE_SONGS.map((song) => (
                      <Button 
                        key={song.name}
                        variant="outline"
                        onClick={() => playSoundboard(song.videoId)}
                        className="h-11 border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase text-[10px]"
                      >
                        🎵 {song.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* HIDDEN AUDIO PLAYER */}
      {activeAudioUrl && (
        <div className="fixed bottom-6 right-6 w-40 h-20 bg-card border-2 border-primary rounded-xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-bottom-4">
           <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-1">
                <Music2 className="h-5 w-5 text-primary animate-bounce" />
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Stadium Music On</span>
              </div>
           </div>
           <iframe 
             key={activeAudioUrl}
             src={activeAudioUrl} 
             className="w-1 h-1 absolute opacity-0" 
             allow="autoplay; encrypted-media; jsapi" 
           />
        </div>
      )}
    </div>
  );
}
