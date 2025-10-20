
'use client';

import { useMemo } from 'react';
import type { Session } from 'next-auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, or } from 'firebase/firestore';
import type { Message, Designer } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { uz } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { Users } from 'lucide-react';

interface ChatSidebarProps {
  currentUser: Session['user'];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

interface Conversation {
    partner: Designer;
    lastMessage: Message;
}

function ConversationSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    )
}

export default function ChatSidebar({ currentUser, selectedUserId, onSelectUser }: ChatSidebarProps) {
  const db = useFirestore();

  const allMessagesQuery = useMemoFirebase(
    () => db && currentUser?.id 
        ? query(
            collection(db, 'messages'), 
            or(
                where('senderId', '==', currentUser.id),
                where('receiverId', '==', currentUser.id)
            ),
            orderBy('createdAt', 'desc')
          )
        : null,
    [db, currentUser.id]
  );
  const { data: allMessages, isLoading: loadingMessages } = useCollection<Message>(allMessagesQuery);

  const partnerLastMessage = useMemo(() => {
    if (!allMessages || !currentUser.id) return new Map<string, Message>();
    
    const map = new Map<string, Message>();
    allMessages.forEach(msg => {
      const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      if (!map.has(partnerId)) {
        map.set(partnerId, msg);
      }
    });
    return map;
  }, [allMessages, currentUser.id]);

  const partnerIds = useMemo(() => Array.from(partnerLastMessage.keys()), [partnerLastMessage]);

  const partnersQuery = useMemoFirebase(
    () => (db && partnerIds.length > 0) ? query(collection(db, 'users'), where('id', 'in', partnerIds)) : null,
    [db, partnerIds]
  );
  const { data: partnersData, isLoading: loadingPartners } = useCollection<Designer>(partnersQuery);

  const partnersMap = useMemo(() => {
    const map = new Map<string, Designer>();
    partnersData?.forEach(p => map.set(p.id, p));
    return map;
  }, [partnersData]);

  const finalConversations: Conversation[] = useMemo(() => {
    return Array.from(partnerLastMessage.entries())
      .map(([partnerId, lastMessage]) => {
        const partner = partnersMap.get(partnerId);
        if (partner) {
          return { partner, lastMessage };
        }
        return null;
      })
      .filter((c): c is Conversation => c !== null)
      .sort((a, b) => (b.lastMessage.createdAt?.toMillis() ?? 0) - (a.lastMessage.createdAt?.toMillis() ?? 0));
  }, [partnerLastMessage, partnersMap]);
  
  const isLoading = loadingMessages || (partnerIds.length > 0 && loadingPartners);

  return (
    <div className="border-r bg-background/80 h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold font-headline">Suhbatlar</h2>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
            <div>
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
            </div>
        ) : finalConversations.length > 0 ? (
           finalConversations.map(({ partner, lastMessage }) => (
            <button
                key={partner.id}
                onClick={() => onSelectUser(partner.id)}
                className={cn(
                    'flex items-center gap-3 p-3 w-full text-left transition-colors hover:bg-secondary/80',
                    selectedUserId === partner.id && 'bg-secondary'
                )}
            >
                <Avatar className="h-12 w-12">
                    <AvatarImage src={partner.photoURL} alt={partner.name} />
                    <AvatarFallback>{partner.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{partner.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {lastMessage.createdAt ? formatDistanceToNowStrict(lastMessage.createdAt.toDate(), { addSuffix: true, locale: uz }) : ''}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                        {lastMessage.senderId === currentUser.id && 'Siz: '}
                        {lastMessage.content}
                    </p>
                </div>
            </button>
            ))
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <Users className="w-12 h-12 mb-4" />
                <p className="font-semibold">Hali suhbatlar yo'q</p>
                <p className="text-sm">Dizaynerlar profillaridan xabar yuborishni boshlang.</p>
            </div>
        )}
      </ScrollArea>
    </div>
  );
}
