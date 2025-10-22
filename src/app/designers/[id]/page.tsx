
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, updateDoc, increment, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail, UserCheck, Palmtree, Eye, Heart, Users, FolderKanban } from 'lucide-react';
import PortfolioCard from '@/components/portfolio-card';
import { useState, useEffect } from 'react';
import type { Designer, Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import SendMessageDialog from '@/components/send-message-dialog';
import { useSession } from 'next-auth/react';
import LoadingPage from '@/app/loading';
import { TelegramIcon } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) => (
     <div className="flex-1 text-center p-4">
        <Icon className="w-8 h-8 mx-auto text-primary mb-2" />
        <p className="text-2xl font-bold font-headline">{value}</p>
        <p className="text-sm text-muted-foreground hidden md:block">{label}</p>
    </div>
);

export default function DesignerProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const db = useFirestore();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isUserLoading = status === 'loading';
  const { toast } = useToast();

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
        variant: "warning",
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
            toast({ variant: "success", description: `${designer?.name} ga obuna bo'ldingiz.` });

            // Create notification for the followed user
            if (designer.id !== user.id ) { 
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
  
  if (!designer && !isDesignerLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><p>Dizayner topilmadi.</p></div>;
  }

  if (!designer) return null;

  const totalLikes = designerProjects?.reduce((acc, p) => acc + p.likeCount, 0) || 0;
  const totalViews = designerProjects?.reduce((acc, p) => acc + p.viewCount, 0) || 0;
  
  return (
    <>
    <div className="container mx-auto py-8 px-4">
      <Card className="overflow-hidden mb-8 shadow-lg">
        <div className="h-32 md:h-64 bg-secondary relative">
          {designer.coverPhotoURL ? (
            <Image 
              src={designer.coverPhotoURL}
              alt={`${designer.name}ning muqova surati`}
              fill
              className="w-full h-full object-cover"
              priority
            />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30"></div>
          )}
        </div>
        <CardContent className="p-4 md:p-6 relative">
          <div className="flex flex-col items-center -mt-16 md:-mt-20">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background ring-4 ring-primary/50">
              {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
              <AvatarFallback className="text-4xl">{designer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center mt-4">
              <h1 className="font-headline text-3xl md:text-4xl font-bold">{designer.name}</h1>
              {designer.specialization && <p className="text-lg text-muted-foreground">{designer.specialization}</p>}
            </div>
             { status === 'authenticated' && session.user.id !== id ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 w-full">
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} disabled={isFollowLoading} className="w-full text-lg py-6 sm:w-auto sm:text-base sm:py-2">
                  {isFollowLoading ? <LoadingPage /> : isFollowing ? <UserCheck className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />}
                  {isFollowing ? "Obuna bo'lingan" : "Obuna bo'lish"}
                </Button>
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(true)} className="w-full text-lg py-6 sm:w-auto sm:text-base sm:py-2">
                  <Mail className="mr-2 h-5 w-5" /> Xabar
                </Button>
              </div>
            ) : null }
          </div>
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

       {(designer.bio || designer.phoneNumber || designer.telegramUrl) && (
        <Card className="mb-12">
            <CardHeader>
                <CardTitle>Ma'lumot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {designer.bio && (
                    <p className="text-muted-foreground leading-relaxed">{designer.bio}</p>
                )}
                {(designer.phoneNumber || designer.telegramUrl) && (
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                        {designer.phoneNumber && (
                            <Button asChild variant="outline">
                                <a href={`tel:${designer.phoneNumber}`}>
                                    <span className="text-lg mr-2">📱</span>
                                    Telefon
                                </a>
                            </Button>
                        )}
                        {designer.telegramUrl && (
                            <Button asChild variant="outline">
                                <a href={`https://t.me/${designer.telegramUrl.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                    <TelegramIcon className="w-5 h-5 mr-2" />
                                    Telegram
                                </a>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
       )}

      <h2 className="font-headline text-3xl font-bold mb-8">Loyihalar</h2>
      {designerProjects && designerProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {designerProjects.map(project => (
            <PortfolioCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card shadow-sm">
            <Palmtree className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <p className="floating-text text-2xl mt-4 text-muted-foreground">{designer.name} hali hech qanday loyiha yuklamagan.</p>
             <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Agar bu sizning profilingiz bo'lsa, o'z ijodingizni namoyish etish uchun birinchi loyihangizni yuklang!
             </p>
              {user?.id === designer.id && (
                <Button asChild className="mt-6">
                    <a href="/account/new-project">Loyiha Yuklash</a>
                </Button>
              )}
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

    