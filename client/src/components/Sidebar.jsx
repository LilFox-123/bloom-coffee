import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { initials } from '../utils/format';
import {
  IconDashboard,
  IconTable,
  IconClipboard,
  IconMenuBook,
  IconReceipt,
  IconUsers,
  IconPerson,
  IconBox,
  IconChartBar,
  IconLogout,
  IconClose,
} from './Icons';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard, adminOnly: true },
  { to: '/ban', label: 'Quản lý Bàn', Icon: IconTable },
  { to: '/goi-mon', label: 'Gọi Món', Icon: IconClipboard },
  { to: '/thuc-don', label: 'Thực Đơn', Icon: IconMenuBook },
  { to: '/hoa-don', label: 'Hóa Đơn', Icon: IconReceipt },
  { to: '/khach-hang', label: 'Khách Hàng', Icon: IconUsers, adminOnly: true },
  { to: '/nhan-vien', label: 'Nhân Viên', Icon: IconPerson, adminOnly: true },
  { to: '/kho', label: 'Quản lý Kho', Icon: IconBox, adminOnly: true },
  { to: '/bao-cao', label: 'Báo Cáo', Icon: IconChartBar, adminOnly: true },
];

function NavList({ items, full, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 space-y-1 relative">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={full ? undefined : label}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-stagger flex items-center gap-3 rounded-lg mx-2 border-l-[3px] transition-colors ${
              full ? 'px-3 py-3.5 text-base' : 'px-3 py-2.5 text-sm justify-center lg:justify-start'
            } ${
              isActive
                ? 'bg-[rgba(200,146,42,0.18)] text-primary font-semibold border-sidebar-border'
                : 'text-sidebar-text border-transparent hover:bg-[rgba(245,237,224,0.08)] hover:text-white'
            }`
          }
        >
          <Icon width={20} height={20} className="shrink-0" />
          <span className={full ? 'inline' : 'hidden lg:inline'}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

const SIDEBAR_BG =
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=70';

// dark espresso overlay over the coffee photo
const sidebarStyle = {
  backgroundImage: `linear-gradient(rgba(26,10,0,0.92), rgba(26,10,0,0.88)), url('${SIDEBAR_BG}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

function Brand() {
  return (
    <>
      <Logo size={40} variant="white" />
      <div className="hidden lg:block">
        <p className="font-display italic text-primary text-xl leading-tight">☕ Bloom Coffee</p>
        <p className="text-xs text-sidebar-text">Quản lý thông minh</p>
      </div>
    </>
  );
}

function UserCard({ user, isAdmin, logout, full }) {
  return (
    <div className="p-3">
      <div className={`bg-sidebar-card rounded-xl ${full ? 'p-3' : 'p-2 lg:p-3'}`}>
        <div className={`flex items-center gap-3 ${full ? '' : 'justify-center lg:justify-start'}`}>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initials(user?.name)}
          </div>
          <div className={`flex-1 min-w-0 ${full ? '' : 'hidden lg:block'}`}>
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <span className="badge text-[10px] !px-2 !py-0.5 bg-primary/20 text-primary">
              {isAdmin ? 'Admin' : 'Nhân viên'}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Đăng xuất"
          className={`mt-3 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-text hover:bg-[rgba(200,146,42,0.12)] hover:text-white transition-colors ${
            full ? '' : 'justify-center lg:justify-start'
          }`}
        >
          <IconLogout width={18} height={18} className="shrink-0" />
          <span className={full ? 'inline' : 'hidden lg:inline'}>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <>
      {/* Persistent sidebar — tablet (icon only) & desktop (full) */}
      <aside
        style={sidebarStyle}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-sidebar text-white flex-col no-print z-40 md:w-[60px] lg:w-[240px] transition-[width] duration-200"
      >
        <div className="flex items-center gap-3 px-3 lg:px-5 py-5 justify-center lg:justify-start">
          <Brand />
        </div>
        <NavList items={items} full={false} />
        <UserCard user={user} isAdmin={isAdmin} logout={logout} full={false} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        style={sidebarStyle}
        className={`md:hidden fixed left-0 top-0 h-screen w-[280px] bg-sidebar text-white flex flex-col z-50 shadow-2xl transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <Logo size={40} variant="white" />
            <div>
              <p className="font-display italic text-primary text-xl leading-tight">☕ Bloom Coffee</p>
              <p className="text-xs text-sidebar-text">Quản lý thông minh</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <IconClose width={22} height={22} />
          </button>
        </div>
        <NavList items={items} full onNavigate={onClose} />
        <UserCard user={user} isAdmin={isAdmin} logout={logout} full />
      </aside>
    </>
  );
}
