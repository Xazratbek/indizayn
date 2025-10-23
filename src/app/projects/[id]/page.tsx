
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, addDoc, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, Calendar, Wrench, ArrowLeft, MessageSquare, Send, Tag, UserPlus, UserCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { Project, Designer, Comment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Lightbox from '@/components/lightbox';
import { useSession } from 'next-auth/react';
import LoadingPage from '@/app/loading';
import { useModalContext } from '@/components/project-detail-modal';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


function CommentSkeleton() {
    return (
        <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    )
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const modalContext = useModalContext();

  const id = modalContext.projectId || (typeof params.id === 'string' ? params.id : '');
  const isModal = !!modalContext.projectId;

  const db = useFirestore();
  const { data: session } = useSession();
  const user = session?.user;

  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const { toast } = useToast();

  // Fetch project details and increment view count
  const projectDocRef = useMemoFirebase(() => (db && id) ? doc(db, 'projects', id) : null, [db, id]);
  const { data: project, isLoading: isProjectLoading, error } = useDoc<Project>(projectDocRef);
  
  useEffect(() => {
    if (id && db) {
        const projectRef = doc(db, 'projects', id);
        const viewedKey = `viewed_${id}`;
        const viewed = sessionStorage.getItem(viewedKey);
        if (!viewed) {
          updateDoc(projectRef, {
              viewCount: increment(1)
          }).catch(err => console.error("Failed to increment view count: ", err));
          sessionStorage.setItem(viewedKey, 'true');
        }
    }
  }, [id, db]);


  const designerDocRef = useMemoFirebase(() => 
    (db && project) ? doc(db, 'users', project.designerId) : null
  , [db, project]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  const commentsQuery = useMemoFirebase(() => 
      (db && id) 
          ? query(collection(db, `projects/${id}/comments`), orderBy('createdAt', 'asc')) 
          : null,
      [db, id]
  );
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);

  useEffect(() => {
    if (user && project?.likes) {
      setIsLiked(project.likes.includes(user.id));
    }
    if (user && designer?.followers) {
      setIsFollowing(designer.followers.includes(user.id));
    }
  }, [user, project, designer]);

    const handleCommentSubmit = async () => {
        if (!user || !project || !db) {
            toast({
                variant: "warning",
                title: "Xatolik!",
                description: "Izoh qoldirish uchun tizimga kiring.",
            });
            return;
        }
        if (!newComment.trim()) {
            toast({ variant: "warning", description: "Izoh matni bo'sh bo'lishi mumkin emas." });
            return;
        }
    
        setIsSubmittingComment(true);
        try {
            const commentsCollectionRef = collection(db, `projects/${id}/comments`);
            await addDoc(commentsCollectionRef, {
                projectId: id,
                userId: user.id,
                userName: user.name,
                userPhotoURL: user.image || '',
                content: newComment,
                createdAt: serverTimestamp(),
            });
    
            if (project.designerId !== user.id) {
                const notificationsRef = collection(db, "notifications");
                await addDoc(notificationsRef, {
                    userId: project.designerId,
                    type: 'comment',
                    senderId: user.id,
                    senderName: user.name || 'Anonim',
                    senderPhotoURL: user.image || '',
                    isRead: false,
                    projectId: project.id,
                    projectName: project.name,
                    messageSnippet: newComment.substring(0, 50) + (newComment.length > 50 ? '...' : ''),
                    createdAt: serverTimestamp(),
                });
            }
    
            setNewComment("");
            toast({ variant: "success", title: "Muvaffaqiyatli!", description: "Izohingiz qo'shildi." });
        } catch (error) {
            console.error("Izoh qo'shishda xatolik:", error);
            toast({
                variant: "destructive",
                title: "Xatolik!",
                description: "Izohni yuborishda muammo yuz berdi.",
            });
        } finally {
            setIsSubmittingComment(false);
        }
    };


  const handleLikeToggle = async () => {
    if (!user || !project || !designer || !db) {
      toast({
        variant: "warning",
        title: "Xatolik!",
        description: "Loyiha yoqishi uchun tizimga kiring.",
      });
      return;
    }

    if(user.id === project.designerId) {
      toast({ variant: "warning", description: "O'z loyihangizga like bosa olmaysiz." });
      return;
    }

    setIsLikeLoading(true);
    const projectRef = doc(db, 'projects', id);

    try {
        if (isLiked) {
            await updateDoc(projectRef, {
                likes: arrayRemove(user.id),
                likeCount: increment(-1)
            });
            setIsLiked(false);
        } else {
            await updateDoc(projectRef, {
                likes: arrayUnion(user.id),
                likeCount: increment(1)
            });
            setIsLiked(true);
             toast({ variant: "success", description: "Loyiha yoqtirilganlarga qo'shildi!"});

            if (project.designerId !== user.id) { 
              const notificationsRef = collection(db, "notifications");
              await addDoc(notificationsRef, {
                  userId: project.designerId,
                  type: 'like',
                  senderId: user.id,
                  senderName: user.name || 'Anonim',
                  senderPhotoURL: user.image || '',
                  isRead: false,
                  projectId: project.id,
                  projectName: project.name,
                  createdAt: serverTimestamp(),
              });
            }
        }
    } catch (err) {
        console.error("Like/Unlike error", err);
        toast({
            variant: "destructive",
            title: "Xatolik!",
            description: "Amalni bajarishda xatolik yuz berdi.",
        });
    } finally {
        setIsLikeLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !designer || !db) {
      toast({ variant: "warning", title: "Xatolik", description: "Obuna bo'lish uchun tizimga kiring." });
      return;
    }
    if (user.id === designer.id) {
       toast({ variant: "destructive", title: "Xatolik", description: "O'zingizga o'zingiz obuna bo'la olmaysiz." });
      return;
    }
    
    setIsFollowLoading(true);
    const designerRef = doc(db, "users", designer.id);
    
    try {
        if (isFollowing) {
            await updateDoc(designerRef, {
                followers: arrayRemove(user.id),
                subscriberCount: increment(-1)
            });
            setIsFollowing(false);
            toast({ description: `${designer?.name} obunasidan chiqdingiz.` });
        } else {
            await updateDoc(designerRef, {
                followers: arrayUnion(user.id),
                subscriberCount: increment(1)
            });
            setIsFollowing(true);
            toast({ variant: "success", description: `${designer?.name} ga obuna bo'ldingiz.` });
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
        toast({ variant: "destructive", title: "Xatolik", description: "Amalni bajarishda xatolik yuz berdi." });
    } finally {
        setIsFollowLoading(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxOpen(true);
  };

  const isLoading = isProjectLoading || isDesignerLoading || areCommentsLoading;

  if (isLoading && !project) {
    return <LoadingPage />;
  }
  
  if (error || !project) {
    return <div className="flex h-[80vh] items-center justify-center"><p>Loyiha topilmadi yoki yuklashda xatolik yuz berdi.</p></div>;
  }

  if (!designer && !isDesignerLoading) {
     return <div className="flex h-[80vh] items-center justify-center"><p>Dizayner ma'lumotlari topilmadi.</p></div>;
  }
  
  const projectImages = project.imageUrls && project.imageUrls.length > 0 ? project.imageUrls : [project.imageUrl];


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="pb-24" // Add padding to the bottom to avoid being hidden by the sticky footer
      >
        <div className="max-w-4xl py-8 px-4 md:px-6 lg:px-8 mx-auto">
          { !isModal && (
              <div className="relative mb-8">
                  <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute -left-4 top-1/2 -translate-y-1/2">
                      <ArrowLeft className="h-5 w-5" />
                  </Button>
              </div>
          )}

          {/* ----- Designer Info Header ----- */}
          {designer && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <Link href={`/designers/${designer.id}`} className="flex items-center gap-4 group">
                    <Avatar className="h-16 w-16">
                        {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                        <AvatarFallback className="text-xl">{designer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xl font-bold group-hover:underline">{project.name}</p>
                        <p className="text-md text-muted-foreground">
                            <span className="font-semibold">{designer.name}</span> tomonidan
                        </p>
                    </div>
                </Link>
                 {user && user.id !== designer.id && (
                    <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} disabled={isFollowLoading} className="w-full sm:w-auto">
                        {isFollowLoading ? <LoadingPage /> : isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {isFollowing ? "Obuna bo'lingan" : "Obuna bo'lish"}
                    </Button>
                )}
            </div>
          )}
          
          <div className="space-y-6">
            {/* ----- Project Images ----- */}
            {projectImages.map((url, index) => (
                <div key={index} className="relative w-full overflow-hidden rounded-lg bg-secondary/30 cursor-pointer" onClick={() => openLightbox(index)}>
                    <Image
                        src={url}
                        alt={`${project.name} - ${index + 1}`}
                        width={1200}
                        height={800}
                        className="w-full h-auto object-contain"
                        data-ai-hint="project image"
                        priority={index < 2}
                    />
                </div>
            ))}

            {/* ----- Description & Metadata ----- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                <div className="md:col-span-2">
                    <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                        <p>{project.description}</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-4 space-y-3 text-sm">
                        {project.createdAt && (
                            <div className="flex items-start">
                            <Calendar className="w-4 h-4 mr-3 mt-1 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="font-semibold">Chop etilgan</h4>
                                <p className="text-muted-foreground">
                                {project.createdAt?.toDate && format(project.createdAt.toDate(), 'd MMMM, yyyy', { locale: uz })}
                                </p>
                            </div>
                            </div>
                        )}
                         <Separator />
                         <div className="flex justify-around text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Heart className="w-4 h-4" />
                                <span>{project.likeCount || 0} yoqdi</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4" />
                                <span>{project.viewCount || 0} ko'rishlar</span>
                            </div>
                        </div>

                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="p-4 space-y-3 text-sm">
                            {project.tools && project.tools.length > 0 && (
                                <div className="flex items-start">
                                <Wrench className="w-4 h-4 mr-3 mt-1 text-muted-foreground shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Foydalanilgan vositalar</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {project.tools.map(tool => <Badge key={tool} variant="secondary">{tool}</Badge>)}
                                    </div>
                                </div>
                                </div>
                            )}
                            {project.tags && project.tags.length > 0 && (
                                <>
                                <Separator/>
                                <div className="flex items-start">
                                <Tag className="w-4 h-4 mr-3 mt-1 text-muted-foreground shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Teglar</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {project.tags.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)}
                                    </div>
                                </div>
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ----- Comments Section ----- */}
             <Card className="pt-6">
                <CardHeader>
                    <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        Izohlar ({comments?.length || 0})
                    </h2>
                </CardHeader>
                <CardContent className="space-y-6">
                    {user && (
                         <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.image ?? ''} alt={user.name ?? ''} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <Textarea 
                                    placeholder="Izohingizni yozing..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={isSubmittingComment}
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handleCommentSubmit} disabled={isSubmittingComment || !newComment.trim()}>
                                        {isSubmittingComment ? <LoadingPage /> : <Send className="mr-2 h-4 w-4"/>}
                                        Yuborish
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                   
                    <Separator />

                    <div className="space-y-6">
                        {areCommentsLoading ? (
                            <div className="space-y-6">
                                <CommentSkeleton />
                                <CommentSkeleton />
                            </div>
                        ) : comments && comments.length > 0 ? (
                           comments.map(comment => (
                               <div key={comment.id} className="flex items-start gap-3">
                                   <Avatar className="h-10 w-10">
                                       <AvatarImage src={comment.userPhotoURL} alt={comment.userName} />
                                       <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <div className="flex-1">
                                       <div className="flex items-center gap-2">
                                           <p className="font-semibold">{comment.userName}</p>
                                           <p className="text-xs text-muted-foreground">
                                               {comment.createdAt ? formatDistanceToNowStrict(comment.createdAt.toDate(), { addSuffix: true, locale: uz }) : ''}
                                           </p>
                                       </div>
                                       <p className="text-muted-foreground">{comment.content}</p>
                                   </div>
                               </div>
                           ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Hali izohlar yo'q. Birinchi bo'lib siz yozing!</p>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

    {/* Sticky Footer for Actions */}
    {!isModal && designer && (
        <div className="sticky bottom-0 left-0 right-0 z-40">
            <div className="container max-w-4xl mx-auto px-4">
                 <Card className="shadow-2xl bg-background/80 backdrop-blur-lg">
                    <CardContent className="p-2 sm:p-3 flex justify-between items-center">
                         <Link href={`/designers/${designer.id}`} className="flex items-center gap-2 group flex-1 min-w-0">
                            <Avatar className="h-10 w-10">
                                {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                                <AvatarFallback>{designer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="font-semibold group-hover:underline truncate">{designer.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{designer.specialization}</p>
                            </div>
                        </Link>
                        <div className="flex items-center gap-2">
                            {user && user.id !== designer.id && (
                                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} disabled={isFollowLoading} size="sm">
                                    {isFollowLoading ? <LoadingPage /> : <UserPlus className="mr-2 h-4 w-4" />}
                                    {isFollowing ? "Obuna bo'lingan" : "Obuna"}
                                </Button>
                            )}
                             <Button onClick={handleLikeToggle} variant={isLiked ? "secondary" : "default"} disabled={!user || isLikeLoading} size="sm">
                                {isLikeLoading ? <LoadingPage /> : <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />}
                                {project.likeCount}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )}


      {lightboxOpen && (
        <Lightbox 
          imageUrls={projectImages} 
          startIndex={lightboxStartIndex}
          open={lightboxOpen} 
          onOpenChange={setLightboxOpen} 
        />
      )}
    </>
  );
}

    