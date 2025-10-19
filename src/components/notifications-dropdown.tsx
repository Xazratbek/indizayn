
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Heart, UserPlus, MessageSquare, CheckCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingPage } from '@/app/loading';

function NotificationIcon({ type }: { type: Notification['type'] }) {
    switch (type) {
        case 'like':
            return <Heart className="h-4 w-4 text-red-500" />;
        case 'follow':
            return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'message':
            return <MessageSquare className="h-4 w-4 text-green-500" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
}

export default function NotificationsDropdown() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const notificationsQuery = useMemoFirebase(() => 
    (db && user?.uid) // Ensure user and user.uid exist before creating the query
      ? query(
          collection(db, 'notifications'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
      : null, 
    [db, user?.uid] // Depend on user.uid to re-run when the user logs in
  );
  
  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
  
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  const handleMarkAllRead = async () => {
    if (!db || !user || unreadNotifications.length === 0) return;
    
    setIsMarkingRead(true);
    try {
        const batch = writeBatch(db);
        unreadNotifications.forEach(notif => {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { isRead: true });
        });
        await batch.commit();
        toast({ description: "Barcha bildirishnomalar o'qildi." });
    } catch (error) {
        console.error("Bildirishnomalarni o'qilgan deb belgilashda xatolik:", error);
        toast({
            variant: "destructive",
            title: "Xatolik",
            description: "Amalni bajarib bo'lmadi.",
        });
    } finally {
        setIsMarkingRead(false);
    }
  };


  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `/projects/${notification.projectId}`;
      case 'follow':
        return `/designers/${notification.senderId}`;
      case 'message':
        // TODO: This should lead to a messages page/chat with the user
        return `/designers/${notification.senderId}`;
      default:
        return '#';
    }
  };

  const getNotificationText = (notification: Notification) => {
    if (notification.senderId === 'system') {
        return notification.messageSnippet || "Tizim xabari.";
    }
    
    switch(notification.type) {
        case 'like':
            return <>
                <span className="font-semibold">{notification.senderName}</span>
                {` loyihangizni yoqtirdi: `}
                <span className="font-semibold italic">"{notification.projectName}"</span>
            </>;
        case 'follow':
            return <>
                <span className="font-semibold">{notification.senderName}</span>
                {` sizga obuna bo'ldi.`}
            </>;
        case 'message':
            return <>
                <span className="font-semibold">{notification.senderName}</span>
                {` sizga xabar yubordi.`}
            </>;
        default:
            return "Yangi bildirishnoma."
    }
  }


  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadNotifications.length}
            </span>
          )}
          <span className="sr-only">Bildirishnomalar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Bildirishnomalar</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAllRead}
            disabled={isMarkingRead || unreadNotifications.length === 0}
          >
            {isMarkingRead ? <LoadingPage /> : <CheckCheck className="h-4 w-4 mr-2" />}
            Barchasini o'qish
          </Button>
        </div>
        <ScrollArea className="h-96">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <LoadingPage />
                </div>
            ) : notifications && notifications.length > 0 ? (
                <div className="divide-y">
                    {notifications.map((notif) => (
                        <Link key={notif.id} href={getNotificationLink(notif) ?? '#'} legacyBehavior>
                        <a className={`block p-4 hover:bg-secondary/50 ${!notif.isRead ? 'bg-blue-500/5' : ''}`}>
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={notif.senderPhotoURL} alt={notif.senderName} />
                                    <AvatarFallback>{notif.senderName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm flex-1">
                                    <p>
                                        {getNotificationText(notif)}
                                    </p>
                                    {notif.type === 'message' && notif.messageSnippet && (
                                        <p className="text-xs text-muted-foreground mt-1 p-2 bg-secondary rounded-md italic">
                                            "{notif.messageSnippet}"
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {notif.createdAt ? formatDistanceToNowStrict(notif.createdAt.toDate(), { addSuffix: true, locale: uz }) : ''}
                                    </p>
                                </div>
                                {!notif.isRead && (
                                     <div className="w-2 h-2 rounded-full bg-primary mt-1"></div>
                                )}
                            </div>
                        </a>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    <p>Hozircha bildirishnomalar yo'q.</p>
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
