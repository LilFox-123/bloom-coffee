import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import { Spinner } from '../components/ui';
import { IconBean } from '../components/Icons';

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

  const beans = [
    { top: '8%', left: '12%', size: 38, rot: 20 },
    { top: '22%', left: '70%', size: 28, rot: -15 },
    { top: '45%', left: '20%', size: 46, rot: 40 },
    { top: '60%', left: '78%', size: 32, rot: 10 },
    { top: '78%', left: '30%', size: 40, rot: -30 },
    { top: '88%', left: '64%', size: 26, rot: 25 },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT — espresso brand panel (hidden on mobile) */}
      <div
        className="relative hidden lg:flex lg:w-1/2 bg-sidebar text-white overflow-hidden flex-col justify-between p-14"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(200,146,42,0.22), transparent 45%), radial-gradient(circle at 80% 80%, rgba(200,146,42,0.15), transparent 40%)',
        }}
      >
        {beans.map((b, i) => (
          <IconBean
            key={i}
            className="absolute text-primary"
            style={{
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              opacity: 0.07,
              transform: `rotate(${b.rot}deg)`,
            }}
          />
        ))}

        <div className="relative flex items-center gap-3">
          <Logo size={48} variant="white" />
          <span className="text-xl font-bold">Bloom Coffee</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Quản lý thông minh
            <br />
            Phục vụ tận tâm
          </h2>
          <p className="mt-4 text-primary/90 max-w-md">
            Hệ thống quản lý quán cà phê toàn diện — bàn, gọi món, hóa đơn, kho và báo cáo trong một
            nền tảng duy nhất.
          </p>
        </div>

        <p className="relative text-white/50 text-sm">© 2026 Bloom Coffee</p>
      </div>

      {/* RIGHT — form */}
      <div className="flex-1 bg-page flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Logo size={44} />
            <span className="text-xl font-bold text-text-primary">Bloom Coffee</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Đăng nhập vào hệ thống</h1>
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
