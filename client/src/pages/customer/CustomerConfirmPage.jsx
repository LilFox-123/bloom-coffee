import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
import { formatVND } from '../../utils/format';
import { Spinner } from '../../components/ui';
import PaymentMethodCard from '../../components/customer/PaymentMethodCard';

const METHODS = [
  { id: 'tienmat', icon: '💵', title: 'Tiền mặt', desc: 'Thanh toán khi nhân viên mang hóa đơn' },
  { id: 'chuyenkhoan', icon: '🏦', title: 'Chuyển khoản', desc: 'Quét mã QR thanh toán' },
  { id: 'vidientu', icon: '📱', title: 'Ví điện tử', desc: 'MoMo, ZaloPay, VNPay' },
];

export default function CustomerConfirmPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { table } = useTable();
  const cart = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const showQr = cart.paymentMethod === 'chuyenkhoan' || cart.paymentMethod === 'vidientu';

  if (cart.list.length === 0) {
    navigate(`/order/${tableId}`, { replace: true });
    return null;
  }

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/public/order', {
        tableId,
        customerName: cart.customerName || undefined,
        notes: cart.notes || undefined,
        paymentMethod: cart.paymentMethod,
        items: cart.list.map((r) => ({ menuItemId: r.menuItem._id, quantity: r.quantity })),
      });
      const { orderId } = res.data.data;
      cart.clear();
      navigate(`/order/${tableId}/success/${orderId}`, { replace: true });
    } catch {
      setError('Không thể gửi đơn hàng. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

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
              <span className="text-[#C8922A] font-semibold">{row.quantity}×</span>{' '}
              {row.menuItem.name}
            </span>
            <span className="text-[#1A0F00] font-medium">
              {formatVND(row.menuItem.price * row.quantity)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-[#F3E8D8]">
          <span className="font-semibold text-[#1A0F00]">Tổng cộng</span>
          <span className="text-lg font-bold text-[#C8922A]">{formatVND(cart.total)}</span>
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
          {METHODS.map((m) => (
            <PaymentMethodCard
              key={m.id}
              icon={m.icon}
              title={m.title}
              desc={m.desc}
              selected={cart.paymentMethod === m.id}
              onSelect={() => cart.setPaymentMethod(m.id)}
            />
          ))}
        </div>
      </div>

      {/* QR placeholder */}
      {showQr && (
        <div className="bg-[#FEF6EC] border border-[#E8D5BC] rounded-2xl p-6 text-center mx-4 mt-4">
          <div className="w-40 h-40 mx-auto bg-[#E8D5BC]/40 rounded-xl flex items-center justify-center text-[#9C8472] text-sm whitespace-pre-line">
            {'Mã QR thanh toán\n(tích hợp sau)'}
          </div>
          <p className="mt-3 text-sm text-[#4A3728]">
            Số tiền: <span className="font-bold text-[#C8922A]">{formatVND(cart.total)}</span>
          </p>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-[#C62828] mt-4 px-4">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="bg-[#C8922A] text-white rounded-xl py-4 font-bold text-base mx-4 mt-6 active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Spinner className="w-5 h-5" /> Đang gửi...
          </>
        ) : (
          'Đặt món ngay'
        )}
      </button>
    </div>
  );
}
