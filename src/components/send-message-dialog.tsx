
"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Designer } from '@/lib/types';
import type { Session } from 'next-auth';
import LoadingPage from '@/app/loading';

interface SendMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: Designer;
  currentUser: Session['user'];
}

export default function SendMessageDialog({ isOpen, onOpenChange, recipient, currentUser }: SendMessageDialogProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Xabar matni bo‘sh bo‘lishi mumkin emas.',
      });
      return;
    }
    if (!db || !currentUser) return;
    if (currentUser.id === recipient.id) {
        toast({
            variant: "destructive",
            title: "Xatolik",
            description: "O'zingizga xabar yubora olmaysiz.",
        });
        return;
    }

    setIsSending(true);
    try {
      // 1. Save message to 'messages' collection
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.id,
        receiverId: recipient.id,
        content: message,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // 2. Create notification for the recipient
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: recipient.id,
        type: 'message',
        senderId: currentUser.id,
        senderName: currentUser.name || 'Anonim foydalanuvchi',
        senderPhotoURL: currentUser.image || '',
        isRead: false,
        messageSnippet: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Muvaffaqiyatli!',
        description: `${recipient.name}ga xabaringiz yuborildi.`,
      });
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Xabar yuborishda xatolik:', error);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Xabarni yuborishda muammo yuz berdi.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{recipient.name}ga xabar yuborish</DialogTitle>
          <DialogDescription>
            Xabaringizni quyida yozing. U bu haqda bildirishnoma oladi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Sizning xabaringiz</Label>
            <Textarea
              placeholder="Salom, ishlaringiz ajoyib..."
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSending}>
              Bekor qilish
            </Button>
          </DialogClose>
          <Button onClick={handleSendMessage} disabled={isSending}>
            {isSending && <LoadingPage />}
            Yuborish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
