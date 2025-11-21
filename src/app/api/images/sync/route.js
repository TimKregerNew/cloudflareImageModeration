import { NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase';

export async function POST() {
    try {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_API_TOKEN;

        if (!accountId || !apiToken) {
            return NextResponse.json(
                { error: 'Missing Cloudflare credentials' },
                { status: 500 }
            );
        }

        // Fetch all images from Cloudflare
        // TODO: Handle pagination for > 100 images
        const cfResponse = await axios.get(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
                params: {
                    per_page: 100,
                },
            }
        );

        const cfImages = cfResponse.data.result.images;
        const cfImageIds = new Set(cfImages.map((img) => img.id));
        let newCount = 0;

        const batch = db.batch();
        let batchCount = 0;

        // 1. Upsert new images
        for (const img of cfImages) {
            const docRef = db.collection('images').doc(img.id);
            const doc = await docRef.get();

            if (!doc.exists) {
                batch.set(docRef, {
                    cloudflareId: img.id,
                    url: img.variants?.[0] || '',
                    metadata: img.meta || {},
                    status: 'pending',
                    uploaded: img.uploaded ? new Date(img.uploaded) : new Date(),
                });
                batchCount++;
                newCount++;
            }
        }

        // 2. Prune deleted images (only those that are 'pending')
        // We don't want to delete 'approved' or 'rejected' records even if they are gone from CF
        // (unless we want strict sync, but usually we keep history).
        // However, if the user manually deleted from CF, they probably want it gone.
        // Let's assume strict sync for 'pending' items at least.

        const pendingSnapshot = await db.collection('images').where('status', '==', 'pending').get();
        let deletedCount = 0;

        pendingSnapshot.forEach((doc) => {
            const data = doc.data();
            if (!cfImageIds.has(data.cloudflareId)) {
                batch.delete(doc.ref);
                batchCount++;
                deletedCount++;
            }
        });

        // Commit batch if there are changes
        if (batchCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${cfImages.length} images. Added ${newCount}, Removed ${deletedCount}.`,
        });
    } catch (error) {
        console.error('Error syncing images:', error);
        return NextResponse.json(
            { error: 'Failed to sync images', details: error.message },
            { status: 500 }
        );
    }
}
