"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Song {
  name: string;
  videoId: string;
  startAt: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  announcementAudioUrl: string;
  songs: Song[];
  stats: { ab: number; h: number; r: number; rbi: number };
}

const INITIAL_ROSTER: Player[] = [
  {
    id: "1",
    name: "Dominic Barrera",
    number: 1,
    announcementAudioUrl: "/audio/Dominic.mp3",
    songs: [
      { name: "We LA", videoId: "rltG2qA_RnA", startAt: 0 },
      { name: "Con Calma", videoId: "yk7yVGbcpHE", startAt: 60 },
      { name: "Mexico Mundial", videoId: "Mf-aUJjSneo", startAt: 14 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 }
  },
  { 
    id: "4", 
    name: "Diomedes Plata", 
    number: 4, 
    announcementAudioUrl: "/audio/Diomedes.mp3",
    songs: [
      { name: "EoO", videoId: "l-eMsVOTCY4", startAt: 80 },
      { name: "Brasil Com S", videoId: "bNTRIdraX8c", startAt: 20 },
      { name: "Narco", videoId: "mDqvPTUuxGY", startAt: 0 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "6", 
    name: "Max Camargo", 
    number: 6, 
    announcementAudioUrl: "/audio/Max.mp3",
    songs: [{ name: "Miss You", videoId: "2S5Ku0mVkzI", startAt: 0 }],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "7", 
    name: "Alexa Franco", 
    number: 7, 
    announcementAudioUrl: "/audio/Alexa.mp3",
    songs: [{ name: "Batter Up", videoId: "olDWm2veCrM", startAt: 61 }],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "8", 
    name: "Zeke Jacobo", 
    number: 8, 
    announcementAudioUrl: "/audio/Zeke.mp3",
    songs: [{ name: "Under Control", videoId: "cRYDSdXcT5o", startAt: 0 }],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "10", 
    name: "Camila Brooks", 
    number: 10, 
    announcementAudioUrl: "/audio/Camila.mp3",
    songs: [
      { name: "Not Like Us", videoId: "d6WiBXd3xfI", startAt: 0 },
      { name: "California Love", videoId: "J7_bMdYfSws", startAt: 0 },
      { name: "HUMBLE.", videoId: "ov4WobPqoSA", startAt: 1 }
    ],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "11-j", 
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
    id: "11-a", 
    name: "Aldrich Munoz", 
    number: 11, 
    announcementAudioUrl: "/audio/Aldrich.mp3",
    songs: [{ name: "Montagem Supersonic", videoId: "lM4v4sq8ypo", startAt: 0 }],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
  { 
    id: "12", 
    name: "Jimena Briones", 
    number: 12, 
    announcementAudioUrl: "/audio/Jimena.mp3",
    songs: [{ name: "Watermelon Sugar", videoId: "KPM_BYl-EaQ", startAt: 0 }],
    stats: { ab: 0, h: 0, r: 0, rbi: 0 } 
  },
].sort((a, b) => a.number - b.number);

interface GameContextType {
  homeScore: number;
  setHomeScore: React.Dispatch<React.SetStateAction<number>>;
  awayScore: number;
  setAwayScore: React.Dispatch<React.SetStateAction<number>>;
  roster: Player[];
  updateStat: (playerId: string, type: keyof Player['stats'], delta: number) => void;
  emailStats: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [roster, setRoster] = useState<Player[]>(INITIAL_ROSTER);

  const updateStat = (playerId: string, type: keyof Player['stats'], delta: number) => {
    setRoster((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? { ...p, stats: { ...p.stats, [type]: Math.max(0, p.stats[type] + delta) } }
          : p
      )
    );
  };

  const emailStats = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
    const subject = `Minors Game Report: ${dateStr}`;
    
    const scoreText = `STADIUM REPORT\nAway: ${awayScore} | Home: ${homeScore}\n\n`;
    const rosterStatsText = [...roster].sort((a, b) => a.number - b.number).map(p => 
      `${p.name} (#${p.number}): AB: ${p.stats.ab}, H: ${p.stats.h}, R: ${p.stats.r}, RBI: ${p.stats.rbi}`
    ).join('\n');
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(scoreText + rosterStatsText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <GameContext.Provider value={{
      homeScore,
      setHomeScore,
      awayScore,
      setAwayScore,
      roster,
      updateStat,
      emailStats
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}