import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge, EmptyState } from '../components/ui';
import { IconPlus, IconEdit, IconLock, IconUnlock, IconSearch } from '../components/Icons';
import Modal from '../components/Modal';
import { initials, timeAgo } from '../utils/format';

const WEEK_DAYS = [
  { key: 'monday', label: 'T2', full: 'Thứ 2' },
  { key: 'tuesday', label: 'T3', full: 'Thứ 3' },
  { key: 'wednesday', label: 'T4', full: 'Thứ 4' },
  { key: 'thursday', label: 'T5', full: 'Thứ 5' },
  { key: 'friday', label: 'T6', full: 'Thứ 6' },
  { key: 'saturday', label: 'T7', full: 'Thứ 7' },
  { key: 'sunday', label: 'CN', full: 'Chủ nhật' },
];

const SHIFTS = [
  { key: 'morning', label: 'Sáng', time: '07:00 - 12:00', tone: 'bg-[#FFF3D8] text-[#A56D13] border-[#F0D7A0]' },
  { key: 'afternoon', label: 'Chiều', time: '12:00 - 17:00', tone: 'bg-[#E3F2FD] text-[#1565C0] border-[#BBDCF8]' },
  { key: 'evening', label: 'Tối', time: '17:00 - 22:00', tone: 'bg-[#FCE7F3] text-[#BE185D] border-[#F8BBD0]' },
];

function createEmptySchedule() {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day.key] = [];
    return acc;
  }, {});
}

function normalizeWeeklySchedule(schedule = {}) {
  return WEEK_DAYS.reduce((acc, day) => {
    const shifts = Array.isArray(schedule?.[day.key]) ? schedule[day.key] : [];
    acc[day.key] = shifts.filter((shift) => SHIFTS.some((item) => item.key === shift));
    return acc;
  }, {});
}

function createEmptyForm() {
  return {
    name: '',
    phone: '',
    email: '',
    role: 'nhanvien',
    password: '',
    confirm: '',
    weeklySchedule: createEmptySchedule(),
  };
}

function getShift(shiftKey) {
  return SHIFTS.find((shift) => shift.key === shiftKey);
}

function shiftCount(schedule = {}) {
  const normalized = normalizeWeeklySchedule(schedule);
  return WEEK_DAYS.reduce((total, day) => total + normalized[day.key].length, 0);
}

function scheduledDayCount(schedule = {}) {
  const normalized = normalizeWeeklySchedule(schedule);
  return WEEK_DAYS.filter((day) => normalized[day.key].length > 0).length;
}

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

function ShiftLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {SHIFTS.map((shift) => (
        <span key={shift.key} className={`rounded-full border px-3 py-1 text-xs font-black ${shift.tone}`}>
          {shift.label} · {shift.time}
        </span>
      ))}
    </div>
  );
}

