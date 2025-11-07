
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

// VAPID public key ni environment variable orqali olish
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const sendNotification = async (notificationPayload: { targetUserId: string; title: string; body: string; url: string }) => {
  try {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });
    if (!res.ok) {
        const errorData = await res.json();
        console.error("Failed to send push notification:", errorData.error);
    }
  } catch (error) {
    console.error("Failed to send push notification request:", error);
  }
};


export default function PushNotificationsProvider() {
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const pathname = usePathname();
    const [isSubscribed, setIsSubscribed] = useState(false);
    
    const subscribeUser = useCallback(async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error('VAPID public key is not defined.');
            return;
        }

        if (!('serviceWorker' in navigator) || !session?.user.id) {
            return;
        }

        try {
            // Register the service worker from public directory
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            
            // Send subscription to our API
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription, userId: session.user.id }),
            });

            setIsSubscribed(true);
            console.log('User is subscribed.');

        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
        }
    }, [session?.user.id]);
    
    useEffect(() => {
        // We don't want to show notification prompts on the messages page
        if (pathname.startsWith('/messages')) return;

        const permissionPrompted = localStorage.getItem('notification_prompted');

        if (status === 'authenticated' && 'Notification' in window && Notification.permission === 'default' && !permissionPrompted) {
             const timer = setTimeout(() => {
                toast({
                    title: "Bildirishnomalarga ruxsat bering",
                    description: "Yangiliklarni o'tkazib yubormaslik uchun bildirishnomalarni yoqishni xohlaysizmi?",
                    action: (
                        <button
                            onClick={() => {
                                localStorage.setItem('notification_prompted', 'true');
                                Notification.requestPermission().then(permission => {
                                    if (permission === 'granted') {
                                        subscribeUser();
                                    }
                                });
                            }}
                            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Ruxsat Berish
                        </button>
                    ),
                    duration: 10000,
                });
             }, 10000); 
             return () => clearTimeout(timer);
        }

        if (status === 'authenticated' && 'Notification' in window && Notification.permission === 'granted' && !isSubscribed) {
            subscribeUser();
        }
    }, [status, isSubscribed, subscribeUser, toast, pathname]);

    return null;
}
