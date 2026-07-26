"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Plus, 
  Minus, 
  Activity,
  Trophy,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGame, FULL_GAME_SCHEDULE } from "@/app/context/game-context";
import { cn } from "@/lib/utils";

interface StadiumScoreboardProps {
  adminMode?: boolean;
}

/**
 * StadiumScoreboard Component
 * 
 * A comprehensive game-management system including:
 * 1. Unified Header (Inning, BSO, and Team Totals)
 * 2. Line Score Table (Innings 1-9)
 * 3. Ergonomic Admin Controls with auto-transition logic
 */
export function StadiumScoreboard({ adminMode = true }: StadiumScoreboardProps) {
  const { homeScore: contextHomeScore, awayScore: contextAwayScore, updateTeamScore, selectedGameId } = useGame();

  // --- Game State ---
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [inning, setInning] = useState(1);
  const [half, setHalf] = useState<'top' | 'bottom'>('top');
  
  const [awayLineScore, setAwayLineScore] = useState<number[]>(new Array(9).fill(0));
  const [homeLineScore, setHomeLineScore] = useState<number[]>(new Array(9).fill(0));
  
  const [awayHits, setAwayHits] = useState(0);
  const [homeHits, setHomeHits] = useState(0);
  const [awayErrors, setAwayErrors] = useState(0);
  const [homeErrors, setHomeErrors] = useState(0);

  // Determine if Strawhats are home or away
  const isStrawhatsHome = useMemo(() => {
    const game = FULL_GAME_SCHEDULE.find(g => g.id === selectedGameId);
    return game?.home === "Coach Chewy";
  }, [selectedGameId]);

  const isStrawhatsAway = useMemo(() => {
    const game = FULL_GAME_SCHEDULE.find(g => g.id === selectedGameId);
    return game?.away === "Coach Chewy";
  }, [selectedGameId]);

  // --- Derived Totals ---
  const awayRuns = awayLineScore.reduce((a, b) => a + b, 0);
  const homeRuns = homeLineScore.reduce((a, b) => a + b, 0);

  // --- Game Logic Handlers ---
  
  const nextHalfInning = useCallback(() => {
    setBalls(0);
    setStrikes(0);
    setOuts(0);
    if (half === 'top') {
      setHalf('bottom');
    } else {
      setHalf('top');
      setInning(prev => Math.min(prev + 1, 9));
    }
  }, [half]);

  const addBall = () => {
    if (balls === 3) {
      setBalls(0);
      setStrikes(0); // Walk
    } else {
      setBalls(prev => prev + 1);
    }
  };

  const addStrike = () => {
    if (strikes === 2) {
      setStrikes(0);
      setBalls(0);
      addOut(); // Strikeout
    } else {
      setStrikes(prev => prev + 1);
    }
  };

  const addOut = () => {
    if (outs === 2) {
      nextHalfInning(); // 3 Outs -> Side Change
    } else {
      setOuts(prev => prev + 1);
    }
  };

  const resetCount = () => {
    setBalls(0);
    setStrikes(0);
  };

  const updateRuns = (delta: number) => {
    const idx = inning - 1;
    if (half === 'top') {
      const next = [...awayLineScore];
      next[idx] = Math.max(0, next[idx] + delta);
      setAwayLineScore(next);
      updateTeamScore('away', delta);
    } else {
      const next = [...homeLineScore];
      next[idx] = Math.max(0, next[idx] + delta);
      setHomeLineScore(next);
      updateTeamScore('home', delta);
    }
  };

  const updateHits = (delta: number) => {
    if (half === 'top') setAwayHits(prev => Math.max(0, prev + delta));
    else setHomeHits(prev => Math.max(0, prev + delta));
  };

  const updateErrors = (delta: number) => {
    if (half === 'top') setAwayErrors(prev => Math.max(0, prev + delta));
    else setHomeErrors(prev => Math.max(0, prev + delta));
  };

  useEffect(() => {
    const contextAway = contextAwayScore || 0;
    const contextHome = contextHomeScore || 0;

    if (contextAway !== awayRuns) {
       const next = new Array(9).fill(0);
       next[0] = contextAway;
       setAwayLineScore(next);
    }
    if (contextHome !== homeRuns) {
       const next = new Array(9).fill(0);
       next[0] = contextHome;
       setHomeLineScore(next);
    }
  }, [contextHomeScore, contextAwayScore, awayRuns, homeRuns]);

  const LightIndicator = ({ label, count, max, activeColor }: { label: string, count: number, max: number, activeColor: string }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-white/10 transition-all duration-300",
              i < count ? activeColor : "bg-black/40 shadow-inner"
            )}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <Card className="bg-black border-2 border-white/5 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900/40 to-transparent p-2.5 sm:p-4 border-b border-white/5 flex flex-wrap items-center justify-start gap-4 sm:gap-8">
          
          <div className="h-12 sm:h-16 px-3 sm:px-5 bg-primary/20 border border-primary/40 rounded-lg flex items-center gap-3 sm:gap-4 shrink-0">
             <div className="flex flex-col items-center">
                <span className="text-[7px] sm:text-[8px] font-black uppercase text-primary leading-none mb-1">INN</span>
                <span className="text-2xl sm:text-3xl font-black digit-font text-white leading-none">{inning}</span>
             </div>
             <div className="h-8 sm:h-10 w-[1px] bg-white/10" />
             <div className="flex items-center">
                {half === 'top' ? (
                  <ChevronUp className="h-6 w-6 sm:h-8 sm:w-8 text-secondary animate-pulse" />
                ) : (
                  <ChevronDown className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                )}
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 sm:gap-6 border-r border-white/5 pr-4 sm:pr-8">
            <LightIndicator label="B" count={balls} max={3} activeColor="bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <LightIndicator label="S" count={strikes} max={2} activeColor="bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            <LightIndicator label="O" count={outs} max={2} activeColor="bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
             <div className="flex flex-col items-center relative">
                <div className="min-w-[50px] sm:min-w-[70px] bg-secondary/10 border border-secondary/20 p-1 sm:p-2 rounded-lg flex flex-col items-center">
                   <span className="text-[7px] sm:text-[9px] font-black uppercase text-secondary leading-none mb-1">AWAY</span>
                   <span className="text-xl sm:text-3xl font-black digit-font text-white leading-none">{contextAwayScore || 0}</span>
                </div>
                {isStrawhatsAway && (
                  <div className="absolute -bottom-4 flex flex-col items-center">
                    <span className="text-[8px] font-black text-secondary tracking-widest uppercase bg-black/80 px-2 py-0.5 rounded border border-secondary/30">👒 STRAWHATS</span>
                  </div>
                )}
             </div>
             <div className="flex flex-col items-center relative">
                <div className="min-w-[50px] sm:min-w-[70px] bg-primary/10 border border-primary/20 p-1 sm:p-2 rounded-lg flex flex-col items-center">
                   <span className="text-[7px] sm:text-[9px] font-black uppercase text-primary leading-none mb-1">HOME</span>
                   <span className="text-xl sm:text-3xl font-black digit-font text-white leading-none">{contextHomeScore || 0}</span>
                </div>
                {isStrawhatsHome && (
                  <div className="absolute -bottom-4 flex flex-col items-center">
                    <span className="text-[8px] font-black text-primary tracking-widest uppercase bg-black/80 px-2 py-0.5 rounded border border-primary/30">👒 STRAWHATS</span>
                  </div>
                )}
             </div>
          </div>
        </div>

        <CardContent className="p-0 overflow-x-auto scrollbar-hide mt-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <th className="p-3 text-left w-24">Team</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                  <th key={i} className={cn("p-3 text-center border-l border-white/5 w-10", inning === i && "bg-primary/20 text-primary")}>{i}</th>
                ))}
                <th className="p-3 text-center border-l-2 border-white/10 w-12 text-white">R</th>
                <th className="p-3 text-center border-l border-white/5 w-12">H</th>
                <th className="p-3 text-center border-l border-white/5 w-12">E</th>
              </tr>
            </thead>
            <tbody className="digit-font">
              <tr className="border-b border-white/5">
                <td className="p-3 font-black text-xs uppercase tracking-tighter text-muted-foreground flex items-center gap-1.5">
                   Away {isStrawhatsAway && <span className="text-[8px] opacity-60">👒</span>}
                </td>
                {awayLineScore.map((score, i) => (
                  <td key={i} className={cn("p-3 text-center border-l border-white/5 text-sm", inning === i + 1 && half === 'top' && "bg-white/5 font-black text-white")}>{score || '-'}</td>
                ))}
                <td className="p-3 text-center border-l-2 border-white/10 font-black text-lg text-primary">{contextAwayScore || 0}</td>
                <td className="p-3 text-center border-l border-white/5 text-sm font-bold text-muted-foreground">{awayHits}</td>
                <td className="p-3 text-center border-l border-white/5 text-sm font-bold text-muted-foreground">{awayErrors}</td>
              </tr>
              <tr className="bg-white/[0.02]">
                <td className="p-3 font-black text-xs uppercase tracking-tighter text-muted-foreground flex items-center gap-1.5">
                   Home {isStrawhatsHome && <span className="text-[8px] opacity-60">👒</span>}
                </td>
                {homeLineScore.map((score, i) => (
                  <td key={i} className={cn("p-3 text-center border-l border-white/5 text-sm", inning === i + 1 && half === 'bottom' && "bg-white/5 font-black text-white")}>{score || '-'}</td>
                ))}
                <td className="p-3 text-center border-l-2 border-white/10 font-black text-lg text-primary">{contextHomeScore || 0}</td>
                <td className="p-3 text-center border-l border-white/5 text-sm font-bold text-muted-foreground">{homeHits}</td>
                <td className="p-3 text-center border-l border-white/5 text-sm font-bold text-muted-foreground">{homeErrors}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {adminMode && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-white/5 shadow-xl">
            <CardHeader className="py-3 border-b border-white/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <Activity className="h-3 w-3" /> Live Count Controller
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               <div className="grid grid-cols-3 gap-3">
                  <Button onClick={addBall} className="h-24 flex flex-col gap-1 bg-green-900/40 hover:bg-green-800/60 border border-green-500/20 group">
                     <span className="text-[8px] font-black uppercase tracking-widest text-green-400 opacity-60 group-hover:opacity-100">+ Ball</span>
                     <span className="text-3xl font-black text-white">{balls}</span>
                  </Button>
                  <Button onClick={addStrike} className="h-24 flex flex-col gap-1 bg-yellow-900/40 hover:bg-yellow-800/60 border border-yellow-500/20 group">
                     <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400 opacity-60 group-hover:opacity-100">+ Strike</span>
                     <span className="text-3xl font-black text-white">{strikes}</span>
                  </Button>
                  <Button onClick={addOut} className="h-24 flex flex-col gap-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/20 group">
                     <span className="text-[8px] font-black uppercase tracking-widest text-red-400 opacity-60 group-hover:opacity-100">+ Out</span>
                     <span className="text-3xl font-black text-white">{outs}</span>
                  </Button>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" onClick={resetCount} className="flex-1 h-12 text-[10px] font-black uppercase border-white/5 hover:bg-white/5">
                     <RotateCcw className="h-3 w-3 mr-2" /> Reset Count
                  </Button>
                  <Button variant="outline" onClick={nextHalfInning} className="flex-1 h-12 text-[10px] font-black uppercase border-white/5 hover:bg-white/5">
                     <History className="h-3 w-3 mr-2" /> Change Half
                  </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 shadow-xl">
             <CardHeader className="py-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                   <Trophy className="h-3 w-3" /> Event Scorer ({half === 'top' ? "Away" : "Home"})
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4 grid grid-cols-3 gap-4">
                {[
                  { label: "Runs", value: half === 'top' ? awayRuns : homeRuns, update: updateRuns },
                  { label: "Hits", value: half === 'top' ? awayHits : homeHits, update: updateHits },
                  { label: "Errors", value: half === 'top' ? awayErrors : homeErrors, update: updateErrors },
                ].map((item) => (
                  <div key={item.label} className="bg-black/20 rounded-xl border border-white/5 p-3 flex flex-col items-center gap-2">
                     <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                     <span className="text-2xl font-black text-white digit-font">{item.value}</span>
                     <div className="flex gap-1 w-full mt-1">
                        <Button variant="ghost" size="icon" onClick={() => item.update(-1)} className="flex-1 h-8 hover:bg-white/5 border border-white/5"><Minus className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => item.update(1)} className="flex-1 h-8 hover:bg-white/5 border border-white/5"><Plus className="h-3 w-3" /></Button>
                     </div>
                  </div>
                ))}
             </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
