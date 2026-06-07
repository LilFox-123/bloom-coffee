import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
import { useToast } from '../../context/ToastContext';
import { formatVND } from '../../utils/format';
import { Spinner } from '../../components/ui';
import PaymentMethodCard from '../../components/customer/PaymentMethodCard';

// Editable for real deployment
const BANK_CONFIG = {
  bankId: 'MB', // MB Bank — change to actual bank
  accountNumber: '1234567890', // change to actual account number
  accountName: 'BLOOM COFFEE',
  template: 'compact2',
};

const BASE_METHODS = [
  { id: 'tienmat', icon: '💵', title: 'Tiền mặt', desc: 'Thanh toán khi nhân viên mang hóa đơn' },
  { id: 'chuyenkhoan', icon: '🏦', title: 'Chuyển khoản', desc: 'Quét mã VietQR thanh toán' },
];

const PROMO_CODES = {
  BLOOM10: { label: 'Giảm 10%', type: 'percent', value: 0.1, max: 30000 },
  COMBO15: { label: 'Giảm 15.000 đ', type: 'fixed', value: 15000 },
  CROISSANT: { label: 'Giảm 5%', type: 'percent', value: 0.05, max: 20000 },
};

const MEMBER_TIER_STYLES = {
  Gold: 'from-[#C89B3C] to-[#8A5A12]',
  Silver: 'from-[#9CA3AF] to-[#4B5563]',
  Member: 'from-[#3B2314] to-[#6E4A32]',
};

const PLACEHOLDER_IMAGE = '/images/placeholder.svg';
const MOMO_LOGO = '/images/payment/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png';
const VNPAY_LOGO = '/images/payment/images.png';
const CASH_DENOMINATIONS = [10000, 20000, 50000, 100000, 200000, 500000];

function MoMoLogo() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#A50064] shadow-sm">
      <img src={MOMO_LOGO} alt="MoMo" className="h-full w-full object-cover" />
    </span>
  );
}

function VNPayLogo() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#D7E6FF]">
      <img src={VNPAY_LOGO} alt="VNPay" className="h-full w-full object-contain p-1.5" />
    </span>
  );
}

function EWalletMethodCard({ type, title, desc, selected, onSelect }) {
  const selectedClasses =
    type === 'momo'
      ? 'border-[#E91E8C] bg-[#FDEBF5]'
      : 'border-[#0056B3] bg-[#EAF3FF]';
  const dotClasses = type === 'momo' ? 'border-[#E91E8C]' : 'border-[#0056B3]';
  const dotFill = type === 'momo' ? 'bg-[#E91E8C]' : 'bg-[#0056B3]';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
        selected ? selectedClasses : 'border-[#E3D3C4] bg-white'
      }`}
    >
      {type === 'momo' ? <MoMoLogo /> : <VNPayLogo />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#3B2314]">{title}</p>
        <p className="mt-0.5 text-xs text-[#8A6F5D]">{desc}</p>
      </div>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? dotClasses : 'border-[#D8C2AC]'
        }`}
      >
        {selected && <span className={`h-2.5 w-2.5 rounded-full ${dotFill}`} />}
      </span>
    </button>
  );
}

function getDiscountAmount(promo, total) {
  if (!promo) return 0;
  if (promo.type === 'fixed') return Math.min(promo.value, total);
  return Math.min(Math.round(total * promo.value), promo.max || total);
}

