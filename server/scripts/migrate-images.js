import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import MenuItem from '../src/models/MenuItem.js';

async function migrateImages() {
  await connectDB();

  const products = await MenuItem.find({
    imageUrl: { $exists: true, $ne: '', $not: /^https?:\/\//i },
  }).select('name imageUrl');

  for (const product of products) {
    console.log(`⚠️ Product ${product.name} has local image ${product.imageUrl} — re-upload manually`);
  }

  if (products.length === 0) {
    console.log('No filename-only product images found.');
  }
}

migrateImages()
  .catch((err) => {
    console.error('Image migration audit failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
