
"use client";

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import PortfolioCard from '@/components/portfolio-card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingPage from '@/app/loading';
import { Button } from '@/components/ui/button';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';

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
                <LoadingPage />
            </div>
        );
    }

    return (
        <div className="py-8 px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Mening Loyihalarim</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Bu yerda siz yuklagan barcha loyihalarni boshqarishingiz mumkin.
                </p>
            </div>
            
            {myProjects && myProjects.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {myProjects.map(project => (
                        <PortfolioCard key={project.id} project={project} showAdminControls={true} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
                    <FolderKanban className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <p className="floating-text text-2xl mt-4">Siz hali hech qanday loyiha yuklamagansiz.</p>
                    <p className="text-muted-foreground mt-2 mb-6">Ijodingizni namoyish etish vaqti keldi!</p>
                    <Button asChild>
                        <Link href="/account/new-project">Birinchi Loyihani Yuklash</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}

    