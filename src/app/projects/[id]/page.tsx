"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Heart, Calendar, Wrench, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { Project, Designer } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default function ProjectDetailsPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const db = useFirestore();
  const { user } = useUser();

  const [isLiked, setIsLiked] = useState(false);

  // Fetch project details and increment view count
  const projectDocRef = useMemoFirebase(() => doc(db, 'projects', id), [db, id]);
  const { data: project, isLoading: isProjectLoading, error } = useDoc<Project>(projectDocRef);
  
  useEffect(() => {
    // Increment view count only once per page load
    if (id) {
        const projectRef = doc(db, 'projects', id);
        const viewed = sessionStorage.getItem(`viewed_${id}`);
        if (!viewed) {
          updateDoc(projectRef, {
              viewCount: increment(1)
          }).catch(err => console.error("Failed to increment view count: ", err));
          sessionStorage.setItem(`viewed_${id}`, 'true');
        }
    }
  }, [id, db]);


  // Fetch designer details based on designerId from the project
  const designerDocRef = useMemoFirebase(() => 
    project ? doc(db, 'users', project.designerId) : null
  , [db, project]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);

  // Check if current user has liked this project
  useEffect(() => {
    if (user && project?.likes) {
      setIsLiked(project.likes.includes(user.uid));
    }
  }, [user, project]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: "Loyiha yoqishi uchun tizimga kiring.",
      });
      return;
    }

    const projectRef = doc(db, 'projects', id);

    try {
        if (isLiked) {
            // Unlike
            await updateDoc(projectRef, {
                likes: arrayRemove(user.uid),
                likeCount: increment(-1)
            });
            setIsLiked(false);
        } else {
            // Like
            await updateDoc(projectRef, {
                likes: arrayUnion(user.uid),
                likeCount: increment(1)
            });
            setIsLiked(true);
        }
    } catch (err) {
        console.error("Like/Unlike error", err);
        toast({
            variant: "destructive",
            title: "Xatolik!",
            description: "Amalni bajarishda xatolik yuz berdi.",
        });
    }
  };


  const isLoading = isProjectLoading || isDesignerLoading;

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
  }
  
  if (!project || !designer) {
    return <div className="flex h-[80vh] items-center justify-center"><p>Loyiha topilmadi.</p></div>;
  }
  
  const projectImages = project.imageUrls && project.imageUrls.length > 0 ? project.imageUrls : [project.imageUrl];


  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          <Card>
            <CardHeader>
              <h1 className="font-headline text-4xl font-bold">{project.name}</h1>
            </CardHeader>
            <CardContent>
              {projectImages && projectImages.length > 0 && (
                 <Carousel className="w-full mb-6">
                    <CarouselContent>
                    {projectImages.map((url, index) => (
                        <CarouselItem key={index}>
                        <div className="aspect-[4/3] relative overflow-hidden rounded-lg">
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
              <p className="text-lg text-muted-foreground leading-relaxed">{project.description}</p>
              
              <Separator className="my-6" />

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p>Ushbu loyiha muayyan dizayn muammosini hal qilish uchun yaratilgan. Biz ham chiroyli, ham funktsional mahsulotni taqdim etish uchun foydalanuvchi tajribasi va zamonaviy estetikaga e'tibor qaratdik. Jarayon keng qamrovli tadqiqotlar, simli chizmalar, prototiplash va foydalanuvchi sinovlarini o'z ichiga oldi.</p>
                <p>Loyiha davomida biz o'z qarashlarimizni hayotga tatbiq etish uchun turli xil vositalardan foydalandik. Yakuniy natija jamoaning birgalikdagi sa'y-harakatlari va ijodiy sinergiyasining isbotidir.</p>
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
                  <Button onClick={handleLikeToggle} className="w-full" variant={isLiked ? "secondary" : "default"}>
                    <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                    {isLiked ? 'Yoqdi' : 'Yoqdi'}
                  </Button>
                </div>
                <div className="flex justify-around text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    <span>{project.likeCount || 0} Likes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{project.viewCount || 0} Ko'rishlar</span>
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
                        {/* Firestore timestamp requires .toDate() conversion */}
                        {format(project.createdAt.toDate(), 'd MMMM, yyyy', { locale: uz })}
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
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.tags.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
