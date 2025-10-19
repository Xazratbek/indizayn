"use client";

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { designers as allDesigners, getProjectsByDesigner } from '@/lib/mock-data';
import imageData from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail } from 'lucide-react';
import PortfolioCard from '@/components/portfolio-card';
import { useState, useEffect } from 'react';

const allImages = imageData.placeholderImages;

export default function DesignerProfilePage({ params: { id } }: { params: { id: string } }) {
  const designer = allDesigners.find(d => d.id === id);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!designer) {
    notFound();
  }

  const designerAvatar = allImages.find(img => img.id === designer.avatarId);
  const designerProjects = getProjectsByDesigner(designer.id);

  const totalLikes = designerProjects.reduce((acc, p) => acc + p.likes, 0);
  const totalViews = designerProjects.reduce((acc, p) => acc + p.views, 0);
  const subscribers = designer.subscribers + (isFollowing ? 1 : 0);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="overflow-hidden mb-12">
        <div className="h-48 bg-secondary">
          <Image 
            src={`https://picsum.photos/seed/${designer.id}99/1200/200`} 
            alt={`${designer.name}ning muqova surati`}
            width={1200}
            height={200}
            className="w-full h-full object-cover"
            data-ai-hint="abstract pattern"
          />
        </div>
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background ring-2 ring-primary">
                {designerAvatar && <AvatarImage src={designerAvatar.imageUrl} alt={designer.name} />}
                <AvatarFallback className="text-4xl">{designer.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-headline text-4xl font-bold">{designer.name}</h1>
              <p className="text-muted-foreground text-lg">{designer.specialization}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsFollowing(!isFollowing)} variant={isFollowing ? "secondary" : "default"}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isFollowing ? "Obuna bo'lingan" : "Obuna bo'lish"}
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Xabar
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{isClient ? subscribers : designer.subscribers}</p>
                  <p className="text-sm text-muted-foreground">Obunachilar</p>
              </div>
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{designerProjects.length}</p>
                  <p className="text-sm text-muted-foreground">Loyihalar</p>
              </div>
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{isClient ? totalLikes : 0}</p>
                  <p className="text-sm text-muted-foreground">Jami Likelar</p>
              </div>
              <div className="text-center">
                  <p className="text-2xl font-bold font-headline">{isClient ? totalViews : 0}</p>
                  <p className="text-sm text-muted-foreground">Jami ko'rishlar</p>
              </div>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="font-headline text-3xl font-bold mb-8">Loyihalar</h2>
      {designerProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {designerProjects.map(project => (
            <PortfolioCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
         <div className="text-center py-16 border rounded-lg bg-card">
            <p className="text-muted-foreground">{designer.name} hali hech qanday loyiha yuklamagan.</p>
        </div>
      )}
    </div>
  );
}
