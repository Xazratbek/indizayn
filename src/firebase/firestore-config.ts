
import { initializeFirebase } from ".";

// This is a separate config file specifically for Firestore to be used in server-side contexts like API routes
// where we don't want the full client-side provider setup.
// It safely initializes Firebase, ensuring it's only done once.
const { firestore } = initializeFirebase();

export const db = firestore;
