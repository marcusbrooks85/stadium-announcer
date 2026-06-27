
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useFirestore } from "@/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  limit 
} from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Song {
  name: string;
  videoId: string;
  startAt: number;
}

export interface PlayerStats {
  ab: number;
  h: number;
  r: number;
  rbi: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  announcementAudioUrl: string;
  songs: Song[];
  stats?: PlayerStats; // Game-specific stats
}

export const INITIAL_ROSTER: Omit<Player, 'id'>[] = [
  { name: "Dominic Barrera", number: 1, announcementAudioUrl: "/audio/Dominic.mp3", songs: [{ name: "EoO", videoId: "rltG2qA_RnA", startAt: 0 }, { name: "Brasil Com S", videoId: "yk7yVGbcpHE", startAt: 60 }, { name: "Narco", videoId: "Mf-aUJjSneo", startAt: 14 }] },
  { name: "Diomedes Plata", number: 4, announcementAudioUrl: "/audio/Diomedes.mp3", songs: [{ name: "We LA (East LA Remix)", videoId: "l-eMsVOTCY4", startAt: 80 }, { name: "Con Calma", videoId: "bNTRIdraX8c", startAt: 20 }, { name: "Mexico Mundial", videoId: "mDqvPTUuxGY", startAt: 0 }] },
  { name: "Max Camargo", number: 6, announcementAudioUrl: "/audio/Max.mp3", songs: [{ name: "Miss You", videoId: "2S5Ku0mVkzI", startAt: 0 }] },
  { name: "Alexa Franco", number: 7, announcementAudioUrl: "/audio/Alexa.mp3", songs: [{ name: "Batter Up", videoId: "olDWm2veCrM", startAt: 61 }] },
  { name: "Zeke Jacobo", number: 8, announcementAudioUrl: "/audio/Zeke.mp3", songs: [{ name: "Under Control", videoId: "cRYDSdXcT5o", startAt: 0 }] },
  { name: "Camila Brooks", number: 10, announcementAudioUrl: "/audio/Camila.mp3", songs: [{ name: "Not Like Us", videoId: "d6WiBXd3xfI", startAt: 0 }, { name: "California Love", videoId: "J7_bMdYfSws", startAt: 0 }, { name: "HUMBLE.", videoId: "ov4WobPqoSA", startAt: 1 }] },
  { name: "Jacob Vieyra", number: 11, announcementAudioUrl: "/audio/Jacob.mp3", songs: [{ name: "Tennessee Whiskey", videoId: "4zAThXFOy2c", startAt: 0 }, { name: "Blow the Whistle", videoId: "W_dJPUWdB_A", startAt: 0 }, { name: "Uprising", videoId: "Sk2Qd13GA7g", startAt: 107 }] },
  { name: "Aldrich Munoz", number: 11, announcementAudioUrl: "/audio/Aldrich.mp3", songs: [{ name: "Montagem Supersonic", videoId: "lM4v4sq8ypo", startAt: 0 }] },
  { name: "Jimena Briones", number: 12, announcementAudioUrl: "/audio/Jimena.mp3", songs: [{ name: "Watermelon Sugar", videoId: "KPM_BYl-EaQ", startAt: 0 }] },
];

export const GAME_SCHEDULE_LIST = [
  { id: "game_1", label: "Week 1 - 06/20" },
  { id: "game_2", label: "Week 2 - 06/27" },
  { id: "game_3", label: "Week 3 - 06/30" },
  { id: "game_4", label: "Week 4 - 07/07" },
  { id: "game_5", label: "Week 5 - 07/11" },
  { id: "game_6", label: "Week 6 - 07/14" },
  { id: "game_7", label: "Week 7 - 07/18" },
  { id: "game_8", label: "Week 8 - 07/21" },
  { id: "game_9", label: "Week 9 - 07/25" },
  { id: "game_10", label: "Week 10 - 07/28" },
  { id: "playoff_1", label: "Playoffs - Semi 1" },
  { id: "playoff_2", label: "Playoffs - Semi 2" },
  { id: "finals_1", label: "Finals - Consolation" },
  { id: "finals_2", label: "Finals - Championship" },
];

