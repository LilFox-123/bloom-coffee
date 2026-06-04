import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
import { formatVND } from '../../utils/format';
import Logo from '../../components/Logo';
import { IconCart } from '../../components/Icons';

const TABS = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];

const SLIDES = [
  {
    bg: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=80',
    product:
      'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=520&q=80',
    productAlt: 'Matcha Latte Nhật Bản',
    fallbackColor: '#3B2314',
    badge: { text: 'MỚI', cls: 'bg-[#C89B3C] text-white' },
    heading: ['Matcha Latte', 'Nhật Bản'],
    sub: 'Vị matcha nguyên chất từ Uji',
    subCls: 'text-[#F3DCA2]',
  },
  {
    bg: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80',
    product:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=520&q=80',
    productAlt: 'Mua 2 tặng 1',
    fallbackColor: '#1F5A3D',
    badge: { text: 'ƯU ĐÃI', cls: 'bg-white/15 text-white ring-1 ring-white/25' },
    heading: ['Mua 2 tặng 1'],
    sub: 'Áp dụng cho tất cả trà sữa hôm nay',
    subCls: 'text-green-100',
  },
  {
    bg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    product:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=520&q=80',
    productAlt: 'Tích điểm mỗi đơn hàng',
    fallbackColor: '#3B2314',
    badge: { text: 'ĐIỂM THƯỞNG', cls: 'bg-white/15 text-white ring-1 ring-white/25' },
    heading: ['Tích điểm', 'mỗi đơn hàng'],
    sub: '10.000₫ = 1 điểm · Đổi quà hấp dẫn',
    subCls: 'text-[#F3DCA2]',
  },
];

const CUSTOMER_MENU_CSS = `
  .customer-category-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .customer-category-scroll::-webkit-scrollbar {
    display: none;
  }
`;

