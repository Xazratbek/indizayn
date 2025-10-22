
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, BarChart2, PlusSquare, Pencil, LogIn, Loader2, Users, FolderKanban, Heart, Eye } from 'lucide-react';
import type { Designer, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LoadingPage from '../loading';
import { Separator } from '@/components/ui/separator';

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) => (
     <div className="flex-1 text-center p-4">
        <Icon className="w-8 h-8 mx-auto text-primary mb-2" />
        <p className="text-2xl font-bold font-headline">{value}</p>
        <p className="text-sm text-muted-foreground hidden md:block">{label}</p>
    </div>
);


export default function AccountDashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isUserLoading = status === 'loading';
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const db = useFirestore();
  
  const id = user?.id;

  // Fetch designer's profile
  const designerDocRef = useMemoFirebase(() => (db && id) ? doc(db, 'users', id) : null, [db, id]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  // Fetch designer's projects
  const projectsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'projects'), where('designerId', '==', id)) : null, [db, id]);
  const { data: designerProjects, isLoading: areProjectsLoading } = useCollection<Project>(projectsQuery);

  const isLoading = isDesignerLoading || areProjectsLoading || isUserLoading;

  const handleSignIn = () => {
    setIsSigningIn(true);
    signIn('google');
  }

  if (isUserLoading || (status === 'authenticated' && isLoading)) {
    return (
        <div className="py-8 px-4 md:px-6 lg:px-8">
             <Card className="overflow-hidden mb-8">
                <Skeleton className="h-48 w-full"/>
                <CardContent className="p-6 relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20">
                         <Skeleton className="w-32 h-32 rounded-full border-4 border-background ring-2 ring-primary"/>
                         <div className="flex-1 mt-4 md:mt-0 text-center md:text-left space-y-3">
                            <Skeleton className="h-10 w-48 mx-auto md:mx-0"/>
                            <Skeleton className="h-6 w-32 mx-auto md:mx-0"/>
                         </div>
                    </div>
                </CardContent>
             </Card>
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
             </div>
        </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-[80vh] items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Siz tizimga kirmagansiz</h2>
          <p className="text-muted-foreground mb-6">Akkauntingizni ko'rish uchun, iltimos, tizimga kiring.</p>
          <Button onClick={handleSignIn} disabled={isSigningIn}>
            {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            {isSigningIn ? 'Yo\'naltirilmoqda...' : 'Kirish / Ro\'yxatdan o\'tish'}
          </Button>
        </div>
      </div>
    );
  }
  
  // This state can happen if the user document hasn't been created in time after a new signup
  if (!designer && status === 'authenticated' && !isDesignerLoading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className='text-center'>
                <p>Profil topilmadi. Ma'lumotlar sinxronlanmoqda...</p>
                 <LoadingPage />
            </div>
        </div>
    );
  }
  
  if (!designer) return null;

  const totalLikes = designerProjects?.reduce((acc, p) => acc + p.likeCount, 0) || 0;
  const totalViews = designerProjects?.reduce((acc, p) => acc + p.viewCount, 0) || 0;
  
  return (
    <div className="py-8 px-4 md:px-6 lg:px-8">
      <Card className="overflow-hidden mb-8">
        <div className="h-48 bg-secondary relative">
          {designer.coverPhotoURL ? (
            <Image 
              src={designer.coverPhotoURL}
              alt={`${designer.name}ning muqova surati`}
              fill
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-sky-100 to-blue-200"></div>
          )}
           <div className="absolute top-4 right-4 flex gap-2">
                <Button asChild size="icon" variant="outline">
                    <Link href="/account/projects"><LayoutDashboard /><span className="sr-only">Mening Loyihalarim</span></Link>
                </Button>
                 <Button asChild size="icon" variant="outline">
                    <Link href="/account/stats"><BarChart2 /><span className="sr-only">Statistika</span></Link>
                </Button>
                 <Button asChild size="icon" variant="outline">
                    <Link href="/account/edit"><Pencil /><span className="sr-only">Profilni Tahrirlash</span></Link>
                </Button>
                <Button asChild size="icon">
                    <Link href="/account/new-project"><PlusSquare /><span className="sr-only">Yangi Loyiha</span></Link>
                </Button>
            </div>
        </div>
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background ring-2 ring-primary">
                {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                <AvatarFallback className="text-4xl">{designer.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-headline text-4xl font-bold">{designer.name}</h1>
              <p className="text-muted-foreground text-lg">{designer.specialization}</p>
            </div>
          </div>
           {designer.bio && (
            <div className="mt-8 pt-6 border-t">
                <h2 className="font-headline text-xl font-bold mb-2">Biografiya</h2>
                <p className="text-muted-foreground">{designer.bio}</p>
            </div>
           )}
        </CardContent>
      </Card>
      
      <Card className="mb-12">
        <div className="flex flex-row justify-around">
            <StatCard label="Obunachilar" value={designer.subscriberCount || 0} icon={Users} />
            <Separator orientation="vertical" className="h-24 my-auto" />
            <StatCard label="Loyihalar" value={designerProjects?.length || 0} icon={FolderKanban} />
             <Separator orientation="vertical" className="h-24 my-auto" />
            <StatCard label="Jami Likelar" value={totalLikes} icon={Heart} />
             <Separator orientation="vertical" className="h-24 my-auto" />
            <StatCard label="Jami Ko'rishlar" value={totalViews} icon={Eye} />
        </div>
      </Card>

    </div>
  );
}

    