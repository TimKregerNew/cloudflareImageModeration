import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Image from '@/models/Image';

export async function POST(request) {
    try {
        await dbConnect();

        const body = await request.json();
        const { id, url, metadata } = body;

        if (!id || !url) {
            return NextResponse.json(
                { error: 'Missing required fields: id, url' },
                { status: 400 }
            );
        }

        // Check if already exists
        const existing = await Image.findOne({ cloudflareId: id });

        if (existing) {
            if (existing.status === 'approved') {
                return NextResponse.json(
                    { message: 'Image already approved' },
                    { status: 200 }
                );
            } else {
                // Update status to approved
                existing.status = 'approved';
                existing.approvedAt = new Date();
                await existing.save();
                return NextResponse.json({ success: true, image: existing });
            }
        }

        const newImage = await Image.create({
            cloudflareId: id,
            url,
            metadata: metadata || {},
            status: 'approved',
        });

        return NextResponse.json({ success: true, image: newImage });
    } catch (error) {
        console.error('Error approving image:', error);
        return NextResponse.json(
            { error: 'Failed to approve image' },
            { status: 500 }
        );
    }
}
