import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        // We use a fixed key to ensure only ONE settings document exists
        key: {
            type: String,
            default: 'site_settings',
            unique: true,
        },
        shopName: {
            type: String,
            default: 'Auhentic',
        },
        tagline: {
            type: String,
            default: 'Fresh food delivered to your door',
        },
        email: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            default: '',
        },
        whatsapp: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },
        deliveryAreas: {
            type: String,
            default: '',
        },
        facebook: {
            type: String,
            default: '',
        },
        instagram: {
            type: String,
            default: '',
        },
        footerMessage: {
            type: String,
            default: 'Auhentic is actually Authentic',
        },
        freeDeliveryAmount: { type: Number, default: null },
        freeDeliveryText: { type: String, default: '' },
        districtDelivery: [
            {
                district:
                {
                    type: String
                },
                charge:
                {
                    type: Number, default: 0
                },
            },
        ],
    },
    { timestamps: true }
);

const Settings =
    mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
export default Settings;