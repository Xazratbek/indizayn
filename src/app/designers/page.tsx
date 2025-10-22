
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Designer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users2, Search, SlidersHorizontal, PackageSearch, X } from "lucide-react";
import Link from "next/link";
import { collection, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { PREDEFINED_SPECIALIZATIONS } from '@/lib/predefined-tags';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const DESIGNERS_PER_PAGE = 12;

function DesignerCardSkeleton() {
    return (
        <Card className="text-center h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-9 w-32" />
            </CardContent>
        </Card>
    );
}


export default function DesignersPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(DESIGNERS_PER_PAGE);

  const designersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'users'), orderBy('subscriberCount', 'desc')) : null, 
  [db]);
  const { data: designers, isLoading } = useCollection<Designer>(designersQuery);
  
  const filteredDesigners = useMemo(() => {
    if (!designers) return [];

    let filtered = designers;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // Filter by both search term (name or specialization) and selected specs
    filtered = filtered.filter(d => {
        const nameMatch = d.name.toLowerCase().includes(lowerCaseSearchTerm);
        const specMatch = d.specialization?.toLowerCase().includes(lowerCaseSearchTerm) ?? false;
        const searchCondition = nameMatch || specMatch;

        const specFilterCondition = selectedSpecs.length > 0 
            ? d.specialization && selectedSpecs.includes(d.specialization)
            : true;
        
        return searchCondition && specFilterCondition;
    });

    return filtered;

  }, [designers, searchTerm, selectedSpecs]);

  const paginatedDesigners = useMemo(() => {
    return filteredDesigners.slice(0, visibleCount);
  }, [filteredDesigners, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + DESIGNERS_PER_PAGE);
  };
  
  const handleSpecToggle = (spec: string) => {
    setSelectedSpecs(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
    setVisibleCount(DESIGNERS_PER_PAGE); // Reset visible count on filter change
  }


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Bizning Dizaynerlarimiz</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Platformamizdagi eng iqtidorli va ijodkor dizaynerlar hamjamiyatini kashf eting.
        </p>
      </div>

       <div className="sticky top-16 md:top-[68px] z-40 bg-background/80 backdrop-blur-lg -mx-4 px-4 py-4 mb-8 border-b">
         <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Ism yoki mutaxassislik bo'yicha qidirish..."
                    className="w-full pl-10 h-12"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setVisibleCount(DESIGNERS_PER_PAGE);
                    }}
                />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Mutaxassislik
                  {selectedSpecs.length > 0 && <span className="ml-2 bg-primary text-primary-foreground h-5 w-5 text-xs rounded-full flex items-center justify-center">{selectedSpecs.length}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Mutaxassislik bo'yicha filtrlash</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-2">
                    {PREDEFINED_SPECIALIZATIONS.map(spec => (
                        <div key={spec} className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary">
                             <Checkbox 
                                id={spec}
                                checked={selectedSpecs.includes(spec)}
                                onCheckedChange={() => handleSpecToggle(spec)}
                             />
                             <Label htmlFor={spec} className="flex-1 cursor-pointer">{spec}</Label>
                        </div>
                    ))}
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button className="w-full">Qo'llash</Button>
                    </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
         </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({length: 8}).map((_, i) => <DesignerCardSkeleton key={i} />)}
        </div>
      ) : paginatedDesigners && paginatedDesigners.length > 0 ? (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {paginatedDesigners.map((designer) => (
                <Link key={designer.id} href={`/designers/${designer.id}`}>
                <Card className="text-center hover:shadow-xl transition-shadow duration-300 h-full">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                        {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                        <AvatarFallback className="text-3xl">{designer.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-headline text-xl font-bold">{designer.name}</h3>
                    <p className="text-muted-foreground mb-4 h-6">{designer.specialization}</p>
                    <Button variant="outline" size="sm">
                        <UserPlus className="mr-2 h-4 w-4" /> Profilni ko'rish
                    </Button>
                    </CardContent>
                </Card>
                </Link>
            ))}
            </div>
             {visibleCount < filteredDesigners.length && (
                <div className="mt-12 text-center">
                    <Button onClick={handleLoadMore}>Ko'proq yuklash</Button>
                </div>
            )}
        </>
      ) : searchTerm || selectedSpecs.length > 0 ? (
         <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
            <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="floating-text text-2xl mt-4">Hech qanday dizayner topilmadi.</p>
            <p className="text-muted-foreground mt-2">Qidiruv so'zini yoki filtrlarni o'zgartirib ko'ring.</p>
        </div>
      ) : (
         <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
            <Users2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="floating-text text-2xl mt-4">Hozircha dizaynerlar yo'q.</p>
            <p className="text-muted-foreground mt-2 mb-6">Balki siz birinchisi bo'larsiz?</p>
            <Button asChild>
                <Link href="/auth">Hamjamiyatga Qo'shilish</Link>
            </Button>
        </div>
      )}
    </div>
  );
}

    