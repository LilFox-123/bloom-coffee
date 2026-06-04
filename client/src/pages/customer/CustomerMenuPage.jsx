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
    bg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
    product:
      'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=720&q=85',
    accent:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=420&q=80',
    productAlt: 'Matcha Latte Nhật Bản',
    fallbackColor: '#3B2314',
    badge: { text: 'MỚI HÔM NAY', cls: 'bg-[#C89B3C] text-white' },
    heading: ['Matcha Latte', 'Nhật Bản'],
    sub: 'Vị matcha nguyên chất từ Uji, béo nhẹ và thơm mịn',
    cta: 'Thử ngay',
  },
  {
    bg: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=85',
    product:
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=720&q=85',
    accent:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=420&q=80',
    productAlt: 'Mua 2 tặng 1',
    fallbackColor: '#1F5A3D',
    badge: { text: 'ƯU ĐÃI COMBO', cls: 'bg-white/20 text-white ring-1 ring-white/25' },
    heading: ['Mua 2', 'tặng bánh'],
    sub: 'Gọi nước kèm croissant để bữa nhẹ trọn vị hơn',
    cta: 'Xem combo',
  },
  {
    bg: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=85',
    product:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=720&q=85',
    accent:
      'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=420&q=80',
    productAlt: 'Tích điểm mỗi đơn hàng',
    fallbackColor: '#3B2314',
    badge: { text: 'ĐIỂM THƯỞNG', cls: 'bg-white/20 text-white ring-1 ring-white/25' },
    heading: ['Tích điểm', 'mỗi đơn hàng'],
    sub: '10.000₫ = 1 điểm, đổi topping hoặc món yêu thích',
    cta: 'Đặt món ngay',
  },
];

const PROMO_CAMPAIGNS = [
  {
    title: 'Combo sáng tỉnh táo',
    desc: 'Cà phê + bánh ngọt, tiết kiệm hơn khi gọi cùng nhau',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=520&q=80',
    tone: 'from-[#3B2314]/95 to-[#3B2314]/35',
  },
  {
    title: 'Trà trái cây mát lành',
    desc: 'Ưu đãi nhóm bạn khi chọn trà và nước ép',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=520&q=80',
    tone: 'from-[#1F5A3D]/95 to-[#1F5A3D]/30',
  },
  {
    title: 'Bánh mới ra lò',
    desc: 'Thêm bánh croissant cho ly nước của bạn',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=520&q=80',
    tone: 'from-[#8A4E24]/95 to-[#8A4E24]/30',
  },
];

const CUSTOMER_WIDGETS = [
  { icon: '⚡', title: 'Pha nhanh', desc: 'Ước tính 10-15 phút' },
  { icon: '🎁', title: 'Ưu đãi hôm nay', desc: 'Combo nước + bánh' },
  { icon: '⭐', title: 'Món mới', desc: 'Cập nhật mỗi tuần' },
];

const ITEM_STATUS_LABELS = {
  dangphache: 'Đang pha chế',
  chuanbiphucvu: 'Chuẩn bị phục vụ',
  daphucvu: 'Đã phục vụ',
};

const ITEM_STATUS_CLASSES = {
  dangphache: 'bg-[#FEF3DC] text-[#C8922A]',
  chuanbiphucvu: 'bg-[#E3F2FD] text-[#1565C0]',
  daphucvu: 'bg-[#E8F5E9] text-[#2E7D32]',
};

const CUSTOMER_MENU_CSS = `
  .customer-category-scroll {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .customer-category-scroll::-webkit-scrollbar {
    display: none;
  }

  @keyframes customer-float {
    0%, 100% { transform: translateY(0) rotate(-1deg) scale(1); }
    50% { transform: translateY(-10px) rotate(1deg) scale(1.015); }
  }

  @keyframes customer-rise {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes customer-shine {
    0% { transform: translateX(-120%) rotate(18deg); }
    100% { transform: translateX(180%) rotate(18deg); }
  }

  .customer-float {
    animation: customer-float 5.5s ease-in-out infinite;
  }

  .customer-rise {
    animation: customer-rise 620ms ease both;
  }

  .customer-shine::after {
    content: "";
    position: absolute;
    inset: -50%;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent);
    animation: customer-shine 4.8s ease-in-out infinite;
  }
`;

