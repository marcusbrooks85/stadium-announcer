
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useFirestore } from "@/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  increment
} from "firebase/firestore";

export interface Song {
  name: string;
  videoId: string;
  startAt: number;
}

export interface StadiumSong {
  id: string;
  title: string;
  link: string;
  startTime: number;
  order?: number;
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
  stats?: PlayerStats;
}

interface UATGameContextType {
  roster: Player[];
  organSongs: StadiumSong[];
  pumpUpSongs: StadiumSong[];
  selectedGameId: string;
  setSelectedGameId: (id: string) => void;
  homeScore: number;
  awayScore: number;
  updateTeamScore: (team: 'home' | 'away', delta: number) => void;
  updatePlayerStat: (playerId: string, statType: keyof PlayerStats, delta: number) => void;
  isAdmin: boolean;
  savePlayer: (playerData: Omit<Player, 'id'>, id?: string) => void;
  deletePlayer: (id: string) => void;
  saveStadiumSong: (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => void;
  deleteStadiumSong: (category: 'organ' | 'pumpup', id: string) => void;
  reorderStadiumSongs: (category: 'organ' | 'pumpup', songs: StadiumSong[]) => void;
}

const UATGameContext = createContext<UATGameContextType | undefined>(undefined);

export function UATGameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const [roster, setRoster] = useState<Player[]>([]);
  const [organSongs, setOrganSongs] = useState<StadiumSong[]>([]);
  const [pumpUpSongs, setPumpUpSongs] = useState<StadiumSong[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("uat_game_1");
  const [gameStats, setGameStats] = useState<any>({});
  const [allGameStats, setAllGameStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!db) return;
    
    // UAT Collections are empty by default - no INITIAL_ROSTER or songs
    const unsubPlayers = onSnapshot(collection(db, "players_UAT"), (snap) => {
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]);
    });

    const unsubAllStats = onSnapshot(collection(db, "game_stats_UAT"), (snap) => {
      const stats: Record<string, any> = {};
      snap.forEach(d => stats[d.id] = d.data());
      setAllGameStats(stats);
    });

    const unsubOrgan = onSnapshot(collection(db, "organ_songs_UAT"), (snap) => {
      setOrganSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as StadiumSong[]);
    });

    const unsubPump = onSnapshot(collection(db, "pump_up_songs_UAT"), (snap) => {
      setPumpUpSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as StadiumSong[]);
    });

    return () => { unsubPlayers(); unsubAllStats(); unsubOrgan(); unsubPump(); };
  }, [db]);

  useEffect(() => {
    if (selectedGameId && allGameStats[selectedGameId]) {
      setGameStats(allGameStats[selectedGameId]);
    } else {
      setGameStats({});
    }
  }, [selectedGameId, allGameStats]);

  const updateTeamScore = (team: 'home' | 'away', delta: number) => {
    if (!db) return;
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const current = gameStats[key] || 0;
    setDoc(doc(db, "game_stats_UAT", selectedGameId), { [key]: Math.max(0, current + delta) }, { merge: true });
  };

  const updatePlayerStat = (playerId: string, statType: keyof PlayerStats, delta: number) => {
    if (!db) return;
    const ref = doc(db, "game_stats_UAT", selectedGameId);
    const pStats = gameStats.playerStats || {};
    const current = pStats[playerId] || { ab: 0, h: 0, r: 0, rbi: 0 };
    const newValue = Math.max(0, current[statType] + delta);
    setDoc(ref, { playerStats: { ...pStats, [playerId]: { ...current, [statType]: newValue } } }, { merge: true });
  };

  const savePlayer = (playerData: Omit<Player, 'id'>, id?: string) => {
    if (!db) return;
    setDoc(id ? doc(db, "players_UAT", id) : doc(collection(db, "players_UAT")), playerData, { merge: true });
  };

  const deletePlayer = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "players_UAT", id));
  };

  const saveStadiumSong = (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => {
    if (!db) return;
    const coll = category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT";
    setDoc(id ? doc(db, coll, id) : doc(collection(db, coll)), song, { merge: true });
  };

  const deleteStadiumSong = (category: 'organ' | 'pumpup', id: string) => {
    if (!db) return;
    deleteDoc(doc(db, category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT", id));
  };

  const reorderStadiumSongs = (category: 'organ' | 'pumpup', updatedSongs: StadiumSong[]) => {
    if (!db) return;
    const batch = writeBatch(db);
    updatedSongs.forEach((song, index) => {
      batch.update(doc(db, category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT", song.id), { order: index });
    });
    batch.commit();
  };

  return (
    <UATGameContext.Provider value={{
      roster: roster.map(p => ({ ...p, stats: gameStats.playerStats?.[p.id] || { ab: 0, h: 0, r: 0, rbi: 0 } })),
      organSongs,
      pumpUpSongs,
      selectedGameId,
      setSelectedGameId,
      homeScore: gameStats.homeScore || 0,
      awayScore: gameStats.awayScore || 0,
      updateTeamScore,
      updatePlayerStat,
      isAdmin: true, // Always true for UAT workspace
      savePlayer,
      deletePlayer,
      saveStadiumSong,
      deleteStadiumSong,
      reorderStadiumSongs
    }}>
      {children}
    </UATGameContext.Provider>
  );
}

export function useUATGame() {
  const context = useContext(UATGameContext);
  if (context === undefined) throw new Error("useUATGame must be used within a UATGameProvider");
  return context;
}
