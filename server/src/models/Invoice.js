import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    customizations: {
      ice: { type: String, default: '' },
      sugar: { type: String, default: '' },
      sweetness: { type: String, default: '' },
      note: { type: String, default: '' },
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    tableName: { type: String, default: '' }, // snapshot
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    staffName: { type: String, default: '' }, // snapshot
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true }, // VNĐ
    vat: { type: Number, required: true }, // VNĐ, currently 0 because Bloom Coffee does not charge VAT
    total: { type: Number, required: true }, // VNĐ
    discountAmount: { type: Number, default: 0 },
    promoDiscountAmount: { type: Number, default: 0 },
    memberDrinkDiscountAmount: { type: Number, default: 0 },
    memberTierDiscountAmount: { type: Number, default: 0 },
    pointDiscountAmount: { type: Number, default: 0 },
    pointsRedeemed: { type: Number, default: 0 },
    memberTier: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['tienmat', 'chuyenkhoan', 'vidientu'],
      default: 'tienmat',
    },
    // carried over from the originating order (staff / customer_kiosk / customer_online)
    source: { type: String, default: 'staff' },
  },
  { timestamps: true }
);

invoiceSchema.index({ createdAt: -1 });

export default mongoose.model('Invoice', invoiceSchema);
