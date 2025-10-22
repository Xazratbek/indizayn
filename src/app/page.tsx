
"use client"

import Link from 'next/link';
import { MoveRight, Palette, UserCheck, ThumbsUp, Loader2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortfolioCard from '@/components/portfolio-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { useSession, signIn } from 'next-auth/react';
import { useState, useRef } from 'react';
import LoadingPage from './loading';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const advantages = [
    {
        icon: <Palette className="w-10 h-10 text-primary" />,
        title: "Portfoliongizni Namoyish Eting",
        description: "O'z ijodiy ishlaringizni keng auditoriyaga taqdim eting va professionallar hamjamiyatidan fikr-mulohazalar oling."
    },
    {
        icon: <UserCheck className="w-10 h-10 text-primary" />,
        title: "Dizaynerlarga Obuna Bo'ling",
        description: "O'zingiz yoqtirgan dizaynerlarning ijodini kuzatib boring va ularning so'nggi ishlaridan birinchilardan bo'lib xabardor bo'ling."
    },
    {
        icon: <ThumbsUp className="w-10 h-10 text-primary" />,
        title: "Ishlarni Baholang va Fikr Bildiring",
        description: "Boshqa dizaynerlarning ishlariga 'layk' bosing, izohlar qoldiring va ijodiy muhokamalarda faol ishtirok eting."
    }
];

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const HeroShowcase = ({ projects }: { projects: Project[] }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: gridRef,
        offset: ['start start', 'end start'],
    });

    const rotateX = useTransform(scrollYProgress, [0, 1], [0, 45]);
    const translateY = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
    
    // Ensure we have at least 9 projects to display by looping if necessary
    const displayProjects = [...projects];
    while (displayProjects.length > 0 && displayProjects.length < 9) {
        displayProjects.push(...projects.slice(0, 9 - displayProjects.length));
    }


    const firstColumn = displayProjects.slice(0, 3);
    const secondColumn = displayProjects.slice(3, 6);
    const thirdColumn = displayProjects.slice(6, 9);
    
    if (firstColumn.length === 0) return null;

    const renderColumn = (columnProjects: Project[], y: number) => (
        <motion.div className="relative flex flex-col gap-4 w-[30%]" style={{ y }}>
            {columnProjects.map((project, index) => (
                <div key={`${project.id}-${index}`} className="aspect-video relative rounded-lg overflow-hidden shadow-xl">
                    <Image
                        src={project.imageUrl}
                        alt={project.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 30vw, 30vw"
                        data-ai-hint="project image"
                    />
                </div>
            ))}
        </motion.div>
    );

    return (
        <div ref={gridRef} className="w-full h-[120vh] relative -mt-[20vh]">
            <motion.div
                className="sticky top-0 h-screen flex justify-center items-center overflow-hidden"
                style={{
                    perspective: '1000px',
                    translateY
                }}
            >
                <motion.div
                    className="flex gap-2 md:gap-4 w-full md:w-[70%]"
                    style={{
                        rotateX,
                        scale,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {renderColumn(firstColumn, -40)}
                    {renderColumn(secondColumn, 80)}
                    {renderColumn(thirdColumn, -40)}
                </motion.div>
            </motion.div>
        </div>
    );
};


export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isUserLoading = status === 'loading';
  const router = useRouter();
  const db = useFirestore();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const featuredProjectsQuery = useMemoFirebase(() =>
    db ? query(collection(db, 'projects'), orderBy('viewCount', 'desc'), limit(9)) : null
  , [db]);
  const { data: featuredProjects, isLoading: areProjectsLoading } = useCollection<Project>(featuredProjectsQuery);

  const handleStartClick = () => {
    setIsSigningIn(true);
    signIn('google');
  };

  const isLoading = areProjectsLoading || isUserLoading;
  
  const displayProjects = featuredProjects?.slice(0, 4) || [];

  return (
    <div className="flex flex-col">
       {!user && !isUserLoading ? (
            <>
                <section className="relative w-full h-[60vh] md:h-auto bg-background overflow-hidden">
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
                      <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className="text-4xl md:text-6xl font-bold font-headline mb-4 liquid-text"
                      >
                          inDizayn-ga Xush Kelibsiz!
                      </motion.h1>

                      <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                          className="mt-4 max-w-2xl text-lg text-muted-foreground"
                      >
                          Dizaynerlar uchun o'z ishlarini namoyish etish, ilhomlanish va global hamjamiyat bilan bog'lanish uchun eng zo'r platforma.
                      </motion.p>
                      
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                            className="mt-8"
                        >
                            {isSigningIn ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    <p className="text-muted-foreground animate-pulse">Google'ga yo'naltirilmoqda...</p>
                                </div>
                            ) : (
                                <div className="animated-border-box">
                                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground py-7" onClick={handleStartClick} disabled={isSigningIn}>
                                        Boshlash <MoveRight className="ml-2" />
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                    {featuredProjects && <HeroShowcase projects={featuredProjects} />}
                </section>
            </>
        ) : null}


      <motion.section 
        className="py-16 md:py-24 bg-secondary/50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Trenddagi Loyihalar</h2>
            <p className="text-muted-foreground mt-2">Iste'dodli hamjamiyatimizdan eng ko'p ko'rilgan loyihalar.</p>
          </div>
          
          {isLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden w-full h-full">
                      <CardContent className="p-0">
                        <Skeleton className="aspect-video w-full" />
                        <div className="p-4 space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
             </div>
          ) : displayProjects && displayProjects.length > 0 ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayProjects.map(project => (
                    <PortfolioCard key={project.id} project={project} />
                ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild variant="outline">
                    <Link href="/browse">Barcha Loyihalarni Ko'rish</Link>
                    </Button>
                </div>
            </>
          ) : (
            <div className="text-center py-20 bg-card border rounded-lg shadow-sm">
                <ImageOff className="mx-auto h-16 w-16 text-muted-foreground/50" />
                <p className="floating-text text-2xl mt-4">Hozircha loyihalar yo'q.</p>
                <p className="text-muted-foreground mt-2 mb-6">Birinchi loyihani yuklagan siz bo'ling!</p>
                 <Button asChild>
                    <Link href="/account/new-project">Loyiha Yuklash</Link>
                </Button>
            </div>
          )}
        </div>
      </motion.section>
      
      {!user && !isUserLoading && (
        <motion.section 
            className="py-16 md:py-24 bg-background"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
        >
            <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Platformaning afzalliklari</h2>
                <p className="text-muted-foreground mt-2">Nima uchun dizaynerlar bizni tanlashadi?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {advantages.map((adv, index) => (
                    <motion.div
                    key={index}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={{
                        hidden: { opacity: 0, y: 50 },
                        visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: { duration: 0.5, delay: index * 0.1 }
                        }
                    }}
                    whileHover={{ y: -8, boxShadow: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    transition={{ duration: 0.3 }}
                    >
                    <Card className="text-center p-6 h-full">
                        <CardHeader className="items-center">
                            <div className="p-4 bg-primary/10 rounded-full mb-4">
                                {adv.icon}
                            </div>
                            <CardTitle className="font-headline text-xl">{adv.title}</CardTitle>
                            <CardDescription className="pt-2">{adv.description}</CardDescription>
                        </CardHeader>
                    </Card>
                    </motion.div>
                ))}
            </div>
            </div>
        </motion.section>
      )}

    </div>
  );
}
