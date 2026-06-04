import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
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

function EWalletMethodCard({ type, icon, title, desc, selected, onSelect }) {
  const selectedClasses =
    type === 'momo'
      ? 'border-[#E91E8C] bg-[#FDEBF5]'
      : 'border-[#0056B3] bg-[#EAF3FF]';
  const iconClasses = type === 'momo' ? 'bg-[#E91E8C]' : 'bg-[#0056B3]';
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
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${iconClasses}`}
      >
        {icon}
      </span>
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

export default function CustomerConfirmPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { table } = useTable();
  const cart = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (cart.list.length === 0) {
    navigate(`/order/${tableId}`, { replace: true });
    return null;
  }

  const method = cart.paymentMethod;
  const cartTotal = cart.total;
  const orderId = null; // order is created on submit; QR uses a generic addInfo until then
  const momoError = method === 'momo' && error.includes('MoMo');
  const vnpayError = method === 'vnpay' && error.includes('VNPay');
  const generalError = error && !error.includes('MoMo') && !error.includes('VNPay');

  const selectPaymentMethod = (id) => {
    cart.setPaymentMethod(id);
    setError('');
  };

  const createOrder = async () => {
    const res = await api.post('/public/order', {
      tableId,
      customerName: cart.customerName || undefined,
      notes: cart.notes || undefined,
      paymentMethod: method,
      items: cart.list.map((r) => ({ menuItemId: r.menuItem._id, quantity: r.quantity })),
    });
    return res.data.data.orderId;
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const newOrderId = await createOrder();

      if (method === 'momo' || method === 'vnpay') {
        const successUrl = `${window.location.origin}/order/${tableId}/success/${newOrderId}`;
        const endpoint = method === 'momo' ? '/payment/momo' : '/payment/vnpay';
        const payRes = await api.post(endpoint, {
          amount: cartTotal,
          orderInfo: `Bloom Coffee - ${table.tableName}`,
          orderId: newOrderId,
          redirectUrl: successUrl,
          returnUrl: successUrl,
          ipnUrl: 'https://bloom-coffee-sab9.onrender.com/api/payment/momo/ipn',
        });
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
      : method === 'momo' || method === 'vnpay'
      ? 'Thanh toán ngay'
      : 'Đặt món ngay';

  const vietQrSrc =
    `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNumber}-${BANK_CONFIG.template}.png` +
    `?amount=${cartTotal}&addInfo=BLOOM${orderId || 'ORDER'}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

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
          <div key={row.menuItem._id} className="flex justify-between py-1.5 text-sm">
            <span className="text-[#5A4232]">
              <span className="font-semibold text-[#C89B3C]">{row.quantity}×</span> {row.menuItem.name}
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
            <p className="mt-2 text-sm font-bold text-[#C89B3C]">{cartTotal.toLocaleString('vi-VN')} ₫</p>
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
              icon="M"
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
              icon="VN"
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
