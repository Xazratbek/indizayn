
"use client";

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import PortfolioCard from '@/components/portfolio-card';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyProjectsPage() {
    const { data: session, status } = useSession();
    const user = session?.user;
    const isUserLoading = status === 'loading';
    const router = useRouter();
    const db = useFirestore();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth');
        }
    }, [status, router]);

    const myProjectsQuery = useMemoFirebase(() => 
        (db && user?.id) 
            ? query(
                collection(db, 'projects'), 
                where('designerId', '==', user.id),
                orderBy('createdAt', 'desc')
              ) 
            : null, 
    [db, user?.id]);

    const { data: myProjects, isLoading: areProjectsLoading } = useCollection<Project>(myProjectsQuery);

    const isLoading = isUserLoading || areProjectsLoading;
    
    if (isLoading || status !== 'authenticated') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Mening Loyihalarim</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Bu yerda siz yuklagan barcha loyihalarni boshqarishingiz mumkin.
                </p>
            </div>
            
            {myProjects && myProjects.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {myProjects.map(project => (
                        <PortfolioCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="floating-text text-2xl">Siz hali hech qanday loyiha yuklamagansiz.</p>
                    <p className="text-muted-foreground mt-2">Ijodingizni namoyish etish vaqti keldi!</p>
                </div>
            )}
        </div>
    )
}
