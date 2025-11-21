'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ImageCard from '@/components/ImageCard';
import { signOut } from 'next-auth/react';

export default function Home() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('unreviewed'); // 'unreviewed' | 'approved'

    useEffect(() => {
        fetchImages();
    }, [activeTab]); // Refetch when tab changes

    const fetchImages = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'unreviewed'
                ? '/api/images/unreviewed'
                : '/api/images/approved';

            const res = await axios.get(endpoint);
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

    if (error) {
        return <div className="empty-state" style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <main className="container">
            <header className="header">
                <h1>Photo Review Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={fetchImages}>
                        Refresh
                    </button>
                    <button className="btn btn-success" onClick={handleSync}>
                        Sync from Cloudflare
                    </button>
                    <button className="btn btn-danger" onClick={() => signOut()}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="tabs" style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('unreviewed')}
                    style={{
                        marginRight: '1rem',
                        fontWeight: activeTab === 'unreviewed' ? 'bold' : 'normal',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        color: activeTab === 'unreviewed' ? '#0070f3' : '#333'
                    }}
                >
                    Unreviewed
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    style={{
                        fontWeight: activeTab === 'approved' ? 'bold' : 'normal',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        color: activeTab === 'approved' ? '#0070f3' : '#333'
                    }}
                >
                    Approved
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading {activeTab} images...</div>
            ) : images.length === 0 ? (
                <div className="empty-state">
                    <h2>No {activeTab} images found.</h2>
                    {activeTab === 'unreviewed' && <p>Great job! You're all caught up.</p>}
                </div>
            ) : (
                <div className="grid">
                    {images.map((image) => (
                        <ImageCard
                            key={image.id}
                            image={image}
                            onApprove={activeTab === 'unreviewed' ? handleApprove : null}
                            onReject={handleReject}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
