
"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { X } from "lucide-react";

interface LightboxProps {
  imageUrls: string[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Lightbox({ imageUrls, startIndex, open, onOpenChange }: LightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-full h-full p-0 bg-black/80 border-0 flex items-center justify-center">
        <DialogTitle className="sr-only">Kattalashtirilgan rasm galereyasi</DialogTitle>
        <DialogDescription className="sr-only">Loyiha rasmlarining to'liq ekranli galereyasi. O'ng va chapga surib varaqlashingiz mumkin.</DialogDescription>
        
        <Carousel 
          opts={{
            startIndex: startIndex,
            loop: true,
          }} 
          className="w-full h-full max-w-7xl"
        >
          <CarouselContent className="h-full">
            {imageUrls.map((url, index) => (
              <CarouselItem key={index} className="flex items-center justify-center">
                <div className="relative w-full h-[90vh]">
                  <Image 
                    src={url} 
                    alt={`Kattalashtirilgan rasm ${index + 1}`} 
                    fill
                    style={{ objectFit: "contain" }}
                    className="rounded-lg"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10" />
        </Carousel>

        <DialogClose className="absolute right-4 top-4 rounded-full p-2 bg-black/50 text-white opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-20">
          <X className="h-6 w-6" />
          <span className="sr-only">Yopish</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