function getMemberTier(points = 0) {
  if (points >= 1000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Member';
}

function customizationText(customizations = {}) {
  return [customizations.ice, customizations.sugar, customizations.sweetness, customizations.note]
    .filter(Boolean)
    .join(' · ');
}

function MemberCard({ member, estimatedPoints }) {
  const tier = member.tier || getMemberTier(member.points);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${MEMBER_TIER_STYLES[tier]} p-4 text-white shadow-[0_14px_32px_rgba(59,35,20,0.22)]`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15" />
      <div className="absolute bottom-3 right-4 text-5xl font-black text-white/10">B</div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/72">Bloom Member</p>
            <p className="mt-1 text-lg font-black leading-tight">{member.name}</p>
            <p className="mt-0.5 text-xs font-semibold text-white/72">{member.phone}</p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold ring-1 ring-white/20">
            {tier}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/16 p-3 ring-1 ring-white/15">
            <p className="text-xs font-semibold text-white/70">Điểm hiện có</p>
            <p className="mt-1 text-xl font-black">{member.points || 0}</p>
          </div>
          <div className="rounded-xl bg-white/16 p-3 ring-1 ring-white/15">
            <p className="text-xs font-semibold text-white/70">Dự kiến nhận</p>
            <p className="mt-1 text-xl font-black">+{estimatedPoints}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function isSnack(item) {
  const haystack = `${item.category || ''} ${item.name || ''}`.toLowerCase();
  return (
    haystack.includes('đồ ăn') ||
    haystack.includes('ăn nhẹ') ||
    haystack.includes('bánh') ||
    haystack.includes('croissant')
  );
}

function RecommendationCard({ item, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);

  return (
    <div className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-[#E3D3C4] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <img
        src={!imageFailed && item.imageUrl ? item.imageUrl : PLACEHOLDER_IMAGE}
        alt={item.name}
        onError={() => setImageFailed(true)}
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-bold text-[#3B2314]">{item.name}</p>
        <p className="mt-0.5 text-xs text-[#8A6F5D]">
          {isSnack(item) ? 'Mua kèm rất hợp với nước uống' : 'Gợi ý thêm cho đơn này'}
        </p>
        <p className="mt-1 text-sm font-bold text-[#C89B3C]">{formatVND(item.price)}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="min-h-[44px] rounded-xl bg-[#C89B3C] px-3 text-sm font-bold text-white"
      >
        Thêm
      </button>
    </div>
  );
}

export default function CustomerConfirmPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { table } = useTable();
  const cart = useCart();
  const toast = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [memberPhone, setMemberPhone] = useState(cart.memberCustomer?.phone || '');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const [memberError, setMemberError] = useState('');
  const [categories, setCategories] = useState([]);
  const [cashChoice, setCashChoice] = useState('exact');
  const [cashCustomInput, setCashCustomInput] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/public/menu')
      .then((res) => {
        if (active) setCategories(res.data.data.categories || []);
      })
      .catch((err) => {
        console.error('[CustomerConfirmPage] Failed to load recommendations:', err.message);
        // keep recommendations empty -- non-critical feature, silent fail is acceptable but should be logged
      });
    return () => {
      active = false;
    };
  }, []);

  const method = cart.paymentMethod;
  const cartTotal = cart.total;
  const appliedPromo = appliedPromoCode ? PROMO_CODES[appliedPromoCode] : null;
  const discountAmount = getDiscountAmount(appliedPromo, cartTotal);
  const payableTotal = Math.max(cartTotal - discountAmount, 0);
  const customCashAmount = Number(String(cashCustomInput).replace(/\D/g, '')) || 0;
  const cashTenderedAmount =
    cashChoice === 'exact' ? payableTotal : cashChoice === 'custom' ? customCashAmount : Number(cashChoice);
  const cashChangeAmount = Math.max(cashTenderedAmount - payableTotal, 0);
  const cashPaymentInvalid = method === 'tienmat' && (!cashTenderedAmount || cashTenderedAmount < payableTotal);
  const estimatedMemberPoints = Math.floor(payableTotal / 10000);
  const orderId = null; // order is created on submit; QR uses a generic addInfo until then
  const momoError = method === 'momo' && error.includes('MoMo');
  const vnpayError = method === 'vnpay' && error.includes('VNPay');
  const generalError = error && !error.includes('MoMo') && !error.includes('VNPay');
  const allMenuItems = useMemo(
    () => categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c.name }))),
    [categories]
  );
  const recommendationItems = useMemo(() => {
    const cartIds = new Set(cart.list.map((row) => row.menuItem._id));
    const hasDrink = cart.list.some((row) => !isSnack(row.menuItem));
    const pool = allMenuItems.filter((item) => !cartIds.has(item._id));
    const preferred = pool.filter((item) => (hasDrink ? isSnack(item) : !isSnack(item)));
    return (preferred.length ? preferred : pool).slice(0, 3);
  }, [allMenuItems, cart.list]);

  if (cart.list.length === 0) {
    navigate(`/order/${tableId}`, { replace: true });
    return null;
  }

  const selectPaymentMethod = (id) => {
    cart.setPaymentMethod(id);
    setError('');
  };

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (!promo) {
      setAppliedPromoCode('');
      setPromoMessage('Mã khuyến mãi không hợp lệ');
      return;
    }

    const discount = getDiscountAmount(promo, cartTotal);
    if (discount <= 0) {
      setAppliedPromoCode('');
      setPromoMessage('Mã khuyến mãi chưa thể áp dụng cho đơn này');
      return;
    }

    setAppliedPromoCode(code);
    setPromoInput(code);
    setPromoMessage(`Đã áp dụng ${code} - ${promo.label}`);
  };

  const removePromo = () => {
    setAppliedPromoCode('');
    setPromoInput('');
    setPromoMessage('');
  };

  const lookupMember = async () => {
    const phone = memberPhone.trim();
    if (!phone) {
      setMemberError('Vui lòng nhập số điện thoại để kiểm tra thẻ');
      setMemberMessage('');
      return;
    }

    setMemberLoading(true);
    setMemberError('');
    setMemberMessage('');
    try {
      const res = await api.post('/public/member', {
        phone,
        name: cart.customerName || undefined,
      });
      const member = res.data.data.customer;
      cart.setMemberCustomer(member);
      setMemberPhone(member.phone);
      if (!cart.customerName && member.name) cart.setCustomerName(member.name);
      setMemberMessage(
        res.data.data.isNew
          ? 'Đã tạo thẻ thành viên mới cho bạn'
          : 'Đã tìm thấy thẻ thành viên của bạn'
      );
    } catch (err) {
      setMemberError(err.message || 'Không thể kiểm tra thẻ thành viên');
    } finally {
      setMemberLoading(false);
    }
  };

  const createOrder = async () => {
    const promoNote = appliedPromoCode ? `Mã khuyến mãi: ${appliedPromoCode}` : '';
    const notes = [cart.notes, promoNote].filter(Boolean).join(' | ');
    try {
      const res = await api.post('/public/order', {
        tableId,
        customerName: cart.customerName || undefined,
        customerId: cart.memberCustomer?._id || undefined,
        notes: notes || undefined,
        paymentMethod: method,
        ...(method === 'tienmat'
          ? {
              cashAmountDue: payableTotal,
              cashTenderedAmount,
              cashChangeAmount,
            }
          : {}),
        items: cart.list.map((r) => ({
          menuItemId: r.menuItem._id,
          quantity: r.quantity,
          customizations: r.customizations || {},
        })),
      });
      return res.data.data.orderId;
    } catch (err) {
      toast.error('Không thể đặt món. Vui lòng thử lại hoặc gọi nhân viên.');
      setSubmitting(false);
      throw err;
    }
  };

  const submit = async () => {
    if (cashPaymentInvalid) {
      setError('Vui lòng chọn hoặc nhập số tiền mặt đủ để nhân viên thối tiền.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const newOrderId = await createOrder();

      if (method === 'momo' || method === 'vnpay') {
        const successUrl = `${window.location.origin}/order/${tableId}/success/${newOrderId}`;
        const endpoint = method === 'momo' ? '/payment/momo' : '/payment/vnpay';
        const paymentPayload = {
          amount: payableTotal,
          orderInfo: `Bloom Coffee - ${table.tableName}`,
          orderId: newOrderId,
        };
        if (method === 'momo') {
          paymentPayload.redirectUrl = successUrl;
          paymentPayload.ipnUrl = 'https://bloom-coffee-sab9.onrender.com/api/payment/momo/ipn';
        }

        const payRes = await api.post(endpoint, paymentPayload);
        const payUrl = payRes.data.data?.payUrl;
        if (payUrl) {
          cart.clear();
          window.location.href = payUrl;
          return;
        }
        throw new Error('no payUrl');
      }

      // tienmat / chuyenkhoan → mark as placed and go to success
      cart.clear();
      navigate(`/order/${tableId}/success/${newOrderId}`, { replace: true });
    } catch {
      setError(
        method === 'momo'
          ? 'Không thể kết nối MoMo, vui lòng thử lại'
          : method === 'vnpay'
          ? 'Không thể kết nối VNPay, vui lòng thử lại'
          : 'Không thể gửi đơn hàng. Vui lòng thử lại.'
      );
      setSubmitting(false);
    }
  };

  const buttonLabel =
    method === 'chuyenkhoan'
      ? 'Xác nhận đã thanh toán'
      : method === 'tienmat'
      ? 'Đặt món và chuẩn bị tiền'
      : method === 'momo' || method === 'vnpay'
      ? 'Thanh toán ngay'
      : 'Đặt món ngay';

  const vietQrSrc =
    `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNumber}-${BANK_CONFIG.template}.png` +
    `?amount=${payableTotal}&addInfo=BLOOM${orderId || 'ORDER'}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF6F1] pb-6 text-[#3B2314]">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-[#3B2314] px-4">
        <button
          onClick={() => navigate(`/order/${tableId}/cart`)}
          className="flex h-11 w-11 items-center justify-center text-2xl leading-none text-white"
          aria-label="Quay lại"
        >
          ←
        </button>
        <h1 className="font-bold text-white">Xác nhận đơn hàng</h1>
      </header>

      {/* order summary */}
      <div className="mx-4 mt-4 rounded-2xl border border-[#E3D3C4] bg-white p-4">
        {cart.list.map((row) => (
          <div key={row.lineId || row.menuItem._id} className="flex justify-between gap-3 py-1.5 text-sm">
            <span className="min-w-0 text-[#5A4232]">
              <span className="font-semibold text-[#C89B3C]">{row.quantity}×</span> {row.menuItem.name}
              {customizationText(row.customizations) && (
                <span className="mt-0.5 block text-xs font-medium text-[#8A6F5D]">
                  {customizationText(row.customizations)}
                </span>
              )}
            </span>
            <span className="font-medium text-[#3B2314]">
              {formatVND(row.menuItem.price * row.quantity)}
            </span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between border-t border-[#F0E4D8] pt-3">
          <span className="font-semibold text-[#3B2314]">Tổng cộng</span>
          <span className="text-lg font-bold text-[#C89B3C]">{formatVND(cartTotal)}</span>
        </div>
        {discountAmount > 0 && (
          <>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[#5A4232]">Khuyến mãi</span>
              <span className="font-semibold text-[#10B981]">- {formatVND(discountAmount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-[#FFF8EF] px-3 py-2">
              <span className="font-semibold text-[#3B2314]">Cần thanh toán</span>
              <span className="text-lg font-extrabold text-[#C89B3C]">{formatVND(payableTotal)}</span>
            </div>
          </>
        )}
      </div>

      {/* promo code */}
      <div className="mt-5 px-4">
        <label className="mb-1.5 block text-sm font-medium text-[#5A4232]">Mã khuyến mãi</label>
        <div className="flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => {
              setPromoInput(e.target.value);
              setPromoMessage('');
              if (appliedPromoCode) setAppliedPromoCode('');
            }}
            placeholder="Nhập mã BLOOM10, COMBO15..."
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-[#E3D3C4] bg-white px-4 py-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/25"
          />
          {appliedPromoCode ? (
            <button
              type="button"
              onClick={removePromo}
              className="min-h-[44px] rounded-xl border border-[#E3D3C4] bg-white px-4 text-sm font-bold text-[#5A4232]"
            >
              Bỏ
            </button>
          ) : (
            <button
              type="button"
              onClick={applyPromo}
              className="min-h-[44px] rounded-xl bg-[#3B2314] px-4 text-sm font-bold text-white"
            >
              Áp dụng
            </button>
          )}
        </div>
        {promoMessage && (
          <p
            className={`mt-2 text-sm font-medium ${
              appliedPromoCode ? 'text-[#0F8A4B]' : 'text-[#C62828]'
            }`}
          >
            {promoMessage}
          </p>
        )}
      </div>

      {/* customer name */}
      <div className="mt-5 px-4">
        <label className="mb-1.5 block text-sm font-medium text-[#5A4232]">
          Tên của bạn (không bắt buộc)
        </label>
        <input
          value={cart.customerName}
          onChange={(e) => cart.setCustomerName(e.target.value)}
          placeholder="Nhập tên của bạn..."
          className="min-h-[44px] w-full rounded-xl border border-[#E3D3C4] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/25"
        />
      </div>

      {/* member card */}
      <div className="mt-5 px-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#3B2314]">Thẻ thành viên</p>
          <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-xs font-bold text-[#C89B3C]">
            Tích điểm
          </span>
        </div>
        {cart.memberCustomer ? (
          <div className="space-y-3">
            <MemberCard member={cart.memberCustomer} estimatedPoints={estimatedMemberPoints} />
            <button
              type="button"
              onClick={() => {
                cart.setMemberCustomer(null);
                setMemberPhone('');
                setMemberMessage('');
                setMemberError('');
              }}
              className="min-h-[44px] w-full rounded-xl border border-[#E3D3C4] bg-white text-sm font-bold text-[#5A4232]"
            >
              Dùng số điện thoại khác
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E3D3C4] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-bold text-[#3B2314]">Nhập SĐT để tích điểm cho đơn này</p>
            <p className="mt-1 text-xs font-medium text-[#8A6F5D]">
              10.000đ = 1 điểm. Nếu chưa có thẻ, hệ thống sẽ tạo thẻ mới cho bạn.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={memberPhone}
                onChange={(e) => {
                  setMemberPhone(e.target.value);
                  setMemberError('');
                  setMemberMessage('');
                }}
                inputMode="tel"
                placeholder="Số điện thoại"
                className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-[#E3D3C4] bg-[#FAF6F1] px-4 py-3 text-sm outline-none placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/25"
              />
              <button
                type="button"
                onClick={lookupMember}
                disabled={memberLoading}
                className="min-h-[44px] rounded-xl bg-[#3B2314] px-4 text-sm font-bold text-white disabled:opacity-70"
              >
                {memberLoading ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </button>
            </div>
            {memberMessage && <p className="mt-2 text-sm font-semibold text-[#0F8A4B]">{memberMessage}</p>}
            {memberError && <p className="mt-2 text-sm font-semibold text-[#C62828]">{memberError}</p>}
          </div>
        )}
      </div>

      {/* recommendations */}
      {recommendationItems.length > 0 && (
        <div className="mt-5 px-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#3B2314]">Gợi ý dùng thêm</p>
            <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-xs font-bold text-[#C89B3C]">
              Combo ngon hơn
            </span>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {recommendationItems.map((item) => (
              <RecommendationCard key={item._id} item={item} onAdd={() => cart.add(item)} />
            ))}
          </div>
        </div>
      )}

      {/* payment method */}
      <div className="mt-5 px-4">
        <p className="mb-2 text-sm font-semibold text-[#3B2314]">Hình thức thanh toán</p>
        <div className="space-y-3">
          {BASE_METHODS.map((m) => (
            <PaymentMethodCard
              key={m.id}
              icon={m.icon}
              title={m.title}
              desc={m.desc}
              selected={method === m.id}
              onSelect={() => selectPaymentMethod(m.id)}
            />
          ))}
        </div>
      </div>

      {method === 'tienmat' && (
        <div className="mx-4 mt-4 rounded-2xl border border-[#E3D3C4] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#3B2314]">Chuẩn bị tiền mặt</p>
              <p className="mt-1 text-xs font-medium text-[#8A6F5D]">
                Chọn số tiền bạn sẽ đưa. Nhân viên sẽ thu khi giao món và thối tiền ngay tại bàn.
              </p>
            </div>
            <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-xs font-bold text-[#C89B3C]">
              Cần {formatVND(payableTotal)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCashChoice('exact')}
              className={`min-h-[44px] rounded-xl border text-sm font-black ${
                cashChoice === 'exact'
                  ? 'border-[#C89B3C] bg-[#C89B3C] text-white'
                  : 'border-[#E3D3C4] bg-[#FAF6F1] text-[#3B2314]'
              }`}
            >
              Vừa đủ
            </button>
            {CASH_DENOMINATIONS.map((amount) => {
              const disabled = amount < payableTotal;
              return (
                <button
                  key={amount}
                  type="button"
                  disabled={disabled}
                  onClick={() => setCashChoice(String(amount))}
                  className={`min-h-[44px] rounded-xl border text-sm font-black ${
                    cashChoice === String(amount)
                      ? 'border-[#C89B3C] bg-[#C89B3C] text-white'
                      : 'border-[#E3D3C4] bg-[#FAF6F1] text-[#3B2314]'
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  {amount / 1000}k
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-xs font-bold text-[#8A6F5D]">Hoặc nhập chính xác số tiền bạn đưa</label>
            <input
              value={cashCustomInput}
              onFocus={() => setCashChoice('custom')}
              onChange={(e) => {
                setCashChoice('custom');
                setCashCustomInput(e.target.value.replace(/[^\d]/g, ''));
              }}
              inputMode="numeric"
              placeholder="Ví dụ: 100000"
              className="min-h-[44px] w-full rounded-xl border border-[#E3D3C4] bg-[#FAF6F1] px-4 py-3 text-sm outline-none placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/25"
            />
          </div>

          <div className="mt-3 rounded-xl bg-[#FFF8EF] p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-[#8A6F5D]">Bạn chuẩn bị</span>
              <span className="font-black text-[#3B2314]">{formatVND(cashTenderedAmount || 0)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="font-medium text-[#8A6F5D]">Nhân viên thối lại</span>
              <span className="font-black text-[#0F8A4B]">{formatVND(cashChangeAmount)}</span>
            </div>
            {cashPaymentInvalid && (
              <p className="mt-2 text-xs font-bold text-[#C62828]">Số tiền đưa phải lớn hơn hoặc bằng số tiền cần thanh toán.</p>
            )}
          </div>
        </div>
      )}

      {/* VietQR for bank transfer */}
      {method === 'chuyenkhoan' && (
        <div className="mx-4 mt-4 flex flex-col items-center gap-3 rounded-2xl border border-[#E3D3C4] bg-[#FFF8EF] p-5">
          <p className="text-sm font-semibold text-[#3B2314]">Quét mã để thanh toán</p>
          <img
            src={vietQrSrc}
            alt="QR thanh toán"
            className="h-48 w-48 rounded-xl border border-[#E3D3C4] bg-white"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="text-center">
            <p className="text-xs text-[#8A6F5D]">
              Ngân hàng: <span className="font-semibold text-[#5A4232]">{BANK_CONFIG.bankId}</span>
            </p>
            <p className="text-xs text-[#8A6F5D]">
              Số tài khoản:{' '}
              <span className="font-mono font-semibold text-[#5A4232]">{BANK_CONFIG.accountNumber}</span>
            </p>
            <p className="text-xs text-[#8A6F5D]">
              Chủ TK: <span className="font-semibold text-[#5A4232]">{BANK_CONFIG.accountName}</span>
            </p>
            <p className="mt-2 text-sm font-bold text-[#C89B3C]">{payableTotal.toLocaleString('vi-VN')} ₫</p>
          </div>
          <p className="text-center text-xs text-[#8A6F5D]">
            Sau khi chuyển khoản, bấm "Xác nhận đã thanh toán" bên dưới
          </p>
        </div>
      )}

      {/* E-wallet: MoMo + VNPay */}
      <div className="mt-3 px-4">
        <div className="space-y-3">
          <div>
            <EWalletMethodCard
              type="momo"
              title="Thanh toán qua MoMo"
              desc="Chuyển hướng đến app MoMo"
              selected={method === 'momo'}
              onSelect={() => selectPaymentMethod('momo')}
            />
            {momoError && <p className="mt-2 px-1 text-sm font-medium text-[#C62828]">{error}</p>}
          </div>

          <div>
            <EWalletMethodCard
              type="vnpay"
              title="Thanh toán qua VNPay"
              desc="ATM, Visa, Mastercard, QR Code"
              selected={method === 'vnpay'}
              onSelect={() => selectPaymentMethod('vnpay')}
            />
            {vnpayError && <p className="mt-2 px-1 text-sm font-medium text-[#C62828]">{error}</p>}
          </div>
        </div>
      </div>

      {generalError && <p className="mt-4 px-4 text-center text-sm text-[#C62828]">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="mx-4 mt-6 flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#C89B3C] py-4 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Spinner className="h-5 w-5" /> Đang xử lý...
          </>
        ) : (
          buttonLabel
        )}
      </button>
    </div>
  );
}
