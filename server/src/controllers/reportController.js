import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import InventoryItem from '../models/InventoryItem.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import asyncHandler from '../utils/asyncHandler.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfVietnamDay(base = new Date()) {
  const vnDate = new Date(base.getTime() + VN_OFFSET_MS);
  return new Date(Date.UTC(vnDate.getUTCFullYear(), vnDate.getUTCMonth(), vnDate.getUTCDate()) - VN_OFFSET_MS);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysAgo(n) {
  return addDays(startOfVietnamDay(), -n);
}

function parseVietnamDate(value, endOfDay = false) {
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  const start = new Date(Date.UTC(year, month - 1, day) - VN_OFFSET_MS);
  return endOfDay ? new Date(start.getTime() + DAY_MS - 1) : start;
}

function fmtDateKey(d) {
  const vnDate = new Date(d.getTime() + VN_OFFSET_MS);
  return `${String(vnDate.getUTCDate()).padStart(2, '0')}/${String(vnDate.getUTCMonth() + 1).padStart(2, '0')}`;
}

function invoiceAmount(invoice) {
  return invoice.subtotal ?? invoice.total;
}

function withoutVat(invoice) {
  const data = invoice.toObject ? invoice.toObject() : invoice;
  return {
    ...data,
    vat: 0,
    total: data.subtotal ?? data.total,
  };
}

// Tạo dải ngày liên tục để biểu đồ không bị khuyết
function buildDateRange(days) {
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    arr.push({ key: fmtDateKey(d), date: new Date(d), value: 0, orders: 0 });
  }
  return arr;
}

export const dashboard = asyncHandler(async (req, res) => {
  const today = startOfVietnamDay();
  const yStart = daysAgo(1);

  const [todayInvoices, yesterdayInvoices, tables, lowStock, recent] = await Promise.all([
    Invoice.find({ createdAt: { $gte: today } }),
    Invoice.find({ createdAt: { $gte: yStart, $lt: today } }),
    Table.find(),
    InventoryItem.find(),
    Invoice.find().sort({ createdAt: -1 }).limit(8),
  ]);

  const revenueToday = todayInvoices.reduce((s, i) => s + invoiceAmount(i), 0);
  const revenueYesterday = yesterdayInvoices.reduce((s, i) => s + invoiceAmount(i), 0);
  const ordersToday = todayInvoices.length;
  const ordersYesterday = yesterdayInvoices.length;
  const servingTables = tables.filter((t) => t.status !== 'trong').length;
  const lowStockItems = lowStock.filter((i) => i.quantity <= i.minThreshold).length;

  const pct = (cur, prev) => {
    if (!prev) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  // Doanh thu 30 ngày
  const range = buildDateRange(30);
  const since = range[0].date;
  const allInvoices = await Invoice.find({ createdAt: { $gte: since } });
  const map = new Map(range.map((r) => [r.key, r]));
  for (const inv of allInvoices) {
    const key = fmtDateKey(new Date(inv.createdAt));
    if (map.has(key)) map.get(key).value += invoiceAmount(inv);
  }
  const revenue30 = range.map((r) => ({ date: r.key, value: r.value }));

  // Top 5 món bán chạy
  const topAgg = await Invoice.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 5 },
  ]);
  const topItems = topAgg.map((t) => ({ name: t._id, quantity: t.quantity, revenue: t.revenue }));

  res.json({
    success: true,
    data: {
      kpis: {
        revenueToday,
        revenueTrend: pct(revenueToday, revenueYesterday),
        ordersToday,
        ordersTrend: pct(ordersToday, ordersYesterday),
        servingTables,
        totalTables: tables.length,
        lowStockItems,
      },
      revenue30,
      topItems,
      recentInvoices: recent.map(withoutVat),
    },
  });
});

