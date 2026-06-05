import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/ui';
import { IconSearch, IconPlus, IconEdit, IconTrash } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatVND } from '../utils/format';

const CATEGORIES = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];
const emptyForm = {
  name: '',
  category: 'Cà phê',
  price: '',
  description: '',
  imageUrl: '',
  isAvailable: true,
};

const CATEGORY_IMAGES = {
  'Cà phê': '/images/menu/coffee-cup.svg',
  Trà: '/images/menu/tea-cup.svg',
  'Nước ép': '/images/menu/juice-glass.svg',
  'Đồ ăn nhẹ': '/images/menu/snack-plate.svg',
};
const PROMO_BANNER_IMAGE = '/images/menu/golden-hour-promo.png';

const CATEGORY_META = {
  'Cà phê': { icon: '☕', tint: 'from-[#5A2E19] to-[#C89B3C]' },
  Trà: { icon: '🍵', tint: 'from-[#166534] to-[#86A85D]' },
  'Nước ép': { icon: '🍊', tint: 'from-[#F97316] to-[#FACC15]' },
  'Đồ ăn nhẹ': { icon: '🥐', tint: 'from-[#A16207] to-[#F2C879]' },
};

function fallbackImage(category) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Cà phê'];
}

function getImage(m) {
  return m.imageUrl || fallbackImage(m.category);
}

function filterByPrice(item, priceFilter) {
  if (priceFilter === 'under40') return item.price < 40000;
  if (priceFilter === '40to50') return item.price >= 40000 && item.price <= 50000;
  if (priceFilter === 'over50') return item.price > 50000;
  return true;
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-white shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur">
      <p className="text-xs font-semibold text-white/70">{label}</p>
      <p className="mt-0.5 text-lg font-black">{value}</p>
    </div>
  );
}