function ScheduleBoard({ staff }) {
  const activeStaff = staff.filter((user) => user.isActive);

  return (
    <section className="mb-6 overflow-hidden rounded-[24px] border border-[#E8D5BC] bg-white shadow-[0_14px_36px_rgba(59,35,20,0.08)]">
      <div className="flex flex-col gap-3 border-b border-[#E8D5BC] bg-[#FFFDF9] p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#C89B3C]">Phân công ca</p>
          <h2 className="mt-1 text-2xl font-black text-[#1A0F00]">Lịch làm việc tuần này</h2>
          <p className="mt-1 text-sm font-medium text-[#8A6F5D]">
            Theo dõi nhanh nhân viên nào đang làm ca nào trong từng ngày.
          </p>
        </div>
        <ShiftLegend />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[240px_repeat(7,minmax(106px,1fr))] border-b border-[#E8D5BC] bg-[#FAF6F1] text-xs font-black uppercase tracking-[0.08em] text-[#8A6F5D]">
            <div className="p-3">Nhân viên</div>
            {WEEK_DAYS.map((day) => (
              <div key={day.key} className="border-l border-[#E8D5BC] p-3 text-center">
                {day.full}
              </div>
            ))}
          </div>

          {activeStaff.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-[#9C8472]">Chưa có nhân viên đang hoạt động.</div>
          ) : (
            activeStaff.map((user) => {
              const schedule = normalizeWeeklySchedule(user.weeklySchedule);
              return (
                <div key={user._id} className="grid grid-cols-[240px_repeat(7,minmax(106px,1fr))] border-b border-[#F0E1D1] last:border-b-0">
                  <div className="flex items-center gap-3 p-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white ${user.role === 'admin' ? 'bg-[#3B2314]' : 'bg-[#C89B3C]'}`}>
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#1A0F00]">{user.name}</p>
                      <p className="text-xs font-bold text-[#9C8472]">{user.role === 'admin' ? 'Admin' : 'Nhân viên'}</p>
                    </div>
                  </div>
                  {WEEK_DAYS.map((day) => {
                    const shifts = schedule[day.key];
                    return (
                      <div key={day.key} className="flex min-h-[86px] flex-col justify-center gap-1 border-l border-[#F0E1D1] p-2">
                        {shifts.length ? (
                          shifts.map((shiftKey) => {
                            const shift = getShift(shiftKey);
                            if (!shift) return null;
                            return (
                              <span key={shift.key} className={`rounded-xl border px-2 py-1 text-center text-xs font-black ${shift.tone}`}>
                                {shift.label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="rounded-xl border border-dashed border-[#E1CDB9] bg-[#FFFDF9] px-2 py-1 text-center text-xs font-bold text-[#B59A85]">
                            Nghỉ
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function StaffCard({ user, onEdit, onToggle }) {
  const isAdmin = user.role === 'admin';
  const active = user.isActive;
  const schedule = normalizeWeeklySchedule(user.weeklySchedule);
  const totalShifts = shiftCount(schedule);
  const totalDays = scheduledDayCount(schedule);

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
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF6F1] text-[#6B4B37] hover:bg-[#FFF3D8]"
            aria-label={`Sửa nhân viên ${user.name}`}
            title="Sửa"
            onClick={() => onEdit(user)}
          >
            <IconEdit width={17} height={17} />
          </button>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-[#FFEBEE] text-[#C62828]' : 'bg-[#E8F5E9] text-[#2E7D32]'}`}
            aria-label={active ? `Khóa nhân viên ${user.name}` : `Mở khóa nhân viên ${user.name}`}
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

      <div className="mt-4 rounded-2xl border border-[#E8D5BC] bg-[#FFFDF9] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#8A6F5D]">Ca tuần này</p>
          <span className="rounded-full bg-[#FFF3D8] px-2.5 py-1 text-xs font-black text-[#A56D13]">
            {totalShifts ? `${totalShifts} ca` : 'Chưa phân'}
          </span>
        </div>
        <p className="mt-2 text-sm font-bold text-[#3B2314]">
          {totalShifts ? `Làm ${totalDays} ngày trong tuần` : 'Chưa có lịch làm việc'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {WEEK_DAYS.map((day) => (
            <span
              key={day.key}
              className={`rounded-lg px-2 py-1 text-[11px] font-black ${schedule[day.key].length ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F5F0EB] text-[#B59A85]'}`}
            >
              {day.label}
            </span>
          ))}
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
  const [form, setForm] = useState(createEmptyForm());
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
      scheduled: staff.filter((u) => shiftCount(u.weeklySchedule) > 0).length,
      shifts: staff.reduce((sum, u) => sum + shiftCount(u.weeklySchedule), 0),
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
    setForm(createEmptyForm());
    setErrors({});
    setShowPw(false);
    setModal(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      phone: u.phone || '',
      email: u.email,
      role: u.role,
      password: '',
      confirm: '',
      weeklySchedule: normalizeWeeklySchedule(u.weeklySchedule),
    });
    setErrors({});
    setShowPw(false);
    setModal(true);
  };

  const toggleShift = (dayKey, shiftKey) => {
    setForm((prev) => {
      const schedule = normalizeWeeklySchedule(prev.weeklySchedule);
      const current = schedule[dayKey] || [];
      const next = current.includes(shiftKey) ? current.filter((item) => item !== shiftKey) : [...current, shiftKey];
      return { ...prev, weeklySchedule: { ...schedule, [dayKey]: next } };
    });
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

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      role: form.role,
      weeklySchedule: normalizeWeeklySchedule(form.weeklySchedule),
    };
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
              Quản lý tài khoản, vai trò, lịch làm việc và phân công ca theo tuần.
            </p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <IconPlus width={18} height={18} /> Thêm nhân viên
          </button>
        </div>
      </section>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng nhân viên" value={stats.total} helper="Tài khoản" tone="blue" />
        <StatCard label="Đang hoạt động" value={stats.active} helper="Ready" tone="green" />
        <StatCard label="Đã phân ca" value={stats.scheduled} helper="Có lịch" tone="gold" />
        <StatCard label="Tổng ca tuần" value={stats.shifts} helper="Ca làm" tone="gray" />
      </div>

      <ScheduleBoard staff={staff} />

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

          <div className="rounded-2xl border border-[#E8D5BC] bg-[#FFFDF9] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#1A0F00]">Phân công ca tuần</p>
                <p className="mt-1 text-xs font-medium text-[#8A6F5D]">Chọn một hoặc nhiều ca cho từng ngày.</p>
              </div>
              <ShiftLegend />
            </div>
            <div className="mt-4 grid gap-3">
              {WEEK_DAYS.map((day) => (
                <div key={day.key} className="grid gap-2 rounded-2xl border border-[#F0E1D1] bg-white p-3 sm:grid-cols-[96px_1fr] sm:items-center">
                  <p className="text-sm font-black text-[#3B2314]">{day.full}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {SHIFTS.map((shift) => {
                      const selected = normalizeWeeklySchedule(form.weeklySchedule)[day.key].includes(shift.key);
                      return (
                        <button
                          key={shift.key}
                          type="button"
                          className={`min-h-[42px] rounded-xl border px-3 py-2 text-left text-xs font-black transition ${
                            selected ? shift.tone : 'border-[#E1CDB9] bg-[#FAF6F1] text-[#8A6F5D] hover:border-[#C89B3C]'
                          }`}
                          onClick={() => toggleShift(day.key, shift.key)}
                        >
                          <span className="block">{shift.label}</span>
                          <span className="block text-[11px] font-bold opacity-75">{shift.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {editing && (
            <div className="border-t border-brdr pt-3">
              <button type="button" className="text-sm font-bold text-accent-green-dark hover:underline" onClick={() => setShowPw((s) => !s)}>
                {showPw ? '- Ẩn đổi mật khẩu' : '+ Đổi mật khẩu'}
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
