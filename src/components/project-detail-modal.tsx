
"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProjectDetailsPage from "@/app/projects/[id]/page";
import { motion, AnimatePresence } from "framer-motion";
import { X } from 'lucide-react';
import { Button } from "./ui/button";
import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface ProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
}

// Wrapper component to provide params to the page
function ProjectPageWrapper({ projectId, onClose }: ProjectDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // This is a bit of a hack to make the Page component work inside the modal
  // by overriding the router methods it uses
  const modalRouter = {
    ...router,
    back: onClose,
    replace: (href: string) => {
        // If it's trying to remove the projectId, we close the modal
        if (!href.includes('projectId=')) {
            onClose();
        } else {
            router.replace(href);
        }
    },
    push: (href: string) => {
        // Any navigation inside the modal should just navigate the main window
        onClose();
        router.push(href);
    }
  };

  // Override useParams
  jest.spyOn(require('next/navigation'), 'useParams').mockImplementation(() => ({
    id: projectId
  }));

  return <ProjectDetailsPage />;
}

export default function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  useEffect(() => {
    // Mocking the router for the page component. This is not ideal.
    // A better approach would be to refactor the ProjectDetailsPage into smaller
    // components that don't rely on the router context directly.
    jest.mock('next/navigation', () => ({
      ...jest.requireActual('next/navigation'),
      useParams: () => ({ id: projectId }),
      useRouter: () => ({
        back: onClose,
        replace: (href: string) => {
            const currentParams = new URLSearchParams(window.location.search);
            const newParams = new URLSearchParams(href.split('?')[1] || '');
            if (!newParams.has('projectId')) {
                onClose();
            } else {
                 const finalParams = new URLSearchParams(currentParams);
                 newParams.forEach((value, key) => finalParams.set(key, value));
                 window.history.replaceState({}, '', `${window.location.pathname}?${finalParams.toString()}`);
            }
        },
        push: (href: string) => {
            onClose();
            window.location.href = href;
        },
      }),
    }));

    return () => {
        jest.restoreAllMocks();
    }
  }, [projectId, onClose]);

  return (
    <Dialog open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {!!projectId && (
          <DialogContent 
            className="max-w-7xl w-full h-[95vh] p-0 flex flex-col"
            asChild
            onInteractOutside={onClose}
          >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-2 right-2 z-50 bg-background/50 hover:bg-background rounded-full"
              >
                <X />
              </Button>
              <div className="flex-1 overflow-y-auto">
                 {/* This is a trick to make the ProjectDetailsPage think it has the right params */}
                 <ProjectPageWrapper projectId={projectId} onClose={onClose} />
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
