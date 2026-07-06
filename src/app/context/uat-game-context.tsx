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

export interface Player {
  id: string;
  name: string;
  number: number;
  announcementAudioUrl: string;
  songs: Song[];
  teamId: string;
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

interface UATGameContextType {
  user: FirebaseUser | null;
  userRole: "super_admin" | "league_admin" | "booth_admin" | "user" | null;
  userTeamId: string | null;
  teamData: Team | null;
  roster: Player[];
  organSongs: StadiumSong[];
  pumpUpSongs: StadiumSong[];
  games: Game[];
  isLoaded: boolean;
  isOnline: boolean;
  savePlayer: (data: any, id?: string) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  saveGame: (data: any, id?: string) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  saveTeamBranding: (data: any) => Promise<void>;
  updateUserRole: (uid: string, role: string) => Promise<void>;
  deleteUserAccount: (uid: string) => Promise<void>;
}

const UATGameContext = createContext<UATGameContextType | undefined>(undefined);

export function UATGameProvider({ children }: { children: ReactNode }) {
  const db = useFirestore();
  const auth = useAuth();
  
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
        }
      } else {
        setUserRole(null);
        setUserTeamId(null);
      }
    });
  }, [auth, db]);

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

    setIsLoaded(true);
    return () => {
      unsubRoster(); unsubGames(); unsubTeam(); unsubOrgan(); unsubPump();
    };
  }, [db, userTeamId, user]);

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

  return (
    <UATGameContext.Provider value={{
      user,
      userRole,
      userTeamId,
      teamData,
      roster,
      games,
      organSongs,
      pumpUpSongs,
      isLoaded,
      isOnline,
      savePlayer,
      deletePlayer,
      saveGame,
      deleteGame,
      saveTeamBranding,
      updateUserRole,
      deleteUserAccount
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
