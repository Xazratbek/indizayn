
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, updateDoc, increment, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, UserCheck, Palmtree } from 'lucide-react';
import PortfolioCard from '@/components/portfolio-card';
import { useState, useEffect } from 'react';
import type { Designer, Project } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import SendMessageDialog from '@/components/send-message-dialog';
import { useSession } from 'next-auth/react';
import LoadingPage from '@/app/loading';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DesignerProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const db = useFirestore();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isUserLoading = status === 'loading';

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  // Fetch designer's profile
  const designerDocRef = useMemoFirebase(() => (db && id) ? doc(db, 'users', id) : null, [db, id]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  // Fetch designer's projects
  const projectsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'projects'), where('designerId', '==', id)) : null, [db, id]);
  const { data: designerProjects, isLoading: areProjectsLoading } = useCollection<Project>(projectsQuery);
  
  // Check if the current logged-in user is already following this designer
  useEffect(() => {
    if (user && designer?.followers) {
      setIsFollowing(designer.followers.includes(user.id));
    }
  }, [user, designer]);

  const handleFollowToggle = async () => {
    if (!user || !designer || !db) {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: "Obuna bo'lish uchun tizimga kiring.",
      });
      return;
    }

    if (user.id === id) {
       toast({
        variant: "destructive",
        title: "Xatolik",
        description: "O'zingizga o'zingiz obuna bo'la olmaysiz.",
      });
      return;
    }
    
    setIsFollowLoading(true);
    const designerRef = doc(db, "users", id);
    
    try {
        if (isFollowing) {
            // Unfollow
            await updateDoc(designerRef, {
                followers: arrayRemove(user.id),
                subscriberCount: increment(-1)
            });
            setIsFollowing(false);
            toast({ description: `${designer?.name} obunasidan chiqdingiz.` });

        } else {
            // Follow
            await updateDoc(designerRef, {
                followers: arrayUnion(user.id),
                subscriberCount: increment(1)
            });
            setIsFollowing(true);
            toast({ description: `${designer?.name} ga obuna bo'ldingiz.` });

            // Create notification for the followed user
            if (designer.id !== user.id) { // Don't notify self
              const notificationsRef = collection(db, "notifications");
              await addDoc(notificationsRef, {
                  userId: designer.id,
                  type: 'follow',
                  senderId: user.id,
                  senderName: user.name || 'Anonim',
                  senderPhotoURL: user.image || '',
                  isRead: false,
                  createdAt: serverTimestamp(),
              });
            }
        }
    } catch(error) {
        console.error("Follow/unfollow error", error);
        toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Amalni bajarishda xatolik yuz berdi.",
        });
    } finally {
        setIsFollowLoading(false);
    }
  };


  const isLoading = isDesignerLoading || areProjectsLoading || isUserLoading;

  if (isLoading) {
    return <LoadingPage />;
  }
  
  if (!designer) {
    return <div className="flex h-[80vh] items-center justify-center"><p>Dizayner topilmadi.</p></div>;
  }

  const totalLikes = designerProjects?.reduce((acc, p) => acc + p.likeCount, 0) || 0;
  const totalViews = designerProjects?.reduce((acc, p) => acc + p.viewCount, 0) || 0;
  
  return (
    <>
    <div className="container mx-auto py-8 px-4">
      <Card className="overflow-hidden mb-12">
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
            { user && user.id !== id && (
              <div className="flex gap-2">
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} disabled={isFollowLoading}>
                  {isFollowLoading ? <LoadingPage /> : isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isFollowing ? "Obuna bo'lingan" : "Obuna bo'lish"}
                </Button>
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(true)}>
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
         <div className="text-center py-20 border rounded-lg bg-card shadow-sm">
            <Palmtree className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="floating-text text-2xl mt-4">{designer.name} hali hech qanday loyiha yuklamagan.</p>
             <p className="text-muted-foreground mt-2">Balki siz unga birinchi bo'lib ilhom berarsiz?</p>
        </div>
      )}
    </div>
    {user && designer && (
         <SendMessageDialog 
            isOpen={isMessageDialogOpen} 
            onOpenChange={setIsMessageDialogOpen}
            recipient={designer}
            currentUser={user}
         />
    )}
    </>
  );
}
