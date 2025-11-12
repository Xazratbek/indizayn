
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
          // YANGI FOYDALANUVCHI: hujjatni 'pushSubscriptions' va 'pushNotificationsEnabled' bilan yaratamiz
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
            pushSubscriptions: [], // Yangi foydalanuvchi uchun bo'sh massiv
            pushNotificationsEnabled: false // Default: disabled
          });
        } else {
          // MAVJUD FOYDALANUVCHI: 'pushSubscriptions' va 'pushNotificationsEnabled' maydonlari borligini tekshiramiz
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const updateData: any = {};
          if (!userData.pushSubscriptions) {
            // Agar maydon mavjud bo'lmasa, uni qo'shamiz
            updateData.pushSubscriptions = [];
          }
          if (userData.pushNotificationsEnabled === undefined) {
            // Agar maydon mavjud bo'lmasa, uni qo'shamiz
            updateData.pushNotificationsEnabled = false;
          }
          if (Object.keys(updateData).length > 0) {
            await updateDoc(userDoc.ref, updateData);
          }
        }
        return true;
      } catch (error) {
        console.error("signIn callback xatoligi:", error);
        return false;
      }
    },
    
    async jwt({ token, user }) {
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
              session.user.image = userData.photoURL;
          }
      }
      return session;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
