import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
import { formatVND } from '../../utils/format';
import Logo from '../../components/Logo';
import { IconCart } from '../../components/Icons';

const TABS = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];

const CATEGORY_EMOJI = {
  'Cà phê': '☕',
  Trà: '🍵',
  'Nước ép': '🥤',
  'Đồ ăn nhẹ': '🧁',
};
const emojiFor = (cat) => CATEGORY_EMOJI[cat] || '🍽️';

const isNewItem = (item) =>
  item.createdAt && Date.now() - new Date(item.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

/* ---------------- Hero promo carousel ---------------- */
const SLIDES = [
  {
    bg: 'linear-gradient(135deg, #3D2410 0%, #6B3A1F 100%)',
    badge: { text: 'MỚI', cls: 'bg-[#C8922A] text-white' },
    heading: ['Matcha Latte', 'Nhật Bản'],
    sub: 'Vị matcha nguyên chất từ Uji',
    subCls: 'text-[#C8922A]',
    right: <span className="cust-float text-3xl">🍵</span>,
  },
  {
    bg: 'linear-gradient(135deg, #1A4731 0%, #2D7A4F 100%)',
    badge: { text: 'ƯU ĐÃI', cls: 'bg-[#F59E0B] text-white', ping: true },
    heading: ['Mua 2 tặng 1'],
    sub: 'Áp dụng cho tất cả trà sữa hôm nay',
    subCls: 'text-green-200',
    right: (
      <div className="flex flex-col items-center">
        <span className="text-3xl">⏰</span>
        <span className="text-white/90 text-[11px] font-semibold mt-1">Còn 2h 30m</span>
      </div>
    ),
  },
  {
    bg: 'linear-gradient(135deg, #2C1A0E 0%, #5C3317 100%)',
    badge: { text: 'ĐIỂM THƯỞNG', cls: 'bg-[#C8922A] text-white' },
    heading: ['Tích điểm', 'mỗi đơn hàng'],
    sub: '10.000₫ = 1 điểm · Đổi quà hấp dẫn',
    subCls: 'text-[#E8C98A]',
    right: (
      <span className="text-3xl transition-transform duration-700 hover:rotate-[360deg] cursor-pointer">
        ⭐
      </span>
    ),
  },
];

function PromoBanner() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-4 mt-4">
      <div className="overflow-hidden rounded-2xl h-[130px]">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="min-w-full h-full flex items-center justify-between px-5"
              style={{ background: s.bg }}
            >
              <div className="min-w-0">
                <span className="relative inline-flex">
                  <span className={`relative z-10 rounded-full text-xs font-bold px-3 py-1 ${s.badge.cls}`}>
                    {s.badge.text}
                  </span>
                  {s.badge.ping && (
                    <span className="cust-ping absolute inset-0 rounded-full bg-[#F59E0B]" />
                  )}
                </span>
                <h2 className="text-white text-xl font-bold leading-tight mt-2">
                  {s.heading.map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <p className={`text-xs mt-1 ${s.subCls}`}>{s.sub}</p>
              </div>
              <div className="shrink-0 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                {s.right}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* dots */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all h-2 ${
              i === idx ? 'bg-[#C8922A] w-4' : 'bg-[#C8922A]/30 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- Enhanced item card ---------------- */
function ItemCard({ item, quantity, onAdd, onInc, onDec }) {
  const [flash, setFlash] = useState(false);
  const available = item.isAvailable !== false;

  const handleAdd = () => {
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  return (
    <div
      className={`relative rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col transition-colors ${
        flash ? 'border-2 border-[#C8922A] cust-cart-flash' : 'border border-[#E8D5BC]'
      }`}
    >
      <div className="relative h-32">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#FEF6EC] flex items-center justify-center text-4xl">
            {emojiFor(item.category)}
          </div>
        )}
        {isNewItem(item) && (
          <span className="absolute top-2 left-2 bg-[#C8922A] text-white text-[10px] font-bold rounded-full px-2 py-0.5">
            Mới
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="badge bg-[#FFEBEE] text-[#C62828]">Hết hàng</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-[#1A0F00] leading-snug line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </p>
        <p className="text-[#C8922A] font-bold text-base mt-1">{formatVND(item.price)}</p>
        <div className="mt-2">
          {!available ? (
            <button
              disabled
              className="w-full rounded-xl py-2 text-sm font-semibold bg-[#F5F0EB] text-[#9C8472] cursor-not-allowed"
            >
              Hết hàng
            </button>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-center bg-[#FEF3DC] rounded-xl animate-fade-in">
              <button onClick={onDec} className="text-[#C8922A] font-bold text-lg px-3.5 py-1.5 min-h-[40px]" aria-label="Giảm">
                −
              </button>
              <span className="text-[#1A0F00] font-semibold min-w-[24px] text-center">{quantity}</span>
              <button onClick={onInc} className="text-[#C8922A] font-bold text-lg px-3.5 py-1.5 min-h-[40px]" aria-label="Tăng">
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full bg-[#C8922A] text-white rounded-xl py-2 text-sm font-semibold active:scale-95 transition-transform"
            >
              + Thêm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
      </header>

      {/* Hero promo carousel */}
      <PromoBanner />

      {/* Category tabs */}
      <div className="sticky top-[104px] z-10 bg-[#FDF8F3] border-b border-[#E8D5BC] px-3 py-2.5 mt-4 overflow-x-auto">
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
            <ItemCard
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
          <div className="bg-[#2C1A0E] rounded-t-3xl px-5 h-[72px] shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex text-2xl">
                🛒
                <span className="absolute -top-1 -right-1 bg-[#C8922A] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {cart.count}
                </span>
              </span>
              <span className="text-white text-sm">{cart.count} món đã chọn</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#C8922A] font-bold text-lg">{formatVND(cart.total)}</span>
              <button
                onClick={() => navigate(`/order/${tableId}/cart`)}
                className="bg-[#C8922A] rounded-xl px-4 py-2 text-white font-semibold flex items-center gap-2 active:scale-95 transition-transform"
              >
                Xem giỏ →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
