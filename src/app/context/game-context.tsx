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
  increment,
  getDoc
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

export const INITIAL_ROSTER: Omit<Player, 'id'>[] = [
  { name: "Dominic Barrera", number: 1, announcementAudioUrl: "/audio/Dominic.mp3", songs: [{ name: "EoO", videoId: "R83_B-T0O6g", startAt: 0 }, { name: "Brasil Com S", videoId: "yk7yVGbcpHE", startAt: 60 }, { name: "Narco", videoId: "Mf-aUJjSneo", startAt: 14 }] },
  { name: "Diomedes Plata", number: 4, announcementAudioUrl: "/audio/Diomedes.mp3", songs: [{ name: "We LA (East LA Remix)", videoId: "l-eMsVOTCY4", startAt: 80 }, { name: "Con Calma", videoId: "8j_Y-5GZ_1U", startAt: 20 }, { name: "Mexico Mundial", videoId: "mDqvPTUuxGY", startAt: 0 }] },
  { name: "Max Camargo", number: 6, announcementAudioUrl: "/audio/Max.mp3", songs: [{ name: "Miss You", videoId: "2S5Ku0mVkzI", startAt: 0 }] },
  { name: "Alexa Franco", number: 7, announcementAudioUrl: "/audio/Alexa.mp3", songs: [{ name: "Batter Up", videoId: "olDWm2veCrM", startAt: 61 }] },
  { name: "Zeke Jacobo", number: 8, announcementAudioUrl: "/audio/Zeke.mp3", songs: [{ name: "Under Control", videoId: "cRYDSdXcT5o", startAt: 0 }] },
  { name: "Camila Brooks", number: 10, announcementAudioUrl: "/audio/Camila.mp3", songs: [{ name: "Not Like Us", videoId: "d6WiBXd3xfI", startAt: 0 }, { name: "California Love", videoId: "J7_bMdYfSws", startAt: 0 }, { name: "HUMBLE.", videoId: "ov4WobPqoSA", startAt: 1 }] },
  { name: "Jacob Vieyra", number: 11, announcementAudioUrl: "/audio/Jacob.mp3", songs: [{ name: "Tennessee Whiskey", videoId: "4zAThXFOy2c", startAt: 0 }, { name: "Blow the Whistle", videoId: "W_dJPUWdB_A", startAt: 0 }, { name: "Uprising", videoId: "Sk2Qd13GA7g", startAt: 107 }] },
  { name: "Aldrich Munoz", number: 11, announcementAudioUrl: "/audio/Aldrich.mp3", songs: [{ name: "Montagem Supersonic", videoId: "lM4v4sq8ypo", startAt: 0 }] },
  { name: "Jimena Briones", number: 12, announcementAudioUrl: "/audio/Jimena.mp3", songs: [{ name: "Watermelon Sugar", videoId: "KPM_BYl-EaQ", startAt: 0 }] },
];

export const INITIAL_ORGAN_HITS = [
  { title: "BULLFIGHTER", link: "melJslO0IJY", startTime: 0, order: 0 },
  { title: "JAWS", link: "QPwozG816lk", startTime: 0, order: 1 },
  { title: "LET'S GO TEAM", link: "kzTfu6LwbD8", startTime: 0, order: 2 },
  { title: "TAKE ME OUT", link: "QamKhi1cxIs", startTime: 0, order: 3 },
  { title: "THREE CHARGES", link: "jcylen-X1no", startTime: 0, order: 4 },
  { title: "CAVALRY CHARGE", link: "1aQ3nk-W0GI", startTime: 0, order: 5 },
];

export const INITIAL_PUMP_UP_SONGS = [
  { title: "DODGERS", link: "4KwFuGtGU6c", startTime: 10, order: 0 },
  { title: "ROCK YOU", link: "TXGbhniTBrU", startTime: 0, order: 1 },
  { title: "PUMP IT", link: "fSvPktHcxtg", startTime: 0, order: 2 },
  { title: "DANCE NOW", link: "l5Zox5O3jh4", startTime: 0, order: 3 },
  { title: "CAN'T STOP", link: "0Ui-QzihJGo", startTime: 0, order: 4 },
  { title: "PASSO BEM", link: "KgayxOF4Y7E", startTime: 0, order: 5 },
];

