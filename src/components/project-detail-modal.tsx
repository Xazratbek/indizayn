
"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProjectDetailsPage from "@/app/projects/[id]/page";
import { motion, AnimatePresence } from "framer-motion";
import { X } from 'lucide-react';
import { Button } from "./ui/button";
import { createContext, useContext } from "react";
import { useRouter } from 'next/navigation';


interface ProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
}

const ModalContext = createContext<{ projectId: string | null }>({ projectId: null });

export const useModalContext = () => useContext(ModalContext);

export default function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  const router = useRouter();

  return (
    <Dialog open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {!!projectId && (
          <DialogContent
            className="max-w-7xl w-full h-[95vh] p-0 flex flex-col"
            onInteractOutside={onClose}
          >
             <DialogTitle className="sr-only">Loyiha tafsilotlari</DialogTitle>
             <DialogDescription className="sr-only">
                Loyiha haqida to'liq ma'lumotni ko'rish uchun qalqib chiquvchi oyna.
            </DialogDescription>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative h-full flex flex-col"
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
