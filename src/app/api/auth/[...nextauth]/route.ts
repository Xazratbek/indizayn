
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firestore-config";
import type { Designer } from "@/lib/types";

const isProduction = process.env.NODE_ENV === 'production';
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60;

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
    maxAge: ONE_WEEK_IN_SECONDS,
  },
  jwt: {
    maxAge: ONE-WEEK_IN_SECONDS,
  },
  ...(isProduction && process.env.NEXTAUTH_URL && {
    cookies: {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
          domain: new URL(process.env.NEXTAUTH_URL).hostname,
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
          const newUserDocRef = doc(usersRef);
          await setDoc(newUserDocRef, {
            id: newUserDocRef.id,
            uid: user.id, // Google's user ID
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
            token.id = userDoc.id; 
          }
        }
        return token;
      },
    
    async session({ session, token }) {
      if (session.user && token.id) {
          const userDocRef = doc(db, 'users', token.id as string);
          const userDoc = await getDoc(userDocRef);
          if(userDoc.exists()) {
              const userData = userDoc.data() as Designer;
              session.user.id = userDoc.id;
              session.user.name = userData.name;
              session.user.image = userData.photoURL; // Ensure session.user.image is the Firestore photoURL
          }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
