import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { EmptyState, Spinner } from '../components/ui';
import { IconPrint, IconRevenue, IconCart, IconWarn, IconBox } from '../components/Icons';
import { formatVND } from '../utils/format';

const TABS = [
  { key: 'revenue', label: 'Doanh thu', icon: IconRevenue },
  { key: 'top', label: 'Món bán chạy', icon: IconCart },
  { key: 'inventory', label: 'Kho', icon: IconBox },
];
const PERIODS = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'custom', label: 'Tùy chọn' },
];

function PeriodSelector({ period, setPeriod, from, to, setFrom, setTo }) {
  return (
    <div className="mb-6 rounded-[24px] border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)] no-print">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`min-h-[44px] shrink-0 rounded-2xl px-4 text-sm font-black transition-all ${
                period === p.key
                  ? 'bg-[#C89B3C] text-white shadow-[0_10px_22px_rgba(200,155,60,0.24)]'
                  : 'border border-[#E1CDB9] bg-white text-[#6B4B37] hover:border-[#C89B3C]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <>
            <input type="date" className="input !w-auto !rounded-2xl" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="input !w-auto !rounded-2xl" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, helper, icon: Icon, tone = 'gold' }) {
  const tones = {
    gold: 'bg-[#FFF3D8] text-[#A56D13]',
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    blue: 'bg-[#E3F2FD] text-[#1565C0]',
    red: 'bg-[#FFEBEE] text-[#C62828]',
  };
  return (
    <div className="rounded-2xl border border-[#E8D5BC] bg-white p-5 shadow-[0_10px_26px_rgba(59,35,20,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#8A6F5D]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#1A0F00]">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon width={20} height={20} />
        </span>
      </div>
      {helper && <p className="mt-3 text-xs font-bold text-[#9C8472]">{helper}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-[24px] border border-[#E8D5BC] bg-white p-5 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
      <h3 className="mb-4 text-base font-black text-[#1A0F00]">{title}</h3>
      {children}
    </div>
  );
}

function truncateName(name = '') {
  return name.length > 20 ? `${name.slice(0, 20)}...` : name;
}

function ChartEmptyState({ title }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF6EC] text-[#C8922A]">
        <IconCart width={32} height={32} />
      </div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
    </div>
  );
}

function InventoryStatusBadge({ stock, threshold }) {
  if (threshold === undefined || threshold === null) {
    return <span className="badge bg-[#F5F0EB] text-[#9C8472]">Đang theo dõi</span>;
  }
  if (Number(stock) <= Number(threshold)) {
    return <span className="badge bg-[#FFEBEE] text-[#C62828]">Cần nhập</span>;
  }
  return <span className="badge bg-[#E8F5E9] text-[#2E7D32]">Ổn định</span>;
}

export default function Reports() {
  const toast = useToast();
  const [tab, setTab] = useState('revenue');
  const [period, setPeriod] = useState('30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  const [revenue, setRevenue] = useState(null);
  const [top, setTop] = useState(null);
  const [inventory, setInventory] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { period, from, to };
      if (tab === 'revenue') {
        const res = await api.get('/reports/revenue', { params });
        setRevenue(res.data.data);
      }
      if (tab === 'top') {
        const res = await api.get('/reports/top-items', { params });
        setTop(res.data.data);
      }
      if (tab === 'inventory') {
        const res = await api.get('/reports/inventory');
        setInventory(res.data.data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, from, to, tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div id="print-area">
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] p-6 text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)] no-print">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
              Business intelligence
            </span>
            <h1 className="mt-4 text-4xl font-black xl:text-5xl">Thống kê & Báo cáo</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/75">
              Xem doanh thu, món bán chạy và biến động kho để ra quyết định nhanh hơn.
            </p>
          </div>
          <button className="btn-primary no-print" onClick={() => window.print()}>
            <IconPrint width={18} height={18} /> Xuất báo cáo
          </button>
        </div>
      </section>

      <div className="hidden print:block mb-4">
        <p className="font-bold text-xl">Bloom Coffee — Báo cáo thống kê</p>
        <p className="text-sm text-text-muted">Xuất ngày {new Date().toLocaleString('vi-VN')}</p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3 no-print">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex min-h-[72px] items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                tab === t.key
                  ? 'border-[#C89B3C] bg-[#C89B3C] text-white shadow-[0_12px_28px_rgba(200,155,60,0.24)]'
                  : 'border-[#E8D5BC] bg-white text-[#3B2314] hover:-translate-y-0.5 hover:border-[#C89B3C]'
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tab === t.key ? 'bg-white/18' : 'bg-[#FAF6F1]'}`}>
                <Icon width={20} height={20} />
              </span>
              <span className="text-base font-black">{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-10 h-10" />
        </div>
      ) : (
        <>
          {tab === 'revenue' && revenue && (
            <section>
              <PeriodSelector {...{ period, setPeriod, from, to, setFrom, setTo }} />
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <KpiCard icon={IconRevenue} label="Tổng doanh thu" value={formatVND(revenue.kpis.totalRevenue)} helper="Theo kỳ đang chọn" tone="gold" />
                <KpiCard icon={IconCart} label="Tổng đơn hàng" value={revenue.kpis.totalOrders} helper="Số hóa đơn phát sinh" tone="blue" />
                <KpiCard icon={IconRevenue} label="Trung bình/đơn" value={formatVND(revenue.kpis.avgOrder)} helper="Giá trị trung bình" tone="green" />
                <KpiCard icon={IconWarn} label="Cao nhất/ngày" value={formatVND(revenue.kpis.maxDay)} helper="Ngày có doanh thu tốt nhất" tone="red" />
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <ChartCard title="Doanh thu theo ngày">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={revenue.series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8D8" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9C8472' }} interval="preserveStartEnd" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9C8472' }} width={48} />
                      <Tooltip formatter={(v) => formatVND(v)} cursor={{ fill: '#FEF6EC' }} />
                      <Bar dataKey="value" name="Doanh thu" fill="#C8922A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Xu hướng số đơn">
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={revenue.series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8D8" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9C8472' }} interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9C8472' }} width={32} />
                      <Tooltip cursor={{ stroke: '#C8922A' }} />
                      <Line type="monotone" dataKey="orders" name="Số đơn" stroke="#C8922A" strokeWidth={3} dot={{ r: 3, fill: '#fff', stroke: '#C8922A' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </section>
          )}

          {tab === 'top' && top && (
            <section>
              <PeriodSelector {...{ period, setPeriod, from, to, setFrom, setTo }} />
              {top.items.length === 0 ? (
                <ChartEmptyState title="Chưa có dữ liệu bán hàng trong kỳ này" />
              ) : (
                <>
                  <ChartCard title="Top 10 món bán chạy">
                    <ResponsiveContainer width="100%" height={390}>
                      <BarChart
                        layout="vertical"
                        data={top.items.map((item) => ({ ...item, displayName: truncateName(item.name) }))}
                        margin={{ left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3E8D8" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9C8472' }} />
                        <YAxis type="category" dataKey="displayName" width={140} tick={{ fontSize: 11, fill: '#1A0F00' }} />
                        <Tooltip cursor={{ fill: '#FEF6EC' }} formatter={(v) => [`${v}`, 'Số lượng bán']} />
                        <Bar dataKey="quantity" name="Số lượng bán" fill="#C8922A" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <div className="card !p-0 mt-6 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Hạng</th>
                            <th className="px-4 py-3 text-left font-medium">Tên món</th>
                            <th className="px-4 py-3 text-right font-medium">Số lượng bán</th>
                            <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
                            <th className="px-4 py-3 text-left font-medium w-1/4">% tổng doanh thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top.items.map((it) => (
                            <tr key={it.rank} className="border-b border-brdr hover:bg-muted">
                              <td className="px-4 py-3 font-bold">#{it.rank}</td>
                              <td className="px-4 py-3 font-medium">{it.name}</td>
                              <td className="px-4 py-3 text-right">{it.quantity}</td>
                              <td className="px-4 py-3 text-right font-semibold">{formatVND(it.revenue)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full bg-accent-green" style={{ width: `${it.percent}%` }} />
                                  </div>
                                  <span className="w-9 text-right text-xs text-text-muted">{it.percent}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {tab === 'inventory' && inventory && (
            <section>
              {inventory.length === 0 ? (
                <EmptyState title="Chưa có dữ liệu kho" message="Thêm nguyên liệu hoặc tạo phiếu nhập/xuất để xem báo cáo kho." />
              ) : (
                <div className="card !p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Nguyên liệu</th>
                          <th className="px-4 py-3 text-right font-medium">Tồn kho</th>
                          <th className="px-4 py-3 text-right font-medium">Ngưỡng</th>
                          <th className="px-4 py-3 text-right font-medium">Nhập tháng này</th>
                          <th className="px-4 py-3 text-right font-medium">Xuất tháng này</th>
                          <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((row, i) => {
                          const threshold = row.minThreshold ?? row.threshold;
                          return (
                            <tr key={row._id || row.name || i} className="border-b border-brdr hover:bg-muted">
                              <td className="px-4 py-3 font-medium">
                                {row.name}
                                {row.unit && <span className="ml-1 text-xs text-text-muted">({row.unit})</span>}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">{row.stock ?? row.quantity ?? '—'}</td>
                              <td className="px-4 py-3 text-right">{threshold ?? '—'}</td>
                              <td className="px-4 py-3 text-right text-accent-green-dark">
                                {row.imported ?? row.importedThisMonth ?? '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-warning">
                                {row.exported ?? row.exportedThisMonth ?? '—'}
                              </td>
                              <td className="px-4 py-3">
                                <InventoryStatusBadge stock={row.stock ?? row.quantity} threshold={threshold} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
