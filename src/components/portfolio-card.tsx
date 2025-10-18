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
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PortfolioCardProps {
  project: Project;
  className?: string;
}

const allImages = imageData.placeholderImages;

export default function PortfolioCard({ project, className }: PortfolioCardProps) {
  const designer = designers.find((d) => d.id === project.designerId);
  const projectImage = allImages.find((img) => img.id === project.imageId);
  const designerAvatar = allImages.find((img) => img.id === designer?.avatarId);
  
  const [likes, setLikes] = useState(project.likes);
  const [views, setViews] = useState(project.views);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  if (!designer || !projectImage) {
    return null;
  }

  return (
    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
      <Card className={cn("overflow-hidden group transition-shadow duration-300 hover:shadow-xl", className)}>
        <CardContent className="p-0">
          <Link href={`/projects/${project.id}`} className="block">
            <div className="aspect-[4/3] relative overflow-hidden">
              <Image
                src={projectImage.imageUrl}
                alt={project.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={projectImage.imageHint}
              />
            </div>
          </Link>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Link href={`/projects/${project.id}`}>
                <h3 className="font-headline font-bold text-lg truncate">{project.name}</h3>
              </Link>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{isClient ? likes : project.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{isClient ? views : project.views}</span>
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
