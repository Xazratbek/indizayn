
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from 'next-auth';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import type { Message, Designer } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, MessageSquareText, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface ChatWindowProps {
  currentUser: Session['user'];
  selectedUserId: string | null;
}

function MessageSkeleton() {
    return (
        <div className="flex items-end gap-2 my-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
    )
}

export default function ChatWindow({ currentUser, selectedUserId }: ChatWindowProps) {
  const db = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const recipientDocRef = useMemoFirebase(
    () => (db && selectedUserId) ? doc(db, 'users', selectedUserId) : null,
    [db, selectedUserId]
  );
  const { data: partner, isLoading: partnerLoading } = useDoc<Designer>(recipientDocRef);

  // Re-using the same logic from sidebar to get all messages related to the user
  const sentMessagesQuery = useMemoFirebase(
    () => db && currentUser?.id 
        ? query(collection(db, 'messages'), where('senderId', '==', currentUser.id), orderBy('createdAt', 'asc'))
        : null,
    [db, currentUser.id]
  );
  const { data: sentMessages, isLoading: loadingSent } = useCollection<Message>(sentMessagesQuery);

  const receivedMessagesQuery = useMemoFirebase(
    () => db && currentUser?.id 
        ? query(collection(db, 'messages'), where('receiverId', '==', currentUser.id), orderBy('createdAt', 'asc'))
        : null,
    [db, currentUser.id]
  );
  const { data: receivedMessages, isLoading: loadingReceived } = useCollection<Message>(receivedMessagesQuery);

  const allMessages = useMemo(() => {
    return [...(sentMessages || []), ...(receivedMessages || [])].sort((a,b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
  }, [sentMessages, receivedMessages]);
  
  const filteredMessages = useMemo(() => {
      if (!allMessages || !selectedUserId) return [];
      return allMessages.filter(msg => 
        (msg.senderId === currentUser.id && msg.receiverId === selectedUserId) ||
        (msg.senderId === selectedUserId && msg.receiverId === currentUser.id)
      )
  }, [allMessages, selectedUserId, currentUser.id]);

  // Mark messages as read
  useEffect(() => {
    if (db && selectedUserId && currentUser.id && filteredMessages.length > 0) {
      const unreadMessages = filteredMessages.filter(
        msg => msg.receiverId === currentUser.id && !msg.isRead
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
  }, [filteredMessages, selectedUserId, currentUser.id, db]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [filteredMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !db) return;
    setIsSending(true);
    
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.id,
        receiverId: selectedUserId,
        content: newMessage,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Xabar yuborishda xatolik:", error);
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

  const isLoading = partnerLoading || loadingSent || loadingReceived;

  return (
    <div className="flex flex-col h-full bg-secondary/30">
      {isLoading && !partner ? (
         <div className="flex items-center gap-3 p-3 border-b bg-background">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className='space-y-1'>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
      ) : partner && (
        <div className="flex items-center gap-3 p-3 border-b bg-background">
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
            filteredMessages.map(msg => (
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
                        'p-3 rounded-lg relative',
                        msg.senderId === currentUser.id
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background text-foreground rounded-bl-none'
                    )}
                >
                    <p className="pb-4 pr-5">{msg.content}</p>
                    {msg.senderId === currentUser.id && (
                        <div className="absolute bottom-1 right-2 flex items-center">
                            {msg.isRead ? (
                                <CheckCheck size={16} className="text-blue-400" />
                            ) : (
                                <Check size={16} className="text-muted-foreground/70" />
                            )}
                        </div>
                    )}
                </div>
                </div>
            ))
        )}
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form 
            className="flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Xabar yozing..."
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
