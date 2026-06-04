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

const DASHBOARD_SLIDES = [
  {
    title: 'Bloom Coffee',
    subtitle: 'Quản lý thông minh — Phục vụ tận tâm',
    eyebrow: 'Chào mừng trở lại',
    metric: 'Không gian quán hôm nay',
    bg: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=1800&q=85',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85',
    accent:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=520&q=80',
  },
  {
    title: 'Giờ vàng bán hàng',
    subtitle: 'Theo dõi doanh thu, đơn mới và món bán chạy trong một màn hình',
    eyebrow: 'Vận hành mượt hơn',
    metric: 'Sẵn sàng phục vụ',
    bg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85',
    image:
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1000&q=85',
    accent:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=520&q=80',
  },
  {
    title: 'Bếp và quầy luôn rõ nhịp',
    subtitle: 'Nhìn nhanh tình trạng bàn, tồn kho và hóa đơn mới nhất',
    eyebrow: 'Dashboard trực quan',
    metric: 'Tập trung vào trải nghiệm',
    bg: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1800&q=85',
    image:
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1000&q=85',
    accent:
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=520&q=80',
  },
];

const DASHBOARD_ANIMATION_CSS = `
  @keyframes dashboard-float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(1.015); }
  }

  @keyframes dashboard-rise {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dashboard-hero-float {
    animation: dashboard-float 6s ease-in-out infinite;
  }

  .dashboard-rise {
    animation: dashboard-rise 680ms ease both;
  }
`;

const PAYMENT_BADGE_STYLES = {
  tienmat: 'bg-[#F3F4F6] text-[#4B5563]',
  chuyenkhoan: 'bg-[#DBEAFE] text-[#1D4ED8]',
  vidientu: 'bg-[#F3E8FF] text-[#7E22CE]',
};

function DashboardHero() {
  const [active, setActive] = useState(0);
  const slide = DASHBOARD_SLIDES[active];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((idx) => (idx + 1) % DASHBOARD_SLIDES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative mb-8 min-h-[380px] w-full overflow-hidden rounded-[28px] bg-[#3B2314] shadow-[0_20px_46px_rgba(59,35,20,0.22)] max-[900px]:min-h-[640px]">
      {DASHBOARD_SLIDES.map((item, idx) => (
        <div
          key={item.title}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            active === idx ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `linear-gradient(100deg, rgba(35,18,9,0.92) 0%, rgba(59,35,20,0.72) 37%, rgba(59,35,20,0.18) 74%, rgba(20,10,5,0.18) 100%), url('${item.bg}')`,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.24),transparent_26%),linear-gradient(180deg,transparent,rgba(0,0,0,0.24))]" />

      <div className="relative z-10 grid min-h-[380px] grid-cols-[0.78fr_1.22fr] items-center gap-8 px-9 py-8 max-[1100px]:grid-cols-[0.9fr_1.1fr] max-[900px]:min-h-[640px] max-[900px]:grid-cols-1 max-[900px]:content-start max-[900px]:gap-5 max-[900px]:px-5">
        <div className="dashboard-rise max-w-xl self-center max-[900px]:order-2">
          <span className="inline-flex rounded-full bg-white/14 px-4 py-2 text-sm font-bold text-[#F8E8C2] ring-1 ring-white/20 backdrop-blur">
            {slide.eyebrow}
          </span>
          <h1 className="mt-4 text-[56px] font-black leading-[0.95] tracking-normal text-white drop-shadow-sm max-[1100px]:text-[46px] max-[640px]:text-[38px]">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-[520px] text-lg font-semibold leading-relaxed text-white/82 max-[640px]:text-base">
            {slide.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-[#C89B3C] px-4 py-3 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(200,155,60,0.32)]">
              {slide.metric}
            </span>
            <span className="rounded-2xl bg-white/12 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/16 backdrop-blur">
              Cập nhật theo thời gian thực
            </span>
          </div>
        </div>

        <div className="relative min-h-[310px] max-[900px]:order-1 max-[900px]:min-h-[320px]">
          <div className="absolute right-0 top-1/2 h-[330px] w-[78%] -translate-y-1/2 overflow-hidden rounded-[34px] border border-white/22 bg-white/10 shadow-[0_26px_70px_rgba(0,0,0,0.42)] max-[1100px]:w-[86%] max-[900px]:left-1/2 max-[900px]:right-auto max-[900px]:w-[82%] max-[900px]:-translate-x-1/2 max-[640px]:h-[280px] max-[640px]:w-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="dashboard-hero-float h-full w-full object-cover"
            />
          </div>

          <div className="absolute left-2 top-6 h-28 w-36 overflow-hidden rounded-3xl border border-white/24 bg-white/15 p-1 shadow-[0_18px_36px_rgba(0,0,0,0.28)] backdrop-blur max-[640px]:left-0 max-[640px]:top-2 max-[640px]:h-24 max-[640px]:w-28">
            <img src={slide.accent} alt="" className="h-full w-full rounded-[20px] object-cover" />
          </div>

          <div className="absolute bottom-4 left-8 rounded-3xl bg-white/90 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur max-[640px]:left-2">
            <div className="flex -space-x-3">
              {DASHBOARD_SLIDES.map((item) => (
                <img
                  key={item.accent}
                  src={item.accent}
                  alt=""
                  className="h-12 w-12 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-extrabold text-[#3B2314]">Nhiều góc nhìn vận hành</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {DASHBOARD_SLIDES.map((item, idx) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(idx)}
            className={`h-2.5 rounded-full transition-all ${
              active === idx ? 'w-8 bg-[#C89B3C]' : 'w-2.5 bg-white/60 hover:bg-white'
            }`}
            aria-label={`Chọn hero slide ${idx + 1}`}
          />
        ))}
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
    <div className="dashboard-rise stat-card rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(59,35,20,0.12)]">
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
    <div className="dashboard-rise rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_18px_36px_rgba(59,35,20,0.10)]">
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
      <style>{DASHBOARD_ANIMATION_CSS}</style>
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
