"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useUser } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'loading' | 'popup_closed' | 'error'>('idle');
    const [errorCode, setErrorCode] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            router.push('/account');
        }
    }, [user, router]);

    // Handle redirect result on component mount
    useEffect(() => {
        if (isUserLoading || !auth || user) return;
        
        // This is the crucial part for handling the redirect result.
        // It should run whenever the auth page loads.
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    // This means the user has just signed in via redirect.
                    // The onAuthStateChanged listener will handle the user state update,
                    // and the useEffect above will redirect to /account.
                    toast({
                      title: "Muvaffaqiyatli kirdingiz!",
                      description: `Xush kelibsiz, ${result.user.displayName}!`,
                    });
                }
            })
            .catch((error) => {
                console.error("Redirect natijasini olishda xatolik: ", error);
                if (error.code !== 'auth/operation-not-allowed') {
                  toast({
                      variant: "destructive",
                      title: "Kirishda xatolik",
                      description: "Tizimga qayta yo'naltirishdan so'ng xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
                  });
                } else {
                   toast({
                      variant: "destructive",
                      title: "Avtorizatsiya usuli yoqilmagan",
                      description: "Iltimos, Firebase loyihangiz sozlamalarida Google orqali kirishni yoqing.",
                    });
                }
            });
    }, [auth, router, isUserLoading, user]);


    const handlePopupSignIn = async () => {
        if (isUserLoading || !auth) return;
        setStatus('loading');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
            await signInWithPopup(auth, provider);
            // On success, the useEffect hook will redirect to /account
        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                setStatus('popup_closed');
                setErrorCode(error.code);
            } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
                // If popup is blocked, immediately try the redirect method as a fallback.
                handleRedirectSignIn();
            } else if (error.code === 'auth/operation-not-allowed') {
                setStatus('error');
                setErrorCode(error.code);
                 toast({
                    variant: "destructive",
                    title: "Ruxsat berilmagan operatsiya",
                    description: "Firebase loyihangizda Google orqali kirish usuli yoqilmagan. Iltimos, uni Firebase konsolidan faollashtiring.",
                });
            }
            else {
                setStatus('error');
                setErrorCode(error.code);
                console.error("Google Popup bilan kirishda xatolik: ", error);
                toast({
                    variant: "destructive",
                    title: "Kirishda xatolik",
                    description: error.message || "Google orqali kirishda noma'lum muammo yuz berdi.",
                });
            }
        }
    };

    const handleRedirectSignIn = async () => {
        if (isUserLoading || !auth) return;
        setStatus('loading');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        try {
            await signInWithRedirect(auth, provider);
            // The page will redirect, and the result will be handled by the useEffect hook on return.
        } catch (error: any) {
            setStatus('error');
            setErrorCode(error.code);
            console.error("Google Redirect bilan kirishda xatolik: ", error);
             if (error.code === 'auth/operation-not-allowed') {
                 toast({
                    variant: "destructive",
                    title: "Ruxsat berilmagan operatsiya",
                    description: "Firebase loyihangizda Google orqali kirish usuli yoqilmagan. Iltimos, uni Firebase konsolidan faollashtiring.",
                });
             } else {
                toast({
                    variant: "destructive",
                    title: "Kirishda xatolik",
                    description: "Google'ga yo'naltirishda muammo yuz berdi. Iltimos, qayta urinib ko'ring.",
                });
            }
        }
    };

    const isLoading = status === 'loading' || isUserLoading;

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Hisobingizga kiring</CardTitle>
                    <CardDescription>
                       Boshlash uchun Google orqali kiring yoki ro'yxatdan o'ting.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button variant="outline" className="w-full h-12 text-base" onClick={handlePopupSignIn} disabled={isLoading}>
                           {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" role="status">
                                    <span className="sr-only">Yuklanmoqda...</span>
                                </div>
                           ) : (
                                <>
                                    <GoogleIcon className="mr-2" />
                                    Google bilan davom eting
                                </>
                           )}
                        </Button>
                    </div>

                    {status === 'popup_closed' && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                            <p className="text-sm text-yellow-800 mb-3">Kirish oynasi yopildi. Qayta urinib ko'rasizmi yoki boshqa usulni sinab ko'rasizmi?</p>
                            <div className="flex justify-center gap-2">
                                <Button size="sm" onClick={handlePopupSignIn}>Qayta urinish (Popup)</Button>
                                <Button size="sm" variant="secondary" onClick={handleRedirectSignIn}>Boshqa usul (Redirect)</Button>
                            </div>
                        </div>
                    )}
                    {status === 'error' && (
                         <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
                             <p className="text-sm text-red-800">Xatolik yuz berdi. Kod: {errorCode}</p>
                         </div>
                    )}

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
                </CardContent>
            </Card>
        </div>
    );
}

    