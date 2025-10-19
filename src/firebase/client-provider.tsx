
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // `useMemo` ensures that `initializeFirebase` is called only once per component
  // lifecycle on the client-side. This is the single source of truth for
  // client-side Firebase services.
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
