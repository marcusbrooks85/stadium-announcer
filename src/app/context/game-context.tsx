
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useFirestore } from "@/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  { id: "playoff_1", week: 11, date: "2026-08-01", time: "9:00 AM", home: "#1 Seed", away: "#4 Seed", location: "Jim Thorpe - Cordary Field", notes: "Playoffs" },
  { id: "playoff_2", week: 11, date: "2026-08-01", time: "11:00 AM", home: "#2 Seed", away: "#3 Seed", location: "Jim Thorpe - Cordary Field", notes: "Playoffs" },
  { id: "finals_1", week: 12, date: "2026-08-08", time: "9:00 AM", home: "Consolation", away: "Consolation", location: "Jim Thorpe - Cordary Field", notes: "Finals" },
  { id: "finals_2", week: 12, date: "2026-08-08", time: "11:00 AM", home: "Championship", away: "Championship", location: "Jim Thorpe - Cordary Field", notes: "Finals" }
];

export const GAME_SCHEDULE_LIST = FULL_GAME_SCHEDULE.map(g => ({
  id: g.id,
  label: `${g.notes || `Week ${g.week}`} - ${new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}`
}));

const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

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
  emailStats: () => void;
  isAdmin: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  savePlayer: (playerData: Omit<Player, 'id'>, id?: string) => void;
  deletePlayer: (id: string) => void;
  saveStadiumSong: (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => void;
  deleteStadiumSong: (category: 'organ' | 'pumpup', id: string) => void;
  reorderStadiumSongs: (category: 'organ' | 'pumpup', songs: StadiumSong[]) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const [roster, setRoster] = useState<Player[]>([]);
  const [organSongs, setOrganSongs] = useState<StadiumSong[]>([]);
  const [pumpUpSongs, setPumpUpSongs] = useState<StadiumSong[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameStats, setGameStats] = useState<any>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Initial Game ID selection based on date
  useEffect(() => {
    const now = new Date();
    const convertTimeTo24h = (timeStr: string) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const sorted = [...FULL_GAME_SCHEDULE].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Find first game that hasn't finished (start + 2h)
    const active = sorted.find(g => {
      const gameStart = new Date(`${g.date}T${convertTimeTo24h(g.time)}`);
      return gameStart.getTime() + (2 * 60 * 60 * 1000) > now.getTime();
    }) || sorted[sorted.length - 1];

    if (active && !selectedGameId) {
      setSelectedGameId(active.id);
    }
  }, [selectedGameId]);

  const resetAdminTimer = useCallback(() => {
    const expiry = Date.now() + SESSION_DURATION;
    localStorage.setItem("admin_session_expiry", expiry.toString());
  }, []);

  const adminLogout = useCallback(() => {
    setIsAdmin(false);
    localStorage.removeItem("admin_session_expiry");
  }, []);

  // Sync admin state on mount and monitor session
  useEffect(() => {
    const checkSession = () => {
      const expiry = localStorage.getItem("admin_session_expiry");
      if (expiry) {
        if (Date.now() < parseInt(expiry)) {
          setIsAdmin(true);
        } else {
          adminLogout();
        }
      }
    };
    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [adminLogout]);

  // Global inactivity listeners
  useEffect(() => {
    if (!isAdmin) return;

    const resetOnActivity = () => resetAdminTimer();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => document.addEventListener(name, resetOnActivity));
    
    return () => {
      events.forEach(name => document.removeEventListener(name, resetOnActivity));
    };
  }, [isAdmin, resetAdminTimer]);

  const adminLogin = (password: string) => {
    if (password === "Chewy2026") {
      setIsAdmin(true);
      resetAdminTimer();
      return true;
    }
    return false;
  };

  // Listeners
  useEffect(() => {
    if (!db) return;
    
    // Players
    const playersRef = collection(db, "players");
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_ROSTER.forEach((p, idx) => setDoc(doc(playersRef, `player_${idx + 1}`), p));
      } else {
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Player[];
        setRoster(loaded.sort((a, b) => a.number - b.number));
      }
    });

    // Organ Songs
    const organRef = collection(db, "organ_songs");
    const unsubOrgan = onSnapshot(organRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_ORGAN_HITS.forEach((s, idx) => setDoc(doc(organRef, `organ_${idx + 1}`), s));
      } else {
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StadiumSong[];
        setOrganSongs(loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    });

    // Pump Up Songs
    const pumpRef = collection(db, "pump_up_songs");
    const unsubPump = onSnapshot(pumpRef, (snapshot) => {
      if (snapshot.empty) {
        INITIAL_PUMP_UP_SONGS.forEach((s, idx) => setDoc(doc(pumpRef, `pump_${idx + 1}`), s));
      } else {
        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StadiumSong[];
        setPumpUpSongs(loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    });

    return () => {
      unsubPlayers();
      unsubOrgan();
      unsubPump();
    };
  }, [db]);

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

  const updateTeamScore = (team: 'home' | 'away', delta: number) => {
    if (!isAdmin) return;
    resetAdminTimer();
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
    if (!isAdmin) return;
    resetAdminTimer();
    const statsDocRef = doc(db, "game_stats", selectedGameId);
    const playerStats = gameStats.playerStats || {};
    const currentStats = playerStats[playerId] || { ab: 0, h: 0, r: 0, rbi: 0 };
    const newValue = Math.max(0, currentStats[statType] + delta);
    const updatedPlayerStats = { ...playerStats, [playerId]: { ...currentStats, [statType]: newValue } };
    setDoc(statsDocRef, { playerStats: updatedPlayerStats }, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: statsDocRef.path, operation: 'write', requestResourceData: { playerStats: updatedPlayerStats }
        }));
      });
  };

  const savePlayer = (playerData: Omit<Player, 'id'>, id?: string) => {
    if (!isAdmin || !db) return;
    resetAdminTimer();
    const docRef = id ? doc(db, "players", id) : doc(collection(db, "players"));
    setDoc(docRef, playerData, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path, operation: 'write', requestResourceData: playerData
        }));
      });
  };

  const deletePlayer = (id: string) => {
    if (!isAdmin || !db) return;
    resetAdminTimer();
    const docRef = doc(db, "players", id);
    deleteDoc(docRef).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const saveStadiumSong = (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => {
    if (!isAdmin || !db) return;
    resetAdminTimer();
    const collName = category === 'organ' ? "organ_songs" : "pump_up_songs";
    const docRef = id ? doc(db, collName, id) : doc(collection(db, collName));
    setDoc(docRef, song, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path, operation: 'write', requestResourceData: song
        }));
      });
  };

  const deleteStadiumSong = (category: 'organ' | 'pumpup', id: string) => {
    if (!isAdmin || !db) return;
    resetAdminTimer();
    const collName = category === 'organ' ? "organ_songs" : "pump_up_songs";
    const docRef = doc(db, collName, id);
    deleteDoc(docRef).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const reorderStadiumSongs = (category: 'organ' | 'pumpup', updatedSongs: StadiumSong[]) => {
    if (!isAdmin || !db) return;
    resetAdminTimer();
    const collName = category === 'organ' ? "organ_songs" : "pump_up_songs";
    const batch = writeBatch(db);
    
    updatedSongs.forEach((song, index) => {
      const docRef = doc(db, collName, song.id);
      batch.update(docRef, { order: index });
    });
    
    batch.commit().catch(async (error) => {
       console.error("Batch update failed", error);
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
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(scoreText + rosterStatsText)}`;
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
      emailStats,
      isAdmin,
      adminLogin,
      adminLogout,
      savePlayer,
      deletePlayer,
      saveStadiumSong,
      deleteStadiumSong,
      reorderStadiumSongs
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
