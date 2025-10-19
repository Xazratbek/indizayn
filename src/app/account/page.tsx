
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Eye, Users, FolderKanban, LayoutDashboard, User, Settings, Loader2, Upload } from "lucide-react";
import PortfolioCard from "@/components/portfolio-card";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Project } from "@/lib/types";
import type { Designer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { uploadImage } from '@/lib/actions';
import { Progress } from "@/components/ui/progress";
import UploadProjectDialog from "@/components/upload-project-dialog";


function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 25,
    stiffness: 250,
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
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newImage, setNewImage] = useState<{file: File | null, previewUrl: string | null}>({ file: null, previewUrl: null });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { register, handleSubmit, setValue, watch, formState: {isDirty, dirtyFields} } = useForm<{
    name: string;
    specialization: string;
    bio: string;
  }>();

  // Fetch current user's profile data
  const userProfileQuery = useMemoFirebase(() =>
    user ? doc(db, 'users', user.uid) : null
  , [db, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Designer>(userProfileQuery);

  // Fetch projects for the current user
  const designerProjectsQuery = useMemoFirebase(() =>
    user ? query(collection(db, 'projects'), where('designerId', '==', user.uid)) : null
  , [db, user]);
  const { data: designerProjects, isLoading: areProjectsLoading } = useCollection<Project>(designerProjectsQuery);

  useEffect(() => {
    if (userProfile) {
      setValue('name', userProfile.name || '');
      setValue('specialization', userProfile.specialization || '');
      setValue('bio', userProfile.bio || '');
    }
  }, [userProfile, setValue]);

  const totalLikes = useMemo(() => designerProjects?.reduce((acc, p) => acc + p.likeCount, 0) || 0, [designerProjects]);
  const totalViews = useMemo(() => designerProjects?.reduce((acc, p) => acc + p.viewCount, 0) || 0, [designerProjects]);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setNewImage({ file, previewUrl });
    }
  };

  const onProfileUpdate = async (data: { name: string; specialization: string; bio: string; }) => {
    if (!user || !userProfile) return;
    
    if (!isDirty && !newImage.file) {
      toast({ description: "O'zgarish kiritilmadi." });
      return;
    }

    setIsSaving(true);
    let newPhotoURL = userProfile.photoURL;

    // Handle Image Upload
    if (newImage.file) {
      setUploadProgress(0);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return 0;
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('image', newImage.file);
      
      try {
        const result = await uploadImage(formData);
        clearInterval(progressInterval);
        if (result.success && result.url) {
          newPhotoURL = result.url;
          setUploadProgress(100);
           setTimeout(() => setUploadProgress(null), 1000);
        } else {
          throw new Error(result.error || "Rasmni yuklab bo'lmadi.");
        }
      } catch (uploadError: any) {
        clearInterval(progressInterval);
        setUploadProgress(null);
        toast({ variant: "destructive", title: "Rasm yuklashda xatolik", description: uploadError.message });
        setIsSaving(false);
        return;
      }
    }
    
    // Handle Text Fields Update
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedData: Partial<Designer> = { photoURL: newPhotoURL };
      
      if (dirtyFields.name) updatedData.name = data.name;
      if (dirtyFields.specialization) updatedData.specialization = data.specialization;
      if (dirtyFields.bio) updatedData.bio = data.bio;
      
      await updateDoc(userRef, updatedData);

      setNewImage({ file: null, previewUrl: null });
      toast({
        title: "Muvaffaqiyatli!",
        description: "Profilingiz yangilandi.",
      });
    } catch (error: any)
{
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: error.message || "Profilni yangilashda xatolik yuz berdi.",
      });
    } finally {
      setIsSaving(false);
      if(uploadProgress !== null) {
          setTimeout(() => setUploadProgress(null), 1500);
      }
    }
  };

  if (isUserLoading) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      )
  }
  
  if (!user) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold">Kirilmagan</p>
                <p className="text-muted-foreground">Iltimos, hisob ma'lumotlarini ko'rish uchun kiring.</p>
            </div>
        </div>
      )
  }

  const tabItems = [
    { value: "dashboard", icon: LayoutDashboard, label: "Boshqaruv Paneli" },
    { value: "projects", icon: FolderKanban, label: "Mening Loyihalarim" },
    { value: "profile", icon: User, label: "Profil" },
    { value: "settings", icon: Settings, label: "Sozlamalar" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="font-headline text-4xl font-bold mb-8">Mening Hisobim</h1>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabItems.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="flex gap-2 items-center">
              <item.icon className="h-5 w-5" />
              <span className="hidden md:inline">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="dashboard">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami Ko'rishlar</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><AnimatedNumber value={totalViews} /></div>
                <p className="text-xs text-muted-foreground">barcha loyihalaringiz bo'yicha</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jami Likelar</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><AnimatedNumber value={totalLikes} /></div>
                <p className="text-xs text-muted-foreground">barcha loyihalaringiz bo'yicha</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Obunachilar</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><AnimatedNumber value={userProfile?.subscriberCount || 0} /></div>
                <p className="text-xs text-muted-foreground">sizni kuzatmoqda</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loyihalar</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{designerProjects?.length || 0}</div>
                <p className="text-xs text-muted-foreground">jami yuklangan</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Faoliyat Tarixi</CardTitle>
                <CardDescription>Bu yerda sizning faoliyatingiz tahlili ko'rsatiladi.</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-10">
                 <div className="floating-text text-xl">Tez kunda...</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="projects">
            <div className="flex justify-between items-center mt-6 mb-6">
                <h2 className="text-2xl font-bold font-headline">Mening Loyihalarim ({designerProjects?.length || 0})</h2>
                <UploadProjectDialog />
            </div>
            {areProjectsLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {designerProjects && designerProjects.length > 0 ? (
                      designerProjects.map(project => (
                          <PortfolioCard key={project.id} project={project} />
                      ))
                  ) : (
                    <div className="text-center py-16 col-span-full">
                       <div className="floating-text text-2xl">Hali loyihalaringiz yo'q.</div>
                       <p className="text-muted-foreground mt-2">Birinchisini yuklang!</p>
                    </div>
                  )}
              </div>
            )}
        </TabsContent>
        <TabsContent value="profile">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ommaviy Profil</CardTitle>
              <CardDescription>Saytda boshqalar sizni shunday ko'radilar.</CardDescription>
            </CardHeader>
            <CardContent>
             {isProfileLoading ? <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin" /></div> : (
              <form onSubmit={handleSubmit(onProfileUpdate)} className="space-y-6">
                 <div className="space-y-4">
                  <Label>Profil Rasmi</Label>
                  <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                          <AvatarImage src={newImage.previewUrl ?? userProfile?.photoURL ?? user.photoURL ?? ''} />
                          <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                      />
                      <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                         <Upload className="mr-2 h-4 w-4"/> Rasmni O'zgartirish
                      </Button>
                  </div>
                  {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">To'liq Ism</Label>
                        <Input id="name" {...register("name")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="specialization">Mutaxassislik</Label>
                        <Input id="specialization" {...register("specialization")} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bio">Biografiya</Label>
                    <Textarea id="bio" placeholder="Hammaga o'zingiz haqingizda bir oz aytib bering" {...register("bio")} />
                </div>
                 <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Profilni Yangilash
                 </Button>
              </form>
             )}
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
                    <Input id="email" type="email" defaultValue={user.email ?? ''} readOnly disabled />
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Parol</h3>
                    <p className="text-sm text-muted-foreground">Bu funksiya hozircha mavjud emas.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
