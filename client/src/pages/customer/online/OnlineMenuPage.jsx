import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { useCart } from '../../../context/CartContext';
import { formatVND } from '../../../utils/format';
import Logo from '../../../components/Logo';
import { IconCart } from '../../../components/Icons';

const TABS = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];
const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

function MenuCard({ item, qty, onAdd, onInc, onDec }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden flex flex-col">
      <div className="w-full h-28 bg-gradient-to-br from-[#2A241C] to-[#1A0A00] flex items-center justify-center">
        <img
          src={item.imageUrl || PLACEHOLDER_IMAGE}
          alt={item.name}
          className="w-full h-28 object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="font-display text-sm font-bold text-[#1A0A00] line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.name}
        </p>
        <p className="text-[#C8922A] font-bold text-base mt-1">{formatVND(item.price)}</p>
        <div className="mt-3">
          {qty > 0 ? (
            <div className="flex items-center justify-center bg-[#FEF3DC] rounded-xl">
              <button onClick={onDec} className="text-[#C8922A] font-bold text-lg px-3.5 py-2 min-h-[40px]" aria-label="Giảm">
                −
              </button>
              <span className="text-[#1A0A00] font-semibold min-w-[24px] text-center">{qty}</span>
              <button onClick={onInc} className="text-[#C8922A] font-bold text-lg px-3.5 py-2 min-h-[40px]" aria-label="Tăng">
                +
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="w-full rounded-xl py-2.5 text-sm font-bold bg-[#C8922A] text-[#1A0A00] min-h-[44px] transition-all hover:bg-[#A0721A] active:scale-95"
            >
              + Thêm vào giỏ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnlineMenuPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('Tất cả');

  useEffect(() => {
    let active = true;
    api
      .get('/public/menu')
      .then((res) => active && setCategories(res.data.data.categories))
      .catch(() => active && setError(true))
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
    <div className="mx-auto w-full max-w-[480px] min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="bg-[#1A0A00] h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={36} variant="white" />
            <span className="font-display italic text-[#C8922A] text-lg">Bloom Coffee</span>
          </div>
          <button
            onClick={() => cart.count > 0 && navigate('/order/confirm')}
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
          Đặt món online · Bloom Coffee
        </div>
        {/* Category tabs */}
        <div className="bg-[#FDF8F3] border-b border-[#E8D5BC] px-3 py-2.5 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tab === t ? 'bg-[#C8922A] text-white' : 'text-[#4A3728] bg-white border border-[#E8D5BC]'
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
      ) : error ? (
        <div className="text-center text-[#9C8472] py-20 px-6">
          Không tải được thực đơn. Vui lòng thử lại sau.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {visible.map((item) => (
            <MenuCard
              key={item._id}
              item={item}
              qty={cart.qtyOf(item._id)}
              onAdd={() => cart.add(item)}
              onInc={() => cart.inc(item._id)}
              onDec={() => cart.dec(item._id)}
            />
          ))}
        </div>
      )}

      {/* Floating cart */}
      {cart.count > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 animate-slide-up">
          <div className="bg-[#1A0A00] rounded-t-2xl px-5 py-4 shadow-2xl flex items-center justify-between">
            <div className="text-white text-sm">
              <span className="font-semibold">{cart.count} món</span> ·{' '}
              <span className="font-bold">{formatVND(cart.total)}</span>
            </div>
            <button
              onClick={() => navigate('/order/confirm')}
              className="bg-[#C8922A] rounded-xl px-5 py-2.5 text-[#1A0A00] font-bold active:scale-95 transition-transform"
            >
              Đặt hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
