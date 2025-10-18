"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Heart, Eye, Users, FolderKanban } from "lucide-react";
import { getProjectsByDesigner, designers } from "@/lib/mock-data";
import PortfolioCard from "@/components/portfolio-card";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

// Mocking a logged-in user
const loggedInDesigner = designers[0];
const designerProjects = getProjectsByDesigner(loggedInDesigner.id);

const totalLikes = designerProjects.reduce((acc, p) => acc + p.likes, 0);
const totalViews = designerProjects.reduce((acc, p) => acc + p.views, 0);

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 100,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US").format(
            latest.toFixed(0)
          );
        }
      }),
    [springValue]
  );

  return <span ref={ref} />;
}

export default function AccountPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="font-headline text-4xl font-bold mb-8">Mening Hisobim</h1>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Boshqaruv Paneli</TabsTrigger>
          <TabsTrigger value="projects">Mening Loyihalarim</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami Ko'rishlar</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isClient ? <AnimatedNumber value={totalViews} /> : 0}</div>
                <p className="text-xs text-muted-foreground">o'tgan oyga nisbatan +10.2%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami Likelar</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isClient ? <AnimatedNumber value={totalLikes} /> : 0}</div>
                <p className="text-xs text-muted-foreground">o'tgan oyga nisbatan +15.1%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Obunachilar</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isClient ? <AnimatedNumber value={loggedInDesigner.subscribers} /> : 0}</div>
                <p className="text-xs text-muted-foreground">o'tgan oydan beri +201</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loyihalar</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{designerProjects.length}</div>
                <p className="text-xs text-muted-foreground">shu oyda +2 yuklandi</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>So'nggi Faoliyat</CardTitle>
                <CardDescription>Sizning so'nggi faoliyatingizning qisqacha mazmuni.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart className="h-64 w-full text-primary" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="projects">
            <div className="flex justify-between items-center mt-6 mb-6">
                <h2 className="text-2xl font-bold font-headline">Mening Loyihalarim ({designerProjects.length})</h2>
                <Button>Loyiha Yuklash</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {designerProjects.map(project => (
                    <PortfolioCard key={project.id} project={project} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="profile">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ommaviy Profil</CardTitle>
              <CardDescription>Saytda boshqalar sizni shunday ko'radilar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={`https://picsum.photos/seed/101/100/100`} />
                        <AvatarFallback>ER</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Rasmni O'zgartirish</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">To'liq Ism</Label>
                        <Input id="name" defaultValue={loggedInDesigner.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="specialization">Mutaxassislik</Label>
                        <Input id="specialization" defaultValue={loggedInDesigner.specialization} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bio">Biografiya</Label>
                    <Textarea id="bio" placeholder="Hammaga o'zingiz haqingizda bir oz aytib bering" />
                </div>
                 <Button>Profilni Yangilash</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hisob Sozlamalari</CardTitle>
              <CardDescription>Hisobingiz afzalliklarini boshqaring.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Elektron pochta manzili</Label>
                    <Input id="email" type="email" defaultValue="elena@example.com" />
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Parol</h3>
                    <p className="text-sm text-muted-foreground">Xavfsizlik uchun parolni o'zgartirish uchun joriy parolingizni kiritishingiz kerak.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Joriy Parol</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Yangi Parol</Label>
                            <Input id="new-password" type="password" />
                        </div>
                    </div>
                </div>
                <Button>Sozlamalarni Yangilash</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
