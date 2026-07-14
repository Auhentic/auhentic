import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
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
    note: {
        type: String,
        default: '',
        maxlength: 300,
    },
});

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
}, { _id: false });

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        guestInfo: {
            name: String,
            email: String,
            phone: String,
        },
        items: [orderItemSchema],
        shippingAddress: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            district: {
                type: String,
                required: true
            },
            postalCode: String,
            phone: {
                type: String,
                required: true
            },
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'SSLCommerz', 'bKash', 'Nagad', 'Rocket'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
            default: 'pending',
        },
        transactionId: String,
        orderStatus: {
            type: String,
            enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'placed',
        },
        statusHistory: [statusHistorySchema],
        subtotal: {
            type: Number,
            required: true
        },
        shippingCost: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        },
        note: {
            type: String,
            default: ''
        },
        // Soft-delete: admin archived the card from done-product view
        // Does NOT affect revenue — dashboard still counts this order's total
        isArchivedByAdmin: {
            type: Boolean,
            default: false
        },

        // Sequential human-readable order number, e.g. AUH-630
        orderNumber: {
            type: Number,
            unique: true,
        },

        couponCode: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;