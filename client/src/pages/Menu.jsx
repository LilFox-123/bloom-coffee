import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Badge, EmptyState } from '../components/ui';
import { IconSearch, IconPlus, IconEdit, IconTrash } from '../components/Icons';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatVND } from '../utils/format';

const CATEGORIES = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Đồ ăn nhẹ'];
const PLACEHOLDER_IMAGE = '/images/placeholder.svg';
const emptyForm = { name: '', category: 'Cà phê', price: '', description: '', imageUrl: '', isAvailable: true };

export default function Menu() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
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
    setForm({ name: m.name, category: m.category, price: m.price, description: m.description, imageUrl: m.imageUrl || '', isAvailable: m.isAvailable });
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

  const filtered = items.filter((m) => {
    const mc = category === 'Tất cả' || m.category === category;
    const ms = m.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  return (
    <>
      <PageHeader
        title="Thực đơn"
        subtitle="Danh sách món và giá bán"
        actions={
          isAdmin && (
            <button className="btn-primary" onClick={openAdd}>
              <IconPlus width={18} height={18} /> Thêm món
            </button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <IconSearch width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="input pl-9" placeholder="Tìm món..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                category === c ? 'bg-accent-green text-white' : 'bg-white border border-brdr text-text-muted hover:bg-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có món nào" message="Thử đổi danh mục hoặc thêm món mới." />
      ) : (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {filtered.map((m) => (
            <div
              key={m._id}
              className={`menu-card bg-surface border border-[rgba(200,146,42,0.12)] rounded-2xl shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-hover ${
                !m.isAvailable ? 'opacity-70' : ''
              }`}
            >
              <img
                src={m.imageUrl || PLACEHOLDER_IMAGE}
                alt={m.name}
                className="menu-card-img w-full aspect-[4/3] object-cover block"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display font-bold text-base text-text-primary leading-tight">{m.name}</p>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button className="text-text-muted hover:text-primary-dark" onClick={() => openEdit(m)}>
                        <IconEdit width={16} height={16} />
                      </button>
                      <button className="text-text-muted hover:text-danger" onClick={() => setConfirm(m)}>
                        <IconTrash width={16} height={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[13px] text-text-muted mt-1 line-clamp-2 min-h-[2.4em]">{m.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-lg text-primary-dark">{formatVND(m.price)}</span>
                  <button
                    onClick={() => isAdmin && toggleAvail(m)}
                    className={`badge border ${
                      m.isAvailable
                        ? 'badge-available bg-[rgba(74,140,92,0.12)] text-success border-[rgba(74,140,92,0.25)]'
                        : 'bg-[rgba(192,57,43,0.10)] text-danger border-[rgba(192,57,43,0.20)]'
                    } ${isAdmin ? 'cursor-pointer' : ''}`}
                  >
                    {m.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Sửa món' : 'Thêm món mới'}>
        <form onSubmit={submit} className="space-y-4" noValidate encType="multipart/form-data">
          <div>
            <label className="label">Tên món</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
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
              <input type="number" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              {errors.price && <p className="text-danger text-xs mt-1">{errors.price}</p>}
            </div>
          </div>
          <div>
            <label className="label">Mô tả</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Ảnh món</label>
            <div className="flex items-start gap-4">
              <div className="w-[120px] h-[120px] rounded-xl overflow-hidden bg-[#2A241C] flex items-center justify-center shrink-0 border border-brdr">
                <img
                  src={imagePreview || form.imageUrl || PLACEHOLDER_IMAGE}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPickImage}
                  className="block w-full text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1A0A00] hover:file:bg-primary-hover file:cursor-pointer"
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
