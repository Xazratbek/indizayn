
"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "../loading";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect them to the account page.
    if (status === "authenticated") {
      router.replace("/account");
    }
  }, [status, router]);

  const handleSignIn = () => {
    signIn('google');
  }

  // While checking session status, show a loader.
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingPage />
      </div>
    );
  }
  
  // If user is authenticated, they are being redirected. Show a loader.
  if (status === "authenticated") {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingPage />
        <p className="ml-4">Hisobingizga yo'naltirilmoqda...</p>
      </div>
    );
  }

  // If user is not authenticated, show the sign-in page.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">inDizayn-ga Xush Kelibsiz!</CardTitle>
                <CardDescription>Boshlash uchun hisobingizga kiring yoki ro'yxatdan o'ting.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full h-12 text-base" onClick={handleSignIn}>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google bilan davom etish
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
