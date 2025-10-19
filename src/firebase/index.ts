
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This structure holds the initialized Firebase services.
interface FirebaseServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
}

/**
 * Initializes Firebase and returns SDK instances.
 * It ensures that initialization happens only once (singleton pattern)
 * by checking if an app with the same name is already initialized.
 * This function can be called on both server and client.
 */
export function initializeFirebase(): FirebaseServices {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);

  return {
    firebaseApp: app,
    firestore,
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
