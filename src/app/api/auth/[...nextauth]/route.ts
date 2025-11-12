
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
// O'zgartirish: `db` obyekti markazlashtirilgan `initializeFirebase` orqali olinadi.
import { initializeFirebase } from "@/firebase";
import type { Designer } from "@/lib/types";


if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID in .env");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET in .env");
}

// Firebase'ni ishga tushirish
const { firestore: db } = initializeFirebase();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 kun
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 kun
  },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.email) {
        return false;
      }

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // YANGI FOYDALANUVCHI: hujjatni 'pushSubscriptions' bilan yaratamiz
          const newUserDocRef = doc(usersRef);
          await setDoc(newUserDocRef, {
            id: newUserDocRef.id,
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
            pushSubscriptions: [] // Yangi foydalanuvchi uchun bo'sh massiv
          });
          // Cache user ID to avoid redundant query in jwt callback
          user.id = newUserDocRef.id;
        } else {
          // MAVJUD FOYDALANUVCHI: 'pushSubscriptions' maydoni borligini tekshiramiz
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          if (!userData.pushSubscriptions) {
            // Agar maydon mavjud bo'lmasa, uni qo'shamiz
            await updateDoc(userDoc.ref, {
              pushSubscriptions: []
            });
          }
          // Cache user ID and data to avoid redundant queries
          user.id = userDoc.id;
        }
        return true;
      } catch (error) {
        console.error("signIn callback xatoligi:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Optimized: Only query on initial sign-in when user object is present
      // On subsequent calls, token already has the ID
      if (user && user.id) {
        token.id = user.id;
        // Cache basic user data in token to avoid session callback query
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      // Optimized: Use cached data from token instead of querying Firestore
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // Use cached name and image from token
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
