"use client"

import Link from 'next/link';
import { MoveRight, Palette, UserCheck, ThumbsUp, Loader2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Project } from '@/lib/types';
import { useSession, signIn } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import PortfolioCard from '@/components/portfolio-card';
import RotatingText from '@/components/RotatingText';

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


const FloatingShowcase = ({ projects }: { projects: Project[] }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const numProjects = isMobile ? 6 : 10;
    const displayProjects = [...projects];
    while (displayProjects.length > 0 && displayProjects.length < numProjects) {
        displayProjects.push(...projects.slice(0, numProjects - displayProjects.length));
    }
    if (displayProjects.length === 0) return null;

    const desktopPositions = [
        // Left Side
        { top: '10%', left: '5%', y: useTransform(scrollYProgress, [0, 1], [0, -10]), className: 'w-48 h-36', delay: 0.2 },
        { top: '45%', left: '2%', y: useTransform(scrollYProgress, [0, 1], [0, -15]), className: 'w-56 h-40', delay: 1.5 },
        { top: '75%', left: '8%', y: useTransform(scrollYProgress, [0, 1], [0, -12]), className: 'w-40 h-56', delay: 0.7 },
        
        // Right Side
        { top: '12%', right: '4%', y: useTransform(scrollYProgress, [0, 1], [0, -15]), className: 'w-44 h-56', delay: 0.9 },
        { top: '50%', right: '10%', y: useTransform(scrollYProgress, [0, 1], [0, -10]), className: 'w-36 h-28', delay: 2.2 },
        { top: '72%', right: '1%', y: useTransform(scrollYProgress, [0, 1], [0, -18]), className: 'w-56 h-48', delay: 1.4 },
        
        // Additional
        { bottom: '5%', left: '25%', y: useTransform(scrollYProgress, [0, 1], [0, -25]), className: 'w-32 h-32 opacity-0 md:opacity-100', delay: 2.5 },
        { bottom: '8%', right: '22%', y: useTransform(scrollYProgress, [0, 1], [0, -20]), className: 'w-48 h-40 opacity-0 md:opacity-100', delay: 0.4 },
        { top: '18%', left: '20%', y: useTransform(scrollYProgress, [0, 1], [0, -15]), className: 'w-24 h-24 opacity-0 md:opacity-100', delay: 3 },
        { top: '60%', right: '25%', y: useTransform(scrollYProgress, [0, 1], [0, -8]), className: 'w-28 h-28 opacity-0 md:opacity-100', delay: 1.8 },
    ];
    
    const mobilePositions = [
        { top: '8%', left: '5%', y: useTransform(scrollYProgress, [0, 1], [0, -15]), className: 'w-32 h-24', delay: 0.2 },
        { top: '15%', right: '8%', y: useTransform(scrollYProgress, [0, 1], [0, -20]), className: 'w-28 h-36', delay: 1 },
        { top: '40%', left: '10%', y: useTransform(scrollYProgress, [0, 1], [0, -25]), className: 'w-36 h-28', delay: 0.5 },
        { bottom: '25%', right: '5%', y: useTransform(scrollYProgress, [0, 1], [0, -18]), className: 'w-40 h-32', delay: 1.5 },
        { bottom: '8%', left: '2%', y: useTransform(scrollYProgress, [0, 1], [0, -30]), className: 'w-24 h-32', delay: 0.4 },
        { bottom: '5%', right: '40%', y: useTransform(scrollYProgress, [0, 1], [0, -14]), className: 'w-28 h-28', delay: 2 },
    ];

    const positions = isMobile ? mobilePositions : desktopPositions;

    return (
        <div ref={ref} className="absolute inset-0 z-0 h-full w-full">
            {displayProjects.slice(0, numProjects).map((project, i) => (
                <motion.div
                    key={`${project.id}-${i}`}
                    className={`absolute rounded-lg shadow-lg overflow-hidden float-anim ${positions[i].className}`}
                    style={{
                        top: positions[i].top,
                        left: positions[i].left,
                        right: positions[i].right,
                        bottom: positions[i].bottom,
                        y: positions[i].y,
                        animationDelay: `${positions[i].delay}s`
                    }}
                >
                     <div className="relative w-full h-full">
                        <Image
                            src={project.imageUrl}
                            alt={project.name}
                            fill
                            className="object-cover"
                            sizes="25vw"
                            data-ai-hint="project image"
                        />
                         <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
                    </div>
                </motion.div>
            ))}
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
    db ? query(collection(db, 'projects'), orderBy('viewCount', 'desc'), limit(12)) : null
  , [db]);
  const { data: featuredProjects, isLoading: areProjectsLoading } = useCollection<Project>(featuredProjectsQuery);

  const handleStartClick = () => {
    setIsSigningIn(true);
    signIn('google');
  };

  const isLoading = areProjectsLoading || isUserLoading;

  return (
    <div className="flex flex-col">
       {!user && !isUserLoading ? (
            <>
                <section className="relative w-full h-[80vh] md:h-screen bg-background overflow-hidden">
                    {featuredProjects && <FloatingShowcase projects={featuredProjects} />}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-background/30 backdrop-blur-sm"></div>
                        <div className="relative z-20 text-center p-4">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="text-4xl md:text-6xl font-bold font-headline mb-4"
                            >
                                <span className="inline-block">Лучшие</span>{' '}
                                <RotatingText
                                  texts={['авторы', 'дизайнеры', 'проекты', 'таланты']}
                                  mainClassName="px-3 py-1 bg-primary text-primary-foreground overflow-hidden justify-center rounded-lg"
                                  staggerFrom={"last"}
                                  initial={{ y: "100%" }}
                                  animate={{ y: 0 }}
                                  exit={{ y: "-120%" }}
                                  staggerDuration={0.025}
                                  splitLevelClassName="overflow-hidden pb-1"
                                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                  rotationInterval={2000}
                                />
                                <br />
                               <span className="inline-block">Узбекистана на <span className="font-bold">InDizayn</span></span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                                className="mt-4 max-w-xl text-lg text-foreground/80"
                            >
                              Комплексная платформа, которая поможет нанимателям и авторам ориентироваться в творческом мире: от поиска вдохновения до общения.
                            </motion.p>
                          
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                            >
                                {isSigningIn ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                        <p className="text-muted-foreground animate-pulse">Google'ga yo'naltirilmoqda...</p>
                                    </div>
                                ) : (
                                    <>
                                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground py-7" onClick={() => router.push('/account/new-project')}>
                                          Loyiha joylash
                                      </Button>
                                       <Button size="lg" variant="secondary" className="py-7" onClick={() => router.push('/designers')}>
                                          Dizaynerlarni ko'rish
                                      </Button>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>
            </>
        ) : (
           <section 
                className="py-16 md:py-24 px-4 md:px-6 lg:px-8"
              >
                
                  
                  {isLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden w-full h-full">
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
                  ) : featuredProjects && featuredProjects.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {featuredProjects.map(project => (
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
                
            </section>
        )}
      
      {!user && !isUserLoading && (
        <motion.section 
            className="py-16 md:py-24 bg-secondary/50"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionVariants}
        >
            <div className="container px-4 md:px-6 lg:px-8">
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

    

    

