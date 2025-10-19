"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Firebase ni faqat bir marta initialize qilish
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google provider sozlamalari
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// ============================================
// XATOLARNI QAYTA ISHLASH
// ============================================
const getErrorMessage = (error: any): string => {
    const errorMessages: { [key: string]: string } = {
      'auth/popup-closed-by-user': 'Login oynasi yopildi. Qaytadan urinib ko\'ring.',
      'auth/popup-blocked': 'Brauzer popup oynani blokladi.',
      'auth/cancelled-popup-request': 'Login bekor qilindi.',
      'auth/network-request-failed': 'Internet ulanishida muammo.',
      'auth/too-many-requests': 'Juda ko\'p urinish. Biroz kuting.',
      'auth/unauthorized-domain': 'Domain ruxsat berilmagan. Firebase Console da sozlang.',
      'auth/operation-not-allowed': 'Google login Firebase Console da yoqilmagan.',
      'auth/invalid-credential': 'Noto\'g\'ri ma\'lumotlar.',
      'auth/account-exists-with-different-credential': 'Bu email boshqa usul bilan ro\'yxatdan o\'tgan.',
      'auth/user-disabled': 'Bu akkaunt o\'chirilgan.',
      'auth/internal-error': 'Ichki xatolik. Firebase sozlamalarini tekshiring.',
    };

    console.log('Xato kodi:', error.code);
    return errorMessages[error.code] || error.message || 'Noma\'lum xatolik yuz berdi.';
};


// ============================================
// GOOGLE AUTH COMPONENT
// ============================================
export default function AuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // Used for redirect start
  const db = useFirestore();
  const router = useRouter();


  // ============================================
  // DATABASE HELPER
  // ============================================
   const saveUserToDB = async (firebaseUser: User) => {
    if (!firebaseUser || !db) return;
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      try {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          specialization: 'Yangi dizayner',
          subscriberCount: 0,
          followers: [],
        });
      } catch (error) {
        console.error("Foydalanuvchini Firestorega saqlashda xatolik:", error);
        toast({
          variant: "destructive",
          title: "Ma'lumotlar bazasi xatosi",
          description: "Foydalanuvchi ma'lumotlarini saqlab bo'lmadi.",
        });
      }
    }
  };


  // ============================================
  // AUTH STATE LOGIC
  // ============================================
  useEffect(() => {
    let mounted = true;
    
    // Set initial loading state to true to handle redirect
    setIsAuthenticating(true);

    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && mounted) {
          console.log('✅ Redirect orqali muvaffaqiyatli login:', result.user.email);
          await saveUserToDB(result.user);
          toast({
            title: "Muvaffaqiyatli kirdingiz!",
            description: `Xush kelibsiz, ${result.user.displayName}!`,
          });
          router.replace('/account');
          // No need to set user state here, onAuthStateChanged will handle it
        }
      } catch (err: any) {
        console.error('❌ Redirect xatosi:', err);
        if (mounted) {
           toast({ variant: "destructive", title: "Kirishda xatolik", description: getErrorMessage(err) });
        }
      } finally {
        if(mounted){
            setIsAuthenticating(false);
        }
      }
    };

    processRedirect();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return;
      
      if (currentUser) {
         if(!user){ // Avoid re-setting user if it's already there
             console.log('👤 User holati o\'zgardi:', currentUser.email);
             setUser(currentUser);
         }
         // if user is on auth page but logged in, redirect them
         if(window.location.pathname.startsWith('/auth')) {
            router.replace('/account');
         }
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsAuthenticating(false); // Also stop authenticating indicator here
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router, db, user]);


  // ============================================
  // GOOGLE SIGN IN (REDIRECT)
  // ============================================
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      console.log('🚀 Google login boshlanyapti (redirect usuli)...');
      await signInWithRedirect(auth, googleProvider);
      // After this line, the page will redirect, so no more code will execute.
    } catch (err: any) {
      console.error('❌ Sign in xatosi:', err);
      toast({ variant: "destructive", title: "Kirishda xatolik", description: getErrorMessage(err) });
      setIsAuthenticating(false);
    }
  };


  // ============================================
  // LOADING STATE
  // ============================================
  if (loading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Yuklanmoqda...
          </h2>
          <p className="text-gray-600">
            {isAuthenticating 
              ? 'Google bilan autentifikatsiya qilinmoqda...' 
              : 'Iltimos kuting...'}
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // LOGIN PAGE
  // ============================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/>
                </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Xush kelibsiz
            </h2>
            <p className="text-gray-600">
              Davom etish uchun akkauntingizga kiring
            </p>
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-lg">Google bilan kirish</span>
          </button>

          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>
              Kirish orqali siz bizning{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-700 underline">
                Shartlar
              </a>
              {' '}ga rozilik bildirasiz
            </p>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                🔒 Xavfsiz redirect autentifikatsiya
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
