import { useCallback, useEffect, useState } from 'react';
import { useParams, Outlet, useOutletContext } from 'react-router-dom';
import api from '../../api/client';
import { CartProvider } from '../../context/CartContext';
import { Spinner } from '../../components/ui';
import { IconWarn } from '../../components/Icons';

const CUSTOMER_FONT_STACK =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function useTable() {
  return useOutletContext();
}

function SeatChangeFloatingButton({ tableId }) {
  const [latestOrder, setLatestOrder] = useState(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const loadLatestOrder = useCallback(() => {
    if (!tableId) return;
    api
      .get(`/public/table/${tableId}/orders`)
      .then((res) => {
        const orders = res.data?.data?.orders || [];
        setLatestOrder(orders[0] || null);
      })
      .catch(() => {});
  }, [tableId]);

  useEffect(() => {
    loadLatestOrder();
    const intervalId = setInterval(loadLatestOrder, 10000);
    return () => clearInterval(intervalId);
  }, [loadLatestOrder]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  const requestStatus = latestOrder?.tableChangeRequest?.status || 'none';
  const disabled = sending || requestStatus === 'pending' || requestStatus === 'accepted';

  const handleRequestTableChange = async () => {
    if (!latestOrder?.orderId) {
      setNotice('Bạn có thể gửi yêu cầu đổi chỗ sau khi tạo đơn đầu tiên.');
      return;
    }

    setSending(true);
    setNotice('');
    try {
      const res = await api.post(`/public/order/${latestOrder.orderId}/table-change-request`, {
        note: 'Khách muốn đổi chỗ ngồi',
      });
      setLatestOrder(res.data.data);
      setNotice('Đã gửi yêu cầu đổi chỗ đến nhân viên.');
    } catch {
      setNotice('Chưa thể gửi yêu cầu. Vui lòng gọi nhân viên nếu cần hỗ trợ ngay.');
    } finally {
      setSending(false);
    }
  };

  const label =
    requestStatus === 'pending'
      ? 'Đã gửi đổi chỗ'
      : requestStatus === 'accepted'
      ? 'NV đã tiếp nhận'
      : sending
      ? 'Đang gửi...'
      : 'Muốn đổi chỗ';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-[480px]">
        <div className="ml-auto flex w-fit max-w-[calc(100%-1rem)] flex-col items-end gap-2">
          {notice && (
            <div className="max-w-[280px] rounded-2xl border border-[#E8D5BC] bg-white/95 px-3 py-2 text-right text-xs font-bold leading-5 text-[#3B2314] shadow-[0_10px_26px_rgba(59,35,20,0.14)] backdrop-blur">
              {notice}
            </div>
          )}
          <button
            type="button"
            onClick={handleRequestTableChange}
            disabled={disabled}
            className="min-h-[44px] rounded-full border border-white/50 bg-[#3B2314] px-4 text-xs font-black text-white shadow-[0_12px_28px_rgba(59,35,20,0.26)] transition active:scale-95 disabled:bg-[#D9C8B8] disabled:text-[#6F5948]"
          >
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLayout() {
  const { tableId } = useParams();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api
      .get(`/public/table/${tableId}`)
      .then((res) => active && setTable(res.data.data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tableId]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#FAF6F1] text-[#C89B3C]"
        style={{ fontFamily: CUSTOMER_FONT_STACK }}
      >
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (error || !table) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-[#FAF6F1] px-6 text-center"
        style={{ fontFamily: CUSTOMER_FONT_STACK }}
      >
        <div className="w-20 h-20 rounded-full bg-[#FFEBEE] text-[#C62828] flex items-center justify-center mb-4">
          <IconWarn width={36} height={36} />
        </div>
        <h1 className="text-xl font-bold text-[#3B2314]">Bàn không tồn tại</h1>
        <p className="text-[#9C8472] text-sm mt-2 max-w-xs">
          Mã QR có thể không hợp lệ. Vui lòng liên hệ nhân viên để được hỗ trợ.
        </p>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#FAF6F1]" style={{ fontFamily: CUSTOMER_FONT_STACK }}>
        <div className="relative mx-auto min-h-screen w-full max-w-[480px] bg-[#FAF6F1]">
          <Outlet context={{ table }} />
          <SeatChangeFloatingButton tableId={tableId} />
        </div>
      </div>
    </CartProvider>
  );
}
