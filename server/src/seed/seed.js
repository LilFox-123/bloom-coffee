import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';
import InventoryItem from '../models/InventoryItem.js';
import Invoice from '../models/Invoice.js';

const usersSeed = [
  { name: 'Nguyễn Quản Trị', email: 'admin@bloomcoffee.vn', password: 'Admin@123', role: 'admin', phone: '0901000001' },
  { name: 'Trần Thị Mai', email: 'nv1@bloomcoffee.vn', password: 'Nv1@123', role: 'nhanvien', phone: '0901000002' },
  { name: 'Lê Văn Hùng', email: 'nv2@bloomcoffee.vn', password: 'Nv2@123', role: 'nhanvien', phone: '0901000003' },
];

const tablesSeed = [
  ...Array.from({ length: 10 }, (_, i) => ({
    name: `Bàn ${i + 1}`,
    capacity: i % 3 === 0 ? 6 : 4,
    zone: i >= 7 ? 'Ngoài trời' : 'Trong nhà',
    status: 'trong',
  })),
  { name: 'Bàn VIP 1', capacity: 8, zone: 'VIP', status: 'trong' },
  { name: 'Bàn VIP 2', capacity: 10, zone: 'VIP', status: 'trong' },
];

const menuSeed = [
  // Cà phê
  { name: 'Cà phê đen đá', category: 'Cà phê', price: 25000, description: 'Cà phê phin truyền thống' },
  { name: 'Cà phê sữa đá', category: 'Cà phê', price: 30000, description: 'Đậm đà, béo ngậy' },
  { name: 'Bạc xỉu', category: 'Cà phê', price: 35000, description: 'Nhiều sữa, ít cà phê' },
  { name: 'Cappuccino', category: 'Cà phê', price: 45000, description: 'Bọt sữa mịn' },
  { name: 'Latte', category: 'Cà phê', price: 49000, description: 'Espresso hòa quyện sữa nóng' },
  { name: 'Espresso', category: 'Cà phê', price: 39000, description: 'Cà phê Ý nguyên chất' },
  // Trà
  { name: 'Trà đào cam sả', category: 'Trà', price: 45000, description: 'Thanh mát, thơm sả' },
  { name: 'Trà sữa trân châu', category: 'Trà', price: 42000, description: 'Trân châu đường đen' },
  { name: 'Trà vải', category: 'Trà', price: 45000, description: 'Vị vải ngọt dịu' },
  { name: 'Trà ô long', category: 'Trà', price: 38000, description: 'Hương ô long tự nhiên' },
  { name: 'Hồng trà chanh', category: 'Trà', price: 40000, description: 'Chua ngọt sảng khoái' },
  // Nước ép
  { name: 'Nước ép cam', category: 'Nước ép', price: 45000, description: 'Cam tươi 100%' },
  { name: 'Nước ép dưa hấu', category: 'Nước ép', price: 42000, description: 'Mát lạnh giải nhiệt' },
  { name: 'Nước ép cà rốt', category: 'Nước ép', price: 45000, description: 'Giàu vitamin A' },
  { name: 'Sinh tố xoài', category: 'Nước ép', price: 50000, description: 'Xoài chín ngọt' },
  { name: 'Sinh tố bơ', category: 'Nước ép', price: 55000, description: 'Bơ sáp béo ngậy' },
  // Đồ ăn nhẹ
  { name: 'Bánh mì chảo', category: 'Đồ ăn nhẹ', price: 49000, description: 'Trứng, pate, xúc xích' },
  { name: 'Bánh croissant', category: 'Đồ ăn nhẹ', price: 35000, description: 'Bơ thơm giòn rụm' },
  { name: 'Bánh tiramisu', category: 'Đồ ăn nhẹ', price: 45000, description: 'Vị cà phê đặc trưng' },
  { name: 'Khoai tây chiên', category: 'Đồ ăn nhẹ', price: 30000, description: 'Giòn rụm ăn kèm sốt' },
];

const inventorySeed = [
  { name: 'Hạt cà phê Arabica', unit: 'kg', quantity: 25, minThreshold: 10 },
  { name: 'Sữa tươi', unit: 'lít', quantity: 8, minThreshold: 15 }, // sắp hết
  { name: 'Đường', unit: 'kg', quantity: 40, minThreshold: 10 },
  { name: 'Trân châu', unit: 'kg', quantity: 0, minThreshold: 5 }, // hết
  { name: 'Trà ô long', unit: 'kg', quantity: 12, minThreshold: 4 },
  { name: 'Cam tươi', unit: 'kg', quantity: 6, minThreshold: 8 }, // sắp hết
  { name: 'Ly nhựa', unit: 'cái', quantity: 500, minThreshold: 100 },
  { name: 'Đá viên', unit: 'kg', quantity: 30, minThreshold: 10 },
];

const customersSeed = [
  { name: 'Phạm Minh Anh', phone: '0911111111', email: 'minhanh@gmail.com', points: 620, totalSpent: 6200000 },
  { name: 'Hoàng Thu Trang', phone: '0922222222', email: 'thutrang@gmail.com', points: 540, totalSpent: 5400000 },
  { name: 'Đỗ Quốc Bảo', phone: '0933333333', email: 'quocbao@gmail.com', points: 280, totalSpent: 2800000 },
  { name: 'Vũ Hải Yến', phone: '0944444444', email: 'haiyen@gmail.com', points: 150, totalSpent: 1500000 },
  { name: 'Bùi Thanh Tùng', phone: '0955555555', email: 'thanhtung@gmail.com', points: 90, totalSpent: 900000 },
];

function randomCode(d) {
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `HD${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildHistoricalInvoices(staffList, menu, tables) {
  const invoices = [];
  const methods = ['tienmat', 'chuyenkhoan', 'vidientu'];
  for (let n = 0; n < 15; n++) {
    const dayOffset = Math.floor(n / 2.2); // spread across last 7 days
    const created = new Date();
    created.setDate(created.getDate() - dayOffset);
    created.setHours(8 + (n % 12), (n * 7) % 60, 0, 0);

    const itemCount = 1 + (n % 3);
    const items = [];
    for (let k = 0; k < itemCount; k++) {
      const m = menu[(n * 3 + k) % menu.length];
      const quantity = 1 + ((n + k) % 3);
      items.push({ menuItemId: m._id, name: m.name, price: m.price, quantity });
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const vat = 0;
    const total = subtotal;
    const staff = staffList[n % staffList.length];
    const table = tables[n % tables.length];

    invoices.push({
      code: randomCode(created),
      tableId: table._id,
      tableName: table.name,
      staffId: staff._id,
      staffName: staff.name,
      items,
      subtotal,
      vat,
      total,
      paymentMethod: methods[n % methods.length],
      createdAt: created,
      updatedAt: created,
    });
  }
  return invoices;
}

export async function runSeed() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log('• Bỏ qua seed: dữ liệu đã tồn tại');
    return;
  }
  console.log('• Đang seed dữ liệu lần đầu...');

  const users = [];
  for (const u of usersSeed) {
    users.push(await User.create(u)); // pre-save hook hashes password
  }
  const tables = await Table.insertMany(tablesSeed);
  const menu = await MenuItem.insertMany(menuSeed);
  await Customer.insertMany(customersSeed);
  await InventoryItem.insertMany(inventorySeed);

  const invoices = buildHistoricalInvoices(users, menu, tables);
  await Invoice.insertMany(invoices);

  console.log(
    `✓ Seed hoàn tất: ${users.length} users, ${tables.length} bàn, ${menu.length} món, ${invoices.length} hóa đơn`
  );
}

// Cho phép chạy độc lập: npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await runSeed();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
