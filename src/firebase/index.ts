
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// Removing getAuth and Auth as we'll no longer use firebase/auth for sessions
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This structure holds the initialized Firebase services.
interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
}

// A variable to hold the singleton instance of Firebase services.
let firebaseServices: FirebaseServices | null = null;

/**
 * Initializes Firebase and returns SDK instances.
 * It ensures that initialization happens only once (singleton pattern).
 * This function can be called on both server and client.
 */
export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Auth is no longer initialized here for client-side use
  const firestore = getFirestore(app);

  firebaseServices = {
    firebaseApp: app,
    firestore,
  };

  return firebaseServices;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
// use-user is now obsolete with next-auth
// export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