const isNewItem = (item) =>
  item.createdAt && Date.now() - new Date(item.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

function PromoBanner() {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-[360px] w-full overflow-hidden bg-[#3B2314]">
      {SLIDES.map((s, i) => (
        <div
          key={s.productAlt}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundColor: s.fallbackColor,
            backgroundImage: `linear-gradient(160deg, rgba(59,35,20,0.96) 0%, rgba(59,35,20,0.76) 42%, rgba(59,35,20,0.16) 100%), url("${s.bg}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
          aria-hidden={i !== idx}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_26%,rgba(255,255,255,0.28),transparent_25%),linear-gradient(180deg,transparent,rgba(0,0,0,0.24))]" />

      <div className="relative z-10 grid min-h-[360px] grid-cols-[0.92fr_1.08fr] items-center gap-4 px-5 py-6">
        <div className="customer-rise relative z-20">
          <span
            className={`inline-flex min-h-[30px] items-center rounded-full px-3 py-1 text-xs font-extrabold shadow-lg ${slide.badge.cls}`}
          >
            {slide.badge.text}
          </span>
          <h2 className="mt-4 text-[38px] font-black leading-[0.98] tracking-normal text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.42)]">
            {slide.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-4 max-w-[230px] rounded-2xl bg-[#1E1008]/70 px-4 py-3 text-sm font-bold leading-relaxed text-[#FFF7E8] shadow-[0_12px_28px_rgba(0,0,0,0.25)] ring-1 ring-white/10 backdrop-blur-sm">
            {slide.sub}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-2xl bg-[#C89B3C] px-4 py-2 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(200,155,60,0.32)]">
              {slide.cta}
            </span>
            <span className="rounded-2xl bg-white/20 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/20 backdrop-blur">
              Freeship tại bàn
            </span>
          </div>
        </div>

        <div className="relative min-h-[292px]">
          <div className="customer-shine absolute right-0 top-2 h-[250px] w-[88%] overflow-hidden rounded-[34px] border border-white/20 bg-white/10 shadow-[0_24px_58px_rgba(0,0,0,0.38)]">
            <img
              src={slide.product}
              alt={slide.productAlt}
              className="customer-float h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="absolute bottom-3 left-0 h-24 w-28 overflow-hidden rounded-3xl border border-white/25 bg-white/20 p-1 shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur">
            <img src={slide.accent} alt="" className="h-full w-full rounded-[20px] object-cover" />
          </div>

          <div className="absolute bottom-1 right-2 rounded-2xl bg-white/90 px-3 py-2 text-xs font-extrabold text-[#3B2314] shadow-[0_14px_28px_rgba(0,0,0,0.24)]">
            Hot deal hôm nay
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === idx ? 'w-5 bg-[#C89B3C]' : 'w-2 bg-white/60'
            }`}
            aria-label={`Chọn ưu đãi ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function CustomerWidgetStrip() {
  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-3">
      {CUSTOMER_WIDGETS.map((widget, index) => (
        <div
          key={widget.title}
          className="customer-rise rounded-2xl border border-[#E7D4C1] bg-white px-3 py-3 text-center shadow-[0_8px_18px_rgba(59,35,20,0.06)]"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF3D8] text-lg">
            {widget.icon}
          </span>
          <p className="mt-2 text-[11px] font-extrabold leading-tight text-[#3B2314]">{widget.title}</p>
          <p className="mt-1 text-[10px] font-semibold leading-tight text-[#8A6F5D]">{widget.desc}</p>
        </div>
      ))}
    </div>
  );
}

function PromoCampaignStrip() {
  return (
    <section className="px-4 pb-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[#3B2314]">Ưu đãi nổi bật</h3>
        <span className="rounded-full bg-[#FFF3D8] px-3 py-1 text-xs font-bold text-[#C89B3C]">
          Chỉ hôm nay
        </span>
      </div>
      <div className="customer-category-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {PROMO_CAMPAIGNS.map((promo) => (
          <article
            key={promo.title}
            className="relative h-[132px] min-w-[238px] overflow-hidden rounded-3xl bg-[#3B2314] shadow-[0_12px_26px_rgba(59,35,20,0.14)]"
          >
            <img src={promo.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${promo.tone}`} />
            <div className="relative z-10 flex h-full flex-col justify-end p-4">
              <p className="text-base font-black leading-tight text-white">{promo.title}</p>
              <p className="mt-1 max-w-[180px] text-xs font-semibold leading-snug text-white/80">
                {promo.desc}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewProductSpotlight({ items, onAdd }) {
  if (!items.length) return null;

  const hero = items[0];
  const rest = items.slice(1, 3);

  return (
    <section className="px-4 pb-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-[#3B2314]">Sản phẩm mới nên thử</h3>
        <span className="rounded-full bg-[#EAF7EF] px-3 py-1 text-xs font-bold text-[#0F8A4B]">
          New
        </span>
      </div>

      <div className="grid gap-3">
        <article className="relative min-h-[164px] overflow-hidden rounded-3xl bg-[#3B2314] shadow-[0_14px_30px_rgba(59,35,20,0.16)]">
          {hero.imageUrl ? (
            <img src={hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0">
              <CoffeeCupPlaceholder />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A160D]/95 via-[#2A160D]/68 to-transparent" />
          <div className="relative z-10 flex min-h-[164px] max-w-[62%] flex-col justify-center p-4">
            <span className="mb-2 w-fit rounded-full bg-[#C89B3C] px-3 py-1 text-[10px] font-black text-white">
              MÓN MỚI
            </span>
            <p className="line-clamp-2 text-xl font-black leading-tight text-white">{hero.name}</p>
            <p className="mt-1 text-sm font-bold text-[#F8E8C2]">{formatVND(hero.price)}</p>
            <button
              type="button"
              onClick={() => onAdd(hero)}
              className="mt-3 min-h-[44px] w-fit rounded-xl bg-white px-4 text-sm font-extrabold text-[#3B2314]"
            >
              + Thêm ngay
            </button>
          </div>
        </article>

        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {rest.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => onAdd(item)}
                className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-[#E7D4C1] bg-white p-2 text-left shadow-[0_8px_18px_rgba(59,35,20,0.06)]"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4E6D4]">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CoffeeCupPlaceholder />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-xs font-extrabold leading-tight text-[#3B2314]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#C89B3C]">{formatVND(item.price)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ItemStatusPill({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
        ITEM_STATUS_CLASSES[status] || ITEM_STATUS_CLASSES.dangphache
      }`}
    >
      {ITEM_STATUS_LABELS[status] || ITEM_STATUS_LABELS.dangphache}
    </span>
  );
}

function MyOrdersPanel({ open, orders, loading, onClose, onRefresh, tableName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        aria-label="Đóng đơn của tôi"
        onClick={onClose}
      />
      <section className="relative max-h-[82vh] w-full overflow-hidden rounded-t-[28px] bg-[#FAF6F1] shadow-2xl animate-slide-up">
        <div className="flex justify-center pt-3">
          <span className="h-1.5 w-10 rounded-full bg-[#D8C2AC]" />
        </div>

        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9C8472]">{tableName}</p>
            <h2 className="text-lg font-black text-[#3B2314]">Đơn của tôi</h2>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[40px] rounded-xl bg-white px-3 text-sm font-bold text-[#C89B3C] shadow-sm"
          >
            Làm mới
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-[#E3D3C4] bg-white p-5 text-center">
              <p className="text-sm font-bold text-[#3B2314]">Bạn chưa có đơn đang chờ</p>
              <p className="mt-1 text-xs font-medium text-[#8A6F5D]">
                Sau khi đặt món, trạng thái đơn sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const shortId = String(order.orderId).slice(-8).toUpperCase();
                const createdAt = order.createdAt
                  ? new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';
                return (
                  <article
                    key={order.orderId}
                    className="overflow-hidden rounded-2xl border border-[#E3D3C4] bg-white shadow-[0_8px_20px_rgba(59,35,20,0.06)]"
                  >
                    <div className="bg-[#3B2314] px-4 py-3 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
                            #{shortId}
                          </p>
                          <p className="mt-1 text-base font-black">{order.statusLabel}</p>
                        </div>
                        <span className="rounded-full bg-[#C89B3C] px-3 py-1 text-xs font-bold text-white">
                          {order.paymentStatusLabel}
                        </span>
                      </div>
                      {createdAt && <p className="mt-1 text-xs font-semibold text-white/65">Đặt lúc {createdAt}</p>}
                    </div>

                    <div className="divide-y divide-[#F3E8D8]">
                      {order.items.map((item, idx) => (
                        <div key={`${item.name}-${idx}`} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-bold text-[#3B2314]">
                              <span className="text-[#C89B3C]">{item.quantity}×</span> {item.name}
                            </p>
                          </div>
                          <ItemStatusPill status={item.status} />
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
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
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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

  const loadMyOrders = () => {
    setOrdersLoading(true);
    api
      .get(`/public/table/${tableId}/orders`)
      .then((res) => setMyOrders(res.data.data.orders || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    const fetchOrders = () => {
      api
        .get(`/public/table/${tableId}/orders`)
        .then((res) => {
          if (active) setMyOrders(res.data.data.orders || []);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setOrdersLoading(false);
        });
    };
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [tableId]);

  const allItems = useMemo(
    () => categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c.name }))),
    [categories]
  );
  const visible = tab === 'Tất cả' ? allItems : allItems.filter((i) => i.category === tab);
  const featuredItems = useMemo(() => {
    const cartIds = new Set(cart.list.map((row) => row.menuItem._id));
    const pool = allItems.filter((item) => !cartIds.has(item._id));
    const preferred = pool.filter((item) => {
      const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
      return (
        text.includes('matcha') ||
        text.includes('latte') ||
        text.includes('bánh') ||
        text.includes('croissant') ||
        text.includes('trà')
      );
    });
    return (preferred.length ? preferred : pool).slice(0, 3);
  }, [allItems, cart.list]);

  return (
    <div className="min-h-screen bg-[#FAF6F1] pb-28 text-[#3B2314]">
      <style>{CUSTOMER_MENU_CSS}</style>

      <header className="sticky top-0 z-20">
        <div className="flex h-16 items-center justify-between bg-[#3B2314] px-4">
          <div className="flex items-center gap-2">
            <Logo size={36} variant="white" />
            <span className="font-bold text-white">Bloom Coffee</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOrdersOpen(true)}
              className="relative flex min-h-[44px] items-center rounded-xl bg-white/10 px-3 text-sm font-bold text-white ring-1 ring-white/15"
            >
              Đơn
              {myOrders.length > 0 && (
                <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C89B3C] px-1 text-xs font-black text-white">
                  {myOrders.length}
                </span>
              )}
            </button>
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
        </div>
        <div className="bg-[#C89B3C] py-2 text-center text-sm font-semibold text-white">
          {table.tableName} · Gọi món tự phục vụ
        </div>
      </header>

      <PromoBanner />
      {myOrders.length > 0 && (
        <button
          type="button"
          onClick={() => setOrdersOpen(true)}
          className="mx-4 mt-3 flex min-h-[54px] w-[calc(100%-2rem)] items-center justify-between rounded-2xl bg-[#3B2314] px-4 text-left text-white shadow-[0_12px_26px_rgba(59,35,20,0.18)]"
        >
          <span>
            <span className="block text-sm font-black">Bạn có {myOrders.length} đơn đang xử lý</span>
            <span className="mt-0.5 block text-xs font-semibold text-white/65">
              Bấm để xem trạng thái từng món
            </span>
          </span>
          <span className="rounded-xl bg-[#C89B3C] px-3 py-2 text-xs font-black">Xem</span>
        </button>
      )}
      <CustomerWidgetStrip />
      <PromoCampaignStrip />
      {!loading && <NewProductSpotlight items={featuredItems} onAdd={(item) => cart.add(item)} />}

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

      <MyOrdersPanel
        open={ordersOpen}
        orders={myOrders}
        loading={ordersLoading}
        tableName={table.tableName}
        onClose={() => setOrdersOpen(false)}
        onRefresh={loadMyOrders}
      />
    </div>
  );
}
