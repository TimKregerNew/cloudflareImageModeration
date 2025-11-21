'use client';

import { useState } from 'react';

export default function ImageCard({ image, onApprove, onReject }) {
    const [isApproving, setIsApproving] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await onApprove(image);
        } catch (error) {
            console.error('Failed to approve:', error);
            setIsApproving(false);
        }
    };

    // Cloudflare Image variants can be used here if configured.
    // Assuming 'public' variant or direct URL for now.
    // The API returns 'variants' array usually.
    const imageUrl = image.variants?.[0] || image.url || '';

    return (
        <div className="card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={image.id} className="card-image" loading="lazy" />
            <div className="card-content">
                <div className="card-meta">
                    <p>ID: {image.id.substring(0, 8)}...</p>
                    <p>
                        Uploaded: {(() => {
                            console.log('Image uploaded value:', image.uploaded);
                            try {
                                return new Date(image.uploaded).toLocaleDateString();
                            } catch (e) {
                                return 'Invalid Date';
                            }
                        })()}
                    </p>
                    {image.meta && Object.keys(image.meta).length > 0 && (
                        <div className="metadata-section" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#aaa' }}>
                            <strong>Metadata:</strong>
                            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {Object.entries(image.meta).map(([key, value]) => (
                                    <li key={key}>
                                        {key}: {String(value)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-success"
                        onClick={handleApprove}
                        disabled={isApproving}
                    >
                        {isApproving ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => onReject(image)}
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}
