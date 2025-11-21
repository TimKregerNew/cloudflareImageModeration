'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ImageCard from '@/components/ImageCard';
import { signOut } from 'next-auth/react';

export default function Home() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const res = await axios.get('/api/images/unreviewed');
            setImages(res.data.images || []);
        } catch (err) {
            console.error('Error fetching images:', err);
            setError('Failed to load images. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            await axios.post('/api/images/sync');
            await fetchImages();
        } catch (err) {
            console.error('Sync failed:', err);
            const msg = err.response?.data?.details || err.response?.data?.error || err.message;
            alert(`Failed to sync images: ${msg}`);
            setLoading(false);
        }
    };

    const handleApprove = async (image) => {
        try {
            // Optimistic update
            setImages((prev) => prev.filter((img) => img.id !== image.id));

            await axios.post('/api/images/approve', {
                id: image.id,
                url: image.variants?.[0] || image.url, // Adjust based on actual CF response
                metadata: image.meta || {},
            });
        } catch (err) {
            console.error('Error approving image:', err);
            // Revert on failure (optional, but good practice)
            // For now, just showing an alert or logging
            alert('Failed to approve image. It might reappear on refresh.');
            fetchImages(); // Re-fetch to sync state
        }
    };

    const handleReject = async (image) => {
        if (!confirm('Are you sure you want to reject and delete this image?')) return;

        try {
            // Optimistic update
            setImages((prev) => prev.filter((img) => img.id !== image.id));

            await axios.delete(`/api/images/reject?id=${image.id}`);
        } catch (err) {
            console.error('Error rejecting image:', err);
            alert('Failed to reject image. It might reappear on refresh.');
            fetchImages();
        }
    };

    if (loading) {
        return <div className="loading">Loading unreviewed images...</div>;
    }

    if (error) {
        return <div className="empty-state" style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <main className="container">
            <header className="header">
                <h1>Photo Review Dashboard</h1>
                <button className="btn btn-primary" onClick={fetchImages} style={{ marginRight: '1rem' }}>
                    Refresh
                </button>
                <button className="btn btn-success" onClick={handleSync}>
                    Sync from Cloudflare
                </button>
                <button className="btn btn-danger" onClick={() => signOut()} style={{ marginLeft: '1rem' }}>
                    Logout
                </button>
            </header>

            {images.length === 0 ? (
                <div className="empty-state">
                    <h2>No unreviewed images found.</h2>
                    <p>Great job! You're all caught up.</p>
                </div>
            ) : (
                <div className="grid">
                    {images.map((image) => (
                        <ImageCard key={image.id} image={image} onApprove={handleApprove} onReject={handleReject} />
                    ))}
                </div>
            )}
        </main>
    );
}
