import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['nhap', 'xuat'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    itemName: { type: String, default: '' }, // snapshot
    quantity: { type: Number, required: true, min: 1 },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    staffName: { type: String, default: '' }, // snapshot
    note: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ date: -1 });

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);
