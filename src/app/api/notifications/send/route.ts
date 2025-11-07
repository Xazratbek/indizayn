import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import webpush from 'web-push';
import type { PushSubscription } from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error("VAPID keys are not defined in environment variables.");
} else {
    webpush.setVapidDetails(
        'mailto:info@indizayn.uz', // O'zingizning emailingizni yozing
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: Request) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        return NextResponse.json({ success: false, error: 'VAPID keys not configured on the server.' }, { status: 500 });
    }
    
    const { firestore } = initializeFirebase();

    try {
        const body = await request.json();
        const { targetUserId, title, body: notificationBody, url } = body;

        if (!targetUserId || !title || !notificationBody || !url) {
            return NextResponse.json({ success: false, error: 'Missing required payload fields.' }, { status: 400 });
        }

        const userDocRef = doc(firestore, 'users', targetUserId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
        }

        const userData = userDoc.data();
        const subscriptions = userData.pushSubscriptions || [];
        
        if (subscriptions.length === 0) {
            return NextResponse.json({ success: true, message: 'User has no subscriptions.' });
        }

        const payload = JSON.stringify({
            title,
            options: {
                body: notificationBody,
                icon: '/logo.png',
                badge: '/logo.png',
                data: { url },
                vibrate: [200, 100, 200]
            }
        });

        const sendPromises = subscriptions.map((sub: PushSubscription) => 
            webpush.sendNotification(sub, payload).catch(error => {
                // Agar obuna eskirgan yoki noto'g'ri bo'lsa (masalan, 410 Gone), uni bazadan o'chirish kerak bo'ladi.
                // Bu qismni keyinchalik qo'shish mumkin.
                console.error(`Failed to send notification to ${sub.endpoint}:`, error.statusCode);
            })
        );

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, message: 'Notification sent successfully.' });

    } catch (error: any) {
        console.error('Error sending push notification:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