// Báo cáo doanh thu theo khoảng
function resolvePeriod(period, from, to) {
  const today = startOfVietnamDay();
  switch (period) {
    case 'today':
      return { start: today, days: 1 };
    case '7':
      return { start: daysAgo(6), days: 7 };
    case 'month': {
      const vnDate = new Date(Date.now() + VN_OFFSET_MS);
      const start = new Date(Date.UTC(vnDate.getUTCFullYear(), vnDate.getUTCMonth(), 1) - VN_OFFSET_MS);
      const days = Math.ceil((today - start) / 86400000) + 1;
      return { start, days };
    }
    case 'custom':
      if (from) {
        const start = parseVietnamDate(from);
        const end = to ? parseVietnamDate(to, true) : new Date();
        const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
        return { start, days, end };
      }
      return { start: daysAgo(29), days: 30 };
    case '30':
    default:
      return { start: daysAgo(29), days: 30 };
  }
}

export const revenueReport = asyncHandler(async (req, res) => {
  const { period = '30', from, to } = req.query;
  const { start, days, end } = resolvePeriod(period, from, to);
  const filter = { createdAt: { $gte: start } };
  if (end) filter.createdAt.$lte = end;
  const invoices = await Invoice.find(filter);

  const range = buildDateRange(Math.min(days, 90));
  // rebuild range from start
  range.length = 0;
  for (let i = 0; i < Math.min(days, 90); i++) {
    const d = addDays(start, i);
    range.push({ key: fmtDateKey(d), value: 0, orders: 0 });
  }
  const map = new Map(range.map((r) => [r.key, r]));
  for (const inv of invoices) {
    const key = fmtDateKey(new Date(inv.createdAt));
    if (map.has(key)) {
      map.get(key).value += invoiceAmount(inv);
      map.get(key).orders += 1;
    }
  }
  const series = range.map((r) => ({ date: r.key, value: r.value, orders: r.orders }));

  const totalRevenue = invoices.reduce((s, i) => s + invoiceAmount(i), 0);
  const totalOrders = invoices.length;
  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const maxDay = series.reduce((m, r) => Math.max(m, r.value), 0);

  res.json({
    success: true,
    data: { series, kpis: { totalRevenue, totalOrders, avgOrder, maxDay } },
  });
});

export const topItemsReport = asyncHandler(async (req, res) => {
  const { period = '30', from, to } = req.query;
  const { start, end } = resolvePeriod(period, from, to);
  const match = { createdAt: { $gte: start } };
  if (end) match.createdAt.$lte = end;

  const agg = await Invoice.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
  ]);

  const totalRevenue = agg.reduce((s, a) => s + a.revenue, 0);
  const items = agg.map((a, idx) => ({
    rank: idx + 1,
    name: a._id,
    quantity: a.quantity,
    revenue: a.revenue,
    percent: totalRevenue ? Math.round((a.revenue / totalRevenue) * 100) : 0,
  }));
  res.json({ success: true, data: { items, totalRevenue } });
});

export const inventoryReport = asyncHandler(async (req, res) => {
  const vnDate = new Date(Date.now() + VN_OFFSET_MS);
  const monthStart = new Date(Date.UTC(vnDate.getUTCFullYear(), vnDate.getUTCMonth(), 1) - VN_OFFSET_MS);
  const [items, txns] = await Promise.all([
    InventoryItem.find().sort({ name: 1 }),
    InventoryTransaction.find({ date: { $gte: monthStart } }),
  ]);

  const byItem = new Map();
  for (const it of items) {
    byItem.set(String(it._id), {
      name: it.name,
      unit: it.unit,
      stock: it.quantity,
      minThreshold: it.minThreshold,
      imported: 0,
      exported: 0,
    });
  }
  for (const t of txns) {
    const row = byItem.get(String(t.itemId));
    if (!row) continue;
    if (t.type === 'nhap') row.imported += t.quantity;
    else row.exported += t.quantity;
  }
  const data = [...byItem.values()];
  res.json({ success: true, data });
});
