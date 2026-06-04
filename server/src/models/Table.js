import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1, default: 4 },
    zone: { type: String, enum: ['Trong nhà', 'Ngoài trời', 'VIP'], default: 'Trong nhà' },
    status: { type: String, enum: ['trong', 'dangdung', 'ghepban'], default: 'trong' },
    guests: { type: Number, default: 0 },
    occupiedAt: { type: Date, default: null },
    currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

tableSchema.index({ status: 1 });

export default mongoose.model('Table', tableSchema);
