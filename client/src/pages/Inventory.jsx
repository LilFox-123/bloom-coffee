import { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader, Badge, EmptyState, TableSkeleton } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconWarn } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDateTime } from '../utils/format';

function statusOf(item) {
  if (item.quantity <= 0) return { key: 'het', label: 'Hết hàng', color: 'red' };
  if (item.quantity <= item.minThreshold) return { key: 'sap', label: 'Sắp hết', color: 'yellow' };
  return { key: 'du', label: 'Đủ hàng', color: 'green' };
}

const emptyItem = { name: '', unit: 'kg', quantity: 0, minThreshold: 0 };
const emptyTxn = { type: 'nhap', itemId: '', quantity: 1, note: '' };

export default function Inventory() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <PageHeader
        title="Quản lý kho nguyên liệu"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => { setTxnForm(emptyTxn); setTxnErrors({}); setTxnModal(true); }}>
              <IconPlus width={18} height={18} /> Phiếu nhập/xuất
            </button>
            <button className="btn-secondary" onClick={openAddItem}>
              <IconPlus width={18} height={18} /> Thêm nguyên liệu
            </button>
          </div>
        }
      />

      {lowItems.length > 0 && (
        <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
          <span className="shrink-0 w-9 h-9 rounded-full bg-[#F59E0B] text-white flex items-center justify-center">
            <IconWarn width={20} height={20} />
          </span>
          <span className="text-sm font-semibold text-[#92400E]">
            Có {lowItems.length} mặt hàng sắp hết nguyên liệu — Kiểm tra ngay
          </span>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có nguyên liệu" action={<button className="btn-primary" onClick={openAddItem}>Thêm nguyên liệu</button>} />
      ) : (
        <div className="card !p-0 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-text-muted">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nguyên liệu</th>
                  <th className="text-left font-medium px-4 py-3">Đơn vị</th>
                  <th className="text-right font-medium px-4 py-3">Tồn kho</th>
                  <th className="text-right font-medium px-4 py-3">Ngưỡng tối thiểu</th>
                  <th className="text-left font-medium px-4 py-3">Trạng thái</th>
                  <th className="text-right font-medium px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const s = statusOf(i);
                  return (
                    <tr key={i._id} className={`border-b border-brdr hover:bg-muted ${s.key === 'sap' ? 'bg-warning-light/60' : ''}`}>
                      <td className="px-4 py-3 font-medium">{i.name}</td>
                      <td className="px-4 py-3 text-text-muted">{i.unit}</td>
                      <td className="px-4 py-3 text-right font-semibold">{i.quantity}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{i.minThreshold}</td>
                      <td className="px-4 py-3">
                        <Badge color={s.color}>{s.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-text-muted hover:text-accent-green-dark" onClick={() => openEditItem(i)}>
                            <IconEdit width={18} height={18} />
                          </button>
                          <button className="text-text-muted hover:text-danger" onClick={() => setConfirm(i)}>
                            <IconTrash width={18} height={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Lịch sử nhập/xuất</h2>
      {txns.length === 0 ? (
        <EmptyState title="Chưa có giao dịch" />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-text-muted">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Loại</th>
                  <th className="text-left font-medium px-4 py-3">Nguyên liệu</th>
                  <th className="text-right font-medium px-4 py-3">Số lượng</th>
                  <th className="text-left font-medium px-4 py-3">Nhân viên</th>
                  <th className="text-left font-medium px-4 py-3">Ngày</th>
                  <th className="text-left font-medium px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t._id} className="border-b border-brdr hover:bg-muted">
                    <td className="px-4 py-3">
                      <Badge color={t.type === 'nhap' ? 'green' : 'yellow'}>
                        {t.type === 'nhap' ? 'Nhập' : 'Xuất'}
                      </Badge>
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

      {/* Item modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title={editing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}>
        <form onSubmit={submitItem} className="space-y-4" noValidate>
          <div>
            <label className="label">Tên nguyên liệu</label>
            <input className="input" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
            {itemErrors.name && <p className="text-danger text-xs mt-1">{itemErrors.name}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Đơn vị</label>
              <input className="input" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
              {itemErrors.unit && <p className="text-danger text-xs mt-1">{itemErrors.unit}</p>}
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

      {/* Transaction modal */}
      <Modal open={txnModal} onClose={() => setTxnModal(false)} title="Phiếu nhập / xuất kho">
        <form onSubmit={submitTxn} className="space-y-4" noValidate>
          <div className="flex gap-3">
            {['nhap', 'xuat'].map((t) => (
              <label
                key={t}
                className={`flex-1 border rounded-lg py-2 text-center text-sm font-medium cursor-pointer ${
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
            {txnErrors.itemId && <p className="text-danger text-xs mt-1">{txnErrors.itemId}</p>}
          </div>
          <div>
            <label className="label">Số lượng</label>
            <input type="number" min="1" className="input" value={txnForm.quantity} onChange={(e) => setTxnForm({ ...txnForm, quantity: e.target.value })} />
            {txnErrors.quantity && <p className="text-danger text-xs mt-1">{txnErrors.quantity}</p>}
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
