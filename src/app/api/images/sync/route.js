import { NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/db';
import Image from '@/models/Image';

export async function POST() {
    try {
        await dbConnect();

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

        // 1. Upsert new images
        for (const img of cfImages) {
            const existing = await Image.findOne({ cloudflareId: img.id });

            if (!existing) {
                await Image.create({
                    cloudflareId: img.id,
                    url: img.variants?.[0] || '',
                    metadata: img.meta || {},
                    status: 'pending',
                    uploaded: img.uploaded,
                });
                newCount++;
            }
        }

        // 2. Prune deleted images (only those that are 'pending')
        // We don't want to delete 'approved' or 'rejected' records even if they are gone from CF
        // (unless we want strict sync, but usually we keep history).
        // However, if the user manually deleted from CF, they probably want it gone.
        // Let's assume strict sync for 'pending' items at least.

        const pendingImages = await Image.find({ status: 'pending' });
        let deletedCount = 0;

        for (const img of pendingImages) {
            if (!cfImageIds.has(img.cloudflareId)) {
                await Image.deleteOne({ _id: img._id });
                deletedCount++;
            }
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
