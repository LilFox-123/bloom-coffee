import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, Spinner } from '../components/ui';
import { IconSearch, IconPlus, IconCart } from '../components/Icons';
import TableCard from '../components/TableCard';
import Modal from '../components/Modal';
import { formatVND } from '../utils/format';

const CATEGORIES = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];
const PAYMENTS = [
  { key: 'tienmat', label: 'Tiền mặt', subtitle: 'Thu tiền tại quầy' },
  { key: 'chuyenkhoan', label: 'Chuyển khoản', subtitle: 'Xác nhận giao dịch' },
  { key: 'vidientu', label: 'Ví điện tử', subtitle: 'MoMo / VNPay' },
];

const CATEGORY_IMAGES = {
  'Cà phê': '/images/menu/coffee-cup.svg',
  Trà: '/images/menu/tea-cup.svg',
  'Nước ép': '/images/menu/juice-glass.svg',
  'Đồ ăn nhẹ': '/images/menu/snack-plate.svg',
};

const ORDER_FLOW = [
  { key: 'moi', label: 'Chờ xác nhận' },
  { key: 'daxacnhan', label: 'Đã xác nhận' },
  { key: 'dathanhtoan', label: 'Đã thanh toán' },
  { key: 'dangphache', label: 'Đang pha chế' },
  { key: 'chuanbiphucvu', label: 'Chuẩn bị phục vụ' },
  { key: 'daphucvu', label: 'Đã phục vụ' },
];

const ORDER_STATUS_META = {
  moi: { label: 'Chờ xác nhận', color: 'blue' },
  daxacnhan: { label: 'Đã xác nhận', color: 'green' },
  dathanhtoan: { label: 'Đã thanh toán', color: 'green' },
  danglam: { label: 'Đang chuẩn bị', color: 'yellow' },
  dangphache: { label: 'Đang pha chế', color: 'yellow' },
  chuanbiphucvu: { label: 'Chuẩn bị phục vụ', color: 'blue' },
  daphucvu: { label: 'Đã phục vụ', color: 'green' },
  hoantat: { label: 'Hoàn tất', color: 'green' },
};

const PAYMENT_STATUS_META = {
  pending: { label: 'Chờ thanh toán', color: 'yellow' },
  paid: { label: 'Đã thanh toán', color: 'green' },
  failed: { label: 'Thanh toán lỗi', color: 'red' },
};

const ORDER_STATUS_ACTIONS = [
  { label: 'Xác nhận đơn', payload: { status: 'daxacnhan' } },
  { label: 'Đã thanh toán', payload: { paymentStatus: 'paid' } },
  { label: 'Đang pha chế', payload: { status: 'dangphache' } },
  { label: 'Chuẩn bị phục vụ', payload: { status: 'chuanbiphucvu' } },
  { label: 'Đã phục vụ', payload: { status: 'daphucvu' } },
];

const ITEM_STATUS_META = {
  dangphache: { label: 'Đang pha chế', color: 'yellow' },
  chuanbiphucvu: { label: 'Chuẩn bị phục vụ', color: 'blue' },
  daphucvu: { label: 'Đã phục vụ', color: 'green' },
};

function fallbackImage(category) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Cà phê'];
}

function getImage(item) {
  return item.imageUrl || fallbackImage(item.category);
}

function OrderStatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status] || ORDER_STATUS_META.moi;
  return <Badge color={meta.color}>{meta.label}</Badge>;
}

function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS_META[status] || PAYMENT_STATUS_META.pending;
  return <Badge color={meta.color}>{meta.label}</Badge>;
}

function ItemStatusBadge({ status }) {
  const meta = ITEM_STATUS_META[status] || ITEM_STATUS_META.dangphache;
  return (
    <Badge color={meta.color} className="!mt-1 !px-2 !py-0.5 !text-[10px]">
      {meta.label}
    </Badge>
  );
}

function customizationText(customizations = {}) {
  return [customizations.ice, customizations.sugar, customizations.sweetness, customizations.note]
    .filter(Boolean)
    .join(' · ');
}

