"use client";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Designer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { collection, query, orderBy } from 'firebase/firestore';

export default function DesignersPage() {
  const db = useFirestore();
  const designersQuery = useMemoFirebase(() => query(collection(db, 'users'), orderBy('subscriberCount', 'desc')), [db]);
  const { data: designers, isLoading } = useCollection<Designer>(designersQuery);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">Bizning Dizaynerlarimiz</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Platformamizdagi eng iqtidorli va ijodkor dizaynerlar hamjamiyatini kashf eting.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : designers && designers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {designers.map((designer) => (
            <Link key={designer.id} href={`/designers/${designer.id}`}>
              <Card className="text-center hover:shadow-xl transition-shadow duration-300 h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                    {designer.photoURL && <AvatarImage src={designer.photoURL} alt={designer.name} />}
                    <AvatarFallback className="text-3xl">{designer.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-headline text-xl font-bold">{designer.name}</h3>
                  <p className="text-muted-foreground mb-4">{designer.specialization}</p>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" /> Profilni ko'rish
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
         <div className="text-center py-20">
            <p className="floating-text text-2xl">Hozircha dizaynerlar yo'q.</p>
            <p className="text-muted-foreground mt-2">Balki siz birinchisi bo'larsiz?</p>
        </div>
      )}
    </div>
  );
}
