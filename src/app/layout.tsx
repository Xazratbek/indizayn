
import type { Metadata } from 'next';
import { Roboto, Montserrat } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import AuthProvider from '@/components/AuthProvider';
import { FirebaseClientProvider } from '@/firebase';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import PushNotificationsProvider from '@/components/PushNotificationsProvider';


const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-roboto',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'inDizayn',
  description: 'Dizaynerlar uchun o\'z ishlarini namoyish qilish uchun eng zo\'r platforma.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={cn(
          'min-h-screen font-body antialiased',
          roboto.variable,
          montserrat.variable
        )}>
        <AuthProvider>
          <FirebaseClientProvider>
            <PushNotificationsProvider />
            <div className="relative flex min-h-dvh flex-col bg-background">
              <Header />
              <main className="flex-1 pb-24 md:pb-0">{children}</main>
              <Footer />
              <MobileBottomNav />
            </div>
            <Toaster />
          </FirebaseClientProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
