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
import { PageHeader, CardSkeleton } from '../components/ui';
import { formatVND, formatDateTime, PAYMENT_LABELS } from '../utils/format';
import { IconRevenue, IconCart, IconTable, IconWarn } from '../components/Icons';
import CountUp from '../components/CountUp';

const DASHBOARD_HERO =
  'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1400&q=80';

const PAYMENT_BADGE_STYLES = {
  tienmat: 'bg-[#F3F4F6] text-[#4B5563]',
  chuyenkhoan: 'bg-[#DBEAFE] text-[#1D4ED8]',
  vidientu: 'bg-[#F3E8FF] text-[#7E22CE]',
};

function DashboardHero() {
  return (
    <section className="relative mb-8 h-[220px] w-full overflow-hidden rounded-2xl bg-[#3B2314] shadow-[0_2px_16px_rgba(0,0,0,0.06)] max-[1200px]:flex max-[1200px]:h-auto max-[1200px]:flex-col">
      <div
        className="absolute inset-y-0 right-0 w-[40%] bg-cover bg-center max-[1200px]:relative max-[1200px]:inset-auto max-[1200px]:order-1 max-[1200px]:h-[200px] max-[1200px]:w-full"
        style={{ backgroundImage: `url('${DASHBOARD_HERO}')` }}
        aria-label="Bloom Coffee"
        role="img"
      />
      <div className="relative z-10 flex h-full w-[64%] items-center bg-[#3B2314] px-10 [clip-path:polygon(0_0,100%_0,86%_100%,0_100%)] max-[1200px]:order-2 max-[1200px]:h-auto max-[1200px]:w-full max-[1200px]:px-8 max-[1200px]:py-8 max-[1200px]:[clip-path:none]">
        <div className="pointer-events-none absolute -right-8 inset-y-0 w-24 skew-x-[-10deg] bg-gradient-to-r from-[#3B2314] to-transparent max-[1200px]:hidden" />
        <div className="relative z-10 max-w-xl">
          <p className="mb-2 text-base font-semibold text-[#E9D7BC]">Chào mừng trở lại 👋</p>
          <h1 className="text-[44px] font-extrabold leading-tight tracking-normal text-white">
            Bloom Coffee
          </h1>
          <p className="mt-2 text-base font-medium text-white/72">
            Quản lý thông minh — Phục vụ tận tâm
          </p>
        </div>
      </div>
    </section>
  );
}

function TrendIndicator({ trend }) {
  if (typeof trend !== 'number' || trend === 0) {
    return <p className="mt-5 text-sm font-semibold text-[#9CA3AF]">—</p>;
  }

  const isPositive = trend > 0;
  return (
    <p className={`mt-5 text-sm font-semibold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
      <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span> {Math.abs(trend)}% so với hôm qua
    </p>
  );
}

function KpiCard({ icon, iconColor, label, value, trend }) {
  return (
    <div className="stat-card rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: iconColor }}
        >
          {icon}
        </div>
        <p className="text-sm font-semibold text-[#6B7280]">{label}</p>
      </div>
      <p className="mt-5 text-[28px] font-extrabold leading-tight text-[#1A1A1A]">{value}</p>
      <TrendIndicator trend={trend} />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      <h3 className="mb-4 text-base font-bold text-[#1A1A1A]">{title}</h3>
      {children}
    </div>
  );
}

function PaymentBadge({ method }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
        PAYMENT_BADGE_STYLES[method] || PAYMENT_BADGE_STYLES.tienmat
      }`}
    >
      {PAYMENT_LABELS[method]}
    </span>
  );
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-brdr bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="font-semibold text-primary">{formatVND(payload[0].value)}</p>
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
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1025px]:grid-cols-4">
        <KpiCard
          icon={<IconRevenue width={22} height={22} />}
          iconColor="#C89B3C"
          label="Doanh thu hôm nay"
          value={<CountUp value={k.revenueToday} format={formatVND} />}
          trend={k.revenueTrend}
        />
        <KpiCard
          icon={<IconCart width={22} height={22} />}
          iconColor="#3B82F6"
          label="Đơn hàng hôm nay"
          value={<CountUp value={k.ordersToday} />}
          trend={k.ordersTrend}
        />
        <KpiCard
          icon={<IconTable width={22} height={22} />}
          iconColor="#10B981"
          label="Bàn đang phục vụ"
          value={`${k.servingTables}/${k.totalTables}`}
        />
        <KpiCard
          icon={<IconWarn width={22} height={22} />}
          iconColor="#EF4444"
          label="Cảnh báo kho"
          value={`${k.lowStockItems} mặt hàng`}
        />
      </div>

      {/* Row 2 — charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <ChartCard title="Doanh thu 30 ngày qua">
          <ResponsiveContainer width="100%" height={320}>
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
        </ChartCard>

        <ChartCard title="Top 5 món bán chạy">
          <ResponsiveContainer width="100%" height={320}>
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
        </ChartCard>
      </div>

      {/* Row 3 — recent invoices */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <h3 className="px-6 py-4 text-base font-bold text-[#1A1A1A]">Hóa đơn gần nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#3B2314] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.05em]">Mã HĐ</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.05em]">Bàn</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.05em]">Nhân viên</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-[0.05em]">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.05em]">
                  Hình thức TT
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.05em]">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices.map((inv, idx) => (
                <tr
                  key={inv._id}
                  className={`${idx % 2 ? 'bg-[#FAF6F1]' : 'bg-white'} transition-colors hover:bg-[#F3E8D8]`}
                >
                  <td className="px-6 py-3 font-medium">{inv.code}</td>
                  <td className="px-6 py-3">{inv.tableName}</td>
                  <td className="px-6 py-3">{inv.staffName}</td>
                  <td className="px-6 py-3 text-right font-semibold">{formatVND(inv.total)}</td>
                  <td className="px-6 py-3">
                    <PaymentBadge method={inv.paymentMethod} />
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
