
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, Pencil, Trash2, User, Users } from 'lucide-react';
import type { Project, Designer } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from './ui/skeleton';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';


interface PortfolioCardProps {
  project: Project;
  className?: string;
  showAdminControls?: boolean;
}

function PortfolioCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn("overflow-hidden group transition-shadow duration-300 w-full h-full", className)}>
            <CardContent className="p-0">
                <div className="aspect-video w-full" />
                <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PortfolioCard({ project, className, showAdminControls = false }: PortfolioCardProps) {
  const db = useFirestore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const designerDocRef = useMemoFirebase(() => 
    (db && project) ? doc(db, 'users', project.designerId) : null
  , [db, project]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);
  
  
  const createQueryString = (paramsToUpdate: { [key: string]: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([name, value]) => {
      params.set(name, value);
    });
    return params.toString();
  };
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // For browse page, we want to open the modal
      if(pathname.startsWith('/browse')) {
        e.preventDefault();
        const newUrl = `${pathname}?${createQueryString({ projectId: project.id })}`;
        router.push(newUrl, { scroll: false });
      }
      // For other pages like /account/projects, it will navigate to the project detail page directly.
  };

  const handleDeleteProject = async () => {
    if (!db) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, "projects", project.id));
        toast({
            variant: "success",
            title: "Muvaffaqiyatli!",
            description: "Loyiha o'chirildi.",
        });
        // We might need to refresh the page or parent component state
        router.refresh(); 
    } catch(error) {
        console.error("Loyiha o'chirishda xatolik:", error);
        toast({
            variant: "destructive",
            title: "Xatolik!",
            description: "Loyihani o'chirishda xatolik yuz berdi.",
        });
    } finally {
        setIsDeleting(false);
    }
  }

  if (isDesignerLoading) {
    return <PortfolioCardSkeleton className={className} />;
  }

  if (!designer || !project) {
    return null;
  }
  
  const projectLink = pathname.startsWith('/browse')
    ? `${pathname}?${createQueryString({ projectId: project.id })}`
    : `/projects/${project.id}`;

  return (
    <motion.div
      whileHover={{ scale: 1.03, z: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative"
    >
      <Card className={cn("overflow-hidden group transition-shadow duration-300 w-full h-full bg-card", className)}>
        <CardContent className="p-0">
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <Link href={projectLink} onClick={handleClick} scroll={false} className="block w-full h-full">
               <motion.div
                 className="absolute inset-0"
               >
                  <Image
                    src={project.imageUrl || `https://picsum.photos/seed/${project.id}/400/300`}
                    alt={project.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    data-ai-hint="project image"
                  />
               </motion.div>
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </Link>
            {showAdminControls && (
                  <div className="absolute top-2 right-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button asChild size="icon" className="h-8 w-8">
                        <Link href={`/account/projects/edit/${project.id}`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu amalni qaytarib bo'lmaydi. Bu loyihani butunlay o'chirib yuboradi.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteProject} disabled={isDeleting}>
                                    {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
          </div>

          <div className="p-4 flex items-center justify-between">
            <HoverCard>
                <HoverCardTrigger asChild>
                     <div className="flex items-center gap-2">
                        <Link href={`/designers/${designer.id}`} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                            {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                            <AvatarFallback className="text-xs">{designer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{designer.name}</span>
                        </Link>
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                    <div className="flex flex-col space-y-4">
                        <div className="h-20 bg-secondary relative rounded-t-md">
                            {designer.coverPhotoURL && (
                                <Image 
                                src={designer.coverPhotoURL}
                                alt={`${designer.name}ning muqova surati`}
                                fill
                                className="w-full h-full object-cover rounded-t-md"
                                />
                            )}
                        </div>
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <Avatar className="h-16 w-16 -mt-10 border-4 border-popover">
                                    <AvatarImage src={designer.photoURL} />
                                    <AvatarFallback className="text-2xl">{designer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-semibold">{designer.name}</h4>
                                    <p className="text-sm text-muted-foreground">{designer.specialization}</p>
                                </div>
                            </div>
                            <Button asChild variant="secondary" size="sm">
                                <Link href={`/designers/${designer.id}`}>Profil</Link>
                            </Button>
                        </div>
                        <div className="flex items-center pt-2 gap-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="mr-1 h-4 w-4" /> {designer.subscriberCount || 0} obunachi
                            </div>
                        </div>
                    </div>
                </HoverCardContent>
            </HoverCard>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <motion.span
                        key={project.likeCount}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        {project.likeCount || 0}
                    </motion.span>
                </div>
                <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <motion.span
                        key={project.viewCount}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                        {project.viewCount || 0}
                    </motion.span>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
