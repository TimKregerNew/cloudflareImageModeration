import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
    try {
        // 1. Fetch approved images from Firestore
        const snapshot = await db.collection('images').where('status', '==', 'approved').get();

        const approvedImages = [];
        snapshot.forEach(doc => {
            approvedImages.push(doc.data());
        });

        // Map to frontend format
        const formattedImages = approvedImages.map((img) => {
            let uploadedDate = new Date();
            if (img.uploaded && typeof img.uploaded.toDate === 'function') {
                uploadedDate = img.uploaded.toDate();
            } else if (img.uploaded) {
                uploadedDate = new Date(img.uploaded);
            }

            return {
                id: img.cloudflareId,
                url: img.url,
                meta: img.metadata,
                uploaded: uploadedDate.toISOString(),
                variants: [img.url], // Mock variants structure
            };
        });

        return NextResponse.json({ images: formattedImages });
    } catch (error) {
        console.error('Error fetching approved images:', error);
        return NextResponse.json(
            { error: 'Failed to fetch approved images', details: error.message },
            { status: 500 }
        );
    }
}
