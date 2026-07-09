import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    // auto delete after 10 minutes
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600,
    },
});

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
export default OTP;