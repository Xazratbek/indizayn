"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

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
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/account');
        } catch (error: any) {
            // This is a common scenario - the user just closed the popup.
            // We don't want to show an error in the console for this.
            if (error.code !== 'auth/popup-closed-by-user') {
                 console.error("Error signing in with Google: ", error);
            }
        }
    };

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
                        <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogleSignIn}>
                            <GoogleIcon className="mr-2" />
                            Google bilan davom eting
                        </Button>
                    </div>
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
