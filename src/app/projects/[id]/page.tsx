
"use client";

import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, addDoc, serverTimestamp, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Calendar, Wrench, MessageSquare, Send, Tag, UserPlus, UserCheck, Share2, Download, Info, Plus, Eye, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { Project, Designer, Comment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Lightbox from '@/components/lightbox';
import { useSession } from 'next-auth/react';
import LoadingPage from '@/app/loading';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useModalContext } from '@/components/project-detail-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


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
  const modalContext = useModalContext();

  const id = modalContext?.projectId || (typeof params.id === 'string' ? params.id : '');

  const db = useFirestore();
  const { data: session } = useSession();
  const user = session?.user;

  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const { toast } = useToast();

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

  const handleShare = () => {
    const url = `${window.location.origin}/projects/${id}`;
    navigator.clipboard.writeText(url).then(() => {
        toast({
            title: "Havola nusxalandi!",
            description: "Loyihani do'stlaringiz bilan ulashishingiz mumkin.",
        });
    }).catch(err => {
         toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Havolani nusxalashda muammo yuz berdi.",
        });
    });
  };

  const handleDownload = async () => {
      if (!project?.imageUrls || project.imageUrls.length === 0) {
        toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Yuklab olish uchun rasmlar topilmadi.",
        });
        return;
      }
      
      setIsDownloading(true);
      toast({
          title: "Arxivlanmoqda...",
          description: "Rasmlar ZIP-arxivga joylanmoqda. Bu biroz vaqt olishi mumkin.",
      });

      try {
        const zip = new JSZip();
        
        for (let i = 0; i < project.imageUrls.length; i++) {
            const url = project.imageUrls[i];
            const response = await fetch(url);
            const blob = await response.blob();
            // Get file extension from url or blob type
            const fileExtension = url.split('.').pop()?.split('?')[0] || blob.type.split('/')[1] || 'jpg';
            zip.file(`image-${i + 1}.${fileExtension}`, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${project.name.replace(/ /g, '_')}.zip`);

      } catch (error) {
         toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Rasmlarni arxivlashda xatolik yuz berdi.",
        });
         console.error("ZIP Error: ", error);
      } finally {
        setIsDownloading(false);
      }
  };


  const handleCommentSubmit = async () => {
      if (!user || !project || !db) {
          toast({ variant: "warning", title: "Xatolik!", description: "Izoh qoldirish uchun tizimga kiring." });
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
          toast({ variant: "destructive", title: "Xatolik!", description: "Izohni yuborishda muammo yuz berdi."});
      } finally {
          setIsSubmittingComment(false);
      }
  };


  const handleLikeToggle = async () => {
    if (!user || !project || !designer || !db) {
      toast({ variant: "warning", title: "Xatolik!", description: "Loyiha yoqishi uchun tizimga kiring." });
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
            await updateDoc(projectRef, { likes: arrayRemove(user.id), likeCount: increment(-1) });
            setIsLiked(false);
        } else {
            await updateDoc(projectRef, { likes: arrayUnion(user.id), likeCount: increment(1) });
            setIsLiked(true);
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
        toast({ variant: "destructive", title: "Xatolik!", description: "Amalni bajarishda xatolik yuz berdi." });
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
            await updateDoc(designerRef, { followers: arrayRemove(user.id), subscriberCount: increment(-1) });
            setIsFollowing(false);
            toast({ description: `${designer?.name} obunasidan chiqdingiz.` });
        } else {
            await updateDoc(designerRef, { followers: arrayUnion(user.id), subscriberCount: increment(1) });
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
    return <div className="h-full w-full flex items-center justify-center bg-card rounded-lg"><LoadingPage /></div>;
  }
  
  if (error || !project) {
    return <div className="flex h-full items-center justify-center bg-card rounded-lg"><p>Loyiha topilmadi yoki yuklashda xatolik yuz berdi.</p></div>;
  }

  if (!designer && !isDesignerLoading) {
     return <div className="flex h-full items-center justify-center bg-card rounded-lg"><p>Dizayner ma'lumotlari topilmadi.</p></div>;
  }
  
  const projectImages = project.imageUrls && project.imageUrls.length > 0 ? project.imageUrls : [project.imageUrl];

  return (
    <div className="relative">
      {/* Floating Action Bar for Desktop */}
      <div className="fixed top-1/2 -translate-y-1/2 right-8 hidden xl:flex flex-col items-center gap-4 z-[60]">
          {designer && (
               <div className="relative group">
                   <Link href={`/designers/${designer.id}`} className="block">
                      <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                          {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                          <AvatarFallback className="text-2xl">{designer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                   </Link>
                   {user && user.id !== designer.id && (
                      <Button
                          size="icon"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full border-2 border-background"
                          variant={isFollowing ? "secondary" : "default"}
                          disabled={isFollowLoading}
                          onClick={handleFollowToggle}
                      >
                          {isFollowLoading ? <LoadingPage /> : isFollowing ? <UserCheck className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                   )}
               </div>
          )}

           <div className="p-2 bg-background/80 backdrop-blur-sm rounded-full flex flex-col gap-2">
              <Button onClick={handleLikeToggle} variant="ghost" size="icon" className="h-14 w-14 rounded-full" disabled={!user || isLikeLoading}>
                <motion.div
                    animate={{ scale: isLiked ? 1.2 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <ThumbsUp className={cn('h-6 w-6 transition-colors', isLiked ? 'fill-blue-500 text-blue-500' : '')} />
                </motion.div>
              </Button>
              <Button onClick={handleShare} variant="ghost" size="icon" className="h-14 w-14 rounded-full">
                  <Share2 className="h-6 w-6" />
              </Button>
              <Button onClick={handleDownload} variant="ghost" size="icon" className="h-14 w-14 rounded-full" disabled={isDownloading}>
                  {isDownloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
              </Button>
          </div>
      </div>
      
      <div className="max-w-5xl mx-auto rounded-lg bg-card text-card-foreground my-8">
        <div className="px-4 md:px-8 pt-8">
             {designer && (
                <div className="flex items-center gap-4">
                    <Link href={`/designers/${designer.id}`} className="group inline-flex items-center gap-2 text-lg">
                        <Avatar className="h-12 w-12 group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2 group-hover:ring-offset-background transition-all">
                            {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                            <AvatarFallback className="text-xl">{designer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <span className="group-hover:underline">{designer.name}</span>
                        </div>
                    </Link>
                </div>
             )}
            <h1 className="font-headline text-2xl md:text-3xl font-bold mt-4">{project.name}</h1>
        </div>
        
        <div className="mt-8">
            {projectImages.map((url, index) => (
                <div key={index} className="relative w-full bg-secondary cursor-pointer" onClick={() => openLightbox(index)}>
                    <Image
                        src={url}
                        alt={`${project.name} - ${index + 1}`}
                        width={1600}
                        height={1200}
                        className="w-full h-auto object-contain"
                        data-ai-hint="project image"
                        priority={index < 2}
                    />
                </div>
            ))}
        </div>
        
        {/* Action Bar for Mobile/Tablet */}
        <div className="px-4 md:px-8 py-4 xl:hidden">
            <div className="relative overflow-hidden rounded-lg">
              <Card>
                  <div className="relative overflow-hidden p-4">
                      <div className="flex items-center justify-between">
                           {designer && (
                               <Link href={`/designers/${designer.id}`} className="group flex items-center gap-3 text-lg">
                                  <Avatar className="h-12 w-12">
                                      {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                                      <AvatarFallback className="text-xl">{designer.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                       <p className="font-bold leading-tight group-hover:underline">{designer.name}</p>
                                       <p className="text-sm text-muted-foreground leading-tight">{designer.specialization}</p>
                                  </div>
                              </Link>
                           )}
                           {user && designer && user.id !== designer.id && (
                               <Button 
                                  size="sm" 
                                  variant={isFollowing ? "secondary" : "default"}
                                  disabled={isFollowLoading}
                                  onClick={handleFollowToggle}
                              >
                                  {isFollowLoading ? <LoadingPage /> : isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                  {isFollowing ? "Obuna" : "Obuna bo'lish"}
                              </Button>
                           )}
                       </div>
                       <Separator className="my-4" />
                       <div className="flex justify-around items-center">
                            <Button onClick={handleLikeToggle} variant="ghost" size="lg" className="flex-col h-auto gap-1" disabled={!user || isLikeLoading}>
                               <motion.div
                                  animate={{ scale: isLiked ? 1.2 : 1, y: isLiked ? -2 : 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                  className="transition-colors"
                               >
                                  <ThumbsUp className={cn('h-6 w-6', isLiked ? 'fill-blue-500 text-blue-500' : 'text-foreground')} />
                               </motion.div>
                              <span className="text-xs">{project.likeCount}</span>
                            </Button>
                             <div className="flex flex-col h-auto gap-1 items-center justify-center text-foreground">
                                 <Eye className="h-6 w-6"/>
                                 <span className="text-xs">{project.viewCount}</span>
                             </div>
                             <div className="flex flex-col h-auto gap-1 items-center justify-center text-foreground">
                                 <MessageSquare className="h-6 w-6"/>
                                 <span className="text-xs">{comments?.length || 0}</span>
                             </div>
                             <Button onClick={handleShare} variant="ghost" size="lg" className="flex-col h-auto gap-1 text-foreground">
                                <Share2 className="h-6 w-6" />
                                 <span className="text-xs">Ulashish</span>
                             </Button>
                             <Button onClick={handleDownload} variant="ghost" size="lg" className="flex-col h-auto gap-1 text-foreground" disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                                 <span className="text-xs">Yuklash</span>
                             </Button>
                       </div>
                  </div>
              </Card>
            </div>
        </div>

        {/* Info Card */}
        <div className="px-4 md:px-8 pb-8">
            <Card>
                <CardHeader>
                    <CardTitle>Loyiha haqida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {project.description && (
                        <div>
                            <p className="text-foreground/90 leading-relaxed">{project.description}</p>
                        </div>
                     )}
                     <Separator/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
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
                    </div>
                </CardContent>
            </Card>
        </div>


        <div className="px-4 md:px-8">
          <div className="max-w-3xl mx-auto w-full pt-8 pb-24">
              <h2 className="font-headline text-2xl font-bold mb-6">
                  Izohlar ({comments?.length || 0})
              </h2>
              <div className="space-y-8">
                  {user && (
                      <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={user.image ?? ''} alt={user.name ?? ''} />
                              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 relative">
                              <Textarea 
                                  placeholder="Izohingizni yozing..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  disabled={isSubmittingComment}
                                  className="bg-secondary min-h-[100px] pr-28"
                              />
                              <Button 
                                  onClick={handleCommentSubmit} 
                                  disabled={isSubmittingComment || !newComment.trim()}
                                  className="absolute bottom-3 right-3"
                                  size="sm"
                              >
                                  {isSubmittingComment ? <LoadingPage /> : 'Yuborish'}
                              </Button>
                          </div>
                      </div>
                  )}
              
                  <div className="space-y-6">
                      {areCommentsLoading ? (
                          <div className="space-y-6">
                              <CommentSkeleton />
                              <CommentSkeleton />
                          </div>
                      ) : comments && comments.length > 0 ? (
                      comments.map(comment => (
                          <div key={comment.id} className="flex items-start gap-4">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={comment.userPhotoURL} alt={comment.userName} />
                                  <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                      <p className="font-semibold">{comment.userName}</p>
                                      <p className="text-muted-foreground">· {comment.createdAt ? formatDistanceToNowStrict(comment.createdAt.toDate(), { addSuffix: true, locale: uz }) : ''}</p>
                                  </div>
                                  <p className="text-foreground/90 mt-1">{comment.content}</p>

                              </div>
                          </div>
                      ))
                      ) : (
                          <p className="text-center text-muted-foreground py-8">Hali izohlar yo'q. Birinchi bo'lib siz yozing!</p>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox 
          imageUrls={projectImages} 
          startIndex={lightboxStartIndex}
          open={lightboxOpen} 
          onOpenChange={setLightboxOpen} 
        />
      )}
    </div>
  );
}
