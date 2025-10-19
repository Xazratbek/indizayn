import Image from 'next/image';
import Link from 'next/link';
import { Eye, Heart } from 'lucide-react';
import type { Project } from '@/lib/types';
import { designers } from '@/lib/mock-data';
import imageData from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface PortfolioCardProps {
  project: Project;
  className?: string;
}

const allImages = imageData.placeholderImages;

export default function PortfolioCard({ project, className }: PortfolioCardProps) {
  const designer = designers.find((d) => d.id === project.designerId);
  const projectImage = allImages.find((img) => img.id === project.imageId);
  const designerAvatar = allImages.find((img) => img.id === designer?.avatarId);
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

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


  if (!designer || !projectImage) {
    return null;
  }

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
                    src={projectImage.imageUrl}
                    alt={project.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    data-ai-hint={projectImage.imageHint}
                  />
              </motion.div>
            </div>
          </Link>
          <div className="p-4" style={{transform: 'translateZ(40px)'}}>
            <div className="flex items-center justify-between">
              <Link href={`/projects/${project.id}`}>
                <h3 className="font-headline font-bold text-lg truncate">{project.name}</h3>
              </Link>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{isClient ? project.likes : 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{isClient ? project.views : 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Link href={`/designers/${designer.id}`} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {designerAvatar && <AvatarImage src={designerAvatar.imageUrl} alt={designer.name} data-ai-hint={designerAvatar.imageHint} />}
                  <AvatarFallback>{designer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hover:underline">{designer.name}</span>
              </Link>
              <Badge variant="secondary">{designer.specialization}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
