import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/format';

const PAYMENT_LABELS = {
  tienmat: 'Tiền mặt',
  chuyenkhoan: 'Chuyển khoản',
  vidientu: 'Ví điện tử',
};

function StatusChip({ status }) {
  if (status === 'daphucvu') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32]">
        ✓ Đã phục vụ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#FEF3DC] text-[#C8922A]">
      <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#C8922A]" />
      Đang pha chế
    </span>
  );
}

export default function CustomerSuccessPage() {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    api
      .get(`/public/order/${orderId}/status`)
      .then((res) => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 15000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const createdLabel = order?.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const shortId = orderId.slice(-8).toUpperCase();
  const paymentLabel = PAYMENT_LABELS[cart.paymentMethod] || 'Tiền mặt';

  return (
    <div className="min-h-screen bg-[#FDF8F3] px-5 py-10 flex flex-col items-center">
      {/* checkmark */}
      <div className="check-circle w-24 h-24 rounded-full bg-[#E8F5E9] flex items-center justify-center">
        <svg className="check-mark" viewBox="0 0 52 52" width="48" height="48" fill="none">
          <path
            d="M14 27l8 8 16-16"
            stroke="#2E7D32"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[#1A0F00] mt-5 text-center">Đặt món thành công! 🎉</h1>
      <p className="text-[#9C8472] mt-1 text-center">Nhân viên sẽ chuẩn bị đơn hàng của bạn</p>

      {/* order info */}
      <div className="bg-white rounded-2xl border border-[#E8D5BC] p-5 mt-6 w-full space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Mã đơn</span>
          <span className="font-mono text-[#C8922A] font-bold">#{shortId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Bàn</span>
          <span className="text-[#1A0F00] font-medium">{order?.tableName || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Thời gian đặt</span>
          <span className="text-[#1A0F00] font-medium">{createdLabel || '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#9C8472]">Hình thức TT</span>
          <span className="badge bg-[#FEF3DC] text-[#C8922A]">{paymentLabel}</span>
        </div>
      </div>

      {/* tracking */}
      <div className="w-full mt-6">
        <p className="text-sm font-semibold text-[#1A0F00] mb-2">Trạng thái món ăn</p>
        <div className="bg-white rounded-2xl border border-[#E8D5BC] overflow-hidden">
          {loading && !order ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-6 rounded-lg" />
              ))}
            </div>
          ) : (
            (order?.items || []).map((it, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between gap-3 p-4 ${
                  idx < (order.items.length - 1) ? 'border-b border-[#F3E8D8]' : ''
                }`}
              >
                <span className="text-sm text-[#1A0F00]">
                  <span className="text-[#C8922A] font-semibold">{it.quantity}×</span> {it.name}
                </span>
                <StatusChip status={it.status} />
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => navigate(`/order/${tableId}`)}
        className="w-full mt-6 border-2 border-[#C8922A] text-[#C8922A] rounded-xl py-3.5 font-semibold active:scale-95 transition-transform"
      >
        Gọi thêm món
      </button>

      <p className="text-xs text-[#9C8472] mt-5 text-center">
        Cần hỗ trợ? Gọi nhân viên hoặc liên hệ quầy
      </p>
    </div>
  );
}
