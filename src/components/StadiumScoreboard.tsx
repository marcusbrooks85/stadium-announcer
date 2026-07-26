
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
import { Badge } from "@/components/ui/badge";
import { useGame, FULL_GAME_SCHEDULE } from "@/app/context/game-context";
import { useUATGame } from "@/app/context/uat-game-context";
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
  const uatContext = useUATGame();
  
  const context = isUAT ? uatContext : prodContext;
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

  const activeGame = (context as any).games ? (context as any).games.find((g:any) => g.id === selectedGameId) : FULL_GAME_SCHEDULE.find(g => g.id === selectedGameId);
  const isOurTeamHome = activeGame?.home?.includes('Chewy') || activeGame?.home === teamData?.name;
  const isOurTeamAway = activeGame?.away?.includes('Chewy') || activeGame?.away === teamData?.name;

  const nextHalfInning = useCallback(() => {
    setBalls(0); setStrikes(0); setOuts(0);
    if (half === 'top') setHalf('bottom');
    else { setHalf('top'); setInning(prev => Math.min(prev + 1, 9)); }
  }, [half]);

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
      <div className="flex gap-1">{Array.from({ length: max }).map((_, i) => (<div key={i} className={cn("h-2.5 w-2.5 rounded-full border border-white/10 transition-all", i < count ? activeColor : "bg-black/40")} />))}</div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <Card className="bg-black border-2 border-white/5 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900/40 to-transparent p-4 flex items-center justify-between gap-8">
          <div className="h-16 px-6 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-6">
             <div className="flex flex-col items-center"><span className="text-[8px] font-black uppercase text-primary">INN</span><span className="text-3xl font-black digit-font text-white">{inning}</span></div>
             {half === 'top' ? <ChevronUp className="h-8 w-8 text-secondary animate-pulse" /> : <ChevronDown className="h-8 w-8 text-primary animate-pulse" />}
          </div>
          <div className="grid grid-cols-3 gap-8 border-r border-white/5 pr-10">
            <LightIndicator label="B" count={balls} max={3} activeColor="bg-green-500 shadow-green-500" />
            <LightIndicator label="S" count={strikes} max={2} activeColor="bg-yellow-500 shadow-yellow-500" />
            <LightIndicator label="O" count={outs} max={2} activeColor="bg-red-500 shadow-red-500" />
          </div>
          <div className="flex items-start gap-6 ml-auto">
             <div className="flex flex-col items-center gap-2">
                <div className="w-[110px] h-[110px] bg-secondary/10 border border-secondary/20 rounded-xl flex flex-col items-center justify-center"><span className="text-[10px] font-black uppercase text-secondary">AWAY</span><span className="text-5xl font-black digit-font text-white">{contextAwayScore}</span></div>
                {isOurTeamAway && <Badge className="bg-primary text-white font-black text-[9px] uppercase tracking-widest">{currentTeamName}</Badge>}
             </div>
             <div className="flex flex-col items-center gap-2">
                <div className="w-[110px] h-[110px] bg-primary/10 border border-primary/20 rounded-xl flex flex-col items-center justify-center"><span className="text-[10px] font-black uppercase text-primary">HOME</span><span className="text-5xl font-black digit-font text-white">{contextHomeScore}</span></div>
                {isOurTeamHome && <Badge className="bg-primary text-white font-black text-[9px] uppercase tracking-widest">{currentTeamName}</Badge>}
             </div>
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground"><th className="p-3 text-left w-24">Team</th>{[1,2,3,4,5,6,7,8,9].map(i=><th key={i} className="p-3 border-l border-white/5">{i}</th>)}<th className="p-3 border-l-2 border-white/10">R</th><th className="p-3 border-l border-white/5">H</th><th className="p-3 border-l border-white/5">E</th></tr></thead>
            <tbody className="digit-font">
              <tr className="border-b border-white/5"><td className="p-3 text-xs font-black uppercase text-muted-foreground">Away</td>{awayLineScore.map((s,i)=><td key={i} className="p-3 text-center border-l border-white/5 text-sm">{s||'-'}</td>)}<td className="p-3 text-center border-l-2 border-white/10 font-black text-primary">{contextAwayScore}</td><td className="p-3 text-center border-l border-white/5 text-sm">{awayHits}</td><td className="p-3 text-center border-l border-white/5 text-sm">{awayErrors}</td></tr>
              <tr className="bg-white/[0.02]"><td className="p-3 text-xs font-black uppercase text-muted-foreground">Home</td>{homeLineScore.map((s,i)=><td key={i} className="p-3 text-center border-l border-white/5 text-sm">{s||'-'}</td>)}<td className="p-3 text-center border-l-2 border-white/10 font-black text-primary">{contextHomeScore}</td><td className="p-3 text-center border-l border-white/5 text-sm">{homeHits}</td><td className="p-3 text-center border-l border-white/5 text-sm">{homeErrors}</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      {adminMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-white/5 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button onClick={()=>setBalls(prev=>prev===3?0:prev+1)} className="h-20 flex flex-col bg-green-900/40 font-black"><span className="text-[8px]">+ BALL</span><span className="text-2xl">{balls}</span></Button>
              <Button onClick={()=>setStrikes(prev=>prev===2?0:prev+1)} className="h-20 flex flex-col bg-yellow-900/40 font-black"><span className="text-[8px]">+ STRIKE</span><span className="text-2xl">{strikes}</span></Button>
              <Button onClick={()=>setOuts(prev=>prev===2?0:prev+1)} className="h-20 flex flex-col bg-red-900/40 font-black"><span className="text-[8px]">+ OUT</span><span className="text-2xl">{outs}</span></Button>
            </div>
            <div className="flex gap-2"><Button variant="outline" onClick={()=>{setBalls(0);setStrikes(0);}} className="flex-1 h-12 font-black uppercase text-[10px]">Reset Count</Button><Button variant="outline" onClick={nextHalfInning} className="flex-1 h-12 font-black uppercase text-[10px]">Change Half</Button></div>
          </Card>
          <Card className="bg-card/50 border-white/5 p-4 grid grid-cols-3 gap-4">
             <div className="bg-black/20 p-3 rounded-xl flex flex-col items-center gap-2"><span className="text-[8px] font-black uppercase">Runs</span><span className="text-2xl font-black">{half==='top'?awayRuns:homeRuns}</span><div className="flex gap-1"><Button onClick={()=>updateRuns(-1)} variant="ghost" size="icon" className="h-8"><Minus className="h-3 w-3" /></Button><Button onClick={()=>updateRuns(1)} variant="ghost" size="icon" className="h-8"><Plus className="h-3 w-3" /></Button></div></div>
             <div className="bg-black/20 p-3 rounded-xl flex flex-col items-center gap-2"><span className="text-[8px] font-black uppercase">Hits</span><span className="text-2xl font-black">{half==='top'?awayHits:homeHits}</span><div className="flex gap-1"><Button onClick={()=>updateHits(-1)} variant="ghost" size="icon" className="h-8"><Minus className="h-3 w-3" /></Button><Button onClick={()=>updateHits(1)} variant="ghost" size="icon" className="h-8"><Plus className="h-3 w-3" /></Button></div></div>
             <div className="bg-black/20 p-3 rounded-xl flex flex-col items-center gap-2"><span className="text-[8px] font-black uppercase">Errors</span><span className="text-2xl font-black">{half==='top'?awayErrors:homeErrors}</span><div className="flex gap-1"><Button onClick={()=>updateErrors(-1)} variant="ghost" size="icon" className="h-8"><Minus className="h-3 w-3" /></Button><Button onClick={()=>updateErrors(1)} variant="ghost" size="icon" className="h-8"><Plus className="h-3 w-3" /></Button></div></div>
          </Card>
        </div>
      )}
    </div>
  );
}
