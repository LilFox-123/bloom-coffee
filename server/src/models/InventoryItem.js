import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true }, // kg, lít, gói, ...
    quantity: { type: Number, required: true, min: 0, default: 0 }, // integer
    minThreshold: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ quantity: 1 });

// virtual status: du | sap | het
inventoryItemSchema.virtual('statusKey').get(function () {
  if (this.quantity <= 0) return 'het';
  if (this.quantity <= this.minThreshold) return 'sap';
  return 'du';
});

inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

export default mongoose.model('InventoryItem', inventoryItemSchema);
