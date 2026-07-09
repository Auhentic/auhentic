import mongoose from 'mongoose';

// Stores logged-in user carts in DB so admin can see abandoned carts.
// Guest carts stay localStorage only — no user ID to link them.
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    variant: {
        type: String,
        default: null
    },
    // Snapshot of the product's general offer at the time it was added,
    // so the cart can show the "Happy Hour" style label + countdown.
    offer: {
        offerLabel: { type: String, default: '' },
        expiresAt: { type: Date, default: null },
    },
}, { _id: false });

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // one cart doc per user
        },
        items: [cartItemSchema],
        personalOffer: {
            discountPercent: { type: Number, default: 0, min: 0, max: 100 },
            message: { type: String, default: '' },
            expiresAt: { type: Date, default: null },
            active: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
