import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true }, // snapshot
    price: { type: Number, required: true }, // snapshot, VNĐ
    quantity: { type: Number, required: true, min: 1, default: 1 },
    status: { type: String, enum: ['dangphache', 'daphucvu'], default: 'dangphache' },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['staff', 'customer_kiosk'], default: 'staff' },
    status: { type: String, enum: ['moi', 'danglam', 'hoantat'], default: 'moi' },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
