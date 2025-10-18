"use client";

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getFullProjectDetails } from '@/lib/mock-data';
import imageData from '@/lib/placeholder-images.json';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Heart, Calendar, Wrench } from 'lucide-react';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';

const allImages = imageData.placeholderImages;

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const projectDetails = getFullProjectDetails(params.id);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(projectDetails?.likes ?? 0);

  if (!projectDetails || !projectDetails.designer) {
    notFound();
  }

  const { project, designer } = { project: projectDetails, designer: projectDetails.designer };
  const projectImage = allImages.find(img => img.id === project.imageId);
  const designerAvatar = allImages.find(img => img.id === designer.avatarId);

  const handleLike = () => {
    if(isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
    }
  }

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
              {projectImage && (
                <div className="aspect-[4/3] relative overflow-hidden rounded-lg mb-6">
                  <Image
                    src={projectImage.imageUrl}
                    alt={project.name}
                    fill
                    className="object-cover"
                    data-ai-hint={projectImage.imageHint}
                  />
                </div>
              )}
              <p className="text-lg text-muted-foreground leading-relaxed">{project.description}</p>
              
              <Separator className="my-6" />

              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p>This project was created to solve a specific design challenge. We focused on user experience and modern aesthetics to deliver a product that is both beautiful and functional. The process involved extensive research, wireframing, prototyping, and user testing.</p>
                <p>Throughout the project, we leveraged a variety of tools to bring our vision to life. The final result is a testament to the collaborative effort and creative synergy of the team.</p>
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
                    {designerAvatar && <AvatarImage src={designerAvatar.imageUrl} alt={designer.name} />}
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
                  <Button onClick={handleLike} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" variant={isLiked ? "secondary" : "default"}>
                    <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                    {isLiked ? 'Liked' : 'Like'}
                  </Button>
                </div>
                <div className="flex justify-around text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    <span>{likes.toLocaleString()} Likes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{project.views.toLocaleString()} Views</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="flex items-start">
                  <Calendar className="w-4 h-4 mr-3 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <h4 className="font-semibold">Published</h4>
                    <p className="text-muted-foreground">{format(parseISO(project.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Wrench className="w-4 h-4 mr-3 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <h4 className="font-semibold">Tools Used</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.tools.map(tool => <Badge key={tool} variant="secondary">{tool}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div>
                    <h4 className="font-semibold">Tags</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
