import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../api/client';

export default function OnlineSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('id') || '';
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const fetchStatus = () => {
      api
        .get(`/public/order/${orderId}/status`)
        .then((res) => active && setOrder(res.data.data))
        .catch(() => {});
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [orderId]);

  const shortId = orderId ? orderId.slice(-8).toUpperCase() : '--------';

  return (
    <div className="mx-auto w-full max-w-[480px] min-h-screen bg-[#FDF8F3] px-5 py-12 flex flex-col items-center">
      <div className="check-circle w-24 h-24 rounded-full bg-[#E8F5E9] flex items-center justify-center">
        <svg className="check-mark" viewBox="0 0 52 52" width="48" height="48" fill="none">
          <path d="M14 27l8 8 16-16" stroke="#4A8C5C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="font-display text-2xl font-bold text-[#1A0A00] mt-5 text-center">
        Đơn hàng của bạn đã được tiếp nhận!
      </h1>
      <p className="text-[#9C8472] mt-1 text-center">Nhân viên sẽ chuẩn bị đơn hàng của bạn ngay.</p>

      <div className="bg-white rounded-2xl border border-[#E8D5BC] p-5 mt-6 w-full space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Mã đơn hàng</span>
          <span className="font-mono text-[#C8922A] font-bold">#{shortId}</span>
        </div>
        {order?.tableName ? (
          <div className="flex justify-between">
            <span className="text-[#9C8472]">Bàn</span>
            <span className="text-[#1A0A00] font-medium">{order.tableName}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Trạng thái</span>
          <span className="text-[#1A0A00] font-medium">{order?.statusLabel || 'Chờ xử lý'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Thanh toán</span>
          <span className="text-[#1A0A00] font-medium">{order?.paymentStatusLabel || 'Chờ thanh toán'}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/order')}
        className="w-full mt-6 bg-[#C8922A] text-[#1A0A00] rounded-xl py-3.5 font-bold active:scale-95 transition-transform"
      >
        Đặt thêm
      </button>

      <p className="text-xs text-[#9C8472] mt-5 text-center">Cảm ơn bạn đã đặt món tại Bloom Coffee ☕</p>
    </div>
  );
}
