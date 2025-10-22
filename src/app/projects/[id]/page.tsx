
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, Heart, Calendar, Wrench, ArrowLeft, MessageSquare, Send, Tag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { Project, Designer, Comment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Lightbox from '@/components/lightbox';
import { useSession } from 'next-auth/react';
import LoadingPage from '@/app/loading';
import { useModalContext } from '@/components/project-detail-modal';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from "embla-carousel-autoplay"


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
  const { toast } = useToast();

   const autoplayPlugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );


  // Fetch project details and increment view count
  const projectDocRef = useMemoFirebase(() => (db && id) ? doc(db, 'projects', id) : null, [db, id]);
  const { data: project, isLoading: isProjectLoading, error } = useDoc<Project>(projectDocRef);
  
  useEffect(() => {
    // Increment view count only once per page load/modal open
    if (id && db) {
        const projectRef = doc(db, 'projects', id);
        const viewedKey = `viewed_${id}`;
        // Use sessionStorage to prevent incrementing on re-renders within the same session
        const viewed = sessionStorage.getItem(viewedKey);
        if (!viewed) {
          updateDoc(projectRef, {
              viewCount: increment(1)
          }).catch(err => console.error("Failed to increment view count: ", err));
          sessionStorage.setItem(viewedKey, 'true');
        }
    }
  }, [id, db]);


  // Fetch designer details based on designerId from the project
  const designerDocRef = useMemoFirebase(() => 
    (db && project) ? doc(db, 'users', project.designerId) : null
  , [db, project]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  // Fetch comments for the project
  const commentsQuery = useMemoFirebase(() => 
      (db && id) 
          ? query(collection(db, `projects/${id}/comments`), orderBy('createdAt', 'asc')) 
          : null,
      [db, id]
  );
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);

  // Check current user has liked this project
  useEffect(() => {
    if (user && project?.likes) {
      setIsLiked(project.likes.includes(user.id));
    }
  }, [user, project]);

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
    
            // Create notification for the project owner
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
            // Unlike
            await updateDoc(projectRef, {
                likes: arrayRemove(user.id),
                likeCount: increment(-1)
            });
            setIsLiked(false);
        } else {
            // Like
            await updateDoc(projectRef, {
                likes: arrayUnion(user.id),
                likeCount: increment(1)
            });
            setIsLiked(true);
             toast({ variant: "success", description: "Loyiha yoqtirilganlarga qo'shildi!"});

             // Create notification for the project owner
            if (project.designerId !== user.id) { // Don't notify self
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

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxOpen(true);
  };

  const isLoading = isProjectLoading || isDesignerLoading || areCommentsLoading;

  if (isLoading && !project) { // Show full page loader only on initial load
    return <LoadingPage />;
  }
  
  if (error || !project) {
    return <div className="flex h-[80vh] items-center justify-center"><p>Loyiha topilmadi yoki yuklashda xatolik yuz berdi.</p></div>;
  }

  if (!designer) {
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
      >
      <div className="container mx-auto max-w-6xl py-8 px-4">
        { !isModal && (
            <div className="relative mb-4 md:hidden">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute -left-2 top-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>
        )}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="w-full lg:w-3/4 space-y-8">
            <Card>
              <CardHeader>
                <h1 className="font-headline text-3xl md:text-4xl font-bold">{project.name}</h1>
              </CardHeader>
              <CardContent>
                {projectImages && projectImages.length > 0 && (
                  <Carousel 
                    className="w-full mb-6"
                    plugins={[autoplayPlugin.current]}
                    onMouseEnter={autoplayPlugin.current.stop}
                    onMouseLeave={autoplayPlugin.current.reset}
                  >
                      <CarouselContent>
                      {projectImages.map((url, index) => (
                          <CarouselItem key={index}>
                          <div className="aspect-video relative overflow-hidden rounded-lg bg-secondary/30 cursor-pointer" onClick={() => openLightbox(index)}>
                              <Image
                              src={url}
                              alt={`${project.name} - ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
                              className="object-cover"
                              data-ai-hint="project image"
                              priority={index === 0}
                              />
                          </div>
                          </CarouselItem>
                      ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4"/>
                  </Carousel>
                )}
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                   <p>{project.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
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

          {/* Sidebar */}
          <div className="w-full lg:w-1/4">
            <div className="sticky top-20 space-y-6">
              <Card>
                <CardContent className="p-4">
                  <Link href={`/designers/${designer.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-12 w-12">
                      {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                      <AvatarFallback>{designer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold group-hover:underline">{designer.name}</p>
                      <p className="text-sm text-muted-foreground">{designer.specialization}</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={handleLikeToggle} className="w-full" variant={isLiked ? "secondary" : "default"} disabled={!user || isLikeLoading}>
                      {isLikeLoading ? <LoadingPage/> :
                      <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                      }
                      {isLiked ? 'Yoqdi' : 'Yoqdi'}
                    </Button>
                  </div>
                  <div className="flex justify-around text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4" />
                      <AnimatePresence mode="popLayout">
                          <motion.span
                            key={project.likeCount}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          >
                            {project.likeCount || 0}
                          </motion.span>
                      </AnimatePresence>
                      <span className='ml-1'>Likes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                       <AnimatePresence mode="popLayout">
                          <motion.span
                            key={project.viewCount}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          >
                           {project.viewCount || 0}
                          </motion.span>
                       </AnimatePresence>
                      <span className='ml-1'>Ko'rishlar</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <div className="flex items-start">
                      <Tag className="w-4 h-4 mr-3 mt-1 text-muted-foreground shrink-0" />
                      <div>
                        <h4 className="font-semibold">Teglar</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.tags.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
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
