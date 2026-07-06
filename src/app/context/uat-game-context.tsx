"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useFirestore, useAuth } from "@/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  increment,
  getDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
  teamId: string;
  stats?: PlayerStats;
}

export interface Game {
  id: string;
  date: string;
  week: number;
  home: string;
  away: string;
  time: string;
  location: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  primaryColor: string;
  secondaryColor: string;
  ownerUid: string;
}

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
];

export const GAME_SCHEDULE_LIST = FULL_GAME_SCHEDULE.map(g => ({
  id: g.id,
  label: `Week ${g.week} - ${new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}`
}));

interface UATGameContextType {
  user: FirebaseUser | null;
  userRole: "super_admin" | "league_admin" | "booth_admin" | "user" | null;
  userTeamId: string | null;
  teamData: Team | null;
  roster: Player[];
  organSongs: StadiumSong[];
  pumpUpSongs: StadiumSong[];
  games: Game[];
  selectedGameId: string;
  setSelectedGameId: (id: string) => void;
  homeScore: number;
  awayScore: number;
  updateTeamScore: (team: 'home' | 'away', delta: number) => void;
  updatePlayerStat: (playerId: string, statType: keyof PlayerStats, delta: number) => void;
  isLoaded: boolean;
  isOnline: boolean;
  savePlayer: (data: any, id?: string) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  saveGame: (data: any, id?: string) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  saveTeamBranding: (data: any) => Promise<void>;
  updateUserRole: (uid: string, role: string) => Promise<void>;
  deleteUserAccount: (uid: string) => Promise<void>;
  saveStadiumSong: (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => Promise<void>;
  deleteStadiumSong: (category: 'organ' | 'pumpup', id: string) => Promise<void>;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  isAdmin: boolean;
  triggerSync: () => Promise<void>;
  emailStats: () => void;
}

const UATGameContext = createContext<UATGameContextType | undefined>(undefined);

export function UATGameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [organSongs, setOrganSongs] = useState<StadiumSong[]>([]);
  const [pumpUpSongs, setPumpUpSongs] = useState<StadiumSong[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [gameStats, setGameStats] = useState<any>({});
  const [allGameStats, setAllGameStats] = useState<Record<string, any>>({});
  const [gameWins, setGameWins] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Monitor Auth & User Document
  useEffect(() => {
    return onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDoc = await getDoc(doc(db, "users_UAT", authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserTeamId(data.teamId);
          // Set isAdmin if user has any administrative role
          if (['super_admin', 'league_admin', 'booth_admin'].includes(data.role)) {
            setIsAdmin(true);
          }
        }
      } else {
        setUserRole(null);
        setUserTeamId(null);
        setIsAdmin(false);
      }
    });
  }, [auth, db]);

  // Handle selected game default
  useEffect(() => {
    const now = new Date();
    const sorted = [...FULL_GAME_SCHEDULE].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const active = sorted.find(g => new Date(g.date).getTime() + (24 * 60 * 60 * 1000) > now.getTime()) || sorted[sorted.length - 1];
    if (active && !selectedGameId) setSelectedGameId(active.id);
  }, [selectedGameId]);

  // Monitor Connection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Primary Data Listeners (Tenant Isolated)
  useEffect(() => {
    if (!db || !userTeamId) {
      if (user && !userTeamId) setIsLoaded(true);
      return;
    }

    const qRoster = query(collection(db, "players_UAT"), where("teamId", "==", userTeamId));
    const unsubRoster = onSnapshot(qRoster, (snap) => {
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]);
    });

    const qGames = query(collection(db, "games_UAT"), where("teamId", "==", userTeamId), orderBy("date", "asc"));
    const unsubGames = onSnapshot(qGames, (snap) => {
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Game[]);
    });

    const unsubTeam = onSnapshot(doc(db, "teams_UAT", userTeamId), (doc) => {
      if (doc.exists()) setTeamData({ id: doc.id, ...doc.data() } as Team);
    });

    const qOrgan = query(collection(db, "organ_songs_UAT"), where("teamId", "==", userTeamId), orderBy("order", "asc"));
    const unsubOrgan = onSnapshot(qOrgan, (snap) => {
      setOrganSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as StadiumSong[]);
    });

    const qPump = query(collection(db, "pump_up_songs_UAT"), where("teamId", "==", userTeamId), orderBy("order", "asc"));
    const unsubPump = onSnapshot(qPump, (snap) => {
      setPumpUpSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as StadiumSong[]);
    });

    const unsubAllStats = onSnapshot(collection(db, "game_stats_UAT"), (snap) => {
       const stats: Record<string, any> = {};
       snap.forEach(d => {
         const data = d.data();
         if (data.teamId === userTeamId) stats[d.id] = data;
       });
       setAllGameStats(stats);
    });

    const unsubWins = onSnapshot(collection(db, "game_wins_UAT"), (snap) => {
      const wins: Record<string, any> = {};
      snap.forEach(d => {
        const data = d.data();
        if (data.teamId === userTeamId) wins[d.id] = data;
      });
      setGameWins(wins);
    });

    setIsLoaded(true);
    return () => {
      unsubRoster(); unsubGames(); unsubTeam(); unsubOrgan(); unsubPump(); unsubAllStats(); unsubWins();
    };
  }, [db, userTeamId, user]);

  useEffect(() => {
    if (selectedGameId && allGameStats[selectedGameId]) {
      setGameStats(allGameStats[selectedGameId]);
    } else {
      setGameStats({});
    }
  }, [selectedGameId, allGameStats]);

  // Management Functions
  const savePlayer = async (data: any, id?: string) => {
    if (!userTeamId) return;
    const ref = id ? doc(db, "players_UAT", id) : doc(collection(db, "players_UAT"));
    await setDoc(ref, { ...data, teamId: userTeamId }, { merge: true });
  };

  const deletePlayer = async (id: string) => {
    await deleteDoc(doc(db, "players_UAT", id));
  };

  const saveGame = async (data: any, id?: string) => {
    if (!userTeamId) return;
    const ref = id ? doc(db, "games_UAT", id) : doc(collection(db, "games_UAT"));
    await setDoc(ref, { ...data, teamId: userTeamId }, { merge: true });
  };

  const deleteGame = async (id: string) => {
    await deleteDoc(doc(db, "games_UAT", id));
  };

  const saveTeamBranding = async (data: any) => {
    if (!userTeamId) return;
    await setDoc(doc(db, "teams_UAT", userTeamId), data, { merge: true });
  };

  const updateUserRole = async (uid: string, role: string) => {
    await setDoc(doc(db, "users_UAT", uid), { role }, { merge: true });
  };

  const deleteUserAccount = async (uid: string) => {
    await deleteDoc(doc(db, "users_UAT", uid));
  };

  const saveStadiumSong = async (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => {
    if (!userTeamId) return;
    const coll = category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT";
    const ref = id ? doc(db, coll, id) : doc(collection(db, coll));
    await setDoc(ref, { ...song, teamId: userTeamId }, { merge: true });
  };

  const deleteStadiumSong = async (category: 'organ' | 'pumpup', id: string) => {
    const coll = category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT";
    await deleteDoc(doc(db, coll, id));
  };

  const updateTeamScore = (team: 'home' | 'away', delta: number) => {
    if (!isAdmin || !db || !userTeamId) return;
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const current = gameStats[key] || 0;
    setDoc(doc(db, "game_stats_UAT", selectedGameId), { 
      [key]: Math.max(0, current + delta), 
      teamId: userTeamId,
      statsSynced: false 
    }, { merge: true });
  };

  const updatePlayerStat = (playerId: string, statType: keyof PlayerStats, delta: number) => {
    if (!isAdmin || !db || !userTeamId) return;
    const ref = doc(db, "game_stats_UAT", selectedGameId);
    const pStats = gameStats.playerStats || {};
    const current = pStats[playerId] || { ab: 0, h: 0, r: 0, rbi: 0 };
    const newValue = Math.max(0, current[statType] + delta);
    setDoc(ref, { 
      playerStats: { ...pStats, [playerId]: { ...current, [statType]: newValue } }, 
      teamId: userTeamId,
      statsSynced: false 
    }, { merge: true });
  };

  const adminLogin = (password: string) => {
    if (password === "UAT2026") {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    if (userRole === 'user') setIsAdmin(false);
  };

  const triggerSync = async () => {
    toast({ title: "Sync triggered (Mock)" });
  };

  const emailStats = () => {
    const report = roster.map(p => `${p.name} (#${p.number}): AB:${p.stats?.ab} H:${p.stats?.h} R:${p.stats?.r} RBI:${p.stats?.rbi}`).join('\n');
    const mailto = `mailto:?subject=UAT Game Stats - ${selectedGameId}&body=${encodeURIComponent(report)}`;
    window.location.href = mailto;
  };

  return (
    <UATGameContext.Provider value={{
      user,
      userRole,
      userTeamId,
      teamData,
      roster: roster.map(p => ({ ...p, stats: gameStats.playerStats?.[p.id] || { ab: 0, h: 0, r: 0, rbi: 0 } })),
      games,
      organSongs,
      pumpUpSongs,
      selectedGameId,
      setSelectedGameId,
      homeScore: gameStats.homeScore || 0,
      awayScore: gameStats.awayScore || 0,
      updateTeamScore,
      updatePlayerStat,
      isLoaded,
      isOnline,
      savePlayer,
      deletePlayer,
      saveGame,
      deleteGame,
      saveTeamBranding,
      updateUserRole,
      deleteUserAccount,
      saveStadiumSong,
      deleteStadiumSong,
      adminLogin,
      adminLogout,
      isAdmin,
      triggerSync,
      emailStats
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