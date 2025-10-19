
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useRef } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc, DocumentData } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useForm } from "react-hook-form";
import { uploadImage } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import type { Designer } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfileEditPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [profilePic, setProfilePic] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: null,
  });
  const [coverPhoto, setCoverPhoto] = useState<{ file: File | null; previewUrl: string | null }>({
    file: null,
    previewUrl: null,
  });

  const userProfileQuery = useMemoFirebase(() => 
    (db && user) ? doc(db, 'users', user.uid) : null
  , [db, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Designer>(userProfileQuery);

  const { register, handleSubmit, setValue, formState: {isDirty, dirtyFields} } = useForm<{
    name: string;
    specialization: string;
    bio: string;
  }>();

  useEffect(() => {
    if (userProfile) {
      setValue("name", userProfile.name || "");
      setValue("specialization", userProfile.specialization || "");
      setValue("bio", userProfile.bio || "");
    }
  }, [userProfile, setValue]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfilePic({ file, previewUrl });
    }
  };
  
  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCoverPhoto({ file, previewUrl });
    }
  };

  const uploadFile = async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const result = await uploadImage(formData);
      if (!result.success || !result.url) {
        throw new Error(result.error || "Rasm yuklashda xatolik yuz berdi.");
      }
      return result.url;
  };

  const onSubmit = async (data: { name: string; specialization: string; bio: string }) => {
    if (!user || !userProfile || !auth?.currentUser) return;

    if (!isDirty && !profilePic.file && !coverPhoto.file) {
      toast({ description: "O'zgarish kiritilmadi." });
      return;
    }
    
    setIsSaving(true);
    let newPhotoURL = userProfile.photoURL || null;
    let newCoverPhotoURL = userProfile.coverPhotoURL || null;
    let profilePicChanged = false;

    try {
      if (profilePic.file || coverPhoto.file) {
        setUploadProgress(0);
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev === null) return 0;
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        if (profilePic.file) {
            newPhotoURL = await uploadFile(profilePic.file);
            profilePicChanged = true;
        }
        if (coverPhoto.file) {
            newCoverPhotoURL = await uploadFile(coverPhoto.file);
        }

        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
      }

      const userRef = doc(db, "users", user.uid);
      
      const updatedData: Partial<Designer> = {};
      if (dirtyFields.name) updatedData.name = data.name;
      if (dirtyFields.specialization) updatedData.specialization = data.specialization;
      if (dirtyFields.bio) updatedData.bio = data.bio;
      if (newPhotoURL !== userProfile.photoURL) updatedData.photoURL = newPhotoURL;
      if (newCoverPhotoURL !== userProfile.coverPhotoURL) updatedData.coverPhotoURL = newCoverPhotoURL;

      if (Object.keys(updatedData).length > 0) {
        await updateDoc(userRef, updatedData as DocumentData);
        if (profilePicChanged || (dirtyFields.name && data.name !== auth.currentUser.displayName)) {
            await updateProfile(auth.currentUser, {
                displayName: data.name,
                photoURL: newPhotoURL,
            });
        }
      }
      
      toast({ title: "Muvaffaqiyatli!", description: "Profil yangilandi!" });
      setProfilePic({ file: null, previewUrl: null });
      setCoverPhoto({ file: null, previewUrl: null });

      if (profilePicChanged) {
        // Force a reload of server components like the header
        router.refresh();
      }


    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Xatolik!",
        description: err.message || "Profilni yangilashda muammo yuz berdi.",
      });
    } finally {
      setIsSaving(false);
      if (uploadProgress !== null) {
        setTimeout(() => setUploadProgress(null), 1500);
      }
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth');
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Iltimos, hisobga kiring.</p>
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Profilni Tahrirlash</CardTitle>
          <CardDescription>Bu yerda ommaviy profilingizni yangilashingiz mumkin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-4">
                <Label>Muqova rasmi</Label>
                <div className="aspect-[16/6] relative w-full bg-secondary rounded-md overflow-hidden">
                    {(coverPhoto.previewUrl || userProfile?.coverPhotoURL) && (
                        <Image src={coverPhoto.previewUrl ?? userProfile?.coverPhotoURL ?? ''} alt="Muqova rasmi" fill className="object-cover"/>
                    )}
                     <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                         <Button
                            type="button"
                            variant="outline"
                            onClick={() => coverPhotoInputRef.current?.click()}
                            disabled={isSaving}
                        >
                            <Upload className="mr-2 h-4 w-4" /> O‘zgartirish
                        </Button>
                     </div>
                </div>
                 <Input
                    type="file"
                    ref={coverPhotoInputRef}
                    onChange={handleCoverPhotoChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
            </div>

            <div className="space-y-4">
              <Label>Profil rasmi</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profilePic.previewUrl ?? userProfile?.photoURL ?? ""} />
                  <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Input
                  type="file"
                  ref={profilePicInputRef}
                  onChange={handleProfilePicChange}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => profilePicInputRef.current?.click()}
                  disabled={isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" /> Rasmni o‘zgartirish
                </Button>
              </div>
            </div>

            {uploadProgress !== null && <Progress value={uploadProgress} className="mt-2" />}

            <div className="space-y-2">
              <Label htmlFor="name">To'liq ism</Label>
              <Input id="name" {...register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Mutaxassislik</Label>
              <Input id="specialization" {...register("specialization")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografiya</Label>
              <Textarea id="bio" {...register("bio")} placeholder="O‘zingiz haqingizda qisqacha yozing..." />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Profilni yangilash
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
