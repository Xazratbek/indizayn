
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, X } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingPage from "@/app/loading";

const projectSchema = z.object({
  name: z.string().min(3, { message: "Loyiha nomi kamida 3 belgidan iborat bo'lishi kerak." }),
  description: z.string().min(10, { message: "Tavsif kamida 10 belgidan iborat bo'lishi kerak." }),
  tags: z.string().optional(),
  tools: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth');
    }
  }, [status, router]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: "",
      tools: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = imageFiles.length + newFiles.length;

      if (totalFiles > 10) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Maksimal 10 ta rasm yuklashingiz mumkin.",
        });
        return;
      }
      
      const newImageFiles = [...imageFiles, ...newFiles];
      const newImagePreviews = newImageFiles.map(file => URL.createObjectURL(file));

      setImageFiles(newImageFiles);
      setImagePreviews(newImagePreviews);
    }
  };

  const removeImage = (index: number) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newImageFiles);
    setImagePreviews(newImagePreviews);
  }

  const uploadImageWithApi = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();

    if (!response.ok || !result.success || !result.url) {
      throw new Error(result.error || "Rasm yuklashda xatolik yuz berdi.");
    }
    return result.url;
  };

  const onSubmit = async (data: ProjectFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Xatolik", description: "Loyiha yuklash uchun tizimga kiring." });
      return;
    }
    if (imageFiles.length === 0) {
      toast({ variant: "destructive", title: "Rasm tanlanmagan", description: "Iltimos, kamida bitta loyiha rasmini yuklang." });
      return;
    }

    setIsSubmitting(true);

    try {
      // --- 1. Upload Images to Cloudinary ---
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImageWithApi(file);
        imageUrls.push(url);
      }

      // --- 2. Save Project to Firestore ---
      const tagsArray = data.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [];
      const toolsArray = data.tools?.split(',').map(tool => tool.trim()).filter(Boolean) || [];

      if(!db) throw new Error("Database connection not found.");

      await addDoc(collection(db, "projects"), {
        name: data.name,
        description: data.description,
        designerId: user.id, // Use user.id from next-auth session
        imageUrl: imageUrls[0], // Main image
        imageUrls: imageUrls, // All images
        tags: tagsArray,
        tools: toolsArray,
        likeCount: 0,
        viewCount: 0,
        likes: [],
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "Muvaffaqiyatli!",
        description: "Yangi loyihangiz platformaga qo'shildi.",
      });

      // --- 3. Reset and Redirect ---
      setTimeout(() => {
        router.push('/account/projects');
      }, 1000);

    } catch (error: any) {
      console.error("Loyiha yuklashda xatolik:", error);
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: error.message || "Loyihani yuklashda kutilmagan xatolik yuz berdi.",
      });
      setIsSubmitting(false);
    }
  };

  if (status !== 'authenticated') {
    return <div className="flex items-center justify-center h-screen"><LoadingPage /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
         <Card>
             <CardHeader>
                 <CardTitle>Yangi loyiha yuklash</CardTitle>
                 <CardDescription>
                     Ijodingizni hamjamiyat bilan baham ko'ring. Loyiha ma'lumotlarini to'ldiring.
                 </CardDescription>
             </CardHeader>
             <CardContent>
                 <Form {...form}>
                     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                 <FormField
                                     control={form.control}
                                     name="name"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Loyiha nomi</FormLabel>
                                             <FormControl>
                                                 <Input placeholder="Masalan, 'Mobil ilova dizayni'" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                                 <FormField
                                     control={form.control}
                                     name="description"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Loyiha tavsifi</FormLabel>
                                             <FormControl>
                                                 <Textarea placeholder="Loyiha haqida batafsil ma'lumot bering..." className="min-h-[120px]" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                                 <FormField
                                     control={form.control}
                                     name="tags"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Teglar</FormLabel>
                                             <FormControl>
                                                 <Input placeholder="Vergul bilan ajrating, masalan: ui, ux, figma" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                                 <FormField
                                     control={form.control}
                                     name="tools"
                                     render={({ field }) => (
                                         <FormItem>
                                             <FormLabel>Foydalanilgan vositalar</FormLabel>
                                             <FormControl>
                                                 <Input placeholder="Vergul bilan ajrating, masalan: Figma, Webflow" {...field} />
                                             </FormControl>
                                             <FormMessage />
                                         </FormItem>
                                     )}
                                 />
                             </div>
                             <div className="space-y-2">
                                 <Label>Loyiha rasmlari ({imagePreviews.length}/10)</Label>
                                 <ScrollArea className="h-72 w-full">
                                     <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 pr-4">
                                         {imagePreviews.map((preview, index) => (
                                             <div key={index} className="relative aspect-square">
                                                 <Image src={preview} alt={`Loyiha rasmi ${index + 1}`} fill className="object-cover rounded-md" />
                                                 <Button
                                                     type="button"
                                                     variant="destructive"
                                                     size="icon"
                                                     className="absolute top-1 right-1 h-6 w-6"
                                                     onClick={() => removeImage(index)}
                                                 >
                                                     <X className="h-4 w-4" />
                                                 </Button>
                                             </div>
                                         ))}
                                     </div>
                                 </ScrollArea>
                                 <div
                                     className="aspect-video w-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors mt-2"
                                     onClick={() => fileInputRef.current?.click()}
                                 >
                                     <div className="text-center text-muted-foreground">
                                         <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                                         <p>Rasm qo'shish</p>
                                         <p className="text-xs">PNG, JPG, GIF (max 5MB)</p>
                                     </div>
                                     <Input
                                         ref={fileInputRef}
                                         type="file"
                                         className="hidden"
                                         accept="image/png, image/jpeg, image/gif"
                                         onChange={handleImageChange}
                                         multiple
                                     />
                                 </div>
                             </div>
                         </div>

                         <div className="flex justify-end gap-2 pt-4">
                             <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => router.back()}>
                                 Bekor qilish
                             </Button>
                             <Button type="submit" disabled={isSubmitting}>
                                 {isSubmitting && <LoadingPage />}
                                 Saqlash va Yuklash
                             </Button>
                         </div>
                     </form>
                 </Form>
             </CardContent>
         </Card>
    </div>
  );
}
