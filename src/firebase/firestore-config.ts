
import { initializeFirebase } from ".";

// This is a separate config file specifically for Firestore to be used in server-side contexts like API routes
// where we don't want the full client-side provider setup.

const { firestore } = initializeFirebase();

export const db = firestore;