export const FULL_GAME_SCHEDULE = [
  { id: "game_1", week: 1, date: "2026-06-20", time: "2:00 PM", home: "Coach Alexis", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { id: "game_2", week: 2, date: "2026-06-27", time: "9:00 AM", home: "Coach Matt & Rene", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { id: "game_3", week: 3, date: "2026-06-30", time: "6:00 PM", home: "Coach Chewy", away: "Coach Manny", location: "Jim Thorpe - Prairie Field" },
  { id: "game_4", week: 4, date: "2026-07-07", time: "6:00 PM", home: "Coach Chewy", away: "Coach Alexis", location: "Jim Thorpe - Cordary Field" },
  { id: "game_5", week: 5, date: "2026-07-11", time: "11:00 AM", home: "Coach Chewy", away: "Coach Matt & Rene", location: "Jim Thorpe - Cordary Field" },
  { id: "game_6", week: 6, date: "2026-07-14", time: "6:00 PM", home: "Coach Manny", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { id: "game_7", week: 7, date: "2026-07-18", time: "9:00 AM", home: "Coach Alexis", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { id: "game_8", week: 8, date: "2026-07-21", time: "6:00 PM", home: "Coach Chewy", away: "Coach Matt & Rene", location: "Jim Thorpe - Prairie Field" },
  { id: "game_9", week: 9, date: "2026-07-25", time: "9:00 AM", home: "Coach Manny", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field" },
  { id: "game_10", week: 10, date: "2026-07-28", time: "6:00 PM", home: "Coach Matt & Rene", away: "Coach Chewy", location: "Jim Thorpe - Prairie Field" },
  { id: "game_11", week: 11, date: "2026-08-01", time: "9:00 AM", home: "Playoffs TBD", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field", notes: "Semi-Finals" },
  { id: "game_12", week: 12, date: "2026-08-08", time: "9:00 AM", home: "Finals TBD", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field", notes: "Championship" },
];

export const GAME_SCHEDULE_LIST = FULL_GAME_SCHEDULE.map(g => ({
  id: g.id,
  label: `${g.notes || `Week ${g.week}`} - ${new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}`
}));

interface GameContextType {
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
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  savePlayer: (playerData: Omit<Player, 'id'>, id?: string) => void;
  deletePlayer: (id: string) => void;
  saveStadiumSong: (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => void;
  deleteStadiumSong: (category: 'organ' | 'pumpup', id: string) => void;
  reorderStadiumSongs: (category: 'organ' | 'pumpup', songs: StadiumSong[]) => void;
  triggerSync: () => void;
  emailStats: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const [roster, setRoster] = useState<Player[]>([]);
  const [organSongs, setOrganSongs] = useState<StadiumSong[]>([]);
  const [pumpUpSongs, setPumpUpSongs] = useState<StadiumSong[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameStats, setGameStats] = useState<any>({});
  const [allGameStats, setAllGameStats] = useState<Record<string, any>>({});
  const [gameWins, setGameWins] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const now = new Date();
    const sorted = [...FULL_GAME_SCHEDULE].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const active = sorted.find(g => new Date(g.date).getTime() + (2 * 60 * 60 * 1000) > now.getTime()) || sorted[sorted.length - 1];
    if (active && !selectedGameId) setSelectedGameId(active.id);
  }, [selectedGameId]);

  const triggerSync = useCallback(async () => {
    if (!db) return;

    const convertTimeTo24h = (timeStr: string) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const now = new Date();
    
    for (const game of FULL_GAME_SCHEDULE) {
      const gameStart = new Date(`${game.date}T${convertTimeTo24h(game.time)}`);
      const syncThreshold = new Date(gameStart.getTime() + 2 * 60 * 60 * 1000);

      if (now >= syncThreshold) {
        const stats = allGameStats[game.id];
        const winStatus = gameWins[game.id];

        if (stats && (!stats.statsSynced || !winStatus)) {
          const homeScore = stats.homeScore || 0;
          const awayScore = stats.awayScore || 0;
          
          if (homeScore > 0 || awayScore > 0) {
            const chewyIsHome = game.home === "Coach Chewy";
            const won = homeScore === awayScore ? null : (chewyIsHome ? (homeScore > awayScore) : (awayScore > homeScore));

            const batch = writeBatch(db);
            batch.set(doc(db, "game_wins", game.id), {
              won: won,
              updatedAt: new Date().toISOString(),
              autoSynced: true
            }, { merge: true });

            batch.update(doc(db, "game_stats", game.id), { statsSynced: true });

            const standingsRef = doc(db, "standings", "chewy_team_2026");
            const updateData: any = { updatedAt: new Date().toISOString() };
            if (won === true) updateData.wins = increment(1);
            else if (won === false) updateData.losses = increment(1);
            else if (homeScore === awayScore && homeScore > 0) updateData.ties = increment(1);
            
            batch.set(standingsRef, updateData, { merge: true });
            await batch.commit();
          }
        }
      }
    }
  }, [db, allGameStats, gameWins]);

  useEffect(() => {
    if (!db) return;
    
    const unsubPlayers = onSnapshot(collection(db, "players"), (snap) => {
      if (snap.empty) {
        INITIAL_ROSTER.forEach((p, idx) => setDoc(doc(db, "players", `player_${idx + 1}`), p));
      } else {
        setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]);
      }
    });

    const unsubWins = onSnapshot(collection(db, "game_wins"), (snap) => {
      const wins: Record<string, any> = {};
      snap.forEach(d => wins[d.id] = d.data());
      setGameWins(wins);
    });

    const unsubAllStats = onSnapshot(collection(db, "game_stats"), (snap) => {
      const stats: Record<string, any> = {};
      snap.forEach(d => stats[d.id] = d.data());
      setAllGameStats(stats);
    });

    const unsubOrgan = onSnapshot(collection(db, "organ_songs"), (snap) => {
      if (snap.empty) {
        INITIAL_ORGAN_HITS.forEach((s, idx) => setDoc(doc(db, "organ_songs", `organ_${idx}`), s));
      } else {
        setOrganSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as StadiumSong[]);
      }
    });

    const unsubPump = onSnapshot(collection(db, "pump_up_songs"), (snap) => {
      if (snap.empty) {
        INITIAL_PUMP_UP_SONGS.forEach((s, idx) => setDoc(doc(db, "pump_up_songs", `pump_${idx}`), s));
      } else {
        setPumpUpSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as StadiumSong[]);
      }
    });

    return () => { unsubPlayers(); unsubWins(); unsubAllStats(); unsubOrgan(); unsubPump(); };
  }, [db]);

  useEffect(() => {
    if (Object.keys(allGameStats).length > 0) triggerSync();
  }, [allGameStats, triggerSync]);

  useEffect(() => {
    if (selectedGameId && allGameStats[selectedGameId]) {
      setGameStats(allGameStats[selectedGameId]);
    } else {
      setGameStats({});
    }
  }, [selectedGameId, allGameStats]);

  const adminLogin = (password: string) => {
    if (password === "Mustard2026") {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => setIsAdmin(false);

  const updateTeamScore = (team: 'home' | 'away', delta: number) => {
    if (!isAdmin || !db) return;
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const current = gameStats[key] || 0;
    setDoc(doc(db, "game_stats", selectedGameId), { [key]: Math.max(0, current + delta), statsSynced: false }, { merge: true });
  };

  const updatePlayerStat = (playerId: string, statType: keyof PlayerStats, delta: number) => {
    if (!isAdmin || !db) return;
    const ref = doc(db, "game_stats", selectedGameId);
    const pStats = gameStats.playerStats || {};
    const current = pStats[playerId] || { ab: 0, h: 0, r: 0, rbi: 0 };
    const newValue = Math.max(0, current[statType] + delta);
    setDoc(ref, { playerStats: { ...pStats, [playerId]: { ...current, [statType]: newValue } }, statsSynced: false }, { merge: true });
  };

  const savePlayer = (playerData: Omit<Player, 'id'>, id?: string) => {
    if (!isAdmin || !db) return;
    setDoc(id ? doc(db, "players", id) : doc(collection(db, "players")), playerData, { merge: true });
  };

  const deletePlayer = (id: string) => {
    if (!isAdmin || !db) return;
    deleteDoc(doc(db, "players", id));
  };

  const saveStadiumSong = (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => {
    if (!isAdmin || !db) return;
    const coll = category === 'organ' ? "organ_songs" : "pump_up_songs";
    setDoc(id ? doc(db, coll, id) : doc(collection(db, coll)), song, { merge: true });
  };

  const deleteStadiumSong = (category: 'organ' | 'pumpup', id: string) => {
    if (!isAdmin || !db) return;
    deleteDoc(doc(db, category === 'organ' ? "organ_songs" : "pump_up_songs", id));
  };

  const reorderStadiumSongs = (category: 'organ' | 'pumpup', updatedSongs: StadiumSong[]) => {
    if (!isAdmin || !db) return;
    const batch = writeBatch(db);
    updatedSongs.forEach((song, index) => {
      batch.update(doc(db, category === 'organ' ? "organ_songs" : "pump_up_songs", song.id), { order: index });
    });
    batch.commit();
  };

  const emailStats = () => {
    const report = roster.map(p => `${p.name} (#${p.number}): AB:${p.stats?.ab} H:${p.stats?.h} R:${p.stats?.r} RBI:${p.stats?.rbi}`).join('\n');
    const mailto = `mailto:?subject=Game Stats - ${selectedGameId}&body=${encodeURIComponent(report)}`;
    window.location.href = mailto;
  };

  return (
    <GameContext.Provider value={{
      roster: roster.map(p => ({ ...p, stats: gameStats.playerStats?.[p.id] || { ab: 0, h: 0, r: 0, rbi: 0 } })),
      organSongs,
      pumpUpSongs,
      selectedGameId,
      setSelectedGameId,
      homeScore: gameStats.homeScore || 0,
      awayScore: gameStats.awayScore || 0,
      updateTeamScore,
      updatePlayerStat,
      isAdmin,
      adminLogin,
      adminLogout,
      savePlayer,
      deletePlayer,
      saveStadiumSong,
      deleteStadiumSong,
      reorderStadiumSongs,
      triggerSync,
      emailStats
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