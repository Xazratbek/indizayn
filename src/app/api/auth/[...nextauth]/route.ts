
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firestore-config";

const isProduction = process.env.NODE_ENV === 'production';

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
  ...(isProduction && {
    useSecureCookies: true,
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
          domain: new URL(process.env.NEXTAUTH_URL!).hostname
        }
      },
    },
  }),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.email) {
        return false;
      }
      try {
        if (!db) {
          console.error("Firestore instance is not available.");
          return false;
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // New user, create a document with Google's user.id as the doc id
          const newUserDocRef = doc(db, "users", user.id);
          await setDoc(newUserDocRef, {
            uid: user.id, // Store uid in the document as well
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
        // If user exists, we just let them sign in.
        return true;
      } catch (error) {
        console.error("Error in signIn callback: ", error);
        return false;
      }
    },
    
    async jwt({ token, user, account, profile }) {
      if (user && user.email) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          // Set the user's Firestore document ID to the token.
          // This will be passed to the session callback.
          token.id = userDoc.id; 
        } else {
            // This case might happen on the very first sign-in
            // where the document was just created in `signIn` callback.
            // We use the google id which was used to create the doc.
            token.id = user.id
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      // Pass the user's Firestore document ID to the session object
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