interface GameContextType {
  roster: Player[];
  selectedGameId: string;
  setSelectedGameId: (id: string) => void;
  homeScore: number;
  awayScore: number;
  updateTeamScore: (team: 'home' | 'away', delta: number) => void;
  updatePlayerStat: (playerId: string, statType: keyof PlayerStats, delta: number) => void;
  emailStats: () => void;
  isAdmin: boolean;
  verifyAdmin: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const [roster, setRoster] = useState<Player[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("game_1");
  const [gameStats, setGameStats] = useState<any>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Load Roster and Seed if empty
  useEffect(() => {
    if (!db) return;
    const playersRef = collection(db, "players");
    
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial roster
        INITIAL_ROSTER.forEach((p, idx) => {
          setDoc(doc(playersRef, `player_${idx + 1}`), p);
        });
      } else {
        const loadedPlayers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];
        setRoster(loadedPlayers.sort((a, b) => a.number - b.number));
      }
    });

    return () => unsubscribe();
  }, [db]);

  // 2. Load Game Stats real-time
  useEffect(() => {
    if (!db || !selectedGameId) return;
    const statsDocRef = doc(db, "game_stats", selectedGameId);

    const unsubscribe = onSnapshot(statsDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameStats(snapshot.data());
      } else {
        setGameStats({ homeScore: 0, awayScore: 0, playerStats: {} });
      }
    });

    return () => unsubscribe();
  }, [db, selectedGameId]);

  const verifyAdmin = () => {
    if (isAdmin) return true;
    const pass = window.prompt("Enter Admin Password:");
    if (pass === "Chewy2026") {
      setIsAdmin(true);
      return true;
    }
    if (pass !== null) alert("Incorrect Password");
    return false;
  };

  const updateTeamScore = (team: 'home' | 'away', delta: number) => {
    if (!verifyAdmin()) return;
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const current = gameStats[key] || 0;
    const statsDocRef = doc(db, "game_stats", selectedGameId);
    
    setDoc(statsDocRef, { [key]: Math.max(0, current + delta) }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsDocRef.path, operation: 'write', requestResourceData: { [key]: current + delta }
        }));
      });
  };

  const updatePlayerStat = (playerId: string, statType: keyof PlayerStats, delta: number) => {
    if (!verifyAdmin()) return;
    const statsDocRef = doc(db, "game_stats", selectedGameId);
    const playerStats = gameStats.playerStats || {};
    const currentStats = playerStats[playerId] || { ab: 0, h: 0, r: 0, rbi: 0 };
    
    const newValue = Math.max(0, currentStats[statType] + delta);
    const updatedPlayerStats = {
      ...playerStats,
      [playerId]: { ...currentStats, [statType]: newValue }
    };

    setDoc(statsDocRef, { playerStats: updatedPlayerStats }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsDocRef.path, operation: 'write', requestResourceData: { playerStats: updatedPlayerStats }
        }));
      });
  };

  const emailStats = () => {
    const gameLabel = GAME_SCHEDULE_LIST.find(g => g.id === selectedGameId)?.label || selectedGameId;
    const subject = `Game Report: ${gameLabel}`;
    
    const scoreText = `STADIUM REPORT\n${gameLabel}\nAway: ${gameStats.awayScore || 0} | Home: ${gameStats.homeScore || 0}\n\n`;
    const rosterStatsText = roster.map(p => {
      const s = gameStats.playerStats?.[p.id] || { ab: 0, h: 0, r: 0, rbi: 0 };
      return `${p.name} (#${p.number}): AB: ${s.ab}, H: ${s.h}, R: ${s.r}, RBI: ${s.rbi}`;
    }).join('\n');
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(scoreText + rosterStatsText)}`;
    window.location.href = mailtoUrl;
  };

  const mergedRoster = roster.map(p => ({
    ...p,
    stats: gameStats.playerStats?.[p.id] || { ab: 0, h: 0, r: 0, rbi: 0 }
  }));

  return (
    <GameContext.Provider value={{
      roster: mergedRoster,
      selectedGameId,
      setSelectedGameId,
      homeScore: gameStats.homeScore || 0,
      awayScore: gameStats.awayScore || 0,
      updateTeamScore,
      updatePlayerStat,
      emailStats,
      isAdmin,
      verifyAdmin
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error("useGame must be used within a GameProvider");
  return context;
}
