"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, Loader2, UserCheck, LayoutDashboard, BarChart2, PlusSquare, Pencil } from 'lucide-react';
import PortfolioCard from '@/components/portfolio-card';
import { useState, useEffect } from 'react';
import type { Designer, Project } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
    <div className="text-center bg-secondary p-4 rounded-lg">
        <p className="text-2xl font-bold font-headline">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
    </div>
);


export default function AccountDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const id = user?.uid;

  // Fetch designer's profile
  const designerDocRef = useMemoFirebase(() => (db && id) ? doc(db, 'users', id) : null, [db, id]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  // Fetch designer's projects
  const projectsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'projects'), where('designerId', '==', id)) : null, [db, id]);
  const { data: designerProjects, isLoading: areProjectsLoading } = useCollection<Project>(projectsQuery);

  const isLoading = isDesignerLoading || areProjectsLoading || isUserLoading;

  if (isLoading) {
    return (
        <div className="container mx-auto py-8 px-4">
             <Card className="overflow-hidden mb-8">
                <Skeleton className="h-48 w-full"/>
                <CardContent className="p-6 relative">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20">
                         <Skeleton className="w-32 h-32 rounded-full border-4 border-background ring-2 ring-primary"/>
                         <div className="flex-1 text-center md:text-left space-y-2">
                            <Skeleton className="h-10 w-48"/>
                            <Skeleton className="h-6 w-32"/>
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
  
  if (!designer) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className='text-center'>
                <p>Profil topilmadi.</p>
                <Button asChild className="mt-4">
                    <Link href="/">Bosh sahifaga</Link>
                </Button>
            </div>
        </div>
    );
  }

  const totalLikes = designerProjects?.reduce((acc, p) => acc + p.likeCount, 0) || 0;
  const totalViews = designerProjects?.reduce((acc, p) => acc + p.viewCount, 0) || 0;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="overflow-hidden mb-8">
        <div className="h-48 bg-secondary relative">
          <Image 
            src={`https://picsum.photos/seed/${designer.id}/1200/200`} 
            alt={`${designer.name}ning muqova surati`}
            width={1200}
            height={200}
            className="w-full h-full object-cover"
            data-ai-hint="abstract pattern"
            priority
          />
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
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Obunachilar" value={designer.subscriberCount || 0} />
        <StatCard label="Loyihalar" value={designerProjects?.length || 0} />
        <StatCard label="Jami Likelar" value={totalLikes} />
        <StatCard label="Jami Ko'rishlar" value={totalViews} />
      </div>

    </div>
  );
}
