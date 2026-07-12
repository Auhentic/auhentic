import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = guest
        visitorId: { type: String, required: true }, // cookie-based id, works for guests too
        type: {
            type: String,
            enum: ['page_view', 'product_view', 'heartbeat', 'pixel'],
            required: true,
        },
        path: { type: String, default: '' },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
        durationSeconds: { type: Number, default: 0 }, // set on heartbeat/unload events
        meta: { type: Object, default: {} }, // free-form: campaign, source, etc.
    },
    { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ product: 1 });
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export default Activity;