"use client";

import { useState } from 'react';
import { getFullProjects } from '@/lib/mock-data';
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
} from "@/components/ui/dropdown-menu"

const allProjects = getFullProjects();

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');

  const filteredProjects = allProjects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.designer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'trending') {
        return (b.likes + b.views) - (a.likes + a.views);
      }
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'popular') {
        return b.likes - a.likes;
      }
      return 0;
    });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Explore Designs</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Discover a world of creativity. Search for projects, designers, or tags to find your next inspiration.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by project, designer, or tag..."
            className="w-full pl-10 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-12">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter & Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sortBy === 'trending'}
              onCheckedChange={() => setSortBy('trending')}
            >
              Trending
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'latest'}
              onCheckedChange={() => setSortBy('latest')}
            >
              Latest
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'popular'}
              onCheckedChange={() => setSortBy('popular')}
            >
              Most Liked
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProjects.map(project => (
            <PortfolioCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground">No projects found for "{searchTerm}". Try a different search.</p>
        </div>
      )}
    </div>
  );
}
