'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

/**
 * Ensures Firebase is initialized once on the client and provides context to children.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // Initialize on mount
    setFirebase(initializeFirebase());
  }, []);

  if (!firebase) {
    return null; // Or a professional stadium loader
  }

  return (
    <FirebaseProvider
      firebaseApp={firebase.firebaseApp}
      firestore={firebase.firestore}
      auth={firebase.auth}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
