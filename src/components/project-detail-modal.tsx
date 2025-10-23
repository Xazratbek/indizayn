
"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import ProjectDetailsPage from "@/app/projects/[id]/page";
import { motion, AnimatePresence } from "framer-motion";
import { X } from 'lucide-react';
import { Button } from "./ui/button";
import { createContext, useContext } from "react";

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
            onInteractOutside={onClose}
          >
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

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative h-full w-full flex flex-col"
              >
                  <div className="flex-1 overflow-y-auto">
                    <ModalContext.Provider value={{ projectId }}>
                        <ProjectDetailsPage />
                    </ModalContext.Provider>
                  </div>
              </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
