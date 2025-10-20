

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from 'next-auth';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, writeBatch, or } from 'firebase/firestore';
import type { Message, Designer } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, MessageSquareText, Check, CheckCheck, ArrowLeft, Mic, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
  currentUser: Session['user'];
  selectedUserId: string | null;
  onBack?: () => void;
}

function MessageSkeleton() {
    return (
        <div className="flex items-end gap-2 my-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
    )
}

export default function ChatWindow({ currentUser, selectedUserId, onBack }: ChatWindowProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // Fetch partner/recipient's profile data
  const recipientDocRef = useMemoFirebase(
    () => (db && selectedUserId) ? doc(db, 'users', selectedUserId) : null,
    [db, selectedUserId]
  );
  const { data: partner, isLoading: partnerLoading } = useDoc<Designer>(recipientDocRef);

  // Get all messages between the current user and the selected partner
  const messagesQuery = useMemoFirebase(
    () => db && currentUser?.id && selectedUserId
        ? query(
            collection(db, 'messages'),
            or(
                where('senderId', '==', currentUser.id),
                where('receiverId', '==', currentUser.id)
            ),
            orderBy('createdAt', 'asc')
          )
        : null,
    [db, currentUser.id, selectedUserId]
  );
  const { data: allMessages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);
  
  // Filter messages on the client to get the specific conversation
  const conversationMessages = useMemo(() => {
    if (!allMessages || !selectedUserId) return [];
    return allMessages.filter(msg => 
        (msg.senderId === currentUser.id && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === currentUser.id)
    )
  }, [allMessages, selectedUserId, currentUser.id]);


  // Mark messages as read
  useEffect(() => {
    if (db && selectedUserId && currentUser.id && conversationMessages.length > 0) {
      const unreadMessages = conversationMessages.filter(
        msg => !msg.isRead && msg.senderId === selectedUserId
      );

      if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        unreadMessages.forEach(msg => {
          if(msg.id) { // ensure message has an id
            const msgRef = doc(db, 'messages', msg.id);
            batch.update(msgRef, { isRead: true });
          }
        });
        batch.commit().catch(console.error);
      }
    }
  }, [conversationMessages, selectedUserId, currentUser.id, db]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [conversationMessages]);


    const handleStartRecording = async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                sendAudioMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Audio recording failed:", error);
            toast({
                variant: 'destructive',
                title: "Xatolik",
                description: "Ovoz yozish uchun ruxsat berilmadi yoki qurilmangizda muammo bor."
            });
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };
    
    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Stop without saving
             mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
             mediaRecorderRef.current = null;
        }
        setIsRecording(false);
        if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
    }

    const sendAudioMessage = async (audioBlob: Blob) => {
        if (!selectedUserId || !db) return;
        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-message.webm');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Ovozli xabarni yuklashda xatolik.");
            }

            const audioUrl = result.url;

            await addDoc(collection(db, 'messages'), {
                senderId: currentUser.id,
                receiverId: selectedUserId,
                type: 'audio',
                audioUrl: audioUrl,
                content: '',
                isRead: false,
                createdAt: serverTimestamp(),
            });

        } catch (error: any) {
            console.error("Ovozli xabar yuborishda xatolik:", error);
            toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
        } finally {
            setIsSending(false);
        }
    }


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !db) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.id,
        receiverId: selectedUserId,
        content: text,
        type: 'text',
        isRead: false,
        createdAt: serverTimestamp(),
      });
      
      if(partner) {
          const notificationsRef = collection(db, "notifications");
          await addDoc(notificationsRef, {
            userId: partner.id,
            type: 'message',
            senderId: currentUser.id,
            senderName: currentUser.name || 'Anonim',
            senderPhotoURL: currentUser.image || '',
            isRead: false,
            messageSnippet: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            createdAt: serverTimestamp(),
          });
      }
    } catch (error) {
      console.error("Xabar yuborishda xatolik:", error);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Xabarni yuborishda muammo yuz berdi.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedUserId) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <MessageSquareText className="w-16 h-16 mb-4" />
        <p className="text-xl font-semibold">Suhbatni tanlang</p>
        <p>Suhbatni boshlash uchun chap tarafdagi ro'yxatdan dizaynerni tanlang.</p>
      </div>
    );
  }

  const isLoading = partnerLoading || messagesLoading;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <div className="flex flex-col h-full bg-secondary/30">
      {isLoading && !partner ? (
         <div className="flex items-center gap-3 p-3 border-b bg-background">
            {onBack && (
              <Button onClick={onBack} variant="ghost" size="icon" className="md:hidden">
                  <ArrowLeft />
              </Button>
            )}
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className='space-y-1'>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
      ) : partner && (
        <div className="flex items-center gap-3 p-3 border-b bg-background">
          {onBack && (
              <Button onClick={onBack} variant="ghost" size="icon" className="md:hidden -ml-2">
                  <ArrowLeft />
              </Button>
          )}
          <Avatar>
            <AvatarImage src={partner.photoURL} alt={partner.name} />
            <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{partner.name}</p>
            <p className="text-xs text-muted-foreground">{partner.specialization}</p>
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoading ? (
            <div className="space-y-4">
                <MessageSkeleton />
                <div className="flex justify-end"><MessageSkeleton /></div>
                <MessageSkeleton />
            </div>
        ) : (
            conversationMessages.map(msg => (
                <div
                    key={msg.id}
                    className={cn(
                        'flex items-end gap-2 my-2 max-w-[80%] clear-both',
                        msg.senderId === currentUser.id ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                >
                <Avatar className="h-6 w-6">
                    <AvatarImage src={msg.senderId === currentUser.id ? currentUser.image ?? '' : partner?.photoURL} />
                    <AvatarFallback>{msg.senderId === currentUser.id ? currentUser.name?.charAt(0) : partner?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div
                    className={cn(
                        'p-3 rounded-lg relative shadow-md',
                        msg.senderId === currentUser.id
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background text-foreground rounded-bl-none'
                    )}
                >
                     {msg.type === 'audio' && msg.audioUrl ? (
                        <audio controls src={msg.audioUrl} className="max-w-[200px] h-10" />
                     ) : (
                        <p className="pb-4 pr-5">{msg.content}</p>
                     )}
                    
                    {msg.senderId === currentUser.id && (
                        <div className="absolute bottom-1 right-2 flex items-center">
                            {msg.isRead ? (
                                <CheckCheck size={16} className="text-blue-400" />
                            ) : (
                                <Check size={16} className={cn("text-muted-foreground/70", msg.senderId === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70')} />
                            )}
                        </div>
                    )}
                </div>
                </div>
            ))
        )}
      </ScrollArea>
      <div className="p-4 border-t bg-background">
         {isRecording ? (
             <div className="flex items-center gap-2">
                 <Button onClick={handleCancelRecording} variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 />
                 </Button>
                <div className="flex-1 bg-secondary rounded-full h-10 flex items-center px-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <p className="text-sm font-mono text-muted-foreground">{formatTime(recordingTime)}</p>
                </div>
                 <Button onClick={handleStopRecording} disabled={isSending}>
                    <Send className="h-4 w-4" />
                 </Button>
             </div>
         ) : (
            <form 
                className="flex items-center gap-2"
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            >
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Xabar yozing..."
                disabled={isSending}
                className="transition-all duration-300"
            />
            {newMessage ? (
                 <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                 </Button>
            ) : (
                 <Button type="button" onClick={handleStartRecording} disabled={isSending}>
                    <Mic className="h-4 w-4" />
                 </Button>
            )}
            </form>
         )}
      </div>
    </div>
  );
}
