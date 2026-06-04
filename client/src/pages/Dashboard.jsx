import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader, CardSkeleton, Badge } from '../components/ui';
import { formatVND, formatDateTime, PAYMENT_LABELS } from '../utils/format';
import { IconRevenue, IconCart, IconTable, IconWarn } from '../components/Icons';
import CountUp from '../components/CountUp';

const DASHBOARD_HERO =
  'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1400&q=80';

function DashboardHero() {
  return (
    <div className="relative overflow-hidden rounded-[20px] mb-8 flex items-center justify-between gap-6 px-7 sm:px-12 py-9 sm:py-10 bg-gradient-to-br from-sidebar to-brown">
      <div className="relative z-10">
        <p className="text-primary-bright text-[13px] uppercase tracking-[0.1em] mb-2 animate-fade-up [animation-delay:0.1s] opacity-0">
          Chào mừng trở lại ☕
        </p>
        <h1
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 }}
          className="font-display italic text-3xl sm:text-[42px] text-page leading-tight mb-2 animate-fade-up [animation-delay:0.2s] opacity-0"
        >
          Bloom Coffee
        </h1>
        <p className="text-page/60 text-[15px] animate-fade-up [animation-delay:0.3s] opacity-0">
          Quản lý thông minh — Phục vụ tận tâm
        </p>
      </div>
      <img
        src={DASHBOARD_HERO}
        alt="Coffee"
        className="relative z-10 hidden sm:block w-[220px] h-[160px] object-cover rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] shrink-0 animate-fade-up [animation-delay:0.15s] opacity-0"
      />
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, trend }) {
  return (
    <div className="stat-card card !rounded-2xl transition-all hover:-translate-y-1 hover:shadow-hover hover:border-primary/40 duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      <p className="text-sm text-text-muted mt-4 mb-1 uppercase tracking-[0.05em]">{label}</p>
      <p className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% so với hôm qua
        </p>
      )}
    </div>
  );
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-brdr rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="text-primary font-semibold">{formatVND(payload[0].value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/reports/dashboard');
        setData(res.data.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (loading) {
    return (
      <>
        <PageHeader title="Tổng quan hôm nay" subtitle={today} />
        <CardSkeleton count={4} />
      </>
    );
  }

  const k = data.kpis;

  return (
    <>
      <DashboardHero />

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<IconRevenue className="text-primary" width={24} height={24} />}
          iconBg="bg-[rgba(200,146,42,0.12)]"
          label="Doanh thu hôm nay"
          value={<CountUp value={k.revenueToday} format={formatVND} />}
          trend={k.revenueTrend}
        />
        <KpiCard
          icon={<IconCart className="text-[#1565C0]" width={24} height={24} />}
          iconBg="bg-[#E3F2FD]"
          label="Đơn hàng hôm nay"
          value={<CountUp value={k.ordersToday} />}
          trend={k.ordersTrend}
        />
        <KpiCard
          icon={<IconTable className="text-success" width={24} height={24} />}
          iconBg="bg-[#E8F5E9]"
          label="Bàn đang phục vụ"
          value={`${k.servingTables}/${k.totalTables}`}
        />
        <KpiCard
          icon={<IconWarn className="text-danger" width={24} height={24} />}
          iconBg="bg-[#FFEBEE]"
          label="Cảnh báo kho"
          value={`${k.lowStockItems} mặt hàng`}
        />
      </div>

      {/* Row 2 — charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Doanh thu 30 ngày qua</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenue30} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8D8" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9C8472' }} interval={3} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9C8472' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip content={<CurrencyTooltip />} cursor={{ fill: '#FEF6EC' }} />
              <Bar dataKey="value" fill="#C8922A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Top 5 món bán chạy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={data.topItems}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3E8D8" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9C8472' }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#1A0F00' }}
                width={110}
              />
              <Tooltip cursor={{ fill: '#FEF6EC' }} formatter={(v) => [`${v} ly/phần`, 'Số lượng']} />
              <Bar dataKey="quantity" fill="#C8922A" radius={[0, 4, 4, 0]}>
                {data.topItems.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#A87520' : '#C8922A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 — recent invoices */}
      <div className="card !p-0 overflow-hidden">
        <h3 className="font-semibold text-text-primary px-6 py-4">Hóa đơn gần nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-text-muted">
              <tr>
                <th className="text-left font-medium px-6 py-3">Mã HĐ</th>
                <th className="text-left font-medium px-6 py-3">Bàn</th>
                <th className="text-left font-medium px-6 py-3">Nhân viên</th>
                <th className="text-right font-medium px-6 py-3">Tổng tiền</th>
                <th className="text-left font-medium px-6 py-3">Hình thức TT</th>
                <th className="text-left font-medium px-6 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((inv, idx) => (
                <tr
                  key={inv._id}
                  className={`border-b border-brdr hover:bg-muted ${idx % 2 ? 'bg-muted/40' : ''}`}
                >
                  <td className="px-6 py-3 font-medium">{inv.code}</td>
                  <td className="px-6 py-3">{inv.tableName}</td>
                  <td className="px-6 py-3">{inv.staffName}</td>
                  <td className="px-6 py-3 text-right font-semibold">{formatVND(inv.total)}</td>
                  <td className="px-6 py-3">
                    <Badge
                      color={
                        inv.paymentMethod === 'chuyenkhoan'
                          ? 'blue'
                          : inv.paymentMethod === 'vidientu'
                          ? 'purple'
                          : 'gray'
                      }
                    >
                      {PAYMENT_LABELS[inv.paymentMethod]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-text-muted">{formatDateTime(inv.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
