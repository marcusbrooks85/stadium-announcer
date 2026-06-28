'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  firestore: null,
  auth: null,
  storage: null,
});

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context.firebaseApp) throw new Error('useFirebaseApp must be used within FirebaseProvider');
  return context.firebaseApp;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (!context.firestore) throw new Error('useFirestore must be used within FirebaseProvider');
  return context.firestore;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context.auth) throw new Error('useAuth must be used within FirebaseProvider');
  return context.auth;
};

export const useStorage = () => {
  const context = useContext(FirebaseContext);
  if (!context.storage) throw new Error('useStorage must be used within FirebaseProvider');
  return context.storage;
};
