
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import PortfolioCard from '@/components/portfolio-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { collection, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot, where } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import LoadingPage from '../loading';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProjectDetailModal from '@/components/project-detail-modal';
import { AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { PREDEFINED_TAGS } from '@/lib/predefined-tags';
import { ScrollArea } from '@/components/ui/scroll-area';


const PROJECTS_PER_PAGE = 12;

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // Default sort to 'latest'
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  const [pages, setPages] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedProjectId = searchParams.get('projectId');
  const db = useFirestore();
  
  const projectsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let baseQuery = collection(db, 'projects');
    
    let q;
    if (sortBy === 'popular') {
      q = query(baseQuery, orderBy('likeCount', 'desc'));
    } else if (sortBy === 'trending') {
      q = query(baseQuery, orderBy('viewCount', 'desc'));
    } else { // 'latest' is the default
      q = query(baseQuery, orderBy('createdAt', 'desc'));
    }
    
    if (activeTag) {
      q = query(q, where('tags', 'array-contains', activeTag));
    }


    q = query(q, limit(PROJECTS_PER_PAGE));
    const lastDoc = pages[pages.length - 1];
    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }
    return q;
  }, [db, sortBy, pages, activeTag]);

  const { data: newProjects, isLoading, error, snapshot } = useCollection<Project>(projectsQuery);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  const loadMore = useCallback(() => {
    if (snapshot && snapshot.docs.length > 0) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setPages(prev => [...prev, lastDoc]);
    }
  }, [snapshot]);

  useEffect(() => {
    if (newProjects) {
        setAllProjects(prev => {
             // Create a Set of new project IDs for efficient lookup
            const newProjectIds = new Set(newProjects.map(p => p.id));
            
            // Filter out any projects in the previous state that are also in the new batch
            const filteredPrev = prev.filter(p => !newProjectIds.has(p.id));

            const combined = [...filteredPrev, ...newProjects];

            // Sort the combined array based on the current sort order
             return combined.sort((a,b) => {
                 if (sortBy === 'popular') return b.likeCount - a.likeCount;
                 if (sortBy === 'trending') return b.viewCount - a.viewCount;
                 return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0); // Default to latest
             });
        });
    }
     if (snapshot) {
        setHasMore(snapshot.docs.length === PROJECTS_PER_PAGE);
     }
  }, [newProjects, snapshot, sortBy]);


  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  const resetAndSort = (newSortBy: string) => {
    // If the new sort value is the same as the current one, reset to default ('latest')
    if (newSortBy === sortBy) {
        setSortBy('latest');
    } else {
        setSortBy(newSortBy);
    }
    setAllProjects([]);
    setPages([]);
    setHasMore(true);
  }

  const handleTagClick = (tag: string) => {
    setAllProjects([]);
    setPages([]);
    setHasMore(true);
    setActiveTag(tag === activeTag ? null : tag);
  }

  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    if (!searchTerm) return allProjects;

    return allProjects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [allProjects, searchTerm]);

  const handleModalClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('projectId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
    <AnimatePresence>
        {selectedProjectId && (
          <ProjectDetailModal 
            projectId={selectedProjectId} 
            onClose={handleModalClose}
          />
        )}
      </AnimatePresence>
    <div className="py-8 px-[10px]">
       <div className="sticky top-14 md:top-[68px] z-40 bg-background/95 backdrop-blur-lg -mx-[10px] px-4 py-4 mb-8 border-b">
        <div className="flex flex-col gap-4 max-w-full mx-auto">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Saralash
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Saralash</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <RadioGroup value={sortBy} onValueChange={resetAndSort}>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="latest" id="latest" />
                      <Label htmlFor="latest">Eng so'nggilari</Label>
                    </div>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="trending" id="trending" />
                      <Label htmlFor="trending">Trenddagilar</Label>
                    </div>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="popular" id="popular" />
                      <Label htmlFor="popular">Eng mashhurlari</Label>
                    </div>
                  </RadioGroup>
                </div>
                <SheetClose asChild>
                  <Button className='w-full'>Ko'rsatish</Button>
                </SheetClose>
              </SheetContent>
            </Sheet>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Loyiha, dizayner yoki teg bo'yicha qidirish..."
                className="w-full pl-10 h-11 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="w-full whitespace-nowrap mt-4">
             <div className="flex gap-2 pb-2">
                 <Button 
                    variant={activeTag === null ? 'default' : 'outline'}
                    onClick={() => handleTagClick(null!)}
                    className="rounded-full h-9 px-4"
                  >
                    Barchasi
                  </Button>
                {[...PREDEFINED_TAGS].slice(0, 15).map(tag => (
                  <Button 
                    key={tag}
                    variant={activeTag === tag ? 'default' : 'outline'}
                    onClick={() => handleTagClick(tag)}
                    className="rounded-full h-9 px-4"
                  >
                    {tag}
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {isLoading && allProjects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className={cn("overflow-hidden group transition-shadow duration-300 w-full h-full")}>
                  <CardContent className="p-0">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-4 w-8" />
                           <Skeleton className="h-4 w-8" />
                        </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-lg">
            <p>Ma'lumotlarni yuklashda xatolik yuz berdi.</p>
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProjects.map(project => (
                <PortfolioCard key={project.id} project={project} />
            ))}
            </div>
            <div ref={loadMoreRef} className="h-10 mt-8">
                {isLoading && allProjects.length > 0 && (
                     <div className="flex justify-center items-center">
                        <LoadingPage />
                     </div>
                )}
            </div>
        </>
      ) : (
        <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
            <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="floating-text text-2xl mt-4">Hech qanday loyiha topilmadi.</p>
            <p className="text-muted-foreground mt-2">Boshqa qidiruv so'zini sinab ko'ring yoki filtrlarni o'zgartiring.</p>
        </div>
      )}
    </div>
    </>
  );
}
