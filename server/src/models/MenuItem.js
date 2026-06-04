import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 }, // VNĐ, integer
    description: { type: String, default: '' },
    // Previously stored filename, now stores full Cloudinary URL
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('MenuItem', menuItemSchema);
