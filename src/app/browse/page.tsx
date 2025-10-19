
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import PortfolioCard from '@/components/portfolio-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import PaginationControls from '@/components/pagination-controls';
import LoadingPage from '../loading';

const PROJECTS_PER_PAGE = 12;

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);

  const db = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let baseQuery = collection(db, 'projects');
    
    let q;
    if (sortBy === 'latest') {
      q = query(baseQuery, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'popular') {
      q = query(baseQuery, orderBy('likeCount', 'desc'));
    } else { // trending
      q = query(baseQuery, orderBy('viewCount', 'desc'));
    }

    q = query(q, limit(PROJECTS_PER_PAGE));
    if (page > 1 && lastVisible) {
        q = query(q, startAfter(lastVisible));
    }

    return q;
  }, [db, sortBy, page, lastVisible]);


  const { data: projects, isLoading, error, snapshot } = useCollection<Project>(projectsQuery);

  useEffect(() => {
      if (!isLoading && snapshot) {
          const hasMore = snapshot.docs.length === PROJECTS_PER_PAGE;
          if (!hasMore && page > 1) {
              // We are on the last page
          }
      }
      if (!isLoading) {
          setIsNextPageLoading(false);
      }
  }, [isLoading, snapshot, page]);


  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchTerm) return projects;

    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [projects, searchTerm]);

  const handleNextPage = () => {
    if (snapshot && snapshot.docs.length > 0) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);
      setPage(p => p + 1);
      setIsNextPageLoading(true);
    }
  };
  
  const handlePrevPage = () => {
    // This is a simplified previous page logic. For a true "prev", we'd need to query backwards
    // which is more complex. Resetting to page 1 is a common simple approach.
    setPage(1);
    setLastVisible(null);
  };
  
  const isNextDisabled = !snapshot || snapshot.docs.length < PROJECTS_PER_PAGE || isNextPageLoading;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold liquid-text">Dizaynlarni O'rganing</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Ijodkorlik dunyosini kashf eting. Keyingi ilhomingizni topish uchun loyihalar, dizaynerlar yoki teglarni qidiring.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Loyiha, dizayner yoki teg bo'yicha qidirish..."
            className="w-full pl-10 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-12">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Saralash
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Saralash</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortBy === 'trending'}
              onCheckedChange={() => { setSortBy('trending'); setPage(1); setLastVisible(null); }}
            >
              Trenddagilar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'latest'}
              onCheckedChange={() => { setSortBy('latest'); setPage(1); setLastVisible(null); }}
            >
              Eng so'nggilari
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'popular'}
              onCheckedChange={() => { setSortBy('popular'); setPage(1); setLastVisible(null); }}
            >
              Eng mashhurlari
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading && page === 1 ? (
        <div className="flex justify-center items-center h-64">
          <LoadingPage />
        </div>
      ) : error ? (
        <div className="text-center py-16">
            <p className="text-destructive">Ma'lumotlarni yuklashda xatolik yuz berdi.</p>
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProjects.map(project => (
                <PortfolioCard key={project.id} project={project} />
            ))}
            </div>
            <PaginationControls 
                currentPage={page}
                onNext={handleNextPage}
                onPrev={handlePrevPage}
                isNextDisabled={isNextDisabled}
                isPrevDisabled={page === 1}
            />
             {isNextPageLoading && (
                <div className="flex justify-center items-center mt-4">
                    <LoadingPage />
                </div>
             )}
        </>
      ) : (
        <div className="text-center py-20">
            <p className="floating-text text-2xl">Hech qanday loyiha topilmadi.</p>
            <p className="text-muted-foreground mt-2">Boshqa qidiruv so'zini sinab ko'ring yoki filtrlarni o'zgartiring.</p>
        </div>
      )}
    </div>
  );
}
