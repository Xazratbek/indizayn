
'use client';

import { useState } from 'react';
import ChatSidebar from '@/components/chat-sidebar';
import ChatWindow from '@/components/chat-window';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import LoadingPage from '../loading';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function MessagesPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === 'loading') {
    return <LoadingPage />;
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Xabarlarni ko'rish uchun kiring</h2>
          <p className="text-muted-foreground mb-6">Mavjud suhbatlaringizni ko'rish yoki yangisini boshlash uchun tizimga kiring.</p>
          <Button onClick={() => (window.location.href = '/auth')}>
            <LogIn className="mr-2 h-4 w-4" />
            Kirish / Ro'yxatdan o'tish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8 h-[calc(100vh-10rem)] md:h-[calc(100vh-8.5rem)]">
        <Card className="h-full grid grid-cols-1 md:grid-cols-[340px_1fr] overflow-hidden">
            <ChatSidebar
            currentUser={user}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            />
            <ChatWindow 
                currentUser={user}
                selectedUserId={selectedUserId}
            />
        </Card>
    </div>
  );
}
