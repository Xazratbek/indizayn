
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Designer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Users2, Search, SlidersHorizontal, PackageSearch, UserCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { collection, query, orderBy, where, limit, startAfter, QueryDocumentSnapshot, DocumentData, updateDoc, doc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
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
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import LoadingPage from '../loading';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DESIGNERS_PER_PAGE = 20;

function DesignerCard({ designer }: { designer: Designer }) {
    const { data: session } = useSession();
    const user = session?.user;
    const db = useFirestore();
    const { toast } = useToast();

    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    
    useEffect(() => {
        if (user && designer?.followers) {
            setIsFollowing(designer.followers.includes(user.id));
        }
    }, [user, designer]);

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); 
        e.preventDefault();

        if (!user || !designer || !db) {
            toast({ variant: "warning", description: "Obuna bo'lish uchun tizimga kiring." });
            return;
        }
        if (user.id === designer.id) {
            toast({ variant: "destructive", description: "O'zingizga obuna bo'la olmaysiz." });
            return;
        }

        setIsFollowLoading(true);
        const designerRef = doc(db, "users", designer.id);

        try {
            if (isFollowing) {
                await updateDoc(designerRef, { followers: arrayRemove(user.id), subscriberCount: increment(-1) });
                setIsFollowing(false);
                toast({ description: `${designer?.name} obunasidan chiqdingiz.` });
            } else {
                await updateDoc(designerRef, { followers: arrayUnion(user.id), subscriberCount: increment(1) });
                setIsFollowing(true);
                toast({ variant: "success", description: `${designer?.name} ga obuna bo'ldingiz.` });
            }
        } catch (error) {
            console.error("Follow/unfollow error", error);
            toast({ variant: "destructive", title: "Xatolik", description: "Amalni bajarishda xatolik yuz berdi." });
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <Link href={`/designers/${designer.id}`} className="block">
            <Card className="text-center hover:shadow-xl transition-shadow duration-300 h-full group">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <div className="relative mb-2">
                        <Avatar className="w-20 h-20 mx-auto border-4 border-transparent group-hover:border-primary/20 transition-colors duration-300">
                            {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                            <AvatarFallback className="text-3xl">{designer.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user && user.id !== designer.id && (
                             <Button
                                size="icon"
                                variant={isFollowing ? 'secondary' : 'default'}
                                onClick={handleFollowToggle}
                                disabled={isFollowLoading}
                                className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full border-2 border-background"
                            >
                                {isFollowLoading 
                                    ? <Loader2 className="h-4 w-4 animate-spin"/> 
                                    : isFollowing 
                                        ? <UserCheck className="h-4 w-4" /> 
                                        : <UserPlus className="h-4 w-4" />
                                }
                            </Button>
                        )}
                    </div>
                    <h3 className="font-headline text-base font-bold truncate w-full">{designer.name}</h3>
                    <p className="text-muted-foreground text-xs truncate w-full">{designer.specialization}</p>
                </CardContent>
            </Card>
        </Link>
    );
}


function DesignerCardSkeleton() {
    return (
        <Card className="text-center h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <Skeleton className="w-20 h-20 rounded-full mx-auto mb-2" />
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
            </CardContent>
        </Card>
    );
}

export default function DesignersPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  
  const [pages, setPages] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [allDesigners, setAllDesigners] = useState<Designer[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  const designersQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q = query(collection(db, 'users'), orderBy('subscriberCount', 'desc'));
    
    if(selectedSpecs.length > 0) {
      q = query(q, where('specialization', 'in', selectedSpecs));
    }

    q = query(q, limit(DESIGNERS_PER_PAGE));
    
    const lastDoc = pages[pages.length - 1];
    if(lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    return q;
  }, [db, selectedSpecs, pages]);

  const { data: newDesigners, isLoading, snapshot } = useCollection<Designer>(designersQuery);

  const loadMore = useCallback(() => {
    if (snapshot && snapshot.docs.length > 0) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setPages(prev => [...prev, lastDoc]);
    }
  }, [snapshot]);

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isLoading, loadMore]);

  useEffect(() => {
    if (newDesigners) {
      setAllDesigners(prev => {
        const newDesignerIds = new Set(newDesigners.map(d => d.id));
        const filteredPrev = prev.filter(d => !newDesignerIds.has(d.id));
        return [...filteredPrev, ...newDesigners].sort((a,b) => b.subscriberCount - a.subscriberCount);
      });
    }
    if (snapshot) {
      setHasMore(snapshot.docs.length === DESIGNERS_PER_PAGE);
    }
  }, [newDesigners, snapshot]);
  
  const filteredDesigners = useMemo(() => {
    if (!allDesigners) return [];
    if (!searchTerm) return allDesigners;
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allDesigners.filter(d =>
        d.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (d.specialization?.toLowerCase().includes(lowerCaseSearchTerm) ?? false)
    );
  }, [allDesigners, searchTerm]);


  const resetAndFilter = () => {
    setAllDesigners([]);
    setPages([]);
    setHasMore(true);
  };
  
  const handleSpecToggle = (spec: string) => {
    setSelectedSpecs(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  }

  const applyFilters = () => {
    resetAndFilter();
  }

  return (
    <div className="py-8 px-4 md:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Bizning Dizaynerlarimiz</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Platformamizdagi eng iqtidorli va ijodkor dizaynerlar hamjamiyatini kashf eting.
        </p>
      </div>

       <div className="sticky top-14 md:top-[68px] z-40 bg-background/80 backdrop-blur-lg -mx-4 px-4 py-4 mb-8 border-b">
         <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Ism bo'yicha qidirish..."
                    className="w-full pl-10 h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                        <Button className="w-full" onClick={applyFilters}>Qo'llash</Button>
                    </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
         </div>
      </div>
      
      {isLoading && allDesigners.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({length: 10}).map((_, i) => <DesignerCardSkeleton key={i} />)}
        </div>
      ) : filteredDesigners && filteredDesigners.length > 0 ? (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredDesigners.map((designer) => (
                  <DesignerCard key={designer.id} designer={designer} />
              ))}
            </div>
            <div ref={loadMoreRef} className="h-10 mt-8">
                {isLoading && allDesigners.length > 0 && (
                     <div className="flex justify-center items-center">
                        <LoadingPage />
                     </div>
                )}
            </div>
        </>
      ) : (
         <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
            <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="floating-text text-2xl mt-4">Hech qanday dizayner topilmadi.</p>
            <p className="text-muted-foreground mt-2">Qidiruv so'zini yoki filtrlarni o'zgartirib ko'ring.</p>
        </div>
      )}
    </div>
  );
}

    
