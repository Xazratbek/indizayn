
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
import { PREDEFINED_TAGS } from '@/lib/predefined-tags';
import { ScrollArea } from '@/components/ui/scroll-area';

const PROJECTS_PER_PAGE = 12;

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedProjectId = searchParams.get('projectId');
  const db = useFirestore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const createBaseQuery = () => {
    if (!db) return null;
    let baseQuery: Query<DocumentData> = collection(db, 'projects');

    if (activeTag) {
      baseQuery = query(baseQuery, where('tags', 'array-contains', activeTag));
    }
    
    if (sortBy === 'popular') {
      baseQuery = query(baseQuery, orderBy('likeCount', 'desc'));
    } else if (sortBy === 'trending') {
        baseQuery = query(baseQuery, orderBy('viewCount', 'desc'));
    } else {
      // Default to 'latest' if sortBy is null or 'latest'
      baseQuery = query(baseQuery, orderBy('createdAt', 'desc'));
    }
    
    return baseQuery;
  }
  
  const fetchProjects = useCallback(async (isInitialLoad = false) => {
    if (!db) return;
    if (!isInitialLoad && !hasMore) return;

    if (isInitialLoad) {
      setIsLoading(true);
      setProjects([]);
      setLastDoc(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let q = createBaseQuery();
      if (!q) return;

      q = query(q, limit(PROJECTS_PER_PAGE));

      if (!isInitialLoad && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newProjects = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
        
        setProjects(prev => isInitialLoad ? newProjects : [...prev, ...newProjects]);
        
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastDoc(newLastDoc || null);
        setHasMore(snapshot.docs.length === PROJECTS_PER_PAGE);
        
        setIsLoading(false);
        setIsLoadingMore(false);
      }, (error) => {
        console.error("Error fetching projects: ", error);
        setIsLoading(false);
        setIsLoadingMore(false);
      });

      return unsubscribe;

    } catch (error) {
      console.error("Failed to build query:", error);
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [db, activeTag, sortBy, lastDoc, hasMore]);


  // Initial load and filter changes
  useEffect(() => {
    const unsubscribePromise = fetchProjects(true);
    return () => {
        unsubscribePromise?.then(unsub => unsub && unsub());
    };
  }, [activeTag, sortBy]);


  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchProjects(false);
        }
      },
      { rootMargin: '100px' }
    );
    
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMoreRef, hasMore, isLoading, isLoadingMore, fetchProjects]);


  const handleSortChange = (newSortBy: string) => {
    const updatedSortBy = sortBy === newSortBy ? null : newSortBy;
    setSortBy(updatedSortBy);
    // When sorting, clear tag filter for simplicity and to avoid complex queries
    if(updatedSortBy !== null) {
        setActiveTag(null);
    }
  }

  const handleTagClick = (tag: string | null) => {
    const newActiveTag = tag === activeTag ? null : tag;
    setActiveTag(newActiveTag);
    // When filtering by tag, reset sort to default for predictable results
    if (newActiveTag !== null) {
        setSortBy(null);
    }
  }

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchTerm) return projects;

    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [projects, searchTerm]);

  const handleModalClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('projectId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const renderSkeletons = () => (
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
  );

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
                  <RadioGroup value={sortBy ?? ""} onValueChange={handleSortChange}>
                     <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="" id="latest"/>
                      <Label htmlFor="latest">Eng so'nggilari (Standart)</Label>
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
                    onClick={() => handleTagClick(null)}
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
      
      {isLoading ? (
        renderSkeletons()
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProjects.map(project => (
                <PortfolioCard key={project.id} project={project} />
            ))}
            </div>
            <div ref={loadMoreRef} className="h-10 mt-8 flex justify-center items-center">
                {isLoadingMore && <LoadingPage />}
                {!hasMore && projects.length > PROJECTS_PER_PAGE && (
                    <p className='text-muted-foreground'>Boshqa loyihalar yo'q.</p>
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
