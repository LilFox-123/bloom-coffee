import { useEffect, useState, Fragment } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader, Badge, EmptyState, TableSkeleton } from '../components/ui';
import { IconSearch, IconPlus } from '../components/Icons';
import Modal from '../components/Modal';
import { formatVND, formatDate, formatDateTime } from '../utils/format';

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});

  const load = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const stats = {
    total: customers.length,
    points: customers.reduce((s, c) => s + c.points, 0),
    eligible: customers.filter((c) => c.points > 500).length,
  };

  const toggleExpand = async (c) => {
    if (expanded === c._id) {
      setExpanded(null);
      return;
    }
    setExpanded(c._id);
    if (!history[c._id]) {
      try {
        const res = await api.get(`/customers/${c._id}/history`);
        setHistory((h) => ({ ...h, [c._id]: res.data.data }));
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.post('/customers', form);
      toast.success('Đã thêm khách hàng');
      setModal(false);
      setForm({ name: '', phone: '', email: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendPromo = async (c) => {
    try {
      const res = await api.post(`/customers/${c._id}/promo`);
      toast.success(res.data.data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Khách hàng thân thiết"
        actions={
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus width={18} height={18} /> Thêm khách hàng
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card !py-4">
          <p className="text-text-muted text-sm">Tổng khách hàng</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="card !py-4">
          <p className="text-text-muted text-sm">Tổng điểm đã phát</p>
          <p className="text-2xl font-bold mt-1 text-accent-green-dark">{stats.points.toLocaleString('vi-VN')}</p>
        </div>
        <div className="card !py-4">
          <p className="text-text-muted text-sm">Đủ điều kiện KM (&gt;500 điểm)</p>
          <p className="text-2xl font-bold mt-1 text-warning">{stats.eligible}</p>
        </div>
      </div>

      <div className="relative max-w-xs mb-6">
        <IconSearch width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input className="input pl-9" placeholder="Tìm khách hàng..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Chưa có khách hàng" action={<button className="btn-primary" onClick={() => setModal(true)}>Thêm khách hàng</button>} />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-text-muted">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Tên</th>
                  <th className="text-left font-medium px-4 py-3">SĐT</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-center font-medium px-4 py-3">Điểm tích lũy</th>
                  <th className="text-right font-medium px-4 py-3">Tổng chi tiêu</th>
                  <th className="text-left font-medium px-4 py-3">Ngày tham gia</th>
                  <th className="text-right font-medium px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <Fragment key={c._id}>
                    <tr
                      className="border-b border-brdr hover:bg-muted cursor-pointer"
                      onClick={() => toggleExpand(c)}
                    >
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.phone}</td>
                      <td className="px-4 py-3 text-text-muted">{c.email || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge color="green">{c.points} điểm</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatVND(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(c.joinedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {c.points > 500 && (
                          <button
                            className="text-xs font-medium text-accent-green-dark hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendPromo(c);
                            }}
                          >
                            Gửi khuyến mãi
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === c._id && (
                      <tr className="bg-muted/60">
                        <td colSpan={7} className="px-6 py-4">
                          <p className="font-medium text-sm mb-2">3 giao dịch gần nhất</p>
                          {!history[c._id] ? (
                            <p className="text-text-muted text-sm">Đang tải...</p>
                          ) : history[c._id].length === 0 ? (
                            <p className="text-text-muted text-sm">Chưa có giao dịch nào</p>
                          ) : (
                            <div className="space-y-2">
                              {history[c._id].map((inv) => (
                                <div key={inv._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-brdr text-sm">
                                  <span className="text-text-muted">{formatDateTime(inv.createdAt)}</span>
                                  <span>{inv.items.length} món</span>
                                  <span className="font-semibold">{formatVND(inv.total)}</span>
                                  <Badge color="green">+{Math.floor(inv.total / 10000)} điểm</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Thêm khách hàng">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label">Họ tên</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">SĐT</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
