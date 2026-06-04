import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, EmptyState } from '../components/ui';
import { IconSearch, IconPlus, IconQr } from '../components/Icons';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';
import QrCodeModal from '../components/QrCodeModal';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'trong', label: 'Trống' },
  { key: 'dangdung', label: 'Đang dùng' },
  { key: 'ghepban', label: 'Ghép bàn' },
];

export default function Tables() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', capacity: 4, zone: 'Trong nhà' });
  const [errors, setErrors] = useState({});
  const [qrTable, setQrTable] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const seat = async (id) => {
    try {
      await api.patch(`/tables/${id}/seat`, { guests: 2 });
      toast.success('Đã nhận khách');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên bàn';
    if (!form.capacity || form.capacity < 1) errs.capacity = 'Sức chứa phải lớn hơn 0';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.post('/tables', { ...form, capacity: Number(form.capacity) });
      toast.success('Đã thêm bàn mới');
      setModal(false);
      setForm({ name: '', capacity: 4, zone: 'Trong nhà' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = tables.filter((t) => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <PageHeader
        title="Sơ đồ bàn"
        subtitle="Cập nhật trạng thái phục vụ"
        actions={
          isAdmin && (
            <button className="btn-primary" onClick={() => setModal(true)}>
              <IconPlus width={18} height={18} /> Thêm bàn
            </button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <IconSearch
            width={18}
            height={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            className="input pl-9"
            placeholder="Tìm bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-white border border-brdr rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-accent-green text-white' : 'text-text-muted hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có bàn nào" message="Thử đổi bộ lọc hoặc thêm bàn mới." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((t) => (
            <TableCard key={t._id} table={t}>
              {t.status === 'trong' ? (
                <button className="btn-primary w-full !py-1.5" onClick={() => seat(t._id)}>
                  Nhận khách
                </button>
              ) : (
                <>
                  <button
                    className={`w-full rounded-lg py-1.5 font-medium text-white ${
                      t.status === 'ghepban' ? 'bg-warning hover:bg-yellow-600' : 'bg-danger hover:bg-red-600'
                    }`}
                    onClick={() => navigate(`/goi-mon/${t._id}`)}
                  >
                    Xem order
                  </button>
                  {t.status === 'dangdung' && (
                    <button
                      className="btn-secondary w-full !py-1.5"
                      onClick={() => navigate(`/goi-mon/${t._id}`)}
                    >
                      Thanh toán
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setQrTable(t)}
                title="Mã QR gọi món"
                aria-label="Mã QR gọi món"
                className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-primary hover:bg-muted transition-colors"
              >
                <IconQr width={16} height={16} /> QR Code
              </button>
            </TableCard>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Thêm bàn mới">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label">Tên bàn</label>
            <input
              className="input"
              placeholder="Bàn 11"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Sức chứa</label>
            <input
              type="number"
              min="1"
              className="input"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            {errors.capacity && <p className="text-danger text-xs mt-1">{errors.capacity}</p>}
          </div>
          <div>
            <label className="label">Khu vực</label>
            <select
              className="input"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
            >
              <option>Trong nhà</option>
              <option>Ngoài trời</option>
              <option>VIP</option>
            </select>
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

      <QrCodeModal open={!!qrTable} onClose={() => setQrTable(null)} table={qrTable} />
    </>
  );
}
