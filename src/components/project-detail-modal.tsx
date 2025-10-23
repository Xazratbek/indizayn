
"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import ProjectDetailsPage from "@/app/projects/[id]/page";
import { motion, AnimatePresence } from "framer-motion";
import { X } from 'lucide-react';
import { Button } from "./ui/button";
import { createContext, useContext } from "react";
import { ScrollArea } from "./ui/scroll-area";

interface ProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
}

const ModalContext = createContext<{ projectId: string | null } | null>(null);

export const useModalContext = () => useContext(ModalContext);

export default function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  return (
    <Dialog open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {!!projectId && (
          <DialogContent
            className="w-full h-full max-w-none p-0 bg-transparent border-0 shadow-none"
          >
            <div className="absolute inset-0" onClick={onClose}>
                <DialogTitle className="sr-only">Loyiha tafsilotlari</DialogTitle>
                <DialogDescription className="sr-only">
                    Loyiha haqida to'liq ma'lumotni ko'rish uchun qalqib chiquvchi oyna.
                </DialogDescription>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-[60] h-10 w-10 rounded-full bg-background/50 hover:bg-background/80">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Yopish</span>
                    </Button>
                </DialogClose>

                <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
                    <ScrollArea className="h-screen w-screen">
                        <ModalContext.Provider value={{ projectId }}>
                            <ProjectDetailsPage />
                        </ModalContext.Provider>
                    </ScrollArea>
                </div>
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
