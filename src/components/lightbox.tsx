
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";

interface LightboxProps {
  imageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Lightbox({ imageUrl, open, onOpenChange }: LightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto p-0 bg-transparent border-0 flex items-center justify-center">
        <div className="relative w-[90vw] h-[90vh]">
          <Image 
            src={imageUrl} 
            alt="Kattalashtirilgan rasm" 
            layout="fill"
            objectFit="contain"
            className="rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
