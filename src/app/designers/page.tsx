"use client";
import { designers } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import imageData from "@/lib/placeholder-images.json";

const allImages = imageData.placeholderImages;

export default function DesignersPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Bizning Dizaynerlarimiz</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Platformamizdagi eng iqtidorli va ijodkor dizaynerlar hamjamiyatini kashf eting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {designers.map((designer) => {
          const designerAvatar = allImages.find(img => img.id === designer.avatarId);
          return (
            <Link key={designer.id} href={`/designers/${designer.id}`}>
              <Card className="text-center hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                    {designerAvatar && <AvatarImage src={designerAvatar.imageUrl} alt={designer.name} />}
                    <AvatarFallback className="text-3xl">{designer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-headline text-xl font-bold">{designer.name}</h3>
                  <p className="text-muted-foreground mb-4">{designer.specialization}</p>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Obuna bo'lish
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
