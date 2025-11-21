import { NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase';

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 }
            );
        }

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_API_TOKEN;

        if (!accountId || !apiToken) {
            return NextResponse.json(
                { error: 'Missing Cloudflare credentials' },
                { status: 500 }
            );
        }

        // Delete from Cloudflare
        await axios.delete(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        );

        // Delete from Firestore
        await db.collection('images').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rejecting image:', error);
        return NextResponse.json(
            { error: 'Failed to reject image' },
            { status: 500 }
        );
    }
}
