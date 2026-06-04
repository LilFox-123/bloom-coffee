import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader, Badge, EmptyState, Spinner } from '../components/ui';
import { IconSearch, IconPlus, IconCart } from '../components/Icons';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';
import { formatVND } from '../utils/format';

const CATEGORIES = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];
const PAYMENTS = [
  { key: 'tienmat', label: 'Tiền mặt' },
  { key: 'chuyenkhoan', label: 'Chuyển khoản' },
  { key: 'vidientu', label: 'Ví điện tử' },
];

function TableSelector() {
  const toast = useToast();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/tables');
        setTables(res.data.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <>
      <PageHeader title="Gọi món" subtitle="Chọn bàn để bắt đầu order" />
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tables.map((t) => (
            <TableCard key={t._id} table={t} selectable onClick={() => navigate(`/goi-mon/${t._id}`)}>
              <button className="btn-primary w-full !py-1.5">Chọn bàn</button>
            </TableCard>
          ))}
        </div>
      )}
    </>
  );
}

function OrderScreen({ tableId }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [order, setOrder] = useState(null);
  const [table, setTable] = useState(null);
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payment, setPayment] = useState('tienmat');
  const [submitting, setSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const load = async () => {
    try {
      const [menuRes, orderRes, tableRes] = await Promise.all([
        api.get('/menu'),
        api.get(`/orders/table/${tableId}`),
        api.get('/tables'),
      ]);
      setMenu(menuRes.data.data);
      setOrder(orderRes.data.data);
      setTable(tableRes.data.data.find((t) => t._id === tableId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  const filteredMenu = useMemo(
    () =>
      menu.filter((m) => {
        const mc = category === 'Tất cả' || m.category === category;
        const ms = m.name.toLowerCase().includes(search.toLowerCase());
        return mc && ms;
      }),
    [menu, category, search]
  );

  const orderItemFor = (id) => order?.items.find((i) => String(i.menuItemId) === String(id));

  const addItem = async (menuItemId) => {
    try {
      const res = await api.post(`/orders/${order._id}/items`, { menuItemId, quantity: 1 });
      setOrder(res.data.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changeQty = async (item, delta) => {
    try {
      const res = await api.patch(`/orders/${order._id}/items/${item._id}`, {
        quantity: item.quantity + delta,
      });
      setOrder(res.data.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeItem = async (item) => {
    try {
      const res = await api.delete(`/orders/${order._id}/items/${item._id}`);
      setOrder(res.data.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveOrder = async () => {
    try {
      await api.patch(`/orders/${order._id}/save`);
      toast.success('Đã lưu đơn');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const createInvoice = async () => {
    setSubmitting(true);
    try {
      await api.post('/invoices', { orderId: order._id, paymentMethod: payment });
      toast.success('Đã tạo hóa đơn và thanh toán');
      setPayModal(false);
      navigate('/hoa-don');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  const subtotal = (order?.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const vat = Math.round(subtotal * 0.1);
  const total = subtotal + vat;
  const itemCount = (order?.items || []).reduce((s, i) => s + i.quantity, 0);

  const cartPanel = (
    <>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{table?.name} — Đơn hiện tại</h3>
          {order?.source === 'customer_kiosk' && (
            <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[#E3F2FD] text-[#1565C0]">
              KH tự đặt
            </span>
          )}
        </div>
        <Badge color={order?.status === 'moi' ? 'blue' : 'green'}>
          {order?.status === 'moi' ? 'Mới' : 'Đang phục vụ'}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 max-h-[45vh]">
        {!order?.items.length ? (
          <p className="text-center text-text-muted py-12 text-sm">Chưa có món nào trong đơn</p>
        ) : (
          <div className="space-y-2">
            {order.items.map((i) => (
              <div key={i._id} className="border border-brdr rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{i.name}</p>
                    <Badge
                      color={i.status === 'daphucvu' ? 'green' : 'yellow'}
                      className="!text-[10px] !px-2 !py-0.5 mt-1"
                    >
                      {i.status === 'daphucvu' ? 'Đã phục vụ' : 'Đang pha chế'}
                    </Badge>
                  </div>
                  <button className="text-text-muted hover:text-danger" onClick={() => removeItem(i)}>
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <button className="w-7 h-7 rounded bg-muted font-bold" onClick={() => changeQty(i, -1)}>
                      −
                    </button>
                    <span className="w-5 text-center">{i.quantity}</span>
                    <button
                      className="w-7 h-7 rounded bg-accent-green text-white font-bold"
                      onClick={() => changeQty(i, 1)}
                    >
                      +
                    </button>
                    <span className="text-text-muted ml-1">× {formatVND(i.price)}</span>
                  </div>
                  <span className="font-semibold">{formatVND(i.price * i.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-page rounded-xl p-4 mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Tạm tính</span>
          <span>{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>VAT (10%)</span>
          <span>{formatVND(vat)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-brdr">
          <span className="font-semibold text-text-primary">Tổng cộng</span>
          <span className="text-2xl font-bold text-primary">{formatVND(total)}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button className="btn-secondary flex-1" onClick={saveOrder} disabled={!order?.items.length}>
          Lưu đơn
        </button>
        <button
          className="btn-primary flex-1"
          onClick={() => {
            setCartOpen(false);
            setPayModal(true);
          }}
          disabled={!order?.items.length}
        >
          Tạo hóa đơn
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <button className="btn-secondary" onClick={() => navigate('/goi-mon')}>
          ← Đổi bàn
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 pb-24 lg:pb-0">
        {/* LEFT — menu */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h3 className="font-semibold text-text-primary text-lg">Thực đơn</h3>
            <div className="relative flex-1 max-w-xs">
              <IconSearch
                width={18}
                height={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                className="input pl-9"
                placeholder="Tìm món..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  category === c
                    ? 'bg-accent-green text-white'
                    : 'bg-muted text-text-muted hover:bg-accent-green-light'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMenu.map((m) => {
              const oi = orderItemFor(m._id);
              const disabled = !m.isAvailable;
              return (
                <div
                  key={m._id}
                  className={`border border-brdr rounded-xl p-3 flex gap-3 ${
                    disabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-text-muted text-xs shrink-0">
                    {m.category.split(' ')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-tight">{m.name}</p>
                      {disabled && <Badge color="red">Hết</Badge>}
                    </div>
                    <p className="text-accent-green-dark font-semibold text-sm mt-1">
                      {formatVND(m.price)}
                    </p>
                    <div className="mt-2">
                      {oi ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 rounded-md bg-muted hover:bg-accent-green-light font-bold"
                            onClick={() => changeQty(oi, -1)}
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold">{oi.quantity}</span>
                          <button
                            className="w-7 h-7 rounded-md bg-accent-green text-white hover:bg-accent-green-dark font-bold"
                            onClick={() => changeQty(oi, 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-primary !py-1 !px-3 text-xs"
                          disabled={disabled}
                          onClick={() => addItem(m._id)}
                        >
                          <IconPlus width={14} height={14} /> Thêm
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — cart panel (desktop) */}
        <div className="hidden lg:flex card flex-col lg:sticky lg:top-8 self-start">
          {cartPanel}
        </div>
      </div>

      {/* Mobile cart bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brdr p-3 no-print">
        <button
          className="btn-primary w-full !py-3 flex items-center justify-between"
          onClick={() => setCartOpen(true)}
        >
          <span className="flex items-center gap-2">
            <IconCart width={18} height={18} />
            Xem giỏ hàng
            {itemCount > 0 && (
              <span className="bg-white text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                {itemCount}
              </span>
            )}
          </span>
          <span className="font-bold">{formatVND(total)}</span>
        </button>
      </div>

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end no-print">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setCartOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto flex flex-col animate-slide-up">
            <div className="flex justify-center mb-2">
              <span className="w-10 h-1.5 rounded-full bg-brdr" />
            </div>
            {cartPanel}
          </div>
        </div>
      )}

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Xác nhận thanh toán">
        <p className="text-text-muted mb-4">
          Tổng thanh toán: <span className="font-bold text-accent-green-dark">{formatVND(total)}</span>
        </p>
        <label className="label">Hình thức thanh toán</label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {PAYMENTS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPayment(p.key)}
              className={`border rounded-lg py-2 text-sm font-medium ${
                payment === p.key
                  ? 'border-accent-green bg-accent-green-light text-primary-dark'
                  : 'border-brdr hover:bg-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setPayModal(false)}>
            Hủy
          </button>
          <button className="btn-primary" onClick={createInvoice} disabled={submitting}>
            {submitting ? <Spinner className="w-5 h-5" /> : 'Xác nhận & tạo hóa đơn'}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function Order() {
  const { tableId } = useParams();
  if (!tableId) return <TableSelector />;
  return <OrderScreen tableId={tableId} />;
}
