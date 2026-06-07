import { useEffect, useMemo, useState, Fragment } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState, TableSkeleton } from '../components/ui';
import { IconSearch, IconPlus } from '../components/Icons';
import Modal from '../components/Modal';
import { formatVND, formatDate, formatDateTime } from '../utils/format';

const emptyForm = { name: '', phone: '', email: '' };

const TIER_META = {
  Diamond: {
    label: 'Diamond',
    range: 'Từ 1.000 điểm',
    benefit: 'Giảm 15% + ưu tiên nhận khuyến mãi mới',
    className: 'from-[#1F2937] via-[#4C1D95] to-[#C89B3C]',
    badge: 'bg-[#F3E8FF] text-[#6D28D9]',
  },
  Gold: {
    label: 'Gold',
    range: '500 - 999 điểm',
    benefit: 'Giảm 10% cho đơn từ 50.000đ',
    className: 'from-[#8A5A12] via-[#C89B3C] to-[#F8D98A]',
    badge: 'bg-[#FFF3D8] text-[#A56D13]',
  },
  Silver: {
    label: 'Silver',
    range: '200 - 499 điểm',
    benefit: 'Giảm 5% cho đơn từ 50.000đ',
    className: 'from-[#4B5563] via-[#9CA3AF] to-[#E5E7EB]',
    badge: 'bg-[#EEF2FF] text-[#4F46E5]',
  },
  Member: {
    label: 'Member',
    range: '0 - 199 điểm',
    benefit: 'Tích điểm cơ bản, giảm 3.000đ mỗi ly nước',
    className: 'from-[#3B2314] via-[#6E4A32] to-[#C89B3C]',
    badge: 'bg-[#E3F2FD] text-[#1565C0]',
  },
};

const MEMBERSHIP_SLIDES = [
  {
    image: '/images/menu/menu-admin-hero-promo.png',
    alt: 'Bloom Coffee membership promotion',
  },
  {
    image: '/images/menu/golden-hour-promo.png',
    alt: 'Bloom Coffee golden hour promotion',
  },
  {
    image: '/images/menu/menu-promo-banner.svg',
    alt: 'Bloom Coffee voucher promotion',
  },
];

function getMemberTier(points = 0) {
  if (points >= 1000) return 'Diamond';
  if (points >= 500) return 'Gold';
  if (points >= 200) return 'Silver';
  return 'Member';
}

function MembershipSlide({ slide }) {
  return (
    <div className="relative h-[320px] overflow-hidden rounded-[30px] border border-[#E8D5BC] bg-[#3B2314] shadow-[0_20px_48px_rgba(59,35,20,0.18)] sm:h-[340px] xl:h-[356px]">
      <img src={slide.image} alt={slide.alt} className="h-full w-full object-cover" loading="eager" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1A0F00]/18 via-transparent to-transparent" />
    </div>
  );
}

function TierMiniCard({ tier, count }) {
  const meta = TIER_META[tier];
  return (
    <div className="flex min-h-[108px] flex-col justify-center rounded-2xl border border-[#E8D5BC] bg-white p-4 shadow-[0_10px_26px_rgba(59,35,20,0.06)] xl:min-h-0">
      <div className={`mb-3 h-2 rounded-full bg-gradient-to-r ${meta.className}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-[#1A0F00]">{meta.label}</p>
          <p className="mt-0.5 text-xs font-bold text-[#8A6F5D]">{meta.range}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${meta.badge}`}>{count}</span>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#6B4B37]">{meta.benefit}</p>
    </div>
  );
}

