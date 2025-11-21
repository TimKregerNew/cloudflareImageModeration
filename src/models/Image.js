import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
    cloudflareId: {
        type: String,
        required: [true, 'Please provide a Cloudflare Image ID'],
        unique: true,
    },
    url: {
        type: String,
        required: [true, 'Please provide the Image URL'],
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    metadata: {
        type: Object,
        default: {},
    },
    approvedAt: {
        type: Date,
        default: Date.now,
    },
    uploaded: {
        type: Date,
    },
});

export default mongoose.models.Image || mongoose.model('Image', ImageSchema);
