"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import PortfolioCard from '@/components/portfolio-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, query, orderBy, limit, startAt, getDocs, where } from 'firebase/firestore';
import type { Project } from '@/lib/types';


export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const db = useFirestore();

  const projectsQuery = useMemoFirebase(() => {
    const baseQuery = collection(db, 'projects');
    if (sortBy === 'latest') {
      return query(baseQuery, orderBy('createdAt', 'desc'));
    }
    if (sortBy === 'popular') {
      return query(baseQuery, orderBy('likeCount', 'desc'));
    }
    // "trending" is more complex, for now, we'll sort by views.
    // A real trending algorithm would require more logic (e.g., views in the last 7 days).
    return query(baseQuery, orderBy('viewCount', 'desc'));
  }, [db, sortBy]);

  const { data: allProjects, isLoading, error } = useCollection<Project>(projectsQuery);

  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    if (!searchTerm) return allProjects;

    return allProjects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [allProjects, searchTerm]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Dizaynlarni O'rganing</h1>
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
              Filtrlash va Saralash
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Saralash</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortBy === 'trending'}
              onCheckedChange={() => setSortBy('trending')}
            >
              Trenddagilar
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'latest'}
              onCheckedChange={() => setSortBy('latest')}
            >
              Eng so'nggilari
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'popular'}
              onCheckedChange={() => setSortBy('popular')}
            >
              Eng mashhurlari
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
            <p className="text-destructive">Ma'lumotlarni yuklashda xatolik yuz berdi.</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProjects.map(project => (
            <PortfolioCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <p className="floating-text text-2xl">Hech qanday loyiha topilmadi.</p>
            <p className="text-muted-foreground mt-2">Boshqa qidiruv so'zini sinab ko'ring yoki filtrlarni o'zgartiring.</p>
        </div>
      )}
    </div>
  );
}
