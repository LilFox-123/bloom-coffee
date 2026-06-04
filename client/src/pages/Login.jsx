import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import { Spinner } from '../components/ui';

export default function Login() {
  const { user, login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@bloomcoffee.vn');
  const [password, setPassword] = useState('Admin@123');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/ban'} replace />;
  }

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success(`Xin chào, ${u.name}!`);
      navigate(u.role === 'admin' ? '/dashboard' : '/ban', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const heroCup = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT — photo brand panel (hidden on mobile) */}
      <div
        className="relative hidden lg:flex lg:w-1/2 text-white overflow-hidden flex-col justify-between p-14"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(26,10,0,0.78), rgba(92,51,23,0.62)), url('${heroCup}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative flex items-center gap-3">
          <Logo size={48} variant="white" />
          <span className="font-display italic text-2xl text-primary">Bloom Coffee</span>
        </div>

        <div className="relative">
          <h2 className="font-display italic text-5xl font-extrabold leading-tight text-page">
            Quản lý thông minh
            <br />
            Phục vụ tận tâm
          </h2>
          <p className="mt-4 text-page/85 max-w-md">
            Hệ thống quản lý quán cà phê toàn diện — bàn, gọi món, hóa đơn, kho và báo cáo trong một
            nền tảng duy nhất.
          </p>
        </div>

        <p className="relative text-page/50 text-sm">© 2026 Bloom Coffee</p>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 bg-page flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm bg-surface rounded-[20px] shadow-hover p-8 sm:p-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Logo size={44} />
            <span className="font-display italic text-2xl text-primary">Bloom Coffee</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Đăng nhập vào hệ thống</h1>
          <p className="text-text-muted text-sm mt-1 mb-8">Chào mừng bạn quay trở lại!</p>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className={`input ${errors.email ? '!border-danger focus:!ring-danger/30' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@bloomcoffee.vn"
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input
                type="password"
                className={`input ${errors.password ? '!border-danger focus:!ring-danger/30' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              className="btn-primary w-full !py-3 !text-base"
              disabled={submitting}
            >
              {submitting ? <Spinner className="w-5 h-5" /> : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-brdr text-xs text-text-muted">
            <p className="font-medium mb-1 text-text-body">Tài khoản demo:</p>
            <p>Admin: admin@bloomcoffee.vn / Admin@123</p>
            <p>Nhân viên: nv1@bloomcoffee.vn / Nv1@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
