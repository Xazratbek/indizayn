
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
import { UploadCloud, X, ArrowLeft, ShieldAlert } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, DocumentData } from "firebase/firestore";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingPage from "@/app/loading";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";

const projectSchema = z.object({
  name: z.string().min(3, { message: "Loyiha nomi kamida 3 belgidan iborat bo'lishi kerak." }),
  description: z.string().min(10, { message: "Tavsif kamida 10 belgidan iborat bo'lishi kerak." }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const TagInput = ({ value, onChange, placeholder }: { value: string[], onChange: (value: string[]) => void, placeholder: string }) => {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            e.stopPropagation();
            if (!value.includes(inputValue.trim())) {
                onChange([...value, inputValue.trim()]);
            }
            setInputValue("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[2.5rem]">
                {value.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
            />
        </div>
    );
};


export default function EditProjectPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  
  // Fetch existing project data
  const projectDocRef = useMemoFirebase(() => db && projectId ? doc(db, 'projects', projectId) : null, [db, projectId]);
  const { data: project, isLoading: isProjectLoading } = useDoc<Project>(projectDocRef);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  // Populate form and state with project data once loaded
  useEffect(() => {
    if (project) {
        form.setValue('name', project.name);
        form.setValue('description', project.description);
        setTags(project.tags || []);
        setTools(project.tools || []);
        setImagePreviews(project.imageUrls || [project.imageUrl]);
    }
  }, [project, form]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles = imagePreviews.length - (imagePreviews.filter(p => p.startsWith('blob:')).length) + newFiles.length;

      if (totalFiles > 10) {
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Maksimal 10 ta rasm yuklashingiz mumkin.",
        });
        return;
      }
      
      const newImageFiles = [...imageFiles, ...newFiles];
      const newImagePreviewsFromFiles = newImageFiles.map(file => URL.createObjectURL(file));
      
      const existingImageUrls = imagePreviews.filter(p => !p.startsWith('blob:'));

      setImageFiles(newImageFiles);
      setImagePreviews([...existingImageUrls, ...newImagePreviewsFromFiles]);
    }
  };

  const removeImage = (index: number, url: string) => {
    if(url.startsWith('blob:')) {
        // It's a new file, remove from files and previews
        const fileIndex = imagePreviews.filter(p => p.startsWith('blob:')).indexOf(url);
        if(fileIndex > -1) {
            setImageFiles(files => files.filter((_, i) => i !== fileIndex));
        }
    }
    setImagePreviews(previews => previews.filter((_, i) => i !== index));
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
    if (!user || !project) return;
    if (imagePreviews.length === 0) {
      toast({ variant: "destructive", title: "Rasm tanlanmagan", description: "Iltimos, kamida bitta loyiha rasmini yuklang." });
      return;
    }

    setIsSubmitting(true);

    try {
      const newImageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImageWithApi(file);
        newImageUrls.push(url);
      }
      
      const existingImageUrls = imagePreviews.filter(p => !p.startsWith('blob:'));
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      if(!db) throw new Error("Database connection not found.");
      
      const projectRef = doc(db, 'projects', projectId);

      const updatedData: Partial<Project> & DocumentData = {
          name: data.name,
          description: data.description,
          tags: tags,
          tools: tools,
          imageUrls: finalImageUrls,
          imageUrl: finalImageUrls[0] || '', // update thumbnail
      };

      await updateDoc(projectRef, updatedData);
      
      toast({
        variant: "success",
        title: "Muvaffaqiyatli!",
        description: "Loyihangiz muvaffaqiyatli yangilandi.",
      });

      setTimeout(() => {
        router.push('/account/projects');
      }, 1000);

    } catch (error: any) {
      console.error("Loyiha yangilashda xatolik:", error);
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: error.message || "Loyihani yangilashda kutilmagan xatolik yuz berdi.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const isLoading = status === 'loading' || isProjectLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><LoadingPage /></div>;
  }

  // Security check: only project owner can edit
  if (status === 'authenticated' && project && user.id !== project.designerId) {
      return (
          <div className="container mx-auto py-10 px-4 text-center">
              <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <ShieldAlert className="h-12 w-12 mx-auto text-destructive"/>
                    <CardTitle className="text-destructive">Ruxsat yo'q</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Sizda bu loyihani tahrirlash uchun ruxsat yo'q.</p>
                    <Button asChild className="mt-6">
                        <Link href="/account/projects">Mening loyihalarimga qaytish</Link>
                    </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }
  
  if (!project) {
      return <div className="flex items-center justify-center h-screen"><p>Loyiha topilmadi.</p></div>
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
         <div className="relative mb-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute -left-2 top-0 md:hidden">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
          </div>
         <Card>
             <CardHeader>
                 <CardTitle>Loyihani tahrirlash</CardTitle>
                 <CardDescription>
                     Loyiha ma'lumotlarini o'zgartirishingiz mumkin.
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
                                <FormItem>
                                    <FormLabel>Teglar</FormLabel>
                                     <TagInput 
                                        value={tags}
                                        onChange={setTags}
                                        placeholder="Teg qo'shish uchun 'Enter' bosing..."
                                     />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Foydalanilgan vositalar</FormLabel>
                                     <TagInput 
                                        value={tools}
                                        onChange={setTools}
                                        placeholder="Vosita qo'shish uchun 'Enter' bosing..."
                                     />
                                </FormItem>

                             </div>
                             <div className="space-y-2">
                                 <Label>Loyiha rasmlari ({imagePreviews.length}/10)</Label>
                                 <ScrollArea className="h-72 w-full">
                                     <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 pr-4">
                                         {imagePreviews.map((preview, index) => (
                                             <div key={preview} className="relative aspect-square">
                                                 <Image src={preview} alt={`Loyiha rasmi ${index + 1}`} fill className="object-cover rounded-md" />
                                                 <Button
                                                     type="button"
                                                     variant="destructive"
                                                     size="icon"
                                                     className="absolute top-1 right-1 h-6 w-6"
                                                     onClick={() => removeImage(index, preview)}
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
                                 O'zgarishlarni saqlash
                             </Button>
                         </div>
                     </form>
                 </Form>
             </CardContent>
         </Card>
    </div>
  );
}
