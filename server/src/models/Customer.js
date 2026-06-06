import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    points: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }, // VNĐ
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 });
customerSchema.index({ name: 'text' });

export default mongoose.model('Customer', customerSchema);
