"use client";

import React, { useState, useCallback, useEffect, useMemo, useContext } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Plus, 
  Minus, 
  Activity,
  Trophy,
  History,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useGame, FULL_GAME_SCHEDULE } from "@/app/context/game-context";
import { useUATGame, UATGameContext } from "@/app/context/uat-game-context";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface StadiumScoreboardProps {
  adminMode?: boolean;
}

export function StadiumScoreboard({ adminMode = true }: StadiumScoreboardProps) {
  const pathname = usePathname();
  const isUAT = pathname.includes('-uat');
  
  // Conditionally use context based on environment
  const prodContext = useGame();
  // Use useContext directly to avoid throwing when the UAT provider is missing (on production pages)
  const uatContext = useContext(UATGameContext);
  
  const context = (isUAT && uatContext) ? uatContext : prodContext;
  const { homeScore: contextHomeScore, awayScore: contextAwayScore, updateTeamScore, selectedGameId, teamData } = context;

  const currentTeamName = isUAT ? (teamData?.name || "UAT TEAM") : "STRAWHATS";

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

  const activeGame = useMemo(() => {
    return (context as any).games 
      ? (context as any).games.find((g:any) => g.id === selectedGameId) 
      : FULL_GAME_SCHEDULE.find(g => g.id === selectedGameId);
  }, [context, selectedGameId]);

  // Robust check to prevent undefined === undefined matches on postseason cards
  const isOurTeamHome = useMemo(() => {
    if (!activeGame) return false;
    const teamName = teamData?.name;
    if (activeGame.isPostseason) {
      return activeGame.subGames?.some((sg: any) => 
        sg.home === "Coach Chewy" || (teamName && sg.home === teamName)
      );
    }
    return activeGame.home?.includes('Chewy') || (teamName && activeGame.home === teamName);
  }, [activeGame, teamData]);

  const isOurTeamAway = useMemo(() => {
    if (!activeGame) return false;
    const teamName = teamData?.name;
    if (activeGame.isPostseason) {
      return activeGame.subGames?.some((sg: any) => 
        sg.away === "Coach Chewy" || (teamName && sg.away === teamName)
      );
    }
    return activeGame.away?.includes('Chewy') || (teamName && activeGame.away === teamName);
  }, [activeGame, teamData]);

  const nextHalfInning = useCallback(() => {
    setBalls(0); setStrikes(0); setOuts(0);
    if (half === 'top') setHalf('bottom');
    else { setHalf('top'); setInning(prev => Math.min(prev + 1, 9)); }
  }, [half]);

  const toggleHalfInning = () => {
    if (!adminMode) return;
    setHalf(prev => prev === 'top' ? 'bottom' : 'top');
    setBalls(0); setStrikes(0); setOuts(0);
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

  useEffect(() => {
    // Sync line scores when context scores change (to handle historical data)
    if (contextAwayScore !== awayLineScore.reduce((a,b)=>a+b,0)) {
       const next = new Array(9).fill(0); next[0] = contextAwayScore; setAwayLineScore(next);
    }
    if (contextHomeScore !== homeLineScore.reduce((a,b)=>a+b,0)) {
       const next = new Array(9).fill(0); next[0] = contextHomeScore; setHomeLineScore(next);
    }
  }, [contextHomeScore, contextAwayScore]);

  const LightIndicator = ({ label, count, max, activeColor }: any) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[7px] font-black text-muted-foreground uppercase">{label}</span>
      <div className="flex gap-1">{Array.from({ length: max }).map((_, i) => (<div key={i} className={cn("h-2 w-2 md:h-2.5 md:w-2.5 rounded-full border border-white/20 transition-all", i < count ? activeColor : "bg-black/40")} />))}</div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <Card className="bg-black border-2 border-white/10 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-950/60 to-black p-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 md:gap-6">
            <div className="h-14 md:h-16 px-4 md:px-6 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-4 md:gap-6">
               <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-primary">INN</span>
                  {adminMode ? (
                    <Select value={inning.toString()} onValueChange={(v) => setInning(parseInt(v))}>
                      <SelectTrigger className="h-8 bg-transparent border-none p-0 focus:ring-0 text-2xl md:text-3xl font-black digit-font text-white w-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9].map(i => <SelectItem key={i} value={i.toString()} className="font-bold">{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-2xl md:text-3xl font-black digit-font text-white">{inning}</span>
                  )}
               </div>
               <button 
                  disabled={!adminMode}
                  onClick={toggleHalfInning}
                  className={cn("transition-all active:scale-90", adminMode ? "cursor-pointer hover:opacity-80" : "cursor-default")}
               >
                 {half === 'top' ? (
                    <ChevronUp className="h-6 w-6 md:h-8 md:w-8 text-secondary animate-pulse" />
                  ) : (
                    <ChevronDown className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse" />
                  )}
               </button>
            </div>
            
            <div className="flex items-center gap-4 md:gap-8 md:border-r border-white/20 md:pr-10">
              <LightIndicator label="B" count={balls} max={3} activeColor="bg-green-500 shadow-green-500" />
              <LightIndicator label="S" count={strikes} max={2} activeColor="bg-yellow-500 shadow-yellow-500" />
              <LightIndicator label="O" count={outs} max={2} activeColor="bg-red-500 shadow-red-500" />
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center justify-around md:justify-end gap-4 md:gap-6 ml-auto">
             {/* AWAY IS ALWAYS FIRST (LEFT) */}
             <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-[80px] h-[80px] md:w-[110px] md:h-[110px] border rounded-xl flex flex-col items-center justify-center transition-all duration-500",
                  half === 'top' ? "bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(46,177,217,0.2)]" : "bg-black/40 border-white/10"
                )}>
                  <span className={cn("text-[8px] md:text-[10px] font-black uppercase", half === 'top' ? "text-secondary" : "text-muted-foreground")}>AWAY</span>
                  <span className="text-3xl md:text-5xl font-black digit-font text-white">{contextAwayScore}</span>
                </div>
                <div className="h-5 flex items-center justify-center">
                  {isOurTeamAway && (
                    <Badge className="bg-primary text-white font-black text-[7px] md:text-[9px] uppercase tracking-[0.2em] rounded-md px-2 py-0.5 border-none shadow-lg whitespace-nowrap">
                      {currentTeamName}
                    </Badge>
                  )}
                </div>
             </div>
             <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-[80px] h-[80px] md:w-[110px] md:h-[110px] border rounded-xl flex flex-col items-center justify-center transition-all duration-500",
                  half === 'bottom' ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(66,133,255,0.2)]" : "bg-black/40 border-white/10"
                )}>
                  <span className={cn("text-[8px] md:text-[10px] font-black uppercase", half === 'bottom' ? "text-primary" : "text-muted-foreground")}>HOME</span>
                  <span className="text-3xl md:text-5xl font-black digit-font text-white">{contextHomeScore}</span>
                </div>
                <div className="h-5 flex items-center justify-center">
                  {isOurTeamHome && (
                    <Badge className="bg-primary text-white font-black text-[7px] md:text-[9px] uppercase tracking-[0.2em] rounded-md px-2 py-0.5 border-none shadow-lg whitespace-nowrap">
                      {currentTeamName}
                    </Badge>
                  )}
                </div>
             </div>
          </div>
        </div>

        <CardContent className="p-0 overflow-x-auto scrollbar-hide bg-black/40">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/20">
                <th className="p-3 text-left w-32">Team Status</th>
                {[1,2,3,4,5,6,7,8,9].map(i=><th key={i} className="p-3 border-l border-white/10">{i}</th>)}
                <th className="p-3 border-l-2 border-white/20 bg-primary/5">R</th>
                <th className="p-3 border-l border-white/10">H</th>
                <th className="p-3 border-l border-white/10">E</th>
              </tr>
            </thead>
            <tbody className="digit-font">
              <tr className={cn(
                "border-b border-white/10 transition-colors duration-300",
                half === 'top' ? "bg-secondary/10 border-l-4 border-l-secondary" : "bg-transparent border-l-4 border-l-transparent"
              )}>
                <td className="p-3 flex items-center gap-2">
                  <span className={cn("text-xs font-black uppercase", half === 'top' ? "text-secondary" : "text-muted-foreground/60")}>Away</span>
                  {half === 'top' && (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                      <span className="text-[8px] font-black text-secondary uppercase tracking-tighter">BATTING</span>
                    </div>
                  )}
                </td>
                {awayLineScore.map((s,i)=><td key={i} className={cn("p-3 text-center border-l border-white/10 text-sm font-bold", half === 'top' && inning === i + 1 ? "text-secondary bg-secondary/5" : "text-white/40")}>{s||'-'}</td>)}
                <td className="p-3 text-center border-l-2 border-white/20 font-black text-white text-lg bg-secondary/5">{contextAwayScore}</td>
                <td className="p-3 text-center border-l border-white/10 text-sm font-bold text-white/60">{awayHits}</td>
                <td className="p-3 text-center border-l border-white/10 text-sm font-bold text-white/60">{awayErrors}</td>
              </tr>
              <tr className={cn(
                "transition-colors duration-300",
                half === 'bottom' ? "bg-primary/10 border-l-4 border-l-primary" : "bg-transparent border-l-4 border-l-transparent"
              )}>
                <td className="p-3 flex items-center gap-2">
                  <span className={cn("text-xs font-black uppercase", half === 'bottom' ? "text-primary" : "text-muted-foreground/60")}>Home</span>
                  {half === 'bottom' && (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[8px] font-black text-primary uppercase tracking-tighter">BATTING</span>
                    </div>
                  )}
                </td>
                {homeLineScore.map((s,i)=><td key={i} className={cn("p-3 text-center border-l border-white/10 text-sm font-bold", half === 'bottom' && inning === i + 1 ? "text-primary bg-primary/5" : "text-white/40")}>{s||'-'}</td>)}
                <td className="p-3 text-center border-l-2 border-white/20 font-black text-white text-lg bg-primary/5">{contextHomeScore}</td>
                <td className="p-3 text-center border-l border-white/10 text-sm font-bold text-white/60">{homeHits}</td>
                <td className="p-3 text-center border-l border-white/10 text-sm font-bold text-white/60">{homeErrors}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      {adminMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-white/10 p-4 space-y-4 shadow-xl">
            <div className="grid grid-cols-3 gap-3">
              <Button onClick={()=>setBalls(prev=>prev===3?0:prev+1)} className="h-16 md:h-20 flex flex-col bg-green-900/40 border border-green-800/40 font-black hover:bg-green-800/60 transition-all"><span className="text-[8px] uppercase tracking-tighter opacity-70">+ BALL</span><span className="text-xl md:text-2xl text-green-400">{balls}</span></Button>
              <Button onClick={()=>setStrikes(prev=>prev===2?0:prev+1)} className="h-16 md:h-20 flex flex-col bg-yellow-900/40 border border-yellow-800/40 font-black hover:bg-yellow-800/60 transition-all"><span className="text-[8px] uppercase tracking-tighter opacity-70">+ STRIKE</span><span className="text-xl md:text-2xl text-yellow-400">{strikes}</span></Button>
              <Button onClick={()=>setOuts(prev=>prev===2?0:prev+1)} className="h-16 md:h-20 flex flex-col bg-red-900/40 border border-red-800/40 font-black hover:bg-red-800/60 transition-all"><span className="text-[8px] uppercase tracking-tighter opacity-70">+ OUT</span><span className="text-xl md:text-2xl text-red-400">{outs}</span></Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={()=>{setBalls(0);setStrikes(0);}} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest border-white/10 hover:bg-white/5 transition-all">Reset Count</Button>
              <Button variant="outline" onClick={nextHalfInning} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest border-white/10 hover:bg-white/5 transition-all">Change Half</Button>
            </div>
          </Card>
          
          <Card className="bg-card/50 border-white/10 p-4 grid grid-cols-3 gap-4 shadow-xl">
             <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center justify-between border border-white/5">
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Runs</span>
                <span className="text-xl md:text-2xl font-black digit-font text-white">{half==='top'?awayLineScore[inning-1]:homeLineScore[inning-1]}</span>
                <div className="flex gap-1">
                   <Button onClick={()=>updateRuns(-1)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground"><Minus className="h-3 w-3" /></Button>
                   <Button onClick={()=>updateRuns(1)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white"><Plus className="h-3 w-3" /></Button>
                </div>
             </div>
             <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center justify-between border border-white/5">
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Hits</span>
                <span className="text-xl md:text-2xl font-black digit-font text-white">{half==='top'?awayHits:homeHits}</span>
                <div className="flex gap-1">
                   <Button onClick={() => half==='top' ? setAwayHits(h=>Math.max(0,h-1)) : setHomeHits(h=>Math.max(0,h-1))} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground"><Minus className="h-3 w-3" /></Button>
                   <Button onClick={() => half==='top' ? setAwayHits(h=>h+1) : setHomeHits(h=>h+1)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white"><Plus className="h-3 w-3" /></Button>
                </div>
             </div>
             <div className="bg-black/40 p-3 rounded-xl flex flex-col items-center justify-between border border-white/5">
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Errors</span>
                <span className="text-xl md:text-2xl font-black digit-font text-white">{half==='top'?awayErrors:homeErrors}</span>
                <div className="flex gap-1">
                   <Button onClick={() => half==='top' ? setAwayErrors(e=>Math.max(0,e-1)) : setHomeErrors(e=>Math.max(0,e-1))} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground"><Minus className="h-3 w-3" /></Button>
                   <Button onClick={() => half==='top' ? setAwayErrors(e=>e+1) : setHomeErrors(e=>e+1)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white"><Plus className="h-3 w-3" /></Button>
                </div>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
}
