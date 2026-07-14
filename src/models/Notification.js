import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        message: { type: String, default: '' },
        type: { type: String, enum: ['offer', 'product', 'personal', 'coupon'], default: 'offer' },
        targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast to everyone currently on site
        link: { type: String, default: '' },
    },
    { timestamps: true }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // auto-clean after 7 days

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;