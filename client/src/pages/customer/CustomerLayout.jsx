import { useEffect, useState } from 'react';
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
        </div>
      </div>
    </CartProvider>
  );
}
