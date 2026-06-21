
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, 
  Users, 
  Mic2, 
  Play, 
  Plus, 
  Minus, 
  Activity, 
  Music,
  ChevronDown,
  Volume2
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

export default function StadiumBoothDashboard() {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [musicPlayerUrl, setMusicPlayerUrl] = useState<string | null>(null);
  const [aiScript, setAiScript] = useState<string>("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const activePlayer = roster.find((p) => p.id === activePlayerId);

  // Sync active player with Script Preview
  useEffect(() => {
    if (activePlayer) {
      const basicScript = `Now at bat... player number ${activePlayer.number}... ${activePlayer.name}!`;
      setAiScript(basicScript);
      generateHypeScript(activePlayer);
    }
  }, [activePlayerId]);

  const generateHypeScript = async (player: typeof INITIAL_ROSTER[0]) => {
    setIsGeneratingScript(true);
    try {
      // Logic for GenAI flow if provided, else fallback to tuned template
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

  const runAnnouncement = () => {
    if (!activePlayer || isAnnouncing) return;

    setIsAnnouncing(true);
    setMusicPlayerUrl(null); // Reset music

    const utterance = new SpeechSynthesisUtterance(aiScript);
    utterance.pitch = 0.85;
    utterance.rate = 0.82;
    utterance.volume = 1;

    utterance.onend = () => {
      // Start music after announcement ends
      const embedUrl = `https://www.youtube.com/embed/${activePlayer.videoId}?autoplay=1&start=${activePlayer.startAt}`;
      setMusicPlayerUrl(embedUrl);
      setIsAnnouncing(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopEverything = () => {
    window.speechSynthesis.cancel();
    setMusicPlayerUrl(null);
    setIsAnnouncing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* 1. SCOREBOARD COMPONENT */}
      <header className="flex justify-center p-6 bg-card border-b border-border shadow-2xl relative z-20">
        <div className="flex items-center gap-16 md:gap-32 bg-background/50 p-6 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-muted-foreground">AWAY</span>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-2 hover:bg-destructive/10" 
                onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="w-24 text-center digit-font text-6xl font-black text-secondary drop-shadow-[0_0_15px_rgba(46,177,217,0.5)]">
                {awayScore.toString().padStart(2, "0")}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-2 hover:bg-primary/10" 
                onClick={() => setAwayScore(awayScore + 1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="h-20 w-[2px] bg-border/50 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-muted-foreground">HOME</span>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-2 hover:bg-destructive/10" 
                onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="w-24 text-center digit-font text-6xl font-black text-primary drop-shadow-[0_0_15px_rgba(66,133,255,0.5)]">
                {homeScore.toString().padStart(2, "0")}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full border-2 hover:bg-primary/10" 
                onClick={() => setHomeScore(homeScore + 1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. TEAM ROSTER & STATS SIDEBAR */}
        <aside className="w-80 bg-card/50 border-r border-border backdrop-blur-sm hidden lg:flex flex-col">
          <div className="p-4 border-b border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-headline font-bold uppercase tracking-wider text-sm">Team Roster</h2>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground uppercase">Active Game</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {roster.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setActivePlayerId(player.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden",
                    activePlayerId === player.id 
                      ? "bg-primary border-primary shadow-lg scale-[1.02]" 
                      : "bg-background/40 border-white/5 hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  {activePlayerId === player.id && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={cn("font-bold text-lg leading-tight", activePlayerId === player.id ? "text-white" : "text-foreground")}>
                        {player.name}
                      </h3>
                      <p className={cn("text-xs flex items-center gap-1", activePlayerId === player.id ? "text-white/80" : "text-muted-foreground")}>
                        <Music className="h-3 w-3" /> {player.song}
                      </p>
                    </div>
                    <span className={cn("text-2xl font-black italic", activePlayerId === player.id ? "text-white/30" : "text-muted-foreground/20")}>
                      #{player.number}
                    </span>
                  </div>
                  <div className={cn(
                    "grid grid-cols-4 gap-1 text-[10px] font-bold uppercase tracking-tight py-2 border-t",
                    activePlayerId === player.id ? "border-white/20 text-white" : "border-white/5 text-muted-foreground"
                  )}>
                    <div className="flex flex-col"><span>AB</span><span className="text-sm font-mono">{player.stats.ab}</span></div>
                    <div className="flex flex-col"><span>H</span><span className="text-sm font-mono">{player.stats.h}</span></div>
                    <div className="flex flex-col"><span>R</span><span className="text-sm font-mono">{player.stats.r}</span></div>
                    <div className="flex flex-col"><span>RBI</span><span className="text-sm font-mono">{player.stats.rbi}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            {/* 3. CENTRAL ANNOUNCER CONTROLS */}
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Select Current Batter
                  </label>
                  <Select value={activePlayerId || ""} onValueChange={(val) => setActivePlayerId(val)}>
                    <SelectTrigger className="h-14 text-lg font-bold bg-card border-2 border-white/5 rounded-xl">
                      <SelectValue placeholder="Choose a player..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roster.map((player) => (
                        <SelectItem key={player.id} value={player.id} className="text-lg py-3">
                          #{player.number} {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-secondary" /> Announcement Status
                  </label>
                  <div className="h-14 flex items-center px-4 bg-card rounded-xl border-2 border-white/5">
                    {isAnnouncing ? (
                      <div className="flex items-center gap-3 text-secondary animate-pulse">
                        <div className="flex gap-1 items-end h-4">
                          <div className="w-1 h-full bg-secondary animate-[bounce_1s_infinite_0s]" />
                          <div className="w-1 h-2/3 bg-secondary animate-[bounce_1s_infinite_0.2s]" />
                          <div className="w-1 h-full bg-secondary animate-[bounce_1s_infinite_0.4s]" />
                        </div>
                        <span className="font-bold uppercase text-sm">Broadcasting Live...</span>
                      </div>
                    ) : musicPlayerUrl ? (
                      <div className="flex items-center gap-3 text-primary">
                        <Play className="h-5 w-5 fill-current" />
                        <span className="font-bold uppercase text-sm">Music Playing</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-medium text-sm">Standby</span>
                    )}
                  </div>
                </div>
              </div>

              <Card className="bg-card/80 border-2 border-white/5 shadow-xl overflow-hidden group">
                <CardHeader className="bg-background/40 pb-4 border-b border-border">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Mic2 className="h-4 w-4 text-primary" /> Script Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-8 space-y-6">
                  <div className={cn(
                    "min-h-[120px] p-6 rounded-xl bg-background/60 border-2 border-white/5 text-2xl font-bold leading-relaxed transition-all duration-500",
                    isGeneratingScript && "opacity-50 blur-[1px]",
                    !activePlayer && "text-muted-foreground flex items-center justify-center italic text-lg"
                  )}>
                    {activePlayer ? aiScript : "Select a player to generate announcer script..."}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      disabled={!activePlayer || isAnnouncing}
                      onClick={runAnnouncement}
                      className={cn(
                        "flex-1 h-20 text-xl font-black uppercase tracking-wider rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95",
                        isAnnouncing ? "bg-muted" : "bg-primary hover:bg-primary/90 text-white"
                      )}
                    >
                      <Mic2 className="h-8 w-8 mr-3" />
                      📢 Run Announcement & Walk-Up
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={stopEverything}
                      className="h-20 px-8 rounded-2xl"
                      title="Kill Sound"
                    >
                      <div className="w-8 h-8 rounded-full border-4 border-white flex items-center justify-center font-black">X</div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 4. IN-GAME STATS UPDATER CONTROLS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-wider text-white">In-Game Stat Updater</h2>
                {activePlayer && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">Editing:</span>
                    <Badge className="bg-primary text-white font-bold px-3 py-1">
                      #{activePlayer.number} {activePlayer.name}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Add At-Bat", type: "ab" as const, color: "border-primary/50 text-primary" },
                  { label: "Add Hit", type: "h" as const, color: "border-secondary/50 text-secondary" },
                  { label: "Add Run", type: "r" as const, color: "border-green-500/50 text-green-500" },
                  { label: "Add RBI", type: "rbi" as const, color: "border-orange-500/50 text-orange-500" },
                ].map((stat) => (
                  <Button
                    key={stat.type}
                    disabled={!activePlayer}
                    onClick={() => updateStat(stat.type, 1)}
                    className={cn(
                      "h-32 flex flex-col items-center justify-center gap-2 bg-card border-2 hover:bg-white/5 transition-all rounded-2xl",
                      stat.color
                    )}
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-lg font-black uppercase tracking-tight">{stat.label}</span>
                    <span className="text-xs font-bold uppercase opacity-60">+{stat.type}</span>
                  </Button>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* 5. HIDDEN MUSIC PLAYER */}
      {musicPlayerUrl && (
        <div className="fixed bottom-4 right-4 w-48 h-24 bg-card border-2 border-primary rounded-xl overflow-hidden shadow-2xl z-50 animate-in slide-in-from-right duration-500">
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-background/80">
              <div className="flex flex-col items-center gap-1">
                <Music className="h-6 w-6 text-primary animate-bounce" />
                <span className="text-[10px] font-black text-primary uppercase">Walking Up...</span>
              </div>
           </div>
           <iframe
            src={musicPlayerUrl}
            className="w-full h-full opacity-0 pointer-events-none"
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
}
