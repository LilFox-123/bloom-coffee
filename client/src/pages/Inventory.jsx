import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, TableSkeleton } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconWarn, IconSearch, IconBox } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDateTime } from '../utils/format';

function statusOf(item) {
  if (item.quantity <= 0) return { key: 'het', label: 'Hết hàng', color: 'red', bar: 'bg-[#EF4444]' };
  if (item.quantity <= item.minThreshold) return { key: 'sap', label: 'Sắp hết', color: 'yellow', bar: 'bg-[#F59E0B]' };
  return { key: 'du', label: 'Đủ hàng', color: 'green', bar: 'bg-[#10B981]' };
}

const emptyItem = { name: '', unit: 'kg', quantity: 0, minThreshold: 0 };
const emptyTxn = { type: 'nhap', itemId: '', quantity: 1, note: '' };
const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'du', label: 'Đủ hàng' },
  { key: 'sap', label: 'Sắp hết' },
  { key: 'het', label: 'Hết hàng' },
];

function StatCard({ label, value, helper, tone = 'gold' }) {
  const tones = {
    gold: 'bg-[#FFF3D8] text-[#A56D13]',
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    red: 'bg-[#FFEBEE] text-[#C62828]',
    blue: 'bg-[#E3F2FD] text-[#1565C0]',
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

function StockCard({ item, onEdit, onDelete }) {
  const status = statusOf(item);
  const denominator = Math.max(Number(item.minThreshold || 0) * 2, Number(item.quantity || 0), 1);
  const width = Math.min(100, Math.round((Number(item.quantity || 0) / denominator) * 100));

  return (
    <article className="rounded-[22px] border border-[#E8D5BC] bg-white p-4 shadow-[0_10px_28px_rgba(59,35,20,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(59,35,20,0.13)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-1 text-lg font-black text-[#1A0F00]">{item.name}</p>
          <p className="mt-1 text-sm font-bold text-[#8A6F5D]">Đơn vị: {item.unit}</p>
        </div>
        <Badge color={status.color}>{status.label}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#FAF6F1] p-3">
          <p className="text-xs font-bold text-[#8A6F5D]">Tồn kho</p>
          <p className="mt-1 text-2xl font-black text-[#3B2314]">{item.quantity}</p>
        </div>
        <div className="rounded-2xl bg-[#FAF6F1] p-3">
          <p className="text-xs font-bold text-[#8A6F5D]">Ngưỡng</p>
          <p className="mt-1 text-2xl font-black text-[#3B2314]">{item.minThreshold}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex justify-between text-xs font-bold text-[#8A6F5D]">
          <span>Mức tồn</span>
          <span>{width}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E8D5BC]">
          <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${Math.max(width, 6)}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="min-h-[42px] rounded-xl border border-[#E8D5BC] bg-[#FAF6F1] text-sm font-black text-[#3B2314] hover:border-[#C89B3C]"
          aria-label={`Sửa nguyên liệu ${item.name}`}
          onClick={() => onEdit(item)}
        >
          <IconEdit width={16} height={16} className="mr-1 inline" /> Sửa
        </button>
        <button
          className="min-h-[42px] rounded-xl border border-[#F3C2BA] bg-[#FFEBEE] text-sm font-black text-[#C62828]"
          aria-label={`Xóa nguyên liệu ${item.name}`}
          onClick={() => onDelete(item)}
        >
          <IconTrash width={16} height={16} className="mr-1 inline" /> Xóa
        </button>
      </div>
    </article>
  );
}

export default function Inventory() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [itemModal, setItemModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [itemErrors, setItemErrors] = useState({});

  const [txnModal, setTxnModal] = useState(false);
  const [txnForm, setTxnForm] = useState(emptyTxn);
  const [txnErrors, setTxnErrors] = useState({});

  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    try {
      const [itemsRes, txnRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/transactions/all'),
      ]);
      setItems(itemsRes.data.data);
      setTxns(txnRes.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const lowItems = items.filter((i) => i.quantity <= i.minThreshold);
  const stats = useMemo(
    () => ({
      total: items.length,
      ok: items.filter((i) => statusOf(i).key === 'du').length,
      low: items.filter((i) => statusOf(i).key === 'sap').length,
      empty: items.filter((i) => statusOf(i).key === 'het').length,
    }),
    [items]
  );
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const status = statusOf(item).key;
        const matchStatus = statusFilter === 'all' || status === statusFilter;
        const matchSearch = `${item.name} ${item.unit}`.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      }),
    [items, search, statusFilter]
  );

  const openAddItem = () => {
    setEditing(null);
    setItemForm(emptyItem);
    setItemErrors({});
    setItemModal(true);
  };
  const openEditItem = (i) => {
    setEditing(i);
    setItemForm({ name: i.name, unit: i.unit, quantity: i.quantity, minThreshold: i.minThreshold });
    setItemErrors({});
    setItemModal(true);
  };

  const submitItem = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!itemForm.name.trim()) errs.name = 'Vui lòng nhập tên';
    if (!itemForm.unit.trim()) errs.unit = 'Vui lòng nhập đơn vị';
    if (itemForm.quantity < 0) errs.quantity = 'Không hợp lệ';
    if (itemForm.minThreshold < 0) errs.minThreshold = 'Không hợp lệ';
    setItemErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = {
      ...itemForm,
      quantity: Number(itemForm.quantity),
      minThreshold: Number(itemForm.minThreshold),
    };
    try {
      if (editing) {
        await api.patch(`/inventory/${editing._id}`, payload);
        toast.success('Đã cập nhật nguyên liệu');
      } else {
        await api.post('/inventory', payload);
        toast.success('Đã thêm nguyên liệu');
      }
      setItemModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitTxn = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!txnForm.itemId) errs.itemId = 'Vui lòng chọn nguyên liệu';
    if (!txnForm.quantity || txnForm.quantity < 1) errs.quantity = 'Số lượng phải lớn hơn 0';
    setTxnErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.post('/inventory/transactions', { ...txnForm, quantity: Number(txnForm.quantity) });
      toast.success(txnForm.type === 'nhap' ? 'Đã nhập kho' : 'Đã xuất kho');
      setTxnModal(false);
      setTxnForm(emptyTxn);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const doDelete = async (i) => {
    try {
      await api.delete(`/inventory/${i._id}`);
      toast.success('Đã xóa nguyên liệu');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] p-6 text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
              Quản lý nguyên liệu
            </span>
            <h1 className="mt-4 text-4xl font-black xl:text-5xl">Kho Bloom Coffee</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/75">
              Theo dõi tồn kho, cảnh báo sắp hết và ghi nhận phiếu nhập/xuất nguyên liệu.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" onClick={() => { setTxnForm(emptyTxn); setTxnErrors({}); setTxnModal(true); }}>
              <IconPlus width={18} height={18} /> Phiếu nhập/xuất
            </button>
            <button className="min-h-[44px] rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15" onClick={openAddItem}>
              <IconPlus width={18} height={18} className="mr-1 inline" /> Thêm nguyên liệu
            </button>
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng nguyên liệu" value={stats.total} helper="Mặt hàng" tone="blue" />
        <StatCard label="Đủ hàng" value={stats.ok} helper="Ổn định" tone="green" />
        <StatCard label="Sắp hết" value={stats.low} helper="Cần nhập" tone="gold" />
        <StatCard label="Hết hàng" value={stats.empty} helper="Khẩn cấp" tone="red" />
      </div>

      {lowItems.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#F59E0B] bg-[#FEF3C7] px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white">
            <IconWarn width={20} height={20} />
          </span>
          <span className="text-sm font-bold text-[#92400E]">
            Có {lowItems.length} mặt hàng cần kiểm tra tồn kho ngay.
          </span>
        </div>
      )}

      <section className="mb-6 rounded-[24px] border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,420px)_1fr]">
          <div className="relative">
            <IconSearch width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8472]" />
            <input
              className="min-h-[48px] w-full rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              placeholder="Tìm nguyên liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`min-h-[48px] shrink-0 rounded-2xl px-4 text-sm font-black transition-all ${
                  statusFilter === f.key
                    ? 'bg-[#C89B3C] text-white shadow-[0_10px_22px_rgba(200,155,60,0.24)]'
                    : 'border border-[#E1CDB9] bg-white text-[#6B4B37] hover:border-[#C89B3C]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có nguyên liệu" action={<button className="btn-primary" onClick={openAddItem}>Thêm nguyên liệu</button>} />
      ) : filteredItems.length === 0 ? (
        <EmptyState title="Không tìm thấy nguyên liệu" message="Thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map((item) => (
            <StockCard key={item._id} item={item} onEdit={openEditItem} onDelete={setConfirm} />
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3B2314] text-[#F8E8C2]">
          <IconBox width={20} height={20} />
        </span>
        <div>
          <h2 className="text-lg font-black text-[#1A0F00]">Lịch sử nhập/xuất</h2>
          <p className="text-sm font-medium text-[#8A6F5D]">Theo dõi các giao dịch kho gần đây</p>
        </div>
      </div>
      {txns.length === 0 ? (
        <EmptyState title="Chưa có giao dịch" />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Loại</th>
                  <th className="px-4 py-3 text-left font-medium">Nguyên liệu</th>
                  <th className="px-4 py-3 text-right font-medium">Số lượng</th>
                  <th className="px-4 py-3 text-left font-medium">Nhân viên</th>
                  <th className="px-4 py-3 text-left font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t._id} className="border-b border-brdr hover:bg-muted">
                    <td className="px-4 py-3">
                      <Badge color={t.type === 'nhap' ? 'green' : 'yellow'}>{t.type === 'nhap' ? 'Nhập' : 'Xuất'}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.itemName}</td>
                    <td className="px-4 py-3 text-right">{t.quantity}</td>
                    <td className="px-4 py-3">{t.staffName}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(t.date)}</td>
                    <td className="px-4 py-3 text-text-muted">{t.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={itemModal} onClose={() => setItemModal(false)} title={editing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}>
        <form onSubmit={submitItem} className="space-y-4" noValidate>
          <div>
            <label className="label">Tên nguyên liệu</label>
            <input className="input" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            {itemErrors.name && <p className="mt-1 text-xs text-danger">{itemErrors.name}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Đơn vị</label>
              <input className="input" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
              {itemErrors.unit && <p className="mt-1 text-xs text-danger">{itemErrors.unit}</p>}
            </div>
            <div>
              <label className="label">Tồn kho</label>
              <input type="number" min="0" className="input" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
            </div>
            <div>
              <label className="label">Ngưỡng</label>
              <input type="number" min="0" className="input" value={itemForm.minThreshold} onChange={(e) => setItemForm({ ...itemForm, minThreshold: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setItemModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu</button>
          </div>
        </form>
      </Modal>

      <Modal open={txnModal} onClose={() => setTxnModal(false)} title="Phiếu nhập / xuất kho">
        <form onSubmit={submitTxn} className="space-y-4" noValidate>
          <div className="flex gap-3">
            {['nhap', 'xuat'].map((t) => (
              <label
                key={t}
                className={`flex-1 cursor-pointer rounded-lg border py-2 text-center text-sm font-medium ${
                  txnForm.type === t ? 'border-accent-green bg-accent-green-light text-primary-dark' : 'border-brdr'
                }`}
              >
                <input type="radio" className="hidden" checked={txnForm.type === t} onChange={() => setTxnForm({ ...txnForm, type: t })} />
                {t === 'nhap' ? 'Nhập kho' : 'Xuất kho'}
              </label>
            ))}
          </div>
          <div>
            <label className="label">Nguyên liệu</label>
            <select className="input" value={txnForm.itemId} onChange={(e) => setTxnForm({ ...txnForm, itemId: e.target.value })}>
              <option value="">-- Chọn nguyên liệu --</option>
              {items.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} (tồn: {i.quantity} {i.unit})
                </option>
              ))}
            </select>
            {txnErrors.itemId && <p className="mt-1 text-xs text-danger">{txnErrors.itemId}</p>}
          </div>
          <div>
            <label className="label">Số lượng</label>
            <input type="number" min="1" className="input" value={txnForm.quantity} onChange={(e) => setTxnForm({ ...txnForm, quantity: e.target.value })} />
            {txnErrors.quantity && <p className="mt-1 text-xs text-danger">{txnErrors.quantity}</p>}
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <input className="input" value={txnForm.note} onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setTxnModal(false)}>Hủy</button>
            <button type="submit" className="btn-primary">Lưu</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => doDelete(confirm)}
        message={`Xóa nguyên liệu "${confirm?.name}"? Hành động này không thể hoàn tác.`}
      />
    </>
  );
}
