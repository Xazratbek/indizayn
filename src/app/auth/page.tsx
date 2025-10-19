
"use client";

import { useEffect, useState } from "react";
import { 
    GoogleAuthProvider, 
    signInWithRedirect, 
    getRedirectResult,
    User
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.233,44,30.028,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function AuthPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isProcessingLogin, setIsProcessingLogin] = useState(true);

  // This function saves user data to Firestore if they don't exist
  const saveUserToDB = async (firebaseUser: User) => {
    if (!firebaseUser || !db) return;
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      try {
        // Create user document
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

        // Create initial notification to ensure collection exists
        const notificationsRef = collection(db, "notifications");
        await addDoc(notificationsRef, {
            userId: firebaseUser.uid,
            type: 'follow', // Using 'follow' as a welcome message type
            senderId: 'system',
            senderName: 'inDizayn',
            senderPhotoURL: '', // Add a system logo URL if available
            isRead: false,
            messageSnippet: `inDizayn platformasiga xush kelibsiz, ${firebaseUser.displayName}!`,
            createdAt: serverTimestamp(),
        });
        
        // Create initial message to ensure collection exists
        const messagesRef = collection(db, "messages");
        await addDoc(messagesRef, {
            senderId: "system",
            receiverId: firebaseUser.uid,
            content: `Salom, ${firebaseUser.displayName}! inDizayn jamoasi sizni qutlaydi. Platformamizda ijodingizni namoyish eting va ilhomlaning!`,
            isRead: false,
            createdAt: serverTimestamp(),
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
  
  const handleSignIn = async () => {
    if (!auth) return;
    setIsProcessingLogin(true); // Show loader when sign-in starts
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithRedirect(auth, provider);
  };

  useEffect(() => {
    // If a user object exists, they are already logged in. Redirect them.
    if (user) {
      router.replace("/account");
      return;
    }
    
    // Only proceed if auth is initialized.
    if (!auth) {
        // We could set isProcessingLogin to false here if auth is taking too long to initialize
        return;
    }

    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await saveUserToDB(result.user);
          toast({
            title: "Muvaffaqiyatli kirdingiz!",
            description: `Xush kelibsiz, ${result.user.displayName}!`,
          });
          router.replace("/account");
        } else {
          // No redirect result, user is not logged in from a redirect.
          // It's now safe to allow a new sign-in attempt.
          setIsProcessingLogin(false);
        }
      } catch (error: any) {
        console.error("Redirect natijasini olishda xatolik: ", error);
        toast({
            variant: "destructive",
            title: "Kirishda xatolik",
            description: "Tizimga qayta yo'naltirishdan so'ng xatolik yuz berdi.",
        });
        setIsProcessingLogin(false);
      }
    };
    
    processRedirect();

  }, [auth, user, router]);


  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Hisobingizga kiring</CardTitle>
          <CardDescription>
            {isProcessingLogin 
                ? "Bir lahza kutib turing..." 
                : "Boshlash uchun Google orqali kiring yoki ro'yxatdan o'ting."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessingLogin ? (
             <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" role="status">
                    <span className="sr-only">Yuklanmoqda...</span>
                </div>
            </div>
          ) : (
            <>
                <Button variant="outline" className="w-full h-12 text-base" onClick={handleSignIn}>
                    <GoogleIcon className="mr-2" />
                    Google bilan davom eting
                </Button>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Davom etish orqali siz bizning{' '}
                    <a href="#" className="underline hover:text-primary">
                        Xizmat ko'rsatish shartlari
                    </a>{' '}
                    va{' '}
                    <a href="#" className="underline hover:text-primary">
                        Maxfiylik siyosati
                    </a>mizga rozilik bildirasiz.
                </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