function MenuHero({ items, onAdd, showAdd }) {
  const total = items.length;
  const available = items.filter((i) => i.isAvailable !== false).length;
  const avgPrice = total ? Math.round(items.reduce((sum, item) => sum + item.price, 0) / total) : 0;
  const featured = items.find((i) => i.imageUrl) || items[0];

  return (
    <section className="relative mb-5 overflow-hidden rounded-[26px] bg-[#3B2314] p-4 text-white shadow-[0_16px_38px_rgba(59,35,20,0.16)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(200,155,60,0.30),transparent_28%),linear-gradient(135deg,#3B2314_0%,#1E1009_58%,#C89B3C_135%)]" />
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#C89B3C]/25 blur-3xl" />
      <div className="relative grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="flex min-h-[260px] flex-col justify-between gap-4 px-1 py-2">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
              Bloom Coffee Menu
            </span>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white xl:text-4xl">Thực đơn hôm nay</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-white/78">
              Quản lý món, hình ảnh, giá bán và trạng thái phục vụ trong một giao diện trực quan hơn.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricPill label="Tổng món" value={total} />
            <MetricPill label="Còn hàng" value={available} />
            <MetricPill label="Giá TB" value={avgPrice ? formatVND(avgPrice) : '0 đ'} />
          </div>
        </div>

        <div className="relative h-[260px] overflow-hidden rounded-[24px] border border-white/15 bg-white/10 xl:h-[300px]">
          <img
            src={PROMO_BANNER_IMAGE}
            alt="Bloom Coffee promotion"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackImage(featured?.category || 'Cà phê');
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1D0F08]/58 via-transparent to-[#1D0F08]/10" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F9E6B8]">Ảnh quảng cáo</p>
              <p className="mt-1 text-2xl font-black">Giờ vàng đồng giá</p>
              {featured && <p className="mt-1 text-xs font-bold text-white/78">Món nổi bật: {featured.name}</p>}
            </div>
            {showAdd && (
              <button className="btn-primary shrink-0" onClick={onAdd}>
                <IconPlus width={18} height={18} /> Thêm món
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryButton({ category, active, count, onClick }) {
  const meta = CATEGORY_META[category] || { icon: '✨', tint: 'from-[#C89B3C] to-[#F4D98D]' };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[50px] items-center gap-3 rounded-2xl border px-4 text-left transition-all ${
        active
          ? 'border-[#C89B3C] bg-[#C89B3C] text-white shadow-[0_10px_22px_rgba(200,155,60,0.25)]'
          : 'border-[#E5D3BE] bg-white text-[#3B2314] hover:-translate-y-0.5 hover:border-[#C89B3C]/70 hover:shadow-[0_10px_22px_rgba(59,35,20,0.08)]'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.tint} text-base shadow-inner`}
      >
        {meta.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black">{category}</span>
        <span className={`block text-xs ${active ? 'text-white/75' : 'text-[#8A6F5D]'}`}>{count} món</span>
      </span>
    </button>
  );
}

function MenuCard({ item, isAdmin, onEdit, onDelete, onToggle }) {
  const [imageSrc, setImageSrc] = useState(getImage(item));

  useEffect(() => {
    setImageSrc(getImage(item));
  }, [item.imageUrl, item.category]);

  return (
    <article
      className={`menu-card group overflow-hidden rounded-[22px] border border-[#E8D5BC] bg-white shadow-[0_10px_28px_rgba(59,35,20,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(59,35,20,0.14)] ${
        !item.isAvailable ? 'opacity-70 grayscale-[0.2]' : ''
      }`}
    >
      <div className="relative h-[210px] overflow-hidden bg-[#F4E6D4]">
        <img
          src={imageSrc}
          alt={item.name}
          className="menu-card-img h-full w-full object-cover"
          onError={() => setImageSrc(fallbackImage(item.category))}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1E1009]/70 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#3B2314] shadow-sm">
          {item.category}
        </span>
        {isAdmin && (
          <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#6B4B37] shadow-sm transition hover:bg-[#C89B3C] hover:text-white"
              onClick={() => onEdit(item)}
              aria-label={`Sửa ${item.name}`}
            >
              <IconEdit width={16} height={16} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#6B4B37] shadow-sm transition hover:bg-[#EF4444] hover:text-white"
              onClick={() => onDelete(item)}
              aria-label={`Xóa ${item.name}`}
            >
              <IconTrash width={16} height={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-[158px] flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-black text-[#24140C]">{item.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-[38px] text-[13px] font-medium leading-5 text-[#8A6F5D]">
              {item.description || 'Món ngon của Bloom Coffee'}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-xl font-black text-[#C89B3C]">{formatVND(item.price)}</span>
          <button
            onClick={() => isAdmin && onToggle(item)}
            className={`badge border ${
              item.isAvailable
                ? 'badge-available border-[#BFD8C6] bg-[#E8F5E9] text-[#2E7D32]'
                : 'border-[#F3C2BA] bg-[#FFEBEE] text-[#C62828]'
            } ${isAdmin ? 'cursor-pointer hover:scale-105' : ''}`}
          >
            {item.isAvailable ? 'Còn hàng' : 'Hết hàng'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Menu() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/menu');
      setItems(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryCounts = useMemo(
    () =>
      CATEGORIES.reduce((acc, c) => {
        acc[c] = c === 'Tất cả' ? items.length : items.filter((item) => item.category === c).length;
        return acc;
      }, {}),
    [items]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = items.filter((m) => {
      const matchCategory = category === 'Tất cả' || m.category === category;
      const matchSearch = `${m.name || ''} ${m.description || ''}`.toLowerCase().includes(query);
      const matchAvailability =
        availability === 'all' ||
        (availability === 'available' && m.isAvailable !== false) ||
        (availability === 'unavailable' && m.isAvailable === false);
      return matchCategory && matchSearch && matchAvailability && filterByPrice(m, priceFilter);
    });

    return [...base].sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
      return 0;
    });
  }, [availability, category, items, priceFilter, search, sortBy]);

  const resetImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    resetImage();
    setModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      category: m.category,
      price: m.price,
      description: m.description,
      imageUrl: m.imageUrl || '',
      isAvailable: m.isAvailable,
    });
    setErrors({});
    resetImage();
    setModal(true);
  };

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên món';
    if (form.price === '' || Number(form.price) < 0) errs.price = 'Giá không hợp lệ';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('category', form.category);
    fd.append('price', String(Number(form.price)));
    fd.append('description', form.description || '');
    fd.append('imageUrl', form.imageUrl || '');
    fd.append('isAvailable', form.isAvailable ? 'true' : 'false');
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editing) {
        await api.patch(`/menu/${editing._id}`, fd);
        toast.success('Đã cập nhật món');
      } else {
        await api.post('/menu', fd);
        toast.success('Đã thêm món mới');
      }
      setModal(false);
      resetImage();
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleAvail = async (m) => {
    try {
      await api.patch(`/menu/${m._id}`, { isAvailable: !m.isAvailable });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const doDelete = async (m) => {
    try {
      await api.delete(`/menu/${m._id}`);
      toast.success('Đã xóa món');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <MenuHero items={items} onAdd={openAdd} showAdd={isAdmin} />

      <section className="mb-5 rounded-[24px] border border-[#E8D5BC] bg-white/82 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#24140C]">Thực đơn</h2>
            <p className="text-sm font-medium text-[#8A6F5D]">Danh sách món và giá bán</p>
          </div>
          {isAdmin && (
            <button className="btn-primary w-full xl:w-auto" onClick={openAdd}>
              <IconPlus width={18} height={18} /> Thêm món
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(260px,420px)_1fr]">
          <div className="relative">
            <IconSearch width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8472]" />
            <input
              className="min-h-[48px] w-full rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              placeholder="Tìm món, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              className="min-h-[48px] rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] px-4 text-sm font-bold text-[#3B2314] outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Còn hàng</option>
              <option value="unavailable">Hết hàng</option>
            </select>
            <select
              className="min-h-[48px] rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] px-4 text-sm font-bold text-[#3B2314] outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
            >
              <option value="all">Tất cả mức giá</option>
              <option value="under40">Dưới 40.000 đ</option>
              <option value="40to50">40.000 - 50.000 đ</option>
              <option value="over50">Trên 50.000 đ</option>
            </select>
            <select
              className="min-h-[48px] rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] px-4 text-sm font-bold text-[#3B2314] outline-none focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sắp xếp mặc định</option>
              <option value="priceAsc">Giá thấp đến cao</option>
              <option value="priceDesc">Giá cao đến thấp</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {CATEGORIES.map((c) => (
            <CategoryButton
              key={c}
              category={c}
              active={category === c}
              count={categoryCounts[c] || 0}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#6B4B37]">
          Đang hiển thị <span className="text-[#C89B3C]">{filtered.length}</span> / {items.length} món
        </p>
        {(search || category !== 'Tất cả' || availability !== 'all' || priceFilter !== 'all' || sortBy !== 'default') && (
          <button
            className="rounded-full border border-[#E1CDB9] bg-white px-4 py-2 text-sm font-bold text-[#6B4B37] hover:border-[#C89B3C]"
            onClick={() => {
              setSearch('');
              setCategory('Tất cả');
              setAvailability('all');
              setPriceFilter('all');
              setSortBy('default');
            }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-[370px] rounded-[22px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có món nào" message="Thử đổi bộ lọc hoặc thêm món mới." />
      ) : (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
          {filtered.map((m) => (
            <MenuCard
              key={m._id}
              item={m}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={setConfirm}
              onToggle={toggleAvail}
            />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Sửa món' : 'Thêm món mới'}>
        <form onSubmit={submit} className="space-y-4" noValidate encType="multipart/form-data">
          <div>
            <label className="label">Tên món</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Danh mục</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Giá (VNĐ)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              {errors.price && <p className="mt-1 text-xs text-danger">{errors.price}</p>}
            </div>
          </div>
          <div>
            <label className="label">Mô tả</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Ảnh món</label>
            <div className="flex items-start gap-4">
              <div className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-brdr bg-[#F4E6D4]">
                <img
                  src={imagePreview || form.imageUrl || fallbackImage(form.category)}
                  alt="preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage(form.category);
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPickImage}
                  className="block w-full text-sm text-text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1A0A00] hover:file:bg-primary-hover"
                />
                <p className="text-xs text-text-muted">JPG, PNG hoặc WEBP · tối đa 5MB</p>
                <input
                  className="input"
                  placeholder="hoặc dán URL ảnh: https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
            Còn hàng
          </label>
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

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => doDelete(confirm)}
        message={`Xóa món "${confirm?.name}"? Hành động này không thể hoàn tác.`}
      />
    </>
  );
}
