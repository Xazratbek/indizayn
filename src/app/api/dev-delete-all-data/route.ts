
import { NextResponse } from 'next/server';
import { collection, getDocs, writeBatch, type Firestore } from 'firebase/firestore';
import { db } from '@/firebase/firestore-config';

const COLLECTIONS_TO_DELETE = ['projects', 'users', 'messages', 'notifications'];

async function deleteCollection(db: Firestore, collectionPath: string, batchSize: number = 50) {
    const collectionRef = collection(db, collectionPath);
    const querySnapshot = await getDocs(collectionRef);
    const numDocs = querySnapshot.size;

    if (numDocs === 0) {
        return 0;
    }

    const batch = writeBatch(db);
    let i = 0;
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
        i++;
        if (i % batchSize === 0) {
            // Commit the batch periodically to avoid exceeding limits
            batch.commit();
        }
    });

    // Commit the final batch
    await batch.commit();

    return numDocs;
}

export async function GET(request: Request) {
    // Basic security check: This should only run in a development environment.
    // In a real production app, you'd want much more robust security here.
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ success: false, error: 'This endpoint is only available in development mode.' }, { status: 403 });
    }

    if (!db) {
        return NextResponse.json({ success: false, error: 'Firestore database is not initialized.' }, { status: 500 });
    }
    
    try {
        let totalDeleted = 0;
        const results: Record<string, any> = {};

        for (const collectionName of COLLECTIONS_TO_DELETE) {
            const deletedCount = await deleteCollection(db, collectionName);
            results[collectionName] = `${deletedCount} document(s) deleted.`;
            totalDeleted += deletedCount;
        }

        const message = totalDeleted > 0
            ? `Tozalash tugallandi. Jami ${totalDeleted} ta hujjat o'chirildi.`
            : `Ma'lumotlar bazasi allaqachon bo'sh edi.`;
            
        return NextResponse.json({ 
            success: true, 
            message,
            details: results 
        });

    } catch (error: any) {
        console.error('Ma\'lumotlarni o\'chirishda xatolik:', error);
        return NextResponse.json({ 
            success: false, 
            error: "Ma'lumotlarni o'chirishda kutilmagan xatolik yuz berdi.",
            errorMessage: error.message 
        }, { status: 500 });
    }
}
