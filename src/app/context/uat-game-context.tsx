"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
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
  orderBy,
  collectionGroup,
  limit,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSound from 'use-sound';

export interface Song {
  name: string;
  videoId: string;
  startAt: number;
}

export interface UploadedTrack {
  id: string;
  name: string;
  url: string;
  storagePath: string;
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
  uploadedTracks: UploadedTrack[];
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
  snackPlayerId?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  primaryColor: string;
  secondaryColor: string;
  ownerUid: string;
  logoUrl?: string;
}

// Global Audio Constants for Migration
const INITIAL_ORGAN_HITS = [
  { title: "BULLFIGHTER", link: "melJslO0IJY", startTime: 0, order: 0 },
  { title: "JAWS", link: "QPwozG816lk", startTime: 0, order: 1 },
  { title: "LET'S GO TEAM", link: "kzTfu6LwbD8", startTime: 0, order: 2 },
  { title: "TAKE ME OUT", link: "QamKhi1cxIs", startTime: 0, order: 3 },
  { title: "THREE CHARGES", link: "jcylen-X1no", startTime: 0, order: 4 },
  { title: "CAVALRY CHARGE", link: "1aQ3nk-W0GI", startTime: 0, order: 5 },
];

const INITIAL_PUMP_UP_SONGS = [
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
  { id: "game_11", week: 11, date: "2026-08-04", time: "6:00 PM", home: "Playoffs TBD", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field", notes: "Semi-Finals" },
  { id: "game_12", week: 12, date: "2026-08-11", time: "6:00 PM", home: "Finals TBD", away: "Coach Chewy", location: "Jim Thorpe - Cordary Field", notes: "Championship" },
];

export const GAME_SCHEDULE_LIST = FULL_GAME_SCHEDULE.map(g => ({
  id: g.id,
  label: `${(g as any).notes || `Week ${g.week}`} - ${new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}`
}));

interface UATGameContextType {
  user: FirebaseUser | null;
  userRole: "super_admin" | "league_admin" | "booth_admin" | "user" | null;
  userTeamId: string | null;
  userProfile: any | null;
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
  updateUserProfile: (uid: string, data: any) => Promise<void>;
  deleteUserAccount: (uid: string) => Promise<void>;
  saveStadiumSong: (category: 'organ' | 'pumpup', song: Omit<StadiumSong, 'id'>, id?: string) => Promise<void>;
  deleteStadiumSong: (category: 'organ' | 'pumpup', id: string) => Promise<void>;
  reorderStadiumSongs: (category: 'organ' | 'pumpup', updatedSongs: StadiumSong[]) => Promise<void>;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  isAdmin: boolean;
  triggerSync: () => Promise<void>;
  emailStats: () => void;
}

const UATGameContext = createContext<UATGameContextType | undefined>(undefined);

const RECEIVE_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

function UATGlobalMessagingListener() {
  const db = useFirestore();
  const auth = useAuth();
  const { userTeamId } = useUATGame();
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [playReceive] = useSound(RECEIVE_SOUND, { volume: 0.4 });
  
  const mountTimeRef = useRef<number>(Date.now());
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!db || !userTeamId || !auth.currentUser) return;

    const q = query(
      collectionGroup(db, "messages_UAT"),
      where("teamId", "==", userTeamId),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      if (snap.empty) return;
      const docSnap = snap.docs[0];
      const msg = docSnap.data();
      const msgId = docSnap.id;

      if (
        msg.senderId !== auth.currentUser?.uid && 
        msg.timestamp?.toMillis() > mountTimeRef.current &&
        msgId !== lastMessageIdRef.current
      ) {
        lastMessageIdRef.current = msgId;
        const currentChatId = searchParams.get('cid');
        const channelRef = docSnap.ref.parent.parent;
        const channelId = channelRef?.id;
        const isCurrentlyLookingAtThisChat = pathname === '/messages-uat' && currentChatId === channelId;

        if (!isCurrentlyLookingAtThisChat) {
          const isBoothPage = pathname === '/booth-uat';
          if (!isBoothPage) playReceive();

          const senderSnap = await getDoc(doc(db, "users_UAT", msg.senderId));
          const senderData = senderSnap.exists() ? senderSnap.data() : { firstName: "Teammate" };
          const senderName = senderData.firstName || "Teammate";
          const messageSnippet = msg.text || "Sent a notification";

          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
             new Notification(`Message from ${senderName}`, { body: messageSnippet });
          }
          
          toast({
            title: `Message from ${senderName}`,
            description: messageSnippet,
            action: (
              <button 
                onClick={() => router.push(`/messages-uat?cid=${channelId}`)}
                className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded"
              >
                VIEW
              </button>
            ),
          });
        }
      }
    });

    return () => unsubscribe();
  }, [db, userTeamId, auth.currentUser, playReceive, pathname, searchParams, toast, router]);

  return null;
}

