
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const userRef = doc(db, "users", user.id);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
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
          return true;
        } catch (error) {
          console.error("Error saving user to Firestore on sign-in:", error);
          return false; // Prevent sign-in if database operation fails
        }
      }
      return true; // Allow other sign-in methods
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
        if (user) {
            token.id = user.id;
        }
        return token;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
