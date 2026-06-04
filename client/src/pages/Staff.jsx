import { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader, Badge, EmptyState } from '../components/ui';
import { IconPlus, IconEdit, IconLock, IconUnlock } from '../components/Icons';
import Modal from '../components/Modal';
import { initials, timeAgo } from '../utils/format';

const emptyForm = { name: '', phone: '', email: '', role: 'nhanvien', password: '', confirm: '' };

export default function Staff() {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowPw(false);
    setModal(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, phone: u.phone || '', email: u.email, role: u.role, password: '', confirm: '' });
    setErrors({});
    setShowPw(false);
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!editing || showPw) {
      if (!form.password || form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
      if (form.password !== form.confirm) errs.confirm = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = { name: form.name, phone: form.phone, email: form.email, role: form.role };
    if (!editing || showPw) payload.password = form.password;

    try {
      if (editing) {
        await api.patch(`/staff/${editing._id}`, payload);
        toast.success('Đã cập nhật nhân viên');
      } else {
        await api.post('/staff', payload);
        toast.success('Đã thêm nhân viên');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggle = async (u) => {
    try {
      await api.patch(`/staff/${u._id}/toggle`);
      toast.success(u.isActive ? `Đã khóa ${u.name}` : `Đã mở khóa ${u.name}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Quản lý nhân viên"
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <IconPlus width={18} height={18} /> Thêm nhân viên
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState title="Chưa có nhân viên" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((u) => (
            <div key={u._id} className="card relative">
              <div className="flex items-center gap-1 absolute top-4 right-4">
                <button className="text-text-muted hover:text-accent-green-dark" title="Sửa" onClick={() => openEdit(u)}>
                  <IconEdit width={18} height={18} />
                </button>
                <button
                  className={`${u.isActive ? 'text-text-muted hover:text-danger' : 'text-text-muted hover:text-accent-green-dark'}`}
                  title={u.isActive ? 'Khóa' : 'Mở khóa'}
                  onClick={() => toggle(u)}
                >
                  {u.isActive ? <IconLock width={18} height={18} /> : <IconUnlock width={18} height={18} />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {initials(u.name)}
                </div>
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <Badge color={u.role === 'admin' ? 'green' : 'blue'}>
                    {u.role === 'admin' ? 'Admin' : 'Nhân viên'}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge color={u.isActive ? 'green' : 'gray'}>
                  {u.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                </Badge>
                <span className="text-xs text-text-muted">
                  Đăng nhập cuối: {u.lastLogin?.length ? timeAgo(u.lastLogin[0]) : 'chưa'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-2">{u.email}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label">Họ tên</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SĐT</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Vai trò</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="nhanvien">Nhân viên</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tài khoản (email)</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
          </div>

          {editing ? (
            <div className="border-t border-brdr pt-3">
              <button
                type="button"
                className="text-sm font-medium text-accent-green-dark hover:underline"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? '− Ẩn đổi mật khẩu' : '+ Đổi mật khẩu'}
              </button>
            </div>
          ) : null}

          {(!editing || showPw) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Mật khẩu</label>
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="label">Xác nhận MK</label>
                <input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                {errors.confirm && <p className="text-danger text-xs mt-1">{errors.confirm}</p>}
              </div>
            </div>
          )}

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
