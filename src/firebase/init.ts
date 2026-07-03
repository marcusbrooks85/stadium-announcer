'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

const config = {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey.trim(),
};

// 1. Initialize the core singleton app instance
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);

// 2. Export the ready-to-use singleton service instances directly
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);

/**
 * Maintained for backward compatibility across the rest of the application
 */
export function initializeFirebase() {
  return { firebaseApp, firestore: db, auth, storage };
}