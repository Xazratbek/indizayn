"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, Loader2, UserCheck } from 'lucide-react';
import PortfolioCard from '@/components/portfolio-card';
import { useState, useEffect, useMemo } from 'react';
import type { Designer, Project } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function DesignerProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const db = useFirestore();
  const { user } = useUser();

  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch designer's profile
  const designerDocRef = useMemoFirebase(() => doc(db, 'users', id), [db, id]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  // Fetch designer's projects
  const projectsQuery = useMemoFirebase(() => query(collection(db, 'projects'), where('designerId', '==', id)), [db, id]);
  const { data: designerProjects, isLoading: areProjectsLoading } = useCollection<Project>(projectsQuery);
  
  // Check if the current logged-in user is already following this designer
  useEffect(() => {
    if (user && designer?.followers) {
      setIsFollowing(designer.followers.includes(user.uid));
    }
  }, [user, designer]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Obuna bo'lish uchun tizimga kiring.",
      });
      return;
    }

    if (user.uid === id) {
       toast({
        variant: "destructive",
        title: "Xatolik",
        description: "O'zingizga o'zingiz obuna bo'la olmaysiz.",
      });
      return;
    }

    const designerRef = doc(db, "users", id);
    
    try {
        if (isFollowing) {
            // Unfollow
            await updateDoc(designerRef, {
                followers: arrayRemove(user.uid),
                subscriberCount: increment(-1)
            });
            setIsFollowing(false);
            toast({ description: `${designer?.name} obunasidan chiqdingiz.` });

        } else {
            // Follow
            await updateDoc(designerRef, {
                followers: arrayUnion(user.uid),
                subscriberCount: increment(1)
            });
            setIsFollowing(true);
            toast({ description: `${designer?.name} ga obuna bo'ldingiz.` });
        }
    } catch(error) {
        console.error("Follow/unfollow error", error);
        toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Amalni bajarishda xatolik yuz berdi.",
        });
    }
  };


  const isLoading = isDesignerLoading || areProjectsLoading;

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  
  if (!designer) {
    return <div className="flex h-[80vh] items-center justify-center"><p>Dizayner topilmadi.</p></div>;
  }

  const totalLikes = designerProjects?.reduce((acc, p) => acc + p.likeCount, 0) || 0;
  const totalViews = designerProjects?.reduce((acc, p) => acc + p.viewCount, 0) || 0;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="overflow-hidden mb-12">
        <div className="h-48 bg-secondary">
          <Image 
            src={`https://picsum.photos/seed/${designer.id}99/1200/200`} 
            alt={`${designer.name}ning muqova surati`}
            width={1200}
            height={200}
            className="w-full h-full object-cover"
            data-ai-hint="abstract pattern"
            priority
          />
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
            { user && user.uid !== id && (
              <div className="flex gap-2">
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"}>
                  {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isFollowing ? "Obuna bo'lingan" : "Obuna bo'lish"}
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" /> Xabar
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{designer.subscriberCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Obunachilar</p>
              </div>
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{designerProjects?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Loyihalar</p>
              </div>
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Jami Likelar</p>
              </div>
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{totalViews}</p>
                  <p className="text-sm text-muted-foreground">Jami ko'rishlar</p>
              </div>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="font-headline text-3xl font-bold mb-8">Loyihalar</h2>
      {designerProjects && designerProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {designerProjects.map(project => (
            <PortfolioCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
         <div className="text-center py-16 border rounded-lg bg-card">
            <p className="text-muted-foreground">{designer.name} hali hech qanday loyiha yuklamagan.</p>
        </div>
      )}
    </div>
  );
}
