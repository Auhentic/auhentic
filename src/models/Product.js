import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        // Already perfectly set up for multiple images!
        images: [
            {
                url: { type: String, required: true },   // Cloudinary URL
                publicId: { type: String, required: true }, // Cloudinary public_id
            },
        ],
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },

        // Admin manually decides which products show in the homepage
        // top-selling slider — no automatic rating-based calculation.
        isTopSelling: {
            type: Boolean,
            default: false,
        },

        // 👇 NEW: Offer details added here
        offer: {
            isOnOffer: { type: Boolean, default: false },
            discountPercent: { type: Number, default: 0, min: 0, max: 100 },
            offerLabel: { type: String, default: '', trim: true },
            expiresAt: { type: Date, default: null }, // 👈 NEW: when the offer auto-ends
        },

        variants: [
            {
                label: { type: String, required: true },
                price: { type: Number, required: true, min: 0 },
            }
        ],

        // Item-level delivery restriction
        deliveryRestriction: {
            enabled: { type: Boolean, default: false },
            allowedDistricts: [
                {
                    district: { type: String, trim: true },
                    charge: { type: Number, default: 0, min: 0 },
                }
            ],
        },

        reviews: [reviewSchema],
        avgRating: {
            type: Number,
            default: 0,
        },
        numReviews: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Auto-calculate avgRating and numReviews on save
productSchema.pre('save', function () {
    if (!this.reviews || this.reviews.length === 0) {
        // FIXED: Pointed these to the actual fields in your schema
        this.avgRating = 0;
        this.numReviews = 0;
        return;
    }

    this.numReviews = this.reviews.length;
    this.avgRating =
        this.reviews.reduce((sum, review) => sum + review.rating, 0) /
        this.reviews.length;
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;