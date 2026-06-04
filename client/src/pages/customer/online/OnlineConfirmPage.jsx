import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { useCart } from '../../../context/CartContext';
import { formatVND } from '../../../utils/format';
import { Spinner } from '../../../components/ui';

export default function OnlineConfirmPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (cart.list.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[480px] min-h-screen flex flex-col">
        <Header onBack={() => navigate('/order')} />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-lg font-semibold text-[#1A0A00]">Giỏ hàng trống</p>
          <button
            onClick={() => navigate('/order')}
            className="mt-5 bg-[#C8922A] text-[#1A0A00] rounded-xl px-6 py-3 font-bold active:scale-95 transition-transform"
          >
            Quay lại thực đơn
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!cart.customerName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/public/online-order', {
        customerName: cart.customerName.trim(),
        tableNumber: cart.tableNumber || undefined,
        note: cart.notes || undefined,
        items: cart.list.map((r) => ({ menuItemId: r.menuItem._id, quantity: r.quantity })),
      });
      const { orderId } = res.data.data;
      cart.clear();
      navigate(`/order/success?id=${orderId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Không thể gửi đơn hàng. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[480px] min-h-screen pb-6 flex flex-col">
      <Header onBack={() => navigate('/order')} />

      {/* summary */}
      <div className="bg-white rounded-2xl border border-[#E8D5BC] mx-4 mt-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F3E8D8]">
          <h2 className="font-display font-bold text-[#1A0A00]">Tóm tắt đơn hàng</h2>
        </div>
        {cart.list.map((row) => (
          <div key={row.menuItem._id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="text-[#3D2B1F]">
              <span className="text-[#C8922A] font-semibold">{row.quantity}×</span> {row.menuItem.name}
            </span>
            <span className="text-[#1A0A00] font-medium">{formatVND(row.menuItem.price * row.quantity)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3E8D8]">
          <span className="font-semibold text-[#1A0A00]">Tổng cộng</span>
          <span className="text-xl font-bold text-[#C8922A]">{formatVND(cart.total)}</span>
        </div>
      </div>

      {/* form */}
      <div className="px-4 mt-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#3D2B1F] mb-1.5">
            Tên của bạn <span className="text-[#C0392B]">*</span>
          </label>
          <input
            value={cart.customerName}
            onChange={(e) => cart.setCustomerName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full border border-[#E8D5BC] rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#C8922A]/25 focus:border-[#C8922A]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#3D2B1F] mb-1.5">Số bàn (không bắt buộc)</label>
          <select
            value={cart.tableNumber}
            onChange={(e) => cart.setTableNumber(e.target.value)}
            className="w-full border border-[#E8D5BC] rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#C8922A]/25 focus:border-[#C8922A]"
          >
            <option value="">Mang đi / chưa chọn bàn</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Bàn {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#3D2B1F] mb-1.5">Ghi chú (không bắt buộc)</label>
          <textarea
            rows={3}
            value={cart.notes}
            onChange={(e) => cart.setNotes(e.target.value)}
            placeholder="Ghi chú cho quán..."
            className="w-full border border-[#E8D5BC] rounded-xl px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#C8922A]/25 focus:border-[#C8922A]"
          />
        </div>
      </div>

      {error && <p className="text-center text-sm text-[#C0392B] mt-4 px-4">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="bg-[#C8922A] text-[#1A0A00] rounded-xl py-4 font-bold text-base mx-4 mt-6 active:scale-95 transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Spinner className="w-5 h-5" /> Đang gửi...
          </>
        ) : (
          'Xác nhận đặt hàng'
        )}
      </button>
    </div>
  );
}

function Header({ onBack }) {
  return (
    <header className="sticky top-0 z-20 bg-[#1A0A00] h-16 px-4 flex items-center gap-3">
      <button onClick={onBack} className="text-white text-2xl leading-none p-1" aria-label="Quay lại">
        ←
      </button>
      <h1 className="font-display italic text-[#C8922A] text-lg">Xác nhận đơn hàng</h1>
    </header>
  );
}
