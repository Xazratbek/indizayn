
"use client";

import React, { useState, useEffect } from 'react';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Initialize Firebase services
const { auth } = initializeFirebase();

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
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

    console.error('Xato kodi:', error.code, error.message);
    return errorMessages[error.code] || error.message || 'Noma\'lum xatolik yuz berdi.';
};


// ============================================
// GOOGLE AUTH COMPONENT
// ============================================
export default function AuthPage() {
  const [isProcessing, setIsProcessing] = useState(true);
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
        toast({
            title: "Xush kelibsiz!",
            description: `Profilingiz muvaffaqiyatli yaratildi.`,
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
    // 1. Check if user is returning from a redirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // User has successfully signed in via redirect.
          await saveUserToDB(result.user);
          toast({
            title: "Muvaffaqiyatli kirdingiz!",
            description: `Xush kelibsiz, ${result.user.displayName}!`,
          });
          router.replace('/account');
          // No need to set isProcessing to false, as we are redirecting away.
        } else {
          // No redirect result, now check for an existing session.
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              // User is already logged in, redirect them.
              router.replace('/account');
            } else {
              // User is not logged in and not coming from a redirect.
              // It's safe to show the login page.
              setIsProcessing(false);
            }
            unsubscribe(); // We only need to check this once on initial load.
          });
        }
      })
      .catch((err) => {
        console.error('getRedirectResult xatosi:', err);
        toast({ variant: "destructive", title: "Kirishda xatolik", description: getErrorMessage(err) });
        setIsProcessing(false);
      });
  }, [router, db]);


  // ============================================
  // GOOGLE SIGN IN (REDIRECT)
  // ============================================
  const handleSignIn = async () => {
    setIsProcessing(true);
    try {
      await signInWithRedirect(auth, googleProvider);
      // After this call, the page will redirect to Google. 
      // The logic in useEffect will handle the result upon returning.
    } catch (err: any) {
      console.error('signInWithRedirect xatosi:', err);
      toast({ variant: "destructive", title: "Kirishda xatolik", description: getErrorMessage(err) });
      setIsProcessing(false);
    }
  };


  // ============================================
  // LOADING STATE
  // ============================================
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Autentifikatsiya...
          </h2>
          <p className="text-gray-600">
             Iltimos kuting...
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

    