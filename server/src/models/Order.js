import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true }, // snapshot
    price: { type: Number, required: true }, // snapshot, VNĐ
    quantity: { type: Number, required: true, min: 1, default: 1 },
    customizations: {
      ice: { type: String, default: '' },
      sugar: { type: String, default: '' },
      sweetness: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['dangphache', 'chuanbiphucvu', 'daphucvu'],
      default: 'dangphache',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    // optional: online orders may not be tied to a physical table
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['staff', 'customer_kiosk', 'customer_online'], default: 'staff' },
    status: {
      type: String,
      enum: ['moi', 'daxacnhan', 'dathanhtoan', 'danglam', 'dangphache', 'chuanbiphucvu', 'daphucvu', 'hoantat'],
      default: 'moi',
    },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: { type: String, default: '' },
    note: { type: String, default: '' },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