export function UATGameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
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

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        unsubProfile = onSnapshot(doc(db, "users_UAT", authUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserProfile(data);
            setUserRole(data.role);
            setUserTeamId(data.teamId);
            setIsAdmin(['super_admin', 'league_admin', 'booth_admin'].includes(data.role));
          }
        });
      } else {
        if (unsubProfile) unsubProfile();
        setUserProfile(null);
        setUserRole(null);
        setUserTeamId(null);
        setIsAdmin(false);
      }
    });
    return () => { unsubAuth(); if (unsubProfile) unsubProfile(); };
  }, [auth, db]);

  useEffect(() => {
    if (!games.length) return;
    const now = new Date();
    const sorted = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const active = sorted.find(g => {
       const [time, modifier] = g.time.split(' ');
       let [hours, minutes] = time.split(':').map(Number);
       if (modifier === 'PM' && hours < 12) hours += 12;
       const d = new Date(g.date + 'T00:00:00');
       d.setHours(hours, minutes);
       return d.getTime() + (2 * 60 * 60 * 1000) > now.getTime();
    }) || sorted[sorted.length - 1];
    if (active && !selectedGameId) setSelectedGameId(active.id);
  }, [games, selectedGameId]);

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

  useEffect(() => {
    if (!db || !userTeamId) {
      if (user && !userTeamId) setIsLoaded(true);
      return;
    }

    const unsubRoster = onSnapshot(query(collection(db, "players_UAT"), where("teamId", "==", userTeamId)), (snap) => {
      setRoster(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]);
    });

    const unsubGames = onSnapshot(query(collection(db, "games_UAT"), where("teamId", "==", userTeamId)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Game[];
      data.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      setGames(data);
    });

    const unsubTeam = onSnapshot(doc(db, "teams_UAT", userTeamId), (doc) => {
      if (doc.exists()) setTeamData({ id: doc.id, ...doc.data() } as Team);
    });

    // Audio Assets Migrated/Mapped from Prod
    const unsubOrgan = onSnapshot(query(collection(db, "organ_songs_UAT"), where("teamId", "==", userTeamId)), (snap) => {
      if (snap.empty && userTeamId) {
        INITIAL_ORGAN_HITS.forEach((s, idx) => {
          setDoc(doc(db, "organ_songs_UAT", `${userTeamId}_organ_${idx}`), { ...s, teamId: userTeamId }, { merge: true });
        });
      } else {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StadiumSong[];
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setOrganSongs(data);
      }
    });

    const unsubPump = onSnapshot(query(collection(db, "pump_up_songs_UAT"), where("teamId", "==", userTeamId)), (snap) => {
      if (snap.empty && userTeamId) {
        INITIAL_PUMP_UP_SONGS.forEach((s, idx) => {
          setDoc(doc(db, "pump_up_songs_UAT", `${userTeamId}_pump_${idx}`), { ...s, teamId: userTeamId }, { merge: true });
        });
      } else {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StadiumSong[];
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setPumpUpSongs(data);
      }
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
    if (selectedGameId && allGameStats[selectedGameId]) setGameStats(allGameStats[selectedGameId]);
    else setGameStats({});
  }, [selectedGameId, allGameStats]);

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

  const updateUserProfile = async (uid: string, data: any) => {
    await setDoc(doc(db, "users_UAT", uid), data, { merge: true });
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

  const reorderStadiumSongs = async (category: 'organ' | 'pumpup', updatedSongs: StadiumSong[]) => {
    if (!db || !userTeamId) return;
    const coll = category === 'organ' ? "organ_songs_UAT" : "pump_up_songs_UAT";
    const batch = writeBatch(db);
    updatedSongs.forEach((song, index) => {
      batch.update(doc(db, coll, song.id), { order: index });
    });
    await batch.commit();
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
    if (password === "UAT2026") { setIsAdmin(true); return true; }
    return false;
  };

  const adminLogout = () => { if (userRole === 'user') setIsAdmin(false); };

  const triggerSync = async () => { toast({ title: "Sync triggered" }); };

  const emailStats = () => {
    const report = roster.map(p => `${p.name} (#${p.number}): AB:${p.stats?.ab} H:${p.stats?.h} R:${p.stats?.r} RBI:${p.stats?.rbi}`).join('\n');
    const mailto = `mailto:?subject=UAT Game Stats&body=${encodeURIComponent(report)}`;
    window.location.href = mailto;
  };

  return (
    <UATGameContext.Provider value={{
      user, userRole, userTeamId, userProfile, teamData, roster: roster.map(p => ({ ...p, stats: gameStats.playerStats?.[p.id] || { ab: 0, h: 0, r: 0, rbi: 0 } })),
      games, organSongs, pumpUpSongs, selectedGameId, setSelectedGameId, homeScore: gameStats.homeScore || 0, awayScore: gameStats.awayScore || 0,
      updateTeamScore, updatePlayerStat, isLoaded, isOnline, savePlayer, deletePlayer, saveGame, deleteGame, saveTeamBranding,
      updateUserProfile, deleteUserAccount, saveStadiumSong, deleteStadiumSong, reorderStadiumSongs, adminLogin, adminLogout, isAdmin, triggerSync, emailStats
    }}>
      <UATGlobalMessagingListener />
      {children}
    </UATGameContext.Provider>
  );
}

export function useUATGame() {
  const context = useContext(UATGameContext);
  if (context === undefined) throw new Error("useUATGame must be used within a UATGameProvider");
  return context;
}