const isNewItem = (item) =>
  item.createdAt && Date.now() - new Date(item.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

function PromoBanner() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative h-[220px] w-full overflow-hidden bg-[#3B2314]">
      {SLIDES.map((s, i) => (
        <div
          key={s.productAlt}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundColor: s.fallbackColor,
            backgroundImage: `linear-gradient(90deg, rgba(59,35,20,0.95) 0%, rgba(59,35,20,0.82) 40%, rgba(59,35,20,0.22) 70%, rgba(59,35,20,0.04) 100%), url("${s.bg}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
          aria-hidden={i !== idx}
        >
          <div className="relative z-10 flex h-full items-center px-5">
            <div className="max-w-[58%]">
              <span
                className={`inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-xs font-bold ${s.badge.cls}`}
              >
                {s.badge.text}
              </span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-normal text-white">
                {s.heading.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className={`mt-2 text-sm font-semibold ${s.subCls}`}>{s.sub}</p>
            </div>
            <div className="absolute right-4 top-1/2 z-10 aspect-square w-[34%] min-w-[112px] max-w-[156px] -translate-y-1/2">
              <img
                src={s.product}
                alt={s.productAlt}
                className="cust-float h-full w-full rounded-full object-cover shadow-[0_18px_38px_rgba(0,0,0,0.34)] ring-4 ring-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === idx ? 'w-5 bg-[#C89B3C]' : 'w-2 bg-white/65'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function CoffeeCupPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#F4E6D4_0%,#FFF8EF_100%)] text-[#3B2314]">
      <svg
        aria-hidden="true"
        viewBox="0 0 80 80"
        className="h-14 w-14 text-[#C89B3C]"
        fill="none"
      >
        <path
          d="M22 32h32v15c0 9-7 16-16 16s-16-7-16-16V32Z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M22 32h32v15c0 9-7 16-16 16s-16-7-16-16V32Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M54 37h4a8 8 0 0 1 0 16h-4"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M30 24c-2-4 2-6 0-10M40 24c-2-4 2-6 0-10M50 24c-2-4 2-6 0-10"
          stroke="#3B2314"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M18 66h42" stroke="#3B2314" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="mt-2 text-xs font-bold text-[#7A5B46]">Bloom Coffee</span>
    </div>
  );
}

function ItemCard({ item, quantity, onAdd, onInc, onDec }) {
  const [flash, setFlash] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const available = item.isAvailable !== false;

  useEffect(() => {
    setImageFailed(false);
  }, [item.imageUrl]);

  const handleAdd = () => {
    onAdd();
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };

  const showImage = item.imageUrl && !imageFailed;

  return (
    <div
      className={`relative flex h-[316px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors ${
        flash ? 'ring-2 ring-[#C89B3C] cust-cart-flash' : ''
      }`}
    >
      <div className="relative h-1/2 shrink-0 bg-[#F4E6D4]">
        {showImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CoffeeCupPlaceholder />
        )}
        {isNewItem(item) && (
          <span className="absolute left-2 top-2 rounded-full bg-[#C89B3C] px-2 py-0.5 text-[10px] font-bold text-white">
            Mới
          </span>
        )}
        {!available && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="badge bg-[#FFEBEE] text-[#C62828]">Hết hàng</span>
          </div>
        )}
      </div>

      <div className="flex h-1/2 flex-col bg-white p-3">
        <p className="line-clamp-2 min-h-[2.45rem] text-sm font-bold leading-snug text-[#3B2314]">
          {item.name}
        </p>
        <p className="mt-1 text-base font-bold text-[#C89B3C]">{formatVND(item.price)}</p>
        <div className="mt-auto">
          {!available ? (
            <button
              disabled
              className="min-h-[44px] w-full cursor-not-allowed rounded-xl bg-[#F5F0EB] px-3 py-2 text-sm font-semibold text-[#9C8472]"
            >
              Hết hàng
            </button>
          ) : quantity > 0 ? (
            <div className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#FEF3DC] animate-fade-in">
              <button
                onClick={onDec}
                className="min-h-[44px] flex-1 px-3 text-lg font-bold text-[#C89B3C]"
                aria-label="Giảm"
              >
                −
              </button>
              <span className="min-w-[28px] text-center font-semibold text-[#3B2314]">{quantity}</span>
              <button
                onClick={onInc}
                className="min-h-[44px] flex-1 px-3 text-lg font-bold text-[#C89B3C]"
                aria-label="Tăng"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="min-h-[44px] w-full rounded-xl bg-[#C89B3C] px-3 py-2 text-sm font-bold text-white transition-transform active:scale-95"
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
    <div className="min-h-screen bg-[#FAF6F1] pb-28 text-[#3B2314]">
      <style>{CUSTOMER_MENU_CSS}</style>

      <header className="sticky top-0 z-20">
        <div className="flex h-16 items-center justify-between bg-[#3B2314] px-4">
          <div className="flex items-center gap-2">
            <Logo size={36} variant="white" />
            <span className="font-bold text-white">Bloom Coffee</span>
          </div>
          <button
            onClick={() => navigate(`/order/${tableId}/cart`)}
            className="relative flex h-11 w-11 items-center justify-center text-white"
            aria-label="Giỏ hàng"
          >
            <IconCart width={26} height={26} />
            {cart.count > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C89B3C] text-xs font-bold text-white">
                {cart.count}
              </span>
            )}
          </button>
        </div>
        <div className="bg-[#C89B3C] py-2 text-center text-sm font-semibold text-white">
          {table.tableName} · Gọi món tự phục vụ
        </div>
      </header>

      <PromoBanner />

      <div className="sticky top-[104px] z-10 mt-0 border-b border-[#E2D3C3] bg-[#FAF6F1] px-3 py-2.5">
        <div className="customer-category-scroll flex w-full gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-[#C89B3C] text-white'
                  : 'border border-[#3B2314] bg-white text-[#3B2314]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-[316px] rounded-2xl" />
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

      {cart.count > 0 && (
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 animate-slide-up">
          <div className="flex h-[72px] items-center justify-between rounded-t-3xl bg-[#3B2314] px-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex text-2xl">
                🛒
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C89B3C] text-xs font-bold text-white">
                  {cart.count}
                </span>
              </span>
              <span className="text-sm text-white">{cart.count} món đã chọn</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#C89B3C]">{formatVND(cart.total)}</span>
              <button
                onClick={() => navigate(`/order/${tableId}/cart`)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#C89B3C] px-4 font-semibold text-white transition-transform active:scale-95"
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
