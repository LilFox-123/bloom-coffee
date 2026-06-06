import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/ui';
import { IconSearch, IconPlus, IconQr, IconCart, IconReceipt, IconTable, IconEdit, IconTrash } from '../components/Icons';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';
import QrCodeModal from '../components/QrCodeModal';
import ConfirmDialog from '../components/ConfirmDialog';

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'trong', label: 'Trống' },
  { key: 'dangdung', label: 'Đang dùng' },
  { key: 'ghepban', label: 'Ghép bàn' },
];

const ZONES = ['Tất cả khu vực', 'Trong nhà', 'Ngoài trời', 'VIP'];

function StatCard({ label, value, tone = 'gold', helper }) {
  const tones = {
    gold: 'bg-[#FFF3D8] text-[#A56D13]',
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    red: 'bg-[#FFEBEE] text-[#C62828]',
    brown: 'bg-[#F5E8DC] text-[#3B2314]',
  };

  return (
    <div className="rounded-2xl border border-[#E8D5BC] bg-white p-4 shadow-[0_10px_26px_rgba(59,35,20,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#8A6F5D]">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}>{helper}</span>
      </div>
      <p className="mt-3 text-3xl font-black text-[#1A0F00]">{value}</p>
    </div>
  );
}

function FlowGuide() {
  const steps = [
    { icon: IconTable, title: '1. Nhận khách', text: 'Chọn bàn trống và nhập số khách.' },
    { icon: IconCart, title: '2. Gọi món', text: 'Mở order của bàn để thêm món.' },
    { icon: IconReceipt, title: '3. Thanh toán', text: 'Tạo hóa đơn, bàn tự về trạng thái trống.' },
    { icon: IconTable, title: '4. Chuyển bàn', text: 'Chuyển order sang bàn trống khi khách đổi chỗ.' },
  ];

  return (
    <section className="mb-5 grid gap-3 xl:grid-cols-4">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div key={step.title} className="rounded-2xl border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_10px_26px_rgba(59,35,20,0.06)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#3B2314] text-[#F8E8C2]">
                <Icon width={20} height={20} />
              </span>
              <div>
                <p className="font-black text-[#1A0F00]">{step.title}</p>
                <p className="text-sm font-medium text-[#8A6F5D]">{step.text}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default function Tables() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [zone, setZone] = useState('Tất cả khu vực');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [seatModal, setSeatModal] = useState(null);
  const [guests, setGuests] = useState(2);
  const [form, setForm] = useState({ name: '', capacity: 4, zone: 'Trong nhà' });
  const [errors, setErrors] = useState({});
  const [qrTable, setQrTable] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [deleteTable, setDeleteTable] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [targetTableId, setTargetTableId] = useState('');
  const [transferring, setTransferring] = useState(false);

  const load = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      const res = await api.get('/tables');
      setTables(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: tables.length,
      free: tables.filter((t) => t.status === 'trong').length,
      serving: tables.filter((t) => t.status === 'dangdung' || t.status === 'ghepban').length,
      guests: tables.reduce((sum, t) => sum + Number(t.guests || 0), 0),
    }),
    [tables]
  );

  const filtered = useMemo(
    () =>
      tables.filter((t) => {
        const matchFilter = filter === 'all' || t.status === filter;
        const matchZone = zone === 'Tất cả khu vực' || t.zone === zone;
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchZone && matchSearch;
      }),
    [filter, search, tables, zone]
  );

  const transferTargets = useMemo(
    () => tables.filter((t) => t.status === 'trong' && t._id !== transferModal?._id),
    [tables, transferModal]
  );

  const openAdd = () => {
    setEditingTable(null);
    setForm({ name: '', capacity: 4, zone: 'Trong nhà' });
    setErrors({});
    setModal(true);
  };

  const openEdit = (table) => {
    setEditingTable(table);
    setForm({ name: table.name || '', capacity: table.capacity || 4, zone: table.zone || 'Trong nhà' });
    setErrors({});
    setModal(true);
  };

  const openSeat = (table) => {
    setSeatModal(table);
    setGuests(Math.max(1, Number(table.guests || 2)));
  };

  const openTransfer = (table) => {
    const firstTarget = tables.find((t) => t.status === 'trong' && t._id !== table._id);
    setTransferModal(table);
    setTargetTableId(firstTarget?._id || '');
  };

  const seat = async () => {
    if (!seatModal) return;
    try {
      await api.patch(`/tables/${seatModal._id}/seat`, { guests: Number(guests) || 1 });
      toast.success('Đã nhận khách');
      setSeatModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const transferOrder = async () => {
    if (!transferModal) return;
    if (!targetTableId) {
      toast.error('Vui lòng chọn bàn chuyển đến');
      return;
    }
    const target = tables.find((t) => t._id === targetTableId);
    try {
      setTransferring(true);
      await api.patch(`/tables/${transferModal._id}/transfer`, { targetTableId });
      toast.success(`Đã chuyển ${transferModal.name} sang ${target?.name || 'bàn mới'}`);
      setTransferModal(null);
      setTargetTableId('');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
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
      if (editingTable) {
        await api.patch(`/tables/${editingTable._id}`, { ...form, capacity: Number(form.capacity) });
        toast.success('Đã cập nhật bàn');
      } else {
        await api.post('/tables', { ...form, capacity: Number(form.capacity) });
        toast.success('Đã thêm bàn mới');
      }
      setModal(false);
      setEditingTable(null);
      setForm({ name: '', capacity: 4, zone: 'Trong nhà' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteSelectedTable = async (table) => {
    if (!table) return;
    try {
      await api.delete(`/tables/${table._id}`);
      toast.success('Đã xóa bàn');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)]">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(200,155,60,0.32),transparent_28%),linear-gradient(135deg,#3B2314_0%,#1F1008_70%,#C89B3C_145%)]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
                Sơ đồ phục vụ
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight xl:text-5xl">Quản lý bàn</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75">
                Theo dõi bàn trống, bàn đang phục vụ và chuyển nhanh sang gọi món hoặc thanh toán.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="min-h-[44px] rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15"
                onClick={() => load(true)}
              >
                {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
              </button>
              {isAdmin && (
                <button className="btn-primary" onClick={openAdd}>
                  <IconPlus width={18} height={18} /> Thêm bàn
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <FlowGuide />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng số bàn" value={stats.total} helper="Tất cả" tone="brown" />
        <StatCard label="Bàn trống" value={stats.free} helper="Sẵn sàng" tone="green" />
        <StatCard label="Đang phục vụ" value={stats.serving} helper="Cần theo dõi" tone="red" />
        <StatCard label="Khách hiện tại" value={stats.guests} helper="Trong quán" tone="gold" />
      </div>

      <section className="mb-6 rounded-[24px] border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,420px)_1fr_220px]">
          <div className="relative">
            <IconSearch width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8472]" />
            <input
              className="min-h-[48px] w-full rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              placeholder="Tìm bàn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`min-h-[48px] shrink-0 rounded-2xl px-4 text-sm font-black transition-all ${
                  filter === f.key
                    ? 'bg-[#C89B3C] text-white shadow-[0_10px_22px_rgba(200,155,60,0.24)]'
                    : 'border border-[#E1CDB9] bg-white text-[#6B4B37] hover:border-[#C89B3C]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            className="min-h-[48px] rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] px-4 text-sm font-bold text-[#3B2314] outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-72 rounded-[22px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có bàn nào" message="Thử đổi bộ lọc hoặc thêm bàn mới." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((t) => (
            <TableCard key={t._id} table={t}>
              {t.status === 'trong' ? (
                <button className="btn-primary w-full" onClick={() => openSeat(t)}>
                  Nhận khách
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="min-h-[44px] rounded-xl bg-[#3B2314] px-3 text-sm font-black text-white hover:bg-[#4A2C1A]"
                    onClick={() => navigate(`/goi-mon/${t._id}`)}
                  >
                    Xem order
                  </button>
                  <button
                    className="min-h-[44px] rounded-xl border border-[#C89B3C] bg-white px-3 text-sm font-black text-[#C89B3C] hover:bg-[#FFF3D8]"
                    onClick={() => navigate(`/goi-mon/${t._id}`)}
                  >
                    Thanh toán
                  </button>
                  <button
                    className="col-span-2 min-h-[44px] rounded-xl border border-[#E1CDB9] bg-[#FAF6F1] px-3 text-sm font-black text-[#3B2314] hover:border-[#C89B3C] hover:bg-[#FFF3D8]"
                    onClick={() => openTransfer(t)}
                  >
                    Chuyển bàn
                  </button>
                </div>
              )}
              <div className={`grid gap-2 ${isAdmin ? 'grid-cols-[1fr_44px_44px]' : 'grid-cols-1'}`}>
                <button
                  onClick={() => setQrTable(t)}
                  title="Mã QR gọi món"
                  aria-label={`Mã QR gọi món ${t.name}`}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-[#8A6F5D] transition-colors hover:bg-[#FAF6F1] hover:text-[#C89B3C]"
                >
                  <IconQr width={16} height={16} /> QR Code
                </button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      title="Sửa"
                      aria-label={`Sửa ${t.name}`}
                      className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#E1CDB9] bg-white text-[#6B4B37] transition hover:border-[#C89B3C] hover:bg-[#FFF3D8]"
                    >
                      <IconEdit width={17} height={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTable(t)}
                      title="Xóa"
                      aria-label={`Xóa ${t.name}`}
                      className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#F3C2BA] bg-[#FFEBEE] text-[#C62828] transition hover:bg-[#FEE2E2]"
                    >
                      <IconTrash width={17} height={17} />
                    </button>
                  </>
                )}
              </div>
            </TableCard>
          ))}
        </div>
      )}

      <Modal open={!!seatModal} onClose={() => setSeatModal(null)} title={`Nhận khách - ${seatModal?.name || ''}`}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#FAF6F1] p-4 text-sm font-medium text-[#6B4B37]">
            Bước này chuyển bàn sang trạng thái đang dùng. Sau đó bạn có thể sang trang gọi món để thêm món cho bàn.
          </div>
          <div>
            <label className="label">Số khách</label>
            <input
              type="number"
              min="1"
              max={seatModal?.capacity || 99}
              className="input"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
            <p className="mt-1 text-xs text-text-muted">Sức chứa bàn: {seatModal?.capacity || 0} khách</p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setSeatModal(null)}>
              Hủy
            </button>
            <button type="button" className="btn-primary" onClick={seat}>
              Nhận khách
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!transferModal} onClose={() => setTransferModal(null)} title={`Chuyển bàn - ${transferModal?.name || ''}`}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#FAF6F1] p-4 text-sm font-medium text-[#6B4B37]">
            Order hiện tại sẽ được chuyển sang bàn trống được chọn. Bàn cũ sẽ tự trở về trạng thái trống.
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#E8D5BC] bg-white p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9C8472]">Từ bàn</p>
              <p className="mt-1 text-lg font-black text-[#1A0F00]">{transferModal?.name}</p>
              <p className="text-xs font-semibold text-[#8A6F5D]">{transferModal?.guests || 0} khách đang phục vụ</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9C8472]">Sang bàn</p>
              <select
                className="input mt-1"
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                disabled={transferTargets.length === 0}
              >
                {transferTargets.length === 0 ? (
                  <option value="">Không có bàn trống</option>
                ) : (
                  transferTargets.map((table) => (
                    <option key={table._id} value={table._id}>
                      {table.name} - {table.zone} - {table.capacity} khách
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F4D7A1] bg-[#FFF8E8] p-4 text-sm font-bold text-[#8A5A12]">
            Lưu ý: chỉ chuyển sang bàn đang trống để tránh trộn nhầm hóa đơn giữa hai nhóm khách.
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setTransferModal(null)}>
              Hủy
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={transferOrder}
              disabled={transferring || transferTargets.length === 0}
            >
              {transferring ? 'Đang chuyển...' : 'Chuyển bàn'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setEditingTable(null);
        }}
        title={editingTable ? 'Sửa bàn' : 'Thêm bàn mới'}
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label">Tên bàn</label>
            <input
              className="input"
              placeholder="Bàn 11"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
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
            {errors.capacity && <p className="mt-1 text-xs text-danger">{errors.capacity}</p>}
          </div>
          <div>
            <label className="label">Khu vực</label>
            <select className="input" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
              <option>Trong nhà</option>
              <option>Ngoài trời</option>
              <option>VIP</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setModal(false);
                setEditingTable(null);
              }}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      <QrCodeModal open={!!qrTable} onClose={() => setQrTable(null)} table={qrTable} />
      <ConfirmDialog
        open={!!deleteTable}
        onClose={() => setDeleteTable(null)}
        onConfirm={() => deleteSelectedTable(deleteTable)}
        message={`Xóa bàn ${deleteTable?.name}? Hành động này không thể hoàn tác.`}
      />
    </>
  );
}
