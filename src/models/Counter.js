import mongoose from 'mongoose';

// Simple auto-increment counter for order numbers.
// Starts at 630 as per client requirement (AUH-630, AUH-631...)
// Uses findOneAndUpdate with $inc for atomic increment —
// safe even under concurrent orders.
const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, default: 629 }, // starts at 629 so first increment = 630
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
export default Counter;
