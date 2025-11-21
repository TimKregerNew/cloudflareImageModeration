import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, url, metadata } = body;

        if (!id || !url) {
            return NextResponse.json(
                { error: 'Missing required fields: id, url' },
                { status: 400 }
            );
        }

        const docRef = db.collection('images').doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            if (data.status === 'approved') {
                return NextResponse.json(
                    { message: 'Image already approved' },
                    { status: 200 }
                );
            } else {
                // Update status to approved
                await docRef.update({
                    status: 'approved',
                    approvedAt: new Date(),
                });
                return NextResponse.json({ success: true, image: { ...data, status: 'approved' } });
            }
        }

        // If it doesn't exist (shouldn't happen if synced, but handle anyway)
        const newImage = {
            cloudflareId: id,
            url,
            metadata: metadata || {},
            status: 'approved',
            approvedAt: new Date(),
            uploaded: new Date(),
        };

        await docRef.set(newImage);

        return NextResponse.json({ success: true, image: newImage });
    } catch (error) {
        console.error('Error approving image:', error);
        return NextResponse.json(
            { error: 'Failed to approve image' },
            { status: 500 }
        );
    }
}
