import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false, // never returned in queries by default
        },
        role: {
            type: String,
            enum: ['customer', 'admin', 'sub-admin'],
            default: 'customer',
        },
        phone: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', ''],
        },
        address: {
            street: String,
            city: String,
            district: String,
            postalCode: String,
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        offer: {
            isOnOffer: {
                type: Boolean,
                default: false
            },
            discountPercent: {
                type: Number,
                default: 0
            },
            offerLabel: {
                type: String,
                default: ''
            },
            offerExpiry: {
                type: Date,
                default: null
            },
        },
        photo: {
            url: {
                type: String,
                default: ''
            },
            publicId: {
                type: String,
                default: ''
            },
        },
        lastSeenAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;