
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

const { auth } = initializeFirebase();

// Create and configure the provider ONCE, outside of the component.
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

const loginSchema = z.object({
  email: z.string().email({ message: "To'g'ri email manzil kiriting." }),
  password: z.string().min(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak." }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: "Ism kamida 2 belgidan iborat bo'lishi kerak." }),
  email: z.string().email({ message: "To'g'ri email manzil kiriting." }),
  password: z.string().min(6, { message: "Parol kamida 6 belgidan iborat bo'lishi kerak." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;


export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });


  const getErrorMessage = (error: any): string => {
    console.error('Xato kodi:', error.code, error.message);
    const errorMessages: { [key: string]: string } = {
      'auth/popup-closed-by-user': 'Login oynasi yopildi. Qaytadan urinib ko\'ring.',
      'auth/popup-blocked': 'Brauzer popup oynani blokladi. Qayta yo\'naltirishga harakat qilinmoqda...',
      'auth/cancelled-popup-request': 'Login bekor qilindi.',
      'auth/network-request-failed': 'Internet ulanishida muammo.',
      'auth/too-many-requests': 'Juda ko\'p urinish. Biroz kuting.',
      'auth/unauthorized-domain': 'Domain ruxsat berilmagan. Firebase Console da sozlang.',
      'auth/operation-not-allowed': 'Bu autentifikatsiya usuli yoqilmagan.',
      'auth/invalid-credential': 'Email yoki parol xato.',
      'auth/wrong-password': 'Parol xato.',
      'auth/invalid-email': 'Email manzil notog\'ri formatda.',
      'auth/user-not-found': 'Bunday foydalanuvchi topilmadi.',
      'auth/email-already-in-use': 'Bu email allaqachon ro\'yxatdan o\'tgan.',
      'auth/account-exists-with-different-credential': 'Bu email boshqa usul bilan ro\'yxatdan o\'tgan.',
      'auth/user-disabled': 'Bu akkaunt o\'chirilgan.',
      'auth/internal-error': 'Ichki xatolik. Firebase sozlamalarini tekshiring.',
    };
    return errorMessages[error.code] || error.message || 'Noma\'lum xatolik yuz berdi.';
  };

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
          coverPhotoURL: '',
          createdAt: serverTimestamp(),
          specialization: 'Yangi dizayner',
          bio: '',
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
  
  const handleAuthSuccess = useCallback(async (user: User) => {
    await saveUserToDB(user);
    toast({
      title: "Muvaffaqiyatli kirdingiz!",
      description: `Xush kelibsiz, ${user.displayName}!`,
    });
    router.replace('/account');
  }, [db, router, toast]);


  useEffect(() => {
    // This effect runs once on component mount.
    // It's responsible for handling both redirect results and the initial auth state.
    setIsProcessing(true); // Indicate that we are checking auth status.

    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          // A user has successfully signed in via redirect.
          handleAuthSuccess(result.user);
        } else {
          // No redirect result, so we check the current auth state.
          // This handles cases where the user is already logged in and revisits the auth page.
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              // User is already logged in, redirect them away from the auth page.
              router.replace('/account');
            } else {
              // No user logged in, and no redirect result. It's safe to show the auth page.
              setIsLoading(false);
              setIsProcessing(false);
            }
          });
          // Return the unsubscribe function for cleanup when the component unmounts.
          return () => unsubscribe();
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
        toast({ variant: "destructive", title: "Kirishda xatolik", description: getErrorMessage(error) });
        setIsLoading(false);
        setIsProcessing(false);
      });
  }, [handleAuthSuccess, router, toast]);

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    // Use redirect method for a more robust authentication flow that avoids popup blocker issues.
    await signInWithRedirect(auth, googleProvider);
  };

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsProcessing(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Muvaffaqiyatli kirdingiz!",
        description: `Xush kelibsiz, ${userCredential.user.displayName || userCredential.user.email}!`,
      });
      router.push('/account');
    } catch (error: any) {
       toast({ variant: "destructive", title: "Kirishda xatolik", description: getErrorMessage(error) });
    } finally {
      setIsProcessing(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsProcessing(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(userCredential.user, { displayName: data.name });

        // create a new user object with the updated displayName to pass to handleAuthSuccess
        const updatedUser = { ...userCredential.user, displayName: data.name, photoURL: userCredential.user.photoURL }; 
        
        await handleAuthSuccess(updatedUser as User);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Ro'yxatdan o'tishda xatolik", description: getErrorMessage(error) });
    } finally {
      setIsProcessing(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
        <Tabs defaultValue="login" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Kirish</TabsTrigger>
                <TabsTrigger value="signup">Ro'yxatdan o'tish</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Hisobga kirish</CardTitle>
                        <CardDescription>Davom etish uchun ma'lumotlaringizni kiriting.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                            Google bilan kirish
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Yoki</span>
                            </div>
                        </div>
                        <Form {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                                <FormField control={loginForm.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={loginForm.control} name="password" render={({ field }) => (
                                    <FormItem><FormLabel>Parol</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" className="w-full" disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Kirish
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>Ro'yxatdan o'tish</CardTitle>
                        <CardDescription>Yangi hisob yaratish uchun ma'lumotlarni to'ldiring.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                            Google bilan ro'yxatdan o'tish
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Yoki</span></div>
                        </div>
                        <Form {...signupForm}>
                             <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                                <FormField control={signupForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Ism</FormLabel><FormControl><Input placeholder="To'liq ismingiz" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={signupForm.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={signupForm.control} name="password" render={({ field }) => (
                                    <FormItem><FormLabel>Parol</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" className="w-full" disabled={isProcessing}>
                                     {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Hisob yaratish
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

    