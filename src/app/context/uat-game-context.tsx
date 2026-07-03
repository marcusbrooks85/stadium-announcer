
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useFirestore, useAuth } from "@/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  writeBatch,
  query,
  where,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

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
  teamId: string;
}

export type UATRole = "super_admin" | "league_admin" | "booth_admin" | "user";

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
  userRole: UATRole;
  userTeamId: string | null;
  savePlayer: (playerData: Omit<Player, 'id'>, id?: string) => void;
  deletePlayer: (id: string) => void;
  saveStadiumSong: (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => void;
  deleteStadiumSong: (category: 'organ' | 'pumpup', id: string) => void;
  reorderStadiumSongs: (category: 'organ' | 'pumpup', songs: StadiumSong[]) => void;
  isLoaded: boolean;
  teamBranding: { primary: string; secondary: string };
  updateBranding: (primary: string, secondary: string) => void;
}

const UATGameContext = createContext<UATGameContextType | undefined>(undefined);

export function UATGameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  
  const [roster, setRoster] = useState<Player[]>([]);
  const [organSongs, setOrganSongs] = useState<StadiumSong[]>([]);
  const [pumpUpSongs, setPumpUpSongs] = useState<StadiumSong[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("uat_game_1");
  const [gameStats, setGameStats] = useState<any>({});
  const [allGameStats, setAllGameStats] = useState<Record<string, any>>({});
  
  const [userRole, setUserRole] = useState<UATRole>("user");
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [teamBranding, setTeamBranding] = useState({ primary: "#4285FF", secondary: "#2EB1D9" });

  useEffect(() => {
    if (!db || !auth) return;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users_UAT", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const teamId = data.teamId || null;
          setUserRole(data.role || "user");
          setUserTeamId(teamId);

          if (!teamId) {
            router.push("/uat");
          } else {
            // Fetch Team Branding
            const teamDoc = await getDoc(doc(db, "teams_UAT", teamId));
            if (teamDoc.exists()) {
              const teamData = teamDoc.data();
              const primary = teamData.primaryColor || "#4285FF";
              const secondary = teamData.secondaryColor || "#2EB1D9";
              setTeamBranding({ primary, secondary });
              
              // Inject CSS variables
              document.documentElement.style.setProperty('--tenant-primary', primary);
              document.documentElement.style.setProperty('--tenant-secondary', secondary);
            }
          }
        } else {
          router.push("/uat");
        }
      } else {
        setUserRole("user");
        setUserTeamId(null);
      }
      setIsLoaded(true);
    });

    return () => unsubAuth();
  }, [db, auth, router]);

  useEffect(() => {
    if (!db || !userTeamId) return;

    // Multi-tenant isolated queries
    const qPlayers = query(collection(db, "players_UAT"), where("teamId", "==", userTeamId));
    const unsubPlayers = onSnapshot(qPlayers, (snap) => {
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]);
    });

    const qStats = query(collection(db, "game_stats_UAT"), where("teamId", "==", userTeamId));
    const unsubAllStats = onSnapshot(qStats, (snap) => {
      const stats: Record<string, any> = {};
      snap.forEach(d => stats[d.id] = d.data());
      setAllGameStats(stats);
    });

    const qOrgan = query(collection(db, "organ_songs_UAT"), where("teamId", "==", userTeamId));
    const unsubOrgan = onSnapshot(qOrgan, (snap) => {
      setOrganSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as StadiumSong[]);
    });

    const qPump = query(collection(db, "pump_up_songs_UAT"), where("teamId", "==", userTeamId));
    const unsubPump = onSnapshot(qPump, (snap) => {
      setPumpUpSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as StadiumSong[]);
    });

    return () => { 
      unsubPlayers(); 
      unsubAllStats(); 
      unsubOrgan(); 
      unsubPump(); 
    };
  }, [db, userTeamId]);

  useEffect(() => {
    if (selectedGameId && allGameStats[selectedGameId]) {
      setGameStats(allGameStats[selectedGameId]);
    } else {
      setGameStats({});
    }
  }, [selectedGameId, allGameStats]);

  const logAudit = async (actionType: string) => {
    if (!db || !auth.currentUser || !userTeamId) return;
    await setDoc(doc(collection(db, "audit_logs_UAT")), {
      timestamp: serverTimestamp(),
      operatorId: auth.currentUser.uid,
      operatorRole: userRole,
      actionType,
      teamId: userTeamId
    });
  };

  const updateBranding = async (primary: string, secondary: string) => {
    if (!db || !userTeamId || (userRole !== "super_admin" && userRole !== "league_admin")) return;
    await setDoc(doc(db, "teams_UAT", userTeamId), {
      primaryColor: primary,
      secondaryColor: secondary
    }, { merge: true });
    setTeamBranding({ primary, secondary });
    document.documentElement.style.setProperty('--tenant-primary', primary);
    document.documentElement.style.setProperty('--tenant-secondary', secondary);
    await logAudit("THEME_UPDATE");
  };

  const updateTeamScore = (team: 'home' | 'away', delta: number) => {
    if (!db || !userTeamId || (userRole !== "super_admin" && userRole !== "league_admin")) return;
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    const current = gameStats[key] || 0;
    setDoc(doc(db, "game_stats_UAT", selectedGameId), { 
      [key]: Math.max(0, current + delta),
      teamId: userTeamId 
    }, { merge: true });
  };

  const updatePlayerStat = (playerId: string, statType: keyof PlayerStats, delta: number) => {
    if (!db || !userTeamId || (userRole !== "super_admin" && userRole !== "league_admin")) return;
    const ref = doc(db, "game_stats_UAT", selectedGameId);
    const pStats = gameStats.playerStats || {};
    const current = pStats[playerId] || { ab: 0, h: 0, r: 0, rbi: 0 };
    const newValue = Math.max(0, current[statType] + delta);
    setDoc(ref, { 
      playerStats: { ...pStats, [playerId]: { ...current, [statType]: newValue } },
      teamId: userTeamId 
    }, { merge: true });
  };

  const savePlayer = (playerData: any, id?: string) => {
    if (!db || !userTeamId || userRole === "user") return;
    setDoc(id ? doc(db, "players_UAT", id) : doc(collection(db, "players_UAT")), {
      ...playerData,
      teamId: userTeamId
    }, { merge: true });
  };

  const deletePlayer = (id: string) => {
    if (!db || userRole === "user") return;
    deleteDoc(doc(db, "players_UAT", id));
  };

  const saveStadiumSong = (category: 'organ' | 'pumpup', song: any, id?: string) => {
    if (!db || !userTeamId || (userRole !== "super_admin" && userRole !== "league_admin")) return;
    const coll = category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT";
    setDoc(id ? doc(db, coll, id) : doc(collection(db, coll)), {
      ...song,
      teamId: userTeamId
    }, { merge: true });
  };

  const deleteStadiumSong = (category: 'organ' | 'pumpup', id: string) => {
    if (!db || (userRole !== "super_admin" && userRole !== "league_admin")) return;
    deleteDoc(doc(db, category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT", id));
  };

  const reorderStadiumSongs = (category: 'organ' | 'pumpup', updatedSongs: StadiumSong[]) => {
    if (!db || (userRole !== "super_admin" && userRole !== "league_admin")) return;
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
      userRole,
      userTeamId,
      savePlayer,
      deletePlayer,
      saveStadiumSong,
      deleteStadiumSong,
      reorderStadiumSongs,
      isLoaded,
      teamBranding,
      updateBranding
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
