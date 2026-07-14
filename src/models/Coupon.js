import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        targetPhone: { type: String, default: null },
        targetEmail: { type: String, default: null },
        scope: { type: String, enum: ['product', 'category'], required: true },
        targetProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
        targetCategory: { type: String, default: null },
        discountPercent: { type: Number, required: true, min: 1, max: 100 },
        active: { type: Boolean, default: true },
        expiresAt: { type: Date, default: null },
        usedInOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
export default Coupon;