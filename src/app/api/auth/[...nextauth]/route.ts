
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firestore-config";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!db) {
          console.error("Firestore instance (db) is not available in next-auth route.");
          return false; // Prevent sign-in if db is not initialized
        }
        if (!user.email) {
            console.error("Email not provided by Google account.");
            return false;
        }

        try {
          // Check if a user with this email already exists
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            // User does not exist, create a new document with Google's user.id
             const newUserRef = doc(db, "users", user.id);
             await setDoc(newUserRef, {
                uid: user.id,
                name: user.name,
                email: user.email,
                photoURL: user.image,
                coverPhotoURL: '',
                createdAt: serverTimestamp(),
                specialization: 'Yangi dizayner',
                bio: '',
                subscriberCount: 0,
                followers: [],
             });
          } 
          // If user exists, do nothing, just let them sign in.
          // The correct Firestore ID will be attached in the jwt callback.

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
     async jwt({ token, user, account }) {
        // This is executed after signIn
        if (account?.provider === "google" && user?.email) {
            if (!db) return token;

            // Find the user in Firestore by email to get the correct (and stable) Firestore document ID
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // There should be only one user with this email
                const firestoreUser = querySnapshot.docs[0];
                token.id = firestoreUser.id; // Assign the Firestore document ID to the token
            } else {
                 // This case should ideally not be hit if signIn logic is correct,
                 // but as a fallback, use the google id.
                 token.id = user.id;
            }
        } else if (user) {
             token.id = user.id;
        }
        return token;
    },
    async session({ session, token }) {
      // The token.id now holds the correct Firestore document ID
      if (session?.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
