import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Badge, EmptyState, TableSkeleton } from '../components/ui';
import { IconSearch, IconEye, IconPrint, IconTrash } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Logo from '../components/Logo';
import { formatVND, formatDateTime, PAYMENT_LABELS, PAYMENT_STYLES } from '../utils/format';

export default function Invoices() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', { params });
      setInvoices(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const applyFilter = () => load({ from, to, q });

  const todayStats = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const today = invoices.filter((i) => new Date(i.createdAt) >= start);
    return {
      count: today.length,
      revenue: today.reduce((s, i) => s + i.total, 0),
    };
  }, [invoices]);

  const doDelete = async (inv) => {
    try {
      await api.delete(`/invoices/${inv._id}`);
      toast.success('Đã xóa hóa đơn');
      load({ from, to, q });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Quản lý hóa đơn"
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="bg-white border border-brdr rounded-lg px-3 py-1.5 text-xs">
              <span className="text-text-muted">HĐ hôm nay: </span>
              <span className="font-bold">{todayStats.count}</span>
            </div>
            <div className="bg-accent-green-light border border-accent-green/30 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-primary-dark">Doanh thu: </span>
              <span className="font-bold text-primary-dark">{formatVND(todayStats.revenue)}</span>
            </div>
          </div>
        }
      />

      <div className="card !p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Từ ngày</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">Đến ngày</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="label">Tìm kiếm</label>
          <div className="relative">
            <IconSearch width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input pl-9"
              placeholder="Mã HĐ hoặc bàn..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={applyFilter}>
          Lọc
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : invoices.length === 0 ? (
        <EmptyState title="Chưa có hóa đơn" message="Không tìm thấy hóa đơn phù hợp." />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-text-muted">
                <tr>
                  <th className="text-left font-semibold uppercase tracking-wide px-4 py-3">Mã HĐ</th>
                  <th className="text-left font-semibold uppercase tracking-wide px-4 py-3">Bàn</th>
                  <th className="text-left font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Nhân viên lập</th>
                  <th className="text-center font-semibold uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Items</th>
                  <th className="text-right font-semibold uppercase tracking-wide px-4 py-3">Tổng tiền</th>
                  <th className="text-left font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Hình thức TT</th>
                  <th className="text-left font-semibold uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Thời gian</th>
                  <th className="text-right font-semibold uppercase tracking-wide px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={inv._id} className={`border-b border-brdr hover:bg-muted ${idx % 2 ? 'bg-muted/40' : ''}`}>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{inv.code}</span>
                        {inv.source === 'customer_online' && (
                          <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#E3F2FD] text-[#1565C0]">
                            Online
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{inv.tableName}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{inv.staffName}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">{inv.items.length}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatVND(inv.total)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${PAYMENT_STYLES[inv.paymentMethod]}`}>
                        {PAYMENT_LABELS[inv.paymentMethod]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap hidden lg:table-cell">{formatDateTime(inv.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-text-muted hover:text-accent-green-dark" title="Xem" onClick={() => setDetail(inv)}>
                          <IconEye width={18} height={18} />
                        </button>
                        <button
                          className="text-text-muted hover:text-info"
                          title="In"
                          onClick={() => {
                            setDetail(inv);
                            setTimeout(() => window.print(), 300);
                          }}
                        >
                          <IconPrint width={18} height={18} />
                        </button>
                        {isAdmin && (
                          <button className="text-text-muted hover:text-danger" title="Xóa" onClick={() => setConfirm(inv)}>
                            <IconTrash width={18} height={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Chi tiết hóa đơn" maxWidth="max-w-xl">
        {detail && (
          <>
            <div id="print-area">
              <div className="flex items-center gap-3 border-b border-brdr pb-4 mb-4">
                <Logo size={48} />
                <div>
                  <p className="font-bold text-lg">Bloom Coffee</p>
                  <p className="text-xs text-text-muted">123 Đường Hoa Sữa, Quận 1, TP. Hồ Chí Minh</p>
                  <p className="text-xs text-text-muted">ĐT: 1900 1234</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-bold">{detail.code}</p>
                  <p className="text-xs text-text-muted">{formatDateTime(detail.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <p>
                  <span className="text-text-muted">Bàn: </span>
                  <span className="font-medium">{detail.tableName}</span>
                </p>
                <p>
                  <span className="text-text-muted">Nhân viên: </span>
                  <span className="font-medium">{detail.staffName}</span>
                </p>
              </div>
              <table className="w-full text-sm mb-4">
                <thead className="bg-muted text-text-muted">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Món</th>
                    <th className="text-center font-medium px-3 py-2">SL</th>
                    <th className="text-right font-medium px-3 py-2">Đơn giá</th>
                    <th className="text-right font-medium px-3 py-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it, i) => (
                    <tr key={i} className="border-b border-brdr">
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2 text-center">{it.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatVND(it.price)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatVND(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm ml-auto max-w-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Tạm tính</span>
                  <span>{formatVND(detail.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-brdr">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="text-xl font-bold text-accent-green-dark">{formatVND(detail.total)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-text-muted">Thanh toán</span>
                  <span className={`badge ${PAYMENT_STYLES[detail.paymentMethod]}`}>
                    {PAYMENT_LABELS[detail.paymentMethod]}
                  </span>
                </div>
              </div>
              <p className="text-center text-xs text-text-muted mt-6">Cảm ơn quý khách & hẹn gặp lại!</p>
            </div>
            <div className="flex justify-end gap-3 mt-6 no-print">
              <button className="btn-secondary" onClick={() => setDetail(null)}>
                Đóng
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <IconPrint width={18} height={18} /> In hóa đơn
              </button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => doDelete(confirm)}
        message={`Xóa hóa đơn ${confirm?.code}? Hành động này không thể hoàn tác.`}
      />
    </>
  );
}
