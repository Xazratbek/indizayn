
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { doc, getDocs, setDoc, serverTimestamp, collection, query, where } from "firebase/firestore";
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
      if (account?.provider !== "google" || !user.email) {
        return false; // Faqat Google va email mavjud bo'lsa davom etamiz
      }

      try {
        if (!db) {
          console.error("Firestore instance (db) is not available in next-auth route.");
          return false; // Agar DB ulanmagan bo'lsa, kirishni bloklaymiz
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Foydalanuvchi topilmadi, demak yangi akkaunt yaratamiz
          // Google'dan kelgan user.id'ni hujjat ID'si sifatida ishlatamiz.
          const newUserDocRef = doc(db, "users", user.id);
          await setDoc(newUserDocRef, {
            uid: user.id, // Bu maydonni saqlab qolamiz, chunki boshqa joylarda ishlatilishi mumkin
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
        // Agar foydalanuvchi topilsa, hech narsa qilmaymiz. Kirish muvaffaqiyatli davom etadi.
        return true;

      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false; // Xatolik yuz bersa kirishni to'xtatamiz
      }
    },

    async jwt({ token, user }) {
        if (user) {
            // Birinchi marta (signIn'dan so'ng)
            token.id = user.id;
        }
        return token;
    },

    async session({ session, token }) {
      // Har bir sessiya so'rovida token'dagi id'ni session.user'ga o'tkazamiz
      if (session?.user && token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
