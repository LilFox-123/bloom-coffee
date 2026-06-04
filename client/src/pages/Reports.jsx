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
import { PageHeader, Spinner } from '../components/ui';
import { IconPrint } from '../components/Icons';
import { formatVND } from '../utils/format';

const TABS = [
  { key: 'revenue', label: 'Doanh thu' },
  { key: 'top', label: 'Món bán chạy' },
  { key: 'inventory', label: 'Kho' },
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
    <div className="flex flex-wrap items-end gap-2 mb-6">
      <div className="flex flex-wrap gap-1 bg-white border border-brdr rounded-lg p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              period === p.key ? 'bg-accent-green text-white' : 'text-text-muted hover:bg-muted'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <>
          <input type="date" className="input !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input !w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        </>
      )}
    </div>
  );
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
      const [rev, tp, inv] = await Promise.all([
        api.get('/reports/revenue', { params }),
        api.get('/reports/top-items', { params }),
        api.get('/reports/inventory'),
      ]);
      setRevenue(rev.data.data);
      setTop(tp.data.data);
      setInventory(inv.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, from, to, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div id="print-area">
      <PageHeader
        title="Thống kê & Báo cáo"
        actions={
          <button className="btn-primary no-print" onClick={() => window.print()}>
            <IconPrint width={18} height={18} /> Xuất báo cáo
          </button>
        }
      />

      <div className="hidden print:block mb-4">
        <p className="font-bold text-xl">Bloom Coffee — Báo cáo thống kê</p>
        <p className="text-sm text-text-muted">Xuất ngày {new Date().toLocaleString('vi-VN')}</p>
      </div>

      <div className="flex gap-1 bg-white border border-brdr rounded-lg p-1 w-max mb-6 no-print">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === t.key ? 'bg-primary text-white' : 'text-text-muted hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card !py-4">
                  <p className="text-text-muted text-sm">Tổng doanh thu</p>
                  <p className="text-xl font-bold text-accent-green-dark mt-1">{formatVND(revenue.kpis.totalRevenue)}</p>
                </div>
                <div className="card !py-4">
                  <p className="text-text-muted text-sm">Tổng đơn hàng</p>
                  <p className="text-xl font-bold mt-1">{revenue.kpis.totalOrders}</p>
                </div>
                <div className="card !py-4">
                  <p className="text-text-muted text-sm">Trung bình/đơn</p>
                  <p className="text-xl font-bold mt-1">{formatVND(revenue.kpis.avgOrder)}</p>
                </div>
                <div className="card !py-4">
                  <p className="text-text-muted text-sm">Cao nhất/ngày</p>
                  <p className="text-xl font-bold mt-1">{formatVND(revenue.kpis.maxDay)}</p>
                </div>
              </div>
              <div className="card mb-6">
                <h3 className="font-semibold mb-4">Doanh thu theo ngày</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8D8" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9C8472' }} interval="preserveStartEnd" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9C8472' }} width={48} />
                    <Tooltip formatter={(v) => formatVND(v)} cursor={{ fill: '#FEF6EC' }} />
                    <Bar dataKey="value" name="Doanh thu" fill="#C8922A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-4">Xu hướng số đơn</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenue.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8D8" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9C8472' }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9C8472' }} width={32} />
                    <Tooltip cursor={{ stroke: '#22C55E' }} />
                    <Line type="monotone" dataKey="orders" name="Số đơn" stroke="#C8922A" strokeWidth={2} dot={{ r: 3, fill: '#fff', stroke: '#C8922A' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {tab === 'top' && top && (
            <section>
              <PeriodSelector {...{ period, setPeriod, from, to, setFrom, setTo }} />
              <div className="card mb-6">
                <h3 className="font-semibold mb-4">Top 10 món bán chạy</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart layout="vertical" data={top.items} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3E8D8" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9C8472' }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#1A0F00' }} />
                    <Tooltip cursor={{ fill: '#FEF6EC' }} formatter={(v) => [`${v}`, 'Số lượng']} />
                    <Bar dataKey="quantity" name="Số lượng" fill="#C8922A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-text-muted">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Hạng</th>
                        <th className="text-left font-medium px-4 py-3">Tên món</th>
                        <th className="text-right font-medium px-4 py-3">Số lượng bán</th>
                        <th className="text-right font-medium px-4 py-3">Doanh thu</th>
                        <th className="text-left font-medium px-4 py-3 w-1/4">% tổng doanh thu</th>
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
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-accent-green" style={{ width: `${it.percent}%` }} />
                              </div>
                              <span className="text-xs text-text-muted w-9 text-right">{it.percent}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {tab === 'inventory' && inventory && (
            <section>
              <div className="card mb-6">
                <h3 className="font-semibold mb-4">Nhập / xuất theo nguyên liệu (tháng này)</h3>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={inventory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3E8D8" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9C8472' }} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 11, fill: '#9C8472' }} width={36} />
                    <Tooltip cursor={{ fill: '#FEF6EC' }} />
                    <Legend />
                    <Bar dataKey="imported" stackId="a" name="Nhập" fill="#C8922A" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="exported" stackId="a" name="Xuất" fill="#E65100" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-text-muted">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Nguyên liệu</th>
                        <th className="text-left font-medium px-4 py-3">Đơn vị</th>
                        <th className="text-right font-medium px-4 py-3">Tồn hiện tại</th>
                        <th className="text-right font-medium px-4 py-3">Nhập trong tháng</th>
                        <th className="text-right font-medium px-4 py-3">Xuất trong tháng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((r, i) => (
                        <tr key={i} className="border-b border-brdr hover:bg-muted">
                          <td className="px-4 py-3 font-medium">{r.name}</td>
                          <td className="px-4 py-3 text-text-muted">{r.unit}</td>
                          <td className="px-4 py-3 text-right font-semibold">{r.stock}</td>
                          <td className="px-4 py-3 text-right text-accent-green-dark">+{r.imported}</td>
                          <td className="px-4 py-3 text-right text-warning">−{r.exported}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
