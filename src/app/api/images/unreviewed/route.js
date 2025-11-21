import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function GET() {
    try {
        // 1. Fetch pending images from Firestore
        const snapshot = await db.collection('images').where('status', '==', 'pending').get();

        const unreviewedImages = [];
        snapshot.forEach(doc => {
            unreviewedImages.push(doc.data());
        });

        // Map to frontend format if needed (renaming cloudflareId to id)
        const formattedImages = unreviewedImages.map((img) => {
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
        console.error('Error fetching images:', error);
        return NextResponse.json(
            { error: 'Failed to fetch images', details: error.message },
            { status: 500 }
        );
    }
}
