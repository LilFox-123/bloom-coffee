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
    <div className="pb-6 min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[#2C1A0E] h-16 px-4 flex items-center gap-3">
        <button
          onClick={() => navigate(`/order/${tableId}/cart`)}
          className="text-white text-2xl leading-none p-1"
          aria-label="Quay lại"
        >
          ←
        </button>
        <h1 className="text-white font-bold">Xác nhận đơn hàng</h1>
      </header>

      {/* order summary */}
      <div className="bg-white rounded-2xl border border-[#E8D5BC] mx-4 mt-4 p-4">
        {cart.list.map((row) => (
          <div key={row.menuItem._id} className="flex justify-between text-sm py-1.5">
            <span className="text-[#4A3728]">
              <span className="text-[#C8922A] font-semibold">{row.quantity}×</span> {row.menuItem.name}
            </span>
            <span className="text-[#1A0F00] font-medium">
              {formatVND(row.menuItem.price * row.quantity)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-[#F3E8D8]">
          <span className="font-semibold text-[#1A0F00]">Tổng cộng</span>
          <span className="text-lg font-bold text-[#C8922A]">{formatVND(cartTotal)}</span>
        </div>
      </div>

      {/* customer name */}
      <div className="px-4 mt-5">
        <label className="block text-sm font-medium text-[#4A3728] mb-1.5">
          Tên của bạn (không bắt buộc)
        </label>
        <input
          value={cart.customerName}
          onChange={(e) => cart.setCustomerName(e.target.value)}
          placeholder="Nhập tên của bạn..."
          className="w-full border border-[#E8D5BC] rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#C8922A]/25 focus:border-[#C8922A] placeholder:text-[#C4A882]"
        />
      </div>

      {/* payment method */}
      <div className="px-4 mt-5">
        <p className="text-sm font-semibold text-[#1A0F00] mb-2">Hình thức thanh toán</p>
        <div className="space-y-3">
          {BASE_METHODS.map((m) => (
            <PaymentMethodCard
              key={m.id}
              icon={m.icon}
              title={m.title}
              desc={m.desc}
              selected={method === m.id}
              onSelect={() => cart.setPaymentMethod(m.id)}
            />
          ))}
        </div>
      </div>

      {/* VietQR for bank transfer */}
      {method === 'chuyenkhoan' && (
        <div className="mx-4 mt-4 bg-[#FEF6EC] rounded-2xl border border-[#E8D5BC] p-5 flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-[#1A0F00]">Quét mã để thanh toán</p>
          <img
            src={vietQrSrc}
            alt="QR thanh toán"
            className="w-48 h-48 rounded-xl border border-[#E8D5BC] bg-white"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="text-center">
            <p className="text-xs text-[#9C8472]">
              Ngân hàng: <span className="font-semibold text-[#4A3728]">{BANK_CONFIG.bankId}</span>
            </p>
            <p className="text-xs text-[#9C8472]">
              Số tài khoản:{' '}
              <span className="font-semibold text-[#4A3728] font-mono">{BANK_CONFIG.accountNumber}</span>
            </p>
            <p className="text-xs text-[#9C8472]">
              Chủ TK: <span className="font-semibold text-[#4A3728]">{BANK_CONFIG.accountName}</span>
            </p>
            <p className="text-sm font-bold text-[#C8922A] mt-2">{cartTotal.toLocaleString('vi-VN')} ₫</p>
          </div>
          <p className="text-xs text-[#9C8472] text-center">
            Sau khi chuyển khoản, bấm "Xác nhận đã thanh toán" bên dưới
          </p>
        </div>
      )}

      {/* E-wallet: MoMo + VNPay */}
      <div className="px-4 mt-3">
        <button
          type="button"
          onClick={() => cart.setPaymentMethod('momo')}
          className={`w-full text-left rounded-2xl p-4 flex items-center gap-3 border-2 transition-colors ${
            method === 'momo' ? 'border-[#A50064] bg-[#FCF0F5]' : 'border-[#E8D5BC] bg-white'
          }`}
        >
          <span className="w-12 h-12 rounded-full bg-[#A50064] text-white font-bold text-lg flex items-center justify-center shrink-0">
            M
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1A0F00]">Thanh toán qua MoMo</p>
            <p className="text-xs text-[#9C8472]">Chuyển hướng đến app MoMo</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => cart.setPaymentMethod('vnpay')}
          className={`w-full text-left rounded-2xl p-4 mt-2 flex items-center gap-3 border-2 transition-colors ${
            method === 'vnpay' ? 'border-[#0057A8] bg-[#F0F4FF]' : 'border-[#E8D5BC] bg-white'
          }`}
        >
          <span className="w-12 h-12 rounded-full bg-[#0057A8] text-white font-bold text-sm flex items-center justify-center shrink-0">
            VN
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1A0F00]">Thanh toán qua VNPay</p>
            <p className="text-xs text-[#9C8472]">ATM, Visa, Mastercard, QR Code</p>
          </div>
        </button>
      </div>

      {error && <p className="text-center text-sm text-[#C62828] mt-4 px-4">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="bg-[#C8922A] text-white rounded-xl py-4 font-bold text-base mx-4 mt-6 active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Spinner className="w-5 h-5" /> Đang xử lý...
          </>
        ) : (
          buttonLabel
        )}
      </button>
    </div>
  );
}
