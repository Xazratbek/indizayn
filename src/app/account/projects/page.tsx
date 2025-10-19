
"use client";

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import PortfolioCard from '@/components/portfolio-card';
import { Loader2 } from 'lucide-react';

export default function MyProjectsPage() {
    const { user, isUserLoading } = useUser();
    const db = useFirestore();

    const myProjectsQuery = useMemoFirebase(() => 
        (db && user) 
            ? query(
                collection(db, 'projects'), 
                where('designerId', '==', user.uid),
                orderBy('createdAt', 'desc')
              ) 
            : null, 
    [db, user]);

    const { data: myProjects, isLoading: areProjectsLoading } = useCollection<Project>(myProjectsQuery);

    const isLoading = isUserLoading || areProjectsLoading;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Mening Loyihalarim</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Bu yerda siz yuklagan barcha loyihalarni boshqarishingiz mumkin.
                </p>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : myProjects && myProjects.length > 0 ? (
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
