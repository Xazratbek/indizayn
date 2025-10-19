"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadImage } from "@/lib/actions";
import Image from "next/image";
import { Progress } from "./ui/progress";

const projectSchema = z.object({
  name: z.string().min(3, { message: "Loyiha nomi kamida 3 belgidan iborat bo'lishi kerak." }),
  description: z.string().min(10, { message: "Tavsif kamida 10 belgidan iborat bo'lishi kerak." }),
  tags: z.string().optional(),
  tools: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function UploadProjectDialog() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Xatolik", description: "Loyiha yuklash uchun tizimga kiring." });
      return;
    }
    if (!imageFile) {
        toast({ variant: "destructive", title: "Rasm tanlanmagan", description: "Iltimos, loyiha rasmini yuklang." });
        return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        // --- 1. Upload Image to Cloudinary ---
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => (prev !== null && prev < 90) ? prev + 10 : 90);
        }, 300);

        const formData = new FormData();
        formData.append('image', imageFile);
        const imageResult = await uploadImage(formData);

        clearInterval(progressInterval);

        if (!imageResult.success || !imageResult.url) {
            throw new Error(imageResult.error || "Rasmni yuklab bo'lmadi.");
        }
        
        setUploadProgress(100);

        // --- 2. Save Project to Firestore ---
        const tagsArray = data.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [];
        const toolsArray = data.tools?.split(',').map(tool => tool.trim()).filter(Boolean) || [];

        await addDoc(collection(db, "projects"), {
            name: data.name,
            description: data.description,
            designerId: user.uid,
            imageUrl: imageResult.url,
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

        // --- 3. Reset and Close ---
        setTimeout(() => {
            form.reset();
            setImageFile(null);
            setImagePreview(null);
            setUploadProgress(null);
            setIsSubmitting(false);
            setIsOpen(false);
        }, 1000);

    } catch (error: any) {
      console.error("Loyiha yuklashda xatolik:", error);
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: error.message || "Loyihani yuklashda kutilmagan xatolik yuz berdi.",
      });
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
            <UploadCloud className="mr-2"/>
            Loyiha Yuklash
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Yangi loyiha yuklash</DialogTitle>
          <DialogDescription>
            Ijodingizni hamjamiyat bilan baham ko'ring. Loyiha ma'lumotlarini to'ldiring.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label>Loyiha rasmi</Label>
                    <div 
                        className="aspect-video w-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Loyiha rasmi" width={400} height={300} className="object-cover w-full h-full rounded-md" />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <UploadCloud className="mx-auto h-10 w-10 mb-2"/>
                                <p>Rasmni tanlang yoki bu yerga torting</p>
                                <p className="text-xs">PNG, JPG, GIF (max 5MB)</p>
                            </div>
                        )}
                        <Input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleImageChange}
                        />
                    </div>
                    {uploadProgress !== null && <Progress value={uploadProgress} className="w-full mt-2" />}
                </div>
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isSubmitting}>
                        Bekor qilish
                    </Button>
                </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Saqlash va Yuklash
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
