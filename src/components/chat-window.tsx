

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from 'next-auth';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, writeBatch, or, Timestamp } from 'firebase/firestore';
import type { Message, Designer } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, MessageSquareText, Check, CheckCheck, ArrowLeft, Mic, Trash2, Loader2, Play, Pause, Camera, SwitchCamera, ArrowUp, Lock, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Slider } from './ui/slider';
import VideoMessagePlayer from './video-message-player';
import { motion, AnimatePresence } from 'framer-motion';

// Optimistic UI for messages
type OptimisticMessage = Message & { status?: 'uploading' | 'sent' | 'failed' };

interface AudioPlayerProps {
    audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', () => setIsPlaying(false));

        if (audioUrl.startsWith('blob:')) {
            audio.load();
        }

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', () => setIsPlaying(false));
        };
    }, [audioUrl]);
    
    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(e => console.error("Audio play failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleSliderChange = (value: number[]) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };
    
    const formatTime = (time: number) => {
        if (isNaN(time) || time === Infinity) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 w-[220px]">
             <audio ref={audioRef} src={audioUrl} preload="metadata" />
            <Button onClick={togglePlayPause} size="icon" variant="ghost" className="shrink-0">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex-1 flex items-center gap-2">
                <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={0.1}
                    onValueChange={handleSliderChange}
                    className="w-full"
                />
                <span className="text-xs font-mono w-12 text-right">{formatTime(currentTime)}</span>
            </div>
        </div>
    )
}


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
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [currentRecordingMode, setCurrentRecordingMode] = useState<'audio' | 'video'>('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
  const [pointerMove, setPointerMove] = useState({ x: 0, y: 0 });
  const LOCK_THRESHOLD = -80; // pixels to swipe up to lock
  const CANCEL_THRESHOLD = -80; // pixels to swipe left to cancel

  const recipientDocRef = useMemoFirebase(
    () => (db && selectedUserId) ? doc(db, 'users', selectedUserId) : null,
    [db, selectedUserId]
  );
  const { data: partner, isLoading: partnerLoading } = useDoc<Designer>(recipientDocRef);

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
  
  const conversationMessages = useMemo(() => {
    if (!allMessages || !selectedUserId) return [];
    return allMessages.filter(msg => 
        (msg.senderId === currentUser.id && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === currentUser.id)
    )
  }, [allMessages, selectedUserId, currentUser.id]);

    const getMessageTime = (message: Message | OptimisticMessage): number => {
        const createdAt = message.createdAt;
        if (!createdAt) return 0;
        if (createdAt instanceof Timestamp) {
            return createdAt.toMillis();
        }
        if (createdAt instanceof Date) {
            return createdAt.getTime();
        }
        if (typeof createdAt === 'object' && 'seconds' in createdAt && 'nanoseconds' in createdAt) {
            return (createdAt as Timestamp).toMillis();
        }
        return 0;
    };

    const combinedMessages = useMemo(() => {
        const finalMessages: (Message | OptimisticMessage)[] = [...conversationMessages];
        
        optimisticMessages.forEach(optMsg => {
            if (!finalMessages.some(m => m.id === optMsg.id)) {
                finalMessages.push(optMsg);
            }
        });

        return finalMessages.sort((a, b) => getMessageTime(a) - getMessageTime(b));
    }, [conversationMessages, optimisticMessages]);


  useEffect(() => {
    if (db && selectedUserId && currentUser.id && conversationMessages.length > 0) {
      const unreadMessages = conversationMessages.filter(
        msg => !msg.isRead && msg.senderId === selectedUserId
      );

      if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        unreadMessages.forEach(msg => {
          if(msg.id) { 
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
  }, [combinedMessages]);


  const startRecording = async () => {
    setIsRecording(true);
    if (isLocked) setIsLocked(false);
    setRecordingTime(0);
    try {
        const constraints = currentRecordingMode === 'video'
            ? { audio: true, video: { facingMode } }
            : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (currentRecordingMode === 'video' && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
        }

        const mimeType = currentRecordingMode === 'video' ? 'video/webm' : 'audio/webm';
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
        
        mediaRecorderRef.current.start();
        
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);

    } catch (error) {
        console.error(`${currentRecordingMode} recording failed:`, error);
        toast({
            variant: 'destructive',
            title: "Xatolik",
            description: `${currentRecordingMode === 'video' ? 'Video' : 'Ovoz'} yozish uchun ruxsat berilmadi yoki qurilmangizda muammo bor.`
        });
        setIsRecording(false);
    }
  };

    const stopRecording = async (send: boolean = true) => {
        if (!mediaRecorderRef.current || !isRecording) return;
    
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        
        setIsRecording(false);
        setIsLocked(false);

        try {
            const mediaBlob = await new Promise<Blob>((resolve) => {
                if (!mediaRecorderRef.current) return;
                
                let chunks: BlobPart[] = [];
                mediaRecorderRef.current.ondataavailable = (e) => {
                    chunks.push(e.data);
                };
    
                mediaRecorderRef.current.onstop = () => {
                    const mimeType = currentRecordingMode === 'video' ? 'video/webm' : 'audio/webm';
                    const blob = new Blob(chunks, { type: mimeType });
                    resolve(blob);
                };

                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            });
    
            if (send && mediaBlob.size > 0) {
                await sendMediaMessage(mediaBlob, currentRecordingMode);
            } else if (send) {
                toast({ variant: 'destructive', title: 'Xatolik', description: `Yozib olingan ${currentRecordingMode} bo'sh.` });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Xatolik', description: `${currentRecordingMode} yozishni to'xtatishda muammo.` });
        }
    };
    
    const sendMediaMessage = async (mediaBlob: Blob, mode: 'audio' | 'video') => {
        if (!selectedUserId || !db) return;

        const optimisticId = `optimistic-${Date.now()}`;
        const localMediaUrl = URL.createObjectURL(mediaBlob);

        const optimisticMsg: OptimisticMessage = {
            id: optimisticId,
            senderId: currentUser.id,
            receiverId: selectedUserId,
            type: mode,
            audioUrl: mode === 'audio' ? localMediaUrl : undefined,
            videoUrl: mode === 'video' ? localMediaUrl : undefined,
            content: '',
            createdAt: new Date(), 
            isRead: false,
            status: 'uploading',
        };
        setOptimisticMessages(prev => [...prev, optimisticMsg]);
        
        try {
            const formData = new FormData();
            formData.append(mode, mediaBlob, `message.${mode === 'video' ? 'webm' : 'webm'}`);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(`Xabarni yuklashda xatolik.`);
            }

            const mediaUrl = result.url;
            
            await addDoc(collection(db, 'messages'), {
                senderId: currentUser.id,
                receiverId: selectedUserId,
                type: mode,
                content: '',
                isRead: false,
                ...(mode === 'audio' && { audioUrl: mediaUrl }),
                ...(mode === 'video' && { videoUrl: mediaUrl }),
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
                  messageSnippet: mode === 'audio' ? "Ovozli xabar" : "Video xabar",
                  createdAt: serverTimestamp(),
                });
            }
            setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
            URL.revokeObjectURL(localMediaUrl);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
            setOptimisticMessages(prev => prev.map(m => m.id === optimisticId ? {...m, status: 'failed'} : m));
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
  
    const onPointerDown = (e: React.PointerEvent) => {
        if (!isLocked) {
            setPointerStart({ x: e.clientX, y: e.clientY });
            setPointerMove({ x: e.clientX, y: e.clientY });
            startRecording();
        }
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (isRecording && !isLocked) {
            setPointerMove({ x: e.clientX, y: e.clientY });
            const dy = e.clientY - pointerStart.y;
            if (dy < LOCK_THRESHOLD) {
                setIsLocked(true);
            }
            const dx = e.clientX - pointerStart.x;
            if (dx < CANCEL_THRESHOLD) {
                stopRecording(false);
                setPointerStart({x:0,y:0})
            }
        }
    };
    const onPointerUp = () => {
        if (isRecording && !isLocked) {
            stopRecording(true);
        }
    };

    const handleCancelLockedRecording = () => stopRecording(false);

    const handleSendLockedRecording = () => stopRecording(true);
    
    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };
    
    useEffect(() => {
        if (isRecording && currentRecordingMode === 'video') {
             // We need to re-request the stream to change camera
            stopRecording(false).then(startRecording);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);


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
  
  const swipeDx = isRecording && !isLocked ? pointerMove.x - pointerStart.x : 0;

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
            combinedMessages.map(msg => (
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
                        'p-2 rounded-lg relative shadow-md',
                         msg.type !== 'video' && (msg.senderId === currentUser.id
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-background text-foreground rounded-bl-none'),
                        msg.type === 'video' && 'p-0 bg-transparent shadow-none' // videos have their own bg/shadow
                    )}
                >
                     {msg.type === 'audio' && msg.audioUrl ? (
                        <AudioPlayer audioUrl={msg.audioUrl}/>
                     ) : msg.type === 'video' && msg.videoUrl ? (
                        <VideoMessagePlayer videoUrl={msg.videoUrl} />
                     ) : (
                        <p className="pb-4 pr-5">{msg.content}</p>
                     )}
                    
                    <div className="absolute bottom-1 right-2 flex items-center gap-1">
                      {(msg as OptimisticMessage).status === 'uploading' && <Loader2 size={14} className="animate-spin text-primary-foreground/70" />}
                      
                      {msg.senderId === currentUser.id && (msg as OptimisticMessage).status !== 'uploading' && msg.type !== 'video' && (
                          <>
                              {msg.isRead ? (
                                  <CheckCheck size={16} className="text-blue-400" />
                              ) : (
                                  <Check size={16} className={cn("text-muted-foreground/70", msg.senderId === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70')} />
                              )}
                          </>
                      )}
                    </div>
                </div>
                </div>
            ))
        )}
      </ScrollArea>

        {isRecording && currentRecordingMode === 'video' && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                <div className="relative w-64 h-64">
                    <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-primary animate-pulse">
                         <video ref={videoPreviewRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted />
                    </div>
                     <Button
                        onClick={handleSwitchCamera}
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-4 right-4 rounded-full z-10"
                    >
                        <SwitchCamera />
                    </Button>
                </div>
            </div>
        )}

      <div className="p-2 md:p-4 border-t bg-background overflow-hidden">
         <AnimatePresence>
            {isLocked && (
                <motion.div
                     initial={{ y: "100%" }}
                     animate={{ y: "0%" }}
                     exit={{ y: "100%" }}
                     transition={{ duration: 0.3, ease: 'easeOut' }}
                     className="flex items-center gap-2"
                >
                    <Button onClick={handleCancelLockedRecording} variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 />
                    </Button>
                    <div className="flex-1 bg-secondary rounded-full h-10 flex items-center px-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <p className="text-sm font-mono text-muted-foreground">{formatTime(recordingTime)}</p>
                    </div>
                    <Button onClick={handleSendLockedRecording} disabled={isSending}>
                        <Send className="h-4 w-4" />
                    </Button>
                </motion.div>
            )}
         </AnimatePresence>
          <motion.div
            animate={{
                y: isLocked ? '150%' : '0%',
                opacity: isLocked ? 0 : 1
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn("flex items-center gap-2", isLocked && "pointer-events-none")}
          >
            {isRecording && !isLocked ? (
                <div className="flex-1 flex items-center justify-between text-muted-foreground transition-all duration-300" style={{ transform: `translateX(${Math.max(0, -swipeDx)}px)`}}>
                     <div className="flex items-center gap-1 text-sm">
                        <ChevronLeft className="h-4 w-4"/> Bekor qilish uchun suring
                     </div>
                      <div className="flex items-center gap-1 text-sm">
                        <p className='font-mono'>{formatTime(recordingTime)}</p>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                </div>
            ) : (
                <>
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Xabar yozing..."
                    disabled={isSending}
                />
                <Button 
                    type="button" 
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentRecordingMode(prev => prev === 'audio' ? 'video' : 'audio')}
                >
                    <AnimatePresence mode="popLayout">
                         <motion.div
                            key={currentRecordingMode}
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                         >
                            {currentRecordingMode === 'audio' ? <Mic/> : <Camera />}
                         </motion.div>
                    </AnimatePresence>
                </Button>
                </>
            )}

            <div 
                className="relative"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <AnimatePresence>
                    {isRecording && !isLocked && (
                         <motion.div 
                            initial={{ y: 0, opacity: 0}}
                            animate={{ y: -60, opacity: 1}}
                            transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 15 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 p-2 bg-secondary rounded-full shadow-lg"
                         >
                            <ArrowUp className="text-muted-foreground"/>
                         </motion.div>
                    )}
                 </AnimatePresence>
                 <motion.div
                     animate={{ scale: isRecording ? 1.4 : 1 }}
                     transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                     style={{ transformOrigin: 'center' }}
                 >
                    <Button
                        type="button" 
                        size="icon"
                        className={cn("rounded-full transition-colors duration-300", isRecording && 'bg-primary/80')}
                    >
                         {isRecording && !isLocked ? <Lock className="h-4 w-4" /> : newMessage ? <Send/> : currentRecordingMode === 'audio' ? <Mic/> : <Camera/> }
                    </Button>
                 </motion.div>
            </div>
         </motion.div>
      </div>
    </div>
  );
}

    