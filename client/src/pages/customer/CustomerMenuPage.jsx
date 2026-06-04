import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
import { formatVND } from '../../utils/format';
import Logo from '../../components/Logo';
import { IconCart } from '../../components/Icons';
import MenuItemCard from '../../components/customer/MenuItemCard';

const TABS = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];

export default function CustomerMenuPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { table } = useTable();
  const cart = useCart();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Tất cả');

  useEffect(() => {
    let active = true;
    api
      .get('/public/menu')
      .then((res) => active && setCategories(res.data.data.categories))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const allItems = useMemo(
    () => categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c.name }))),
    [categories]
  );
  const visible = tab === 'Tất cả' ? allItems : allItems.filter((i) => i.category === tab);

  return (
    <div className="pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="bg-[#2C1A0E] h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={36} variant="white" />
            <span className="text-white font-bold">Bloom Coffee</span>
          </div>
          <button
            onClick={() => navigate(`/order/${tableId}/cart`)}
            className="relative text-white p-1"
            aria-label="Giỏ hàng"
          >
            <IconCart width={26} height={26} />
            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C8922A] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                {cart.count}
              </span>
            )}
          </button>
        </div>
        <div className="bg-[#C8922A] text-white text-sm font-semibold text-center py-2">
          {table.tableName} · Gọi món tự phục vụ
        </div>
        {/* Category tabs */}
        <div className="bg-[#FDF8F3] border-b border-[#E8D5BC] px-3 py-2.5 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'bg-[#C8922A] text-white'
                    : 'text-[#4A3728] bg-white border border-[#E8D5BC]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {visible.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              quantity={cart.qtyOf(item._id)}
              onAdd={() => cart.add(item)}
              onInc={() => cart.inc(item._id)}
              onDec={() => cart.dec(item._id)}
            />
          ))}
        </div>
      )}

      {/* Floating cart bar */}
      {cart.count > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 animate-slide-up">
          <div className="bg-[#2C1A0E] rounded-t-2xl px-5 py-4 shadow-2xl flex items-center justify-between">
            <div className="text-white text-sm">
              <span className="font-semibold">{cart.count} món</span> ·{' '}
              <span className="font-bold">{formatVND(cart.total)}</span>
            </div>
            <button
              onClick={() => navigate(`/order/${tableId}/cart`)}
              className="bg-[#C8922A] rounded-xl px-5 py-2.5 text-white font-semibold active:scale-95 transition-transform"
            >
              Xem giỏ hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
