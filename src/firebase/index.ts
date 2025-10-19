
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This structure holds the initialized Firebase services.
interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
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
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  firebaseServices = {
    firebaseApp: app,
    auth,
    firestore,
  };

  return firebaseServices;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';

