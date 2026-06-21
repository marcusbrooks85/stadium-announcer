
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
  Target
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

// Roster Data
const INITIAL_ROSTER = [
  { id: "1", name: "Max Camargo", number: 6, song: "Miss You - Oliver Tree", videoId: "2Vv-BfVoq4g", startAt: 0, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
  { id: "2", name: "Diomedes Plata", number: 4, song: "We LA - Will.I.AM", videoId: "I6vR9v-vTAY", startAt: 80, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
  { id: "3", name: "Jimena Briones", number: 12, song: "Watermelon Sugar - Harry Styles", videoId: "L0X03zR0rQk", startAt: 0, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
  { id: "4", name: "Alexa Franco", number: 7, song: "Batter Up - Babymonster", videoId: "m_9H0qLzS7A", startAt: 58, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
  { id: "5", name: "Camila Brooks", number: 10, song: "Not Like Us - Kendrick Lamar", videoId: "T6eK-mAk_7M", startAt: 0, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
  { id: "6", name: "Ezekiel Jacobo", number: 8, song: "Under Control - Calvin Harris", videoId: "T9K6Z1T2V8g", startAt: 55, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
  { id: "7", name: "Aldrich Munoz", number: 11, song: "Montagem supersonic - VZSIK", videoId: "_qV_T9v_0U0", startAt: 0, stats: { ab: 0, h: 0, r: 0, rbi: 0 } },
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
    if (!activePlayer || isAnnouncing || isStreamingAudio) return;

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
        const embedUrl = `https://www.youtube.com/embed/${activePlayer.videoId}?autoplay=1&start=${activePlayer.startAt}&mute=0&rel=0&enablejsapi=1`;
        setActiveAudioUrl(embedUrl);
        setIsAnnouncing(false);
      };

      await audio.play();
    } catch (error) {
      console.error("Sequence failed", error);
      setIsStreamingAudio(false);
      setIsAnnouncing(false);
      // Fallback: Just play the music if TTS fails
      const embedUrl = `https://www.youtube.com/embed/${activePlayer.videoId}?autoplay=1&start=${activePlayer.startAt}&mute=0&rel=0&enablejsapi=1`;
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
      <header className="flex justify-center p-6 bg-card border-b border-border shadow-2xl relative z-20">
        <div className="flex items-center gap-16 md:gap-32 bg-background/50 p-6 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Away Team</span>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setAwayScore(Math.max(0, awayScore - 1))}><Minus /></Button>
              <div className="w-24 text-center digit-font text-6xl font-black text-secondary">{awayScore.toString().padStart(2, "0")}</div>
              <Button variant="outline" size="icon" onClick={() => setAwayScore(awayScore + 1)}><Plus /></Button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Home Team</span>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setHomeScore(Math.max(0, homeScore - 1))}><Minus /></Button>
              <div className="w-24 text-center digit-font text-6xl font-black text-primary">{homeScore.toString().padStart(2, "0")}</div>
              <Button variant="outline" size="icon" onClick={() => setHomeScore(homeScore + 1)}><Plus /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* TEAM ROSTER */}
        <aside className="w-80 bg-card/50 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
          <div className="p-4 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="font-headline font-bold uppercase tracking-wider text-sm">Active Roster</h2></div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {roster.map((player) => (
                <button 
                  key={player.id} 
                  onClick={() => setActivePlayerId(player.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    activePlayerId === player.id 
                      ? "bg-primary border-primary shadow-lg ring-2 ring-primary/20" 
                      : "bg-background/40 border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-1">{player.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold opacity-70">#{player.number}</span>
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-white/10 uppercase font-bold">
                          H: {player.stats.h} | RBI: {player.stats.rbi}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN DASHBOARD */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          <div className="max-w-5xl mx-auto w-full space-y-8">
            {/* ANNOUNCER CONTROLS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/80 border-2 border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Mic2 className="h-4 w-4" /> Announcer Booth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={activePlayerId || ""} onValueChange={(val) => setActivePlayerId(val)}>
                    <SelectTrigger className="h-14 text-lg font-bold bg-background/50 border-white/10">
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
                  
                  <div className={cn(
                    "p-4 rounded-xl bg-background/60 border-2 border-white/5 text-xl font-bold min-h-[100px] flex items-center justify-center text-center leading-tight",
                    !activePlayer && "text-muted-foreground text-sm italic"
                  )}>
                    {isGeneratingScript ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs uppercase tracking-widest">Generating Hype Script...</span>
                      </div>
                    ) : (
                      activePlayer ? aiScript : "Select a player from the roster to prepare the announcement."
                    )}
                  </div>

                  <Button 
                    disabled={!activePlayer || isAnnouncing || isStreamingAudio} 
                    onClick={triggerSequence}
                    className="w-full h-20 text-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-transform active:scale-95 group"
                  >
                    {isStreamingAudio ? (
                      <Loader2 className="animate-spin mr-3 h-6 w-6" />
                    ) : isAnnouncing ? (
                      <Activity className="animate-pulse mr-3 h-6 w-6" />
                    ) : (
                      <Zap className="mr-3 h-6 w-6 fill-white group-hover:animate-bounce" />
                    )}
                    {isStreamingAudio ? "PREPARING AUDIO..." : isAnnouncing ? "LIVE ANNOUNCING..." : "START WALK-UP SEQUENCE"}
                  </Button>
                </CardContent>
              </Card>

              {/* STAT UPDATER */}
              <Card className="bg-card/80 border-2 border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Live Game Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {["ab", "h", "r", "rbi"].map((stat) => (
                    <div key={stat} className="flex flex-col gap-2">
                       <Button 
                        disabled={!activePlayer}
                        onClick={() => updateStat(stat as any, 1)}
                        className="h-20 flex flex-col border-2 border-white/5 bg-background/40 hover:bg-primary/20 hover:border-primary/50 transition-all group"
                      >
                        <Plus className="h-4 w-4 mb-1 text-primary group-hover:scale-125 transition-transform" />
                        <span className="text-lg font-black uppercase">{stat}</span>
                      </Button>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{stat} Total</span>
                        <span className="text-sm font-black text-primary">{activePlayer ? (activePlayer.stats as any)[stat] : 0}</span>
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
                  <Volume2 className="h-6 w-6 text-secondary" />
                  <h2 className="text-xl font-black uppercase tracking-wider">Stadium Soundboard</h2>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={stopEverything}
                  className="h-10 font-black px-6 shadow-lg shadow-destructive/20 border-2 border-white/10"
                >
                  <VolumeX className="mr-2 h-5 w-5" /> STOP ALL SOUNDS
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organ Hits */}
                <Card className="bg-card/80 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Music className="h-3 w-3" /> Classic Organ Hits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {ORGAN_HITS.map((hit) => (
                      <Button 
                        key={hit.name}
                        variant="outline"
                        onClick={() => playSoundboard(hit.videoId)}
                        className="h-14 border-secondary/30 text-secondary hover:bg-secondary/10 font-bold uppercase text-xs"
                      >
                        🎹 {hit.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Hype Songs */}
                <Card className="bg-card/80 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Play className="h-3 w-3" /> Crowd Hype Songs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {HYPE_SONGS.map((song) => (
                      <Button 
                        key={song.name}
                        variant="outline"
                        onClick={() => playSoundboard(song.videoId)}
                        className="h-14 border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase text-xs"
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
        <div className="fixed bottom-6 right-6 w-48 h-24 bg-card border-2 border-primary rounded-xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-bottom-4">
           <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-1">
                <Music2 className="h-6 w-6 text-primary animate-bounce" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Stadium Audio Active</span>
              </div>
           </div>
           {/* Key forces fresh load/autoplay on URL change */}
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
