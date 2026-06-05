import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState } from '../components/ui';
import { IconPlus, IconEdit, IconLock, IconUnlock, IconSearch } from '../components/Icons';
import Modal from '../components/Modal';
import { initials, timeAgo } from '../utils/format';

const emptyForm = { name: '', phone: '', email: '', role: 'nhanvien', password: '', confirm: '' };

function StatCard({ label, value, helper, tone = 'gold' }) {
  const tones = {
    gold: 'bg-[#FFF3D8] text-[#A56D13]',
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    blue: 'bg-[#E3F2FD] text-[#1565C0]',
    gray: 'bg-[#F5F0EB] text-[#9C8472]',
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

function StaffCard({ user, onEdit, onToggle }) {
  const isAdmin = user.role === 'admin';
  const active = user.isActive;

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-[#E8D5BC] bg-white p-5 shadow-[0_10px_28px_rgba(59,35,20,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(59,35,20,0.13)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${active ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white ${isAdmin ? 'bg-[#3B2314]' : 'bg-[#C89B3C]'}`}>
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-lg font-black text-[#1A0F00]">{user.name}</p>
            <p className="line-clamp-1 text-sm font-medium text-[#8A6F5D]">{user.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF6F1] text-[#6B4B37] hover:bg-[#FFF3D8]" title="Sửa" onClick={() => onEdit(user)}>
            <IconEdit width={17} height={17} />
          </button>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-[#FFEBEE] text-[#C62828]' : 'bg-[#E8F5E9] text-[#2E7D32]'}`}
            title={active ? 'Khóa' : 'Mở khóa'}
            onClick={() => onToggle(user)}
          >
            {active ? <IconLock width={17} height={17} /> : <IconUnlock width={17} height={17} />}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge color={isAdmin ? 'green' : 'blue'}>{isAdmin ? 'Admin' : 'Nhân viên'}</Badge>
        <Badge color={active ? 'green' : 'gray'}>{active ? 'Đang hoạt động' : 'Tạm khóa'}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#FAF6F1] p-3">
          <p className="text-xs font-bold text-[#8A6F5D]">SĐT</p>
          <p className="mt-1 truncate text-sm font-black text-[#3B2314]">{user.phone || 'Chưa có'}</p>
        </div>
        <div className="rounded-2xl bg-[#FAF6F1] p-3">
          <p className="text-xs font-bold text-[#8A6F5D]">Đăng nhập cuối</p>
          <p className="mt-1 truncate text-sm font-black text-[#3B2314]">
            {user.lastLogin?.length ? timeAgo(user.lastLogin[0]) : 'Chưa'}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Staff() {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((u) => u.isActive).length,
      admin: staff.filter((u) => u.role === 'admin').length,
      locked: staff.filter((u) => !u.isActive).length,
    }),
    [staff]
  );

  const filtered = useMemo(
    () =>
      staff.filter((u) => {
        const query = `${u.name} ${u.email} ${u.phone || ''}`.toLowerCase();
        const matchSearch = query.includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && u.isActive) ||
          (statusFilter === 'locked' && !u.isActive);
        return matchSearch && matchRole && matchStatus;
      }),
    [roleFilter, search, staff, statusFilter]
  );

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
      <section className="mb-6 overflow-hidden rounded-[28px] bg-[#3B2314] p-6 text-white shadow-[0_18px_45px_rgba(59,35,20,0.18)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F9E6B8]">
              Đội ngũ vận hành
            </span>
            <h1 className="mt-4 text-4xl font-black xl:text-5xl">Quản lý nhân viên</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-white/75">
              Quản lý tài khoản, vai trò, trạng thái hoạt động và quyền truy cập hệ thống.
            </p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <IconPlus width={18} height={18} /> Thêm nhân viên
          </button>
        </div>
      </section>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng nhân viên" value={stats.total} helper="Tài khoản" tone="blue" />
        <StatCard label="Đang hoạt động" value={stats.active} helper="Online ready" tone="green" />
        <StatCard label="Quản trị viên" value={stats.admin} helper="Admin" tone="gold" />
        <StatCard label="Tạm khóa" value={stats.locked} helper="Cần xem xét" tone="gray" />
      </div>

      <section className="mb-6 rounded-[24px] border border-[#E8D5BC] bg-white/85 p-4 shadow-[0_12px_32px_rgba(59,35,20,0.06)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,420px)_180px_180px]">
          <div className="relative">
            <IconSearch width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C8472]" />
            <input
              className="min-h-[48px] w-full rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-[#B59A85] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/15"
              placeholder="Tìm tên, email, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="min-h-[48px] rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] px-4 text-sm font-bold text-[#3B2314] outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="nhanvien">Nhân viên</option>
          </select>
          <select className="min-h-[48px] rounded-2xl border border-[#E1CDB9] bg-[#FFFDF9] px-4 text-sm font-bold text-[#3B2314] outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Tạm khóa</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-[22px]" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState title="Chưa có nhân viên" />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy nhân viên" message="Thử đổi bộ lọc hoặc từ khóa tìm kiếm." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => (
            <StaffCard key={u._id} user={u} onEdit={openEdit} onToggle={toggle} />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="label">Họ tên</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
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
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>

          {editing && (
            <div className="border-t border-brdr pt-3">
              <button type="button" className="text-sm font-bold text-accent-green-dark hover:underline" onClick={() => setShowPw((s) => !s)}>
                {showPw ? '− Ẩn đổi mật khẩu' : '+ Đổi mật khẩu'}
              </button>
            </div>
          )}

          {(!editing || showPw) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Mật khẩu</label>
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
              </div>
              <div>
                <label className="label">Xác nhận MK</label>
                <input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm}</p>}
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
