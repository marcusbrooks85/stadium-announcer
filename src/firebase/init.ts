'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize the core singleton app instance
export const firebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

/**
 * Initialize Firestore with Persistent Local Cache for offline resiliency.
 * Uses multiple tab manager to coordinate across browser instances.
 */
let firestoreDb;
try {
  firestoreDb = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  // If initialization fails (e.g. already initialized elsewhere), fallback to getFirestore
  firestoreDb = getFirestore(firebaseApp);
}

export const db = firestoreDb;
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

/**
 * Maintained for backward compatibility across the rest of the application
 */
export function initializeFirebase() {
  return { firebaseApp, firestore: db, auth, storage };
}
