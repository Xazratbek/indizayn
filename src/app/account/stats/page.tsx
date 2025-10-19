
"use client"

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Project, Designer } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Eye, Heart, Users } from 'lucide-react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default function MyStatsPage() {
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

    const id = user?.id;
    
    // Fetch designer's profile for subscriber count
    const designerDocRef = useMemoFirebase(() => (db && id) ? doc(db, 'users', id) : null, [db, id]);
    const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);


    // Fetch projects for stats
    const projectsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'projects'), where('designerId', '==', id)) : null, [db, id]);
    const { data: projects, isLoading: areProjectsLoading } = useCollection<Project>(projectsQuery);

    const isLoading = isUserLoading || areProjectsLoading || isDesignerLoading;
    
    if (isLoading || status !== 'authenticated') {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin h-10 w-10" />
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex items-center justify-center h-screen">
                <p>Statistikani ko'rish uchun hisobga kiring.</p>
            </div>
        );
    }

    const totalLikes = projects?.reduce((acc, p) => acc + p.likeCount, 0) || 0;
    const totalViews = projects?.reduce((acc, p) => acc + p.viewCount, 0) || 0;
    const subscriberCount = designer?.subscriberCount || 0;
    
    const chartData = projects?.map(p => ({
        name: p.name.length > 15 ? `${p.name.substring(0,15)}...` : p.name,
        'Ko\'rishlar': p.viewCount,
        'Yoqtirishlar': p.likeCount,
    })).sort((a,b) => b['Ko\'rishlar'] - a['Ko\'rishlar']).slice(0, 10) || [];


    return (
        <div className="container mx-auto py-8 px-4">
             <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Mening Statistikam</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Ijodingiz qanday natijalar keltirayotganini kuzatib boring.
                </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatCard title="Jami Yoqtirishlar" value={totalLikes} icon={Heart} />
                <StatCard title="Jami Ko'rishlar" value={totalViews} icon={Eye} />
                <StatCard title="Obunachilar" value={subscriberCount} icon={Users} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Eng Ommabop Loyihalar</CardTitle>
                </CardHeader>
                <CardContent>
                    {projects && projects.length > 0 ? (
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Ko'rishlar" fill="hsl(var(--primary))" />
                                <Bar dataKey="Yoqtirishlar" fill="hsl(var(--accent))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                         <div className="text-center py-20">
                            <p className="floating-text text-2xl">Statistika uchun hali loyihalar mavjud emas.</p>
                            <p className="text-muted-foreground mt-2">Birinchi loyihangizni yuklang va natijalarni kuzating!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
