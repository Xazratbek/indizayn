
import { NextResponse } from 'next/server';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { PushSubscription } from 'web-push';

// Firebase'ni ishga tushirish
const { firestore } = initializeFirebase();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscription, userId }: { subscription: PushSubscription, userId: string } = body;
        
        if (!subscription || !userId) {
            return NextResponse.json({ success: false, error: 'Subscription obyekti yoki userId yetishmayapti.' }, { status: 400 });
        }

        const userDocRef = doc(firestore, 'users', userId);

        // Atomik tarzda yangi obunani `pushSubscriptions` massiviga qo'shish
        // Bu bir xil obunalar qayta-qayta qo'shilishining oldini oladi
        await updateDoc(userDocRef, {
            pushSubscriptions: arrayUnion(subscription)
        });

        return NextResponse.json({ success: true, message: 'Obuna muvaffaqiyatli saqlandi.' });

    } catch (error: any) {
        console.error('Obunani saqlashda xatolik:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