function FlowSteps({ status }) {
  const index = Math.max(0, ORDER_FLOW.findIndex((step) => step.key === status));

  return (
    <div className="rounded-2xl border border-[#E8D5BC] bg-[#FAF6F1] p-3">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#8A6F5D]">Luồng xử lý đơn</p>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {ORDER_FLOW.map((step, stepIndex) => {
          const active = stepIndex <= index;
          return (
            <div
              key={step.key}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                active ? 'bg-[#3B2314] text-white' : 'bg-white text-[#9C8472]'
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SourceBadge({ source }) {
  if (source === 'customer_kiosk') return <Badge color="blue">KH tự đặt</Badge>;
  if (source === 'customer_online') return <Badge color="blue">Online</Badge>;
  return <Badge color="gray">Nhân viên</Badge>;
}

function TableSelector() {
  const toast = useToast();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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

  const stats = useMemo(
    () => ({
      total: tables.length,
      free: tables.filter((t) => t.status === 'trong').length,
      busy: tables.filter((t) => t.status !== 'trong').length,
    }),
    [tables]
  );

  const filtered = useMemo(
    () =>
      tables.filter((t) => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || t.status === filter;
        return matchSearch && matchFilter;
      }),
    [filter, search, tables]
  );

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] p-6 text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)]">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
              Bước 1 / Chọn bàn
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight xl:text-5xl">Gọi món tại bàn</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75">
              Chọn bàn cần phục vụ. Nếu bàn trống, hệ thống sẽ tự tạo order mới khi bạn vào bàn.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/70">Tổng bàn</p>
              <p className="mt-2 text-3xl font-black">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/70">Trống</p>
              <p className="mt-2 text-3xl font-black">{stats.free}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/70">Đang dùng</p>
              <p className="mt-2 text-3xl font-black">{stats.busy}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-[24px] border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,420px)_1fr]">
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
            {[
              ['all', 'Tất cả'],
              ['trong', 'Bàn trống'],
              ['dangdung', 'Đang dùng'],
              ['ghepban', 'Ghép bàn'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`min-h-[48px] shrink-0 rounded-2xl px-4 text-sm font-black transition-all ${
                  filter === key
                    ? 'bg-[#C89B3C] text-white shadow-[0_10px_22px_rgba(200,155,60,0.24)]'
                    : 'border border-[#E1CDB9] bg-white text-[#6B4B37] hover:border-[#C89B3C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-72 rounded-[22px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có bàn nào" message="Thử đổi bộ lọc hoặc tìm bàn khác." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((t) => (
            <TableCard key={t._id} table={t} selectable onClick={() => navigate(`/goi-mon/${t._id}`)}>
              <button className="btn-primary w-full">Chọn bàn</button>
            </TableCard>
          ))}
        </div>
      )}
    </>
  );
}

function MenuItemCard({ item, orderItem, disabled, onAdd, onInc, onDec }) {
  const [imageSrc, setImageSrc] = useState(getImage(item));

  useEffect(() => {
    setImageSrc(getImage(item));
  }, [item.imageUrl, item.category]);

  return (
    <article className={`overflow-hidden rounded-[18px] border border-[#E8D5BC] bg-white shadow-[0_10px_26px_rgba(59,35,20,0.07)] ${disabled ? 'opacity-60' : ''}`}>
      <div className="relative h-52 overflow-hidden bg-[#F4E6D4] sm:h-56 xl:h-52 2xl:h-56">
        <img
          src={imageSrc}
          alt={item.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
          onError={() => setImageSrc(fallbackImage(item.category))}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-[#3B2314]">
          {item.category}
        </span>
      </div>
      <div className="flex min-h-[154px] flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-black text-[#1A0F00]">{item.name}</p>
            <p className="mt-1 text-sm font-black text-[#C89B3C]">{formatVND(item.price)}</p>
          </div>
          {disabled && <Badge color="red">Hết</Badge>}
        </div>
        <p className="mt-1 line-clamp-2 min-h-[34px] text-xs font-medium leading-4 text-[#8A6F5D]">
          {item.description || 'Món ngon của Bloom Coffee'}
        </p>
        <div className="mt-auto pt-3">
          {orderItem ? (
            <div className="flex items-center justify-between rounded-xl bg-[#FAF6F1] p-1">
              <button className="h-9 w-9 rounded-lg bg-white text-lg font-black text-[#3B2314]" onClick={onDec}>
                -
              </button>
              <span className="text-sm font-black text-[#3B2314]">{orderItem.quantity}</span>
              <button className="h-9 w-9 rounded-lg bg-[#C89B3C] text-lg font-black text-white" onClick={onInc}>
                +
              </button>
            </div>
          ) : (
            <button className="btn-primary w-full !rounded-xl !py-2 text-xs" disabled={disabled} onClick={onAdd}>
              <IconPlus width={14} height={14} /> Thêm món
            </button>
          )}
        </div>
      </div>
    </article>
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
  const [availableOnly, setAvailableOnly] = useState(false);
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
        const matchCategory = category === 'Tất cả' || m.category === category;
        const query = `${m.name || ''} ${m.description || ''}`.toLowerCase();
        const matchSearch = query.includes(search.toLowerCase());
        const matchAvailable = !availableOnly || m.isAvailable !== false;
        return matchCategory && matchSearch && matchAvailable;
      }),
    [availableOnly, category, menu, search]
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
      const res = await api.patch(`/orders/${order._id}/save`);
      setOrder(res.data.data);
      toast.success('Đã xác nhận đơn');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateOrderStatus = async (payload, successMessage) => {
    try {
      const res = await api.patch(`/orders/${order._id}/status`, payload);
      setOrder(res.data.data);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const acceptTableChangeRequest = async () => {
    try {
      const res = await api.patch(`/orders/${order._id}/table-change-request`, { status: 'accepted' });
      setOrder(res.data.data);
      toast.success('Đã tiếp nhận yêu cầu đổi chỗ');
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
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const subtotal = (order?.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal;
  const itemCount = (order?.items || []).reduce((s, i) => s + i.quantity, 0);

  const cartPanel = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8A6F5D]">Đơn hiện tại</p>
          <h3 className="mt-1 truncate text-xl font-black text-[#1A0F00]">{table?.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <SourceBadge source={order?.source} />
            <OrderStatusBadge status={order?.status} />
            <PaymentStatusBadge status={order?.paymentStatus} />
          </div>
        </div>
        <div className="rounded-2xl bg-[#FFF3D8] px-4 py-3 text-center">
          <p className="text-xs font-bold text-[#A56D13]">Món</p>
          <p className="text-2xl font-black text-[#3B2314]">{itemCount}</p>
        </div>
      </div>

      <FlowSteps status={order?.status} />

      {order?.tableChangeRequest?.status === 'pending' && (
        <div className="mt-4 rounded-2xl border border-[#F0D3A1] bg-[#FFF8EF] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#A56D13]">Khách yêu cầu đổi chỗ</p>
          <p className="mt-2 text-sm font-semibold text-[#3B2314]">
            {order.tableChangeRequest.note || 'Khách muốn đổi sang chỗ ngồi khác.'}
          </p>
          <p className="mt-1 text-xs font-medium text-[#8A6F5D]">
            Hãy kiểm tra bàn trống, trao đổi với khách và dùng chức năng Chuyển bàn nếu có chỗ phù hợp.
          </p>
          <button
            type="button"
            onClick={acceptTableChangeRequest}
            className="mt-3 min-h-[40px] w-full rounded-xl bg-[#3B2314] px-3 text-sm font-black text-white"
          >
            Tiếp nhận yêu cầu
          </button>
        </div>
      )}

      {order?.tableChangeRequest?.status === 'accepted' && (
        <div className="mt-4 rounded-2xl border border-[#D7E9D5] bg-[#F0FAF2] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2E7D32]">Đã tiếp nhận đổi chỗ</p>
          <p className="mt-1 text-xs font-semibold text-[#4A7C59]">
            Nhân viên đã ghi nhận yêu cầu. Nếu đã sắp xếp được bàn mới, hãy dùng chức năng Chuyển bàn.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-[#E8D5BC] bg-white p-3">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#8A6F5D]">Cập nhật trạng thái cho khách</p>
        <div className="grid grid-cols-2 gap-2">
          {ORDER_STATUS_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => updateOrderStatus(action.payload, action.label)}
              disabled={!order?.items.length}
              className="min-h-[40px] rounded-xl border border-[#E8D5BC] bg-[#FAF6F1] px-2 text-xs font-black text-[#3B2314] hover:border-[#C89B3C] hover:bg-[#FFF3D8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {order?.paymentMethod === 'tienmat' && order?.cashTenderedAmount > 0 && (
        <div className="mt-4 rounded-2xl border border-[#F0D3A1] bg-[#FFF8EF] p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#A56D13]">Khách chuẩn bị tiền mặt</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-[#8A6F5D]">Cần thu</span>
              <span className="font-black text-[#3B2314]">{formatVND(order.cashAmountDue || total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[#8A6F5D]">Khách đưa</span>
              <span className="font-black text-[#C8922A]">{formatVND(order.cashTenderedAmount)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-white px-3 py-2">
              <span className="font-semibold text-[#8A6F5D]">Cần thối</span>
              <span className="font-black text-[#0F8A4B]">{formatVND(order.cashChangeAmount || 0)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-[#8A6F5D]">
            Khi giao món, thu đúng số khách đã chuẩn bị và thối lại theo dòng trên.
          </p>
        </div>
      )}

      <div className="-mx-2 mt-4 max-h-[42vh] flex-1 overflow-y-auto px-2">
        {!order?.items.length ? (
          <div className="rounded-2xl border border-dashed border-[#E8D5BC] bg-[#FAF6F1] py-12 text-center">
            <p className="font-black text-[#3B2314]">Chưa có món nào</p>
            <p className="mt-1 text-sm font-medium text-[#8A6F5D]">Chọn món bên trái để bắt đầu order.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {order.items.map((i) => (
              <div key={i._id} className="rounded-2xl border border-[#E8D5BC] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-black text-[#1A0F00]">{i.name}</p>
                    {customizationText(i.customizations) && (
                      <p className="mt-1 text-xs font-medium text-[#8A6F5D]">{customizationText(i.customizations)}</p>
                    )}
                    <ItemStatusBadge status={i.status} />
                  </div>
                  <button className="text-[#9C8472] hover:text-[#C62828]" onClick={() => removeItem(i)}>
                    ×
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <button className="h-8 w-8 rounded-lg bg-[#FAF6F1] font-black" onClick={() => changeQty(i, -1)}>
                      -
                    </button>
                    <span className="w-6 text-center font-black">{i.quantity}</span>
                    <button className="h-8 w-8 rounded-lg bg-[#C89B3C] font-black text-white" onClick={() => changeQty(i, 1)}>
                      +
                    </button>
                    <span className="ml-1 text-[#8A6F5D]">× {formatVND(i.price)}</span>
                  </div>
                  <span className="font-black text-[#3B2314]">{formatVND(i.price * i.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-[#FAF6F1] p-4 text-sm">
        <div className="flex justify-between text-[#8A6F5D]">
          <span>Tạm tính</span>
          <span>{formatVND(subtotal)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#E8D5BC] pt-3">
          <span className="font-black text-[#1A0F00]">Tổng cộng</span>
          <span className="text-2xl font-black text-[#C89B3C]">{formatVND(total)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="btn-secondary" onClick={saveOrder} disabled={!order?.items.length}>
          Lưu đơn
        </button>
        <button
          className="btn-primary"
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
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] p-6 text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <button className="mb-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15" onClick={() => navigate('/goi-mon')}>
              ← Đổi bàn
            </button>
            <h1 className="text-4xl font-black xl:text-5xl">{table?.name || 'Gọi món'}</h1>
            <p className="mt-2 text-sm font-medium text-white/75">
              Bước 2: thêm món vào order, xác nhận trạng thái, sau đó tạo hóa đơn khi khách thanh toán.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/70">Số món</p>
              <p className="mt-2 text-3xl font-black">{itemCount}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/70">Tạm tính</p>
              <p className="mt-2 text-2xl font-black">{formatVND(subtotal)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold text-white/70">Tổng</p>
              <p className="mt-2 text-2xl font-black text-[#F8E8C2]">{formatVND(total)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 pb-24 xl:grid-cols-[minmax(0,1fr)_440px] xl:pb-0">
        <section className="rounded-[24px] border border-[#E8D5BC] bg-white/90 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1A0F00]">Thực đơn gọi món</h2>
              <p className="text-sm font-medium text-[#8A6F5D]">Chọn món để thêm trực tiếp vào order của bàn.</p>
            </div>
            <label className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-[#E8D5BC] bg-[#FAF6F1] px-4 text-sm font-bold text-[#6B4B37]">
              <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
              Chỉ hiện món còn hàng
            </label>
          </div>

          <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(260px,380px)_1fr]">
            <div className="relative">
              <IconSearch width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8472]" />
              <input
                className="min-h-[48px] w-full rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
                placeholder="Tìm món..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`min-h-[48px] shrink-0 rounded-2xl px-4 text-sm font-black transition-all ${
                    category === c
                      ? 'bg-[#C89B3C] text-white shadow-[0_10px_22px_rgba(200,155,60,0.24)]'
                      : 'border border-[#E1CDB9] bg-white text-[#6B4B37] hover:border-[#C89B3C]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {filteredMenu.length === 0 ? (
            <EmptyState title="Không có món phù hợp" message="Thử đổi danh mục hoặc từ khóa tìm kiếm." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredMenu.map((m) => {
                const oi = orderItemFor(m._id);
                const disabled = !m.isAvailable;
                return (
                  <MenuItemCard
                    key={m._id}
                    item={m}
                    orderItem={oi}
                    disabled={disabled}
                    onAdd={() => addItem(m._id)}
                    onInc={() => changeQty(oi, 1)}
                    onDec={() => changeQty(oi, -1)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <aside className="hidden flex-col rounded-[24px] border border-[#E8D5BC] bg-white/95 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.08)] xl:sticky xl:top-8 xl:flex xl:self-start">
          {cartPanel}
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E8D5BC] bg-white p-3 xl:hidden">
        <button className="btn-primary w-full !justify-between !py-3" onClick={() => setCartOpen(true)}>
          <span className="flex items-center gap-2">
            <IconCart width={18} height={18} />
            Xem đơn
            {itemCount > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-[#C89B3C]">{itemCount}</span>}
          </span>
          <span>{formatVND(total)}</span>
        </button>
      </div>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end xl:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative flex max-h-[82vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex justify-center">
              <span className="h-1.5 w-10 rounded-full bg-[#E8D5BC]" />
            </div>
            {cartPanel}
          </div>
        </div>
      )}

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Xác nhận thanh toán">
        <div className="mb-4 rounded-2xl bg-[#FAF6F1] p-4">
          <p className="text-sm font-bold text-[#8A6F5D]">Tổng thanh toán</p>
          <p className="mt-1 text-3xl font-black text-[#C89B3C]">{formatVND(total)}</p>
        </div>
        <label className="label">Hình thức thanh toán</label>
        <div className="mb-6 grid gap-3">
          {PAYMENTS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPayment(p.key)}
              className={`min-h-[62px] rounded-2xl border p-3 text-left transition-all ${
                payment === p.key ? 'border-[#C89B3C] bg-[#FFF3D8]' : 'border-[#E8D5BC] bg-white hover:border-[#C89B3C]'
              }`}
            >
              <p className="font-black text-[#1A0F00]">{p.label}</p>
              <p className="text-xs font-medium text-[#8A6F5D]">{p.subtitle}</p>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setPayModal(false)}>
            Hủy
          </button>
          <button className="btn-primary" onClick={createInvoice} disabled={submitting}>
            {submitting ? <Spinner className="h-5 w-5" /> : 'Xác nhận & tạo hóa đơn'}
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
