'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services and returns the app, firestore, auth, and storage instances.
 * Ensures the config is always trimmed and properly passed to prevent validation errors.
 */
export function initializeFirebase() {
  const config = {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey.trim(),
  };

  const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  const storage = getStorage(firebaseApp);

  return { firebaseApp, firestore, auth, storage };
}
