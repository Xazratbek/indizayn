
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Project, Designer } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Skeleton } from './ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

interface PortfolioCardProps {
  project: Project;
  className?: string;
}


export default function PortfolioCard({ project, className }: PortfolioCardProps) {
  const db = useFirestore();

  // Fetch designer details for the project
  const designerDocRef = useMemoFirebase(() => 
    (db && project) ? doc(db, 'users', project.designerId) : null
  , [db, project]);
  const { data: designer, isLoading: isDesignerLoading } = useDoc<Designer>(designerDocRef);
  
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0-5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };


  if (isDesignerLoading) {
    return (
       <Card className={cn("overflow-hidden group transition-shadow duration-300 w-full h-full", className)}>
        <CardContent className="p-0">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!designer || !project) {
    return null;
  }
  
  const projectImages = project.imageUrls && project.imageUrls.length > 0 ? project.imageUrls : [project.imageUrl];

  return (
     <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="relative"
    >
      <Card className={cn("overflow-hidden group transition-shadow duration-300 hover:shadow-xl w-full h-full", className)} style={{transform: 'translateZ(75px)', transformStyle: 'preserve-3d'}}>
        <CardContent className="p-0">
          <Carousel 
            opts={{
              loop: true,
            }}
            className="w-full relative group/carousel"
          >
            <CarouselContent>
              {projectImages.map((url, index) => (
                <CarouselItem key={index}>
                   <Link href={`/projects/${project.id}`} className="block">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <motion.div
                        style={{
                          transform: 'translateZ(50px)',
                          transformStyle: 'preserve-3d',
                        }}
                        className="absolute inset-0"
                      >
                          <Image
                            src={url || `https://picsum.photos/seed/${project.id}/400/300`}
                            alt={project.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            data-ai-hint="project image"
                          />
                      </motion.div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
             <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
          </Carousel>

          <div className="p-4" style={{transform: 'translateZ(40px)'}}>
            <div className="flex items-center justify-between">
              <Link href={`/projects/${project.id}`}>
                <h3 className="font-headline font-bold text-lg truncate">{project.name}</h3>
              </Link>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>{project.likeCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👀</span>
                  <span>{project.viewCount || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Link href={`/designers/${designer.id}`} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                  <AvatarFallback>{designer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hover:underline">{designer.name}</span>
              </Link>
              {designer.specialization && <Badge variant="secondary">{designer.specialization}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
