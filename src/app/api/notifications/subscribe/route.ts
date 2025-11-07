import { NextResponse } from 'next/server';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { PushSubscription } from 'web-push';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


const { firestore } = initializeFirebase();

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { subscription, userId }: { subscription: PushSubscription, userId: string } = body;
        
        if(userId !== session.user.id) {
            return NextResponse.json({ success: false, error: 'User ID mismatch.' }, { status: 403 });
        }

        if (!subscription || !userId) {
            return NextResponse.json({ success: false, error: 'Subscription obyekti yoki userId yetishmayapti.' }, { status: 400 });
        }

        const userDocRef = doc(firestore, 'users', userId);

        await updateDoc(userDocRef, {
            pushSubscriptions: arrayUnion(subscription)
        });

        return NextResponse.json({ success: true, message: 'Obuna muvaffaqiyatli saqlandi.' });

    } catch (error: any) {
        console.error('Obunani saqlashda xatolik:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
