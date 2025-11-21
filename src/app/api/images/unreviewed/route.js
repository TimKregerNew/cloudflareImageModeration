import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Image from '@/models/Image';

export async function GET() {
    try {
        await dbConnect();

        // 1. Fetch pending images from MongoDB
        const unreviewedImages = await Image.find({ status: 'pending' }).lean();

        // Map to frontend format if needed (renaming cloudflareId to id)
        const formattedImages = unreviewedImages.map((img) => ({
            id: img.cloudflareId,
            url: img.url,
            meta: img.metadata,
            uploaded: img.uploaded || new Date().toISOString(), // Fallback
            variants: [img.url], // Mock variants structure
        }));

        return NextResponse.json({ images: formattedImages });
    } catch (error) {
        console.error('Error fetching images:', error);
        return NextResponse.json(
            { error: 'Failed to fetch images' },
            { status: 500 }
        );
    }
}