function StatCard({ label, value, helper, tone = 'gold' }) {
  const tones = {
    gold: 'bg-[#FFF3D8] text-[#A56D13]',
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    blue: 'bg-[#E3F2FD] text-[#1565C0]',
  };

  return (
    <div className="rounded-2xl border border-[#E8D5BC] bg-white p-4 shadow-[0_10px_26px_rgba(59,35,20,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#8A6F5D]">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}>{helper}</span>
      </div>
      <p className="mt-3 text-3xl font-black text-[#1A0F00]">{value}</p>
    </div>
  );
}

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});
  const [activeSlide, setActiveSlide] = useState(0);

  const load = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((current) => (current + 1) % MEMBERSHIP_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(
    () => ({
      total: customers.length,
      points: customers.reduce((s, c) => s + c.points, 0),
      drinkDiscountCustomers: customers.filter((c) => c.points > 0 || c.totalSpent > 0).length,
    }),
    [customers]
  );

  const tierCounts = useMemo(
    () =>
      customers.reduce(
        (acc, customer) => {
          const tier = getMemberTier(customer.points || 0);
          acc[tier] += 1;
          return acc;
        },
        { Member: 0, Silver: 0, Gold: 0, Diamond: 0 }
      ),
    [customers]
  );

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email || '').toLowerCase().includes(search.toLowerCase())
      ),
    [customers, search]
  );

  const toggleExpand = async (customer) => {
    if (expanded === customer._id) {
      setExpanded(null);
      return;
    }
    setExpanded(customer._id);
    if (!history[customer._id]) {
      try {
        const res = await api.get(`/customers/${customer._id}/history`);
        setHistory((h) => ({ ...h, [customer._id]: res.data.data }));
      } catch (err) {
        toast.error(err.message);
        setHistory((h) => ({ ...h, [customer._id]: [] }));
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      await api.post('/customers', form);
      toast.success('Đã thêm khách hàng');
      setModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendPromo = async (customer) => {
    try {
      await api.post(`/customers/${customer._id}/promo`);
      toast.success(`Đã gửi thông báo khuyến mãi đến ${customer.name || customer.phone}`);
    } catch (err) {
      toast.error('Không thể gửi thông báo. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] p-6 text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
              Loyalty
            </span>
            <h1 className="mt-4 text-4xl font-black xl:text-5xl">Khách hàng thân thiết</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/75">
              Theo dõi điểm tích lũy, lịch sử mua gần nhất và gửi ưu đãi nhanh cho từng khách hàng.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus width={18} height={18} /> Thêm khách hàng
          </button>
        </div>
      </section>

      <section className="mb-5 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
        <div className="flex min-h-0 flex-col">
          <MembershipSlide slide={MEMBERSHIP_SLIDES[activeSlide]} />
          <div className="mt-3 flex justify-center gap-2">
            {MEMBERSHIP_SLIDES.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                aria-label={`Chuyển đến slide membership ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeSlide === index ? 'w-8 bg-[#C89B3C]' : 'w-2.5 bg-[#D8C2AC]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 xl:grid-rows-3">
          <StatCard label="Tổng khách hàng" value={stats.total} helper="Hồ sơ" tone="blue" />
          <StatCard label="Tổng điểm đã phát" value={stats.points.toLocaleString('vi-VN')} helper="Điểm" tone="green" />
          <StatCard label="Đang dùng member" value={stats.drinkDiscountCustomers} helper="Giảm 3k/ly" tone="gold" />
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {['Member', 'Silver', 'Gold', 'Diamond'].map((tier) => (
          <TierMiniCard key={tier} tier={tier} count={tierCounts[tier]} />
        ))}
      </section>

      <section className="mb-6 rounded-[24px] border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full max-w-md">
            <IconSearch width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8472]" />
            <input
              className="min-h-[48px] w-full rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              placeholder="Tìm tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['Giảm 3.000đ/ly nước', '10.000đ = 1 điểm', 'Đổi điểm nhận voucher'].map((label) => (
              <span key={label} className="rounded-full border border-[#E8D5BC] bg-[#FFF8EF] px-3 py-2 text-xs font-black text-[#6B4B37]">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Chưa có khách hàng" action={<button className="btn-primary" onClick={() => setModal(true)}>Thêm khách hàng</button>} />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="w-12 px-4 py-3 text-left font-medium"></th>
                  <th className="px-4 py-3 text-left font-medium">Tên</th>
                  <th className="px-4 py-3 text-left font-medium">SĐT</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-center font-medium">Điểm tích lũy</th>
                  <th className="px-4 py-3 text-right font-medium">Tổng chi tiêu</th>
                  <th className="px-4 py-3 text-left font-medium">Ngày tham gia</th>
                  <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <Fragment key={customer._id}>
                    <tr className="border-b border-brdr hover:bg-muted">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-[#8A6F5D] hover:bg-[#FEF6EC] hover:text-[#C8922A]"
                          aria-label={expanded === customer._id ? 'Thu gọn lịch sử mua hàng' : 'Mở lịch sử mua hàng'}
                          onClick={() => toggleExpand(customer)}
                        >
                          {expanded === customer._id ? '▲' : '▼'}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{customer.name}</td>
                      <td className="px-4 py-3">{customer.phone}</td>
                      <td className="px-4 py-3 text-text-muted">{customer.email || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${TIER_META[getMemberTier(customer.points || 0)].badge}`}>
                            {getMemberTier(customer.points || 0)}
                          </span>
                          <Badge color={customer.points >= 200 ? 'green' : 'blue'}>{customer.points} điểm</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatVND(customer.totalSpent)}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(customer.joinedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {customer.points > 0 && (
                            <button
                              className="rounded-lg border border-[#C8922A] px-3 py-1.5 text-xs font-bold text-[#C8922A] hover:bg-[#FFF3D8]"
                              onClick={() => sendPromo(customer)}
                            >
                              Gửi KM
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === customer._id && (
                      <tr className="bg-[#FEF6EC]">
                        <td colSpan={8} className="border-t border-[#E8D5BC] px-6 py-4">
                          <p className="mb-3 text-sm font-semibold text-[#1A0F00]">Lịch sử mua hàng gần đây</p>
                          {!history[customer._id] ? (
                            <p className="text-sm text-[#9C8472]">Đang tải...</p>
                          ) : history[customer._id].length === 0 ? (
                            <p className="text-sm text-[#9C8472]">Chưa có lịch sử mua hàng</p>
                          ) : (
                            <table className="w-full overflow-hidden rounded-xl bg-white text-sm">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Ngày</th>
                                  <th className="px-4 py-2 text-center font-medium">Số món</th>
                                  <th className="px-4 py-2 text-right font-medium">Tổng tiền</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history[customer._id].map((invoice) => (
                                  <tr key={invoice._id} className="border-t border-[#E8D5BC]">
                                    <td className="px-4 py-2 text-[#6B4B37]">{formatDateTime(invoice.createdAt)}</td>
                                    <td className="px-4 py-2 text-center">{invoice.items?.length || 0}</td>
                                    <td className="px-4 py-2 text-right font-semibold">{formatVND(invoice.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Thêm khách hàng">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label">Họ tên</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div>
            <label className="label">SĐT</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
