import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/Guards';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Order from './pages/Order';
import Menu from './pages/Menu';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import CustomerCartPage from './pages/customer/CustomerCartPage';
import CustomerConfirmPage from './pages/customer/CustomerConfirmPage';
import CustomerSuccessPage from './pages/customer/CustomerSuccessPage';

import OnlineLayout from './pages/customer/online/OnlineLayout';
import OnlineMenuPage from './pages/customer/online/OnlineMenuPage';
import OnlineConfirmPage from './pages/customer/online/OnlineConfirmPage';
import OnlineSuccessPage from './pages/customer/online/OnlineSuccessPage';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/ban'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Public single-link online ordering (no auth, no table required).
          Static paths rank above the dynamic /order/:tableId below. */}
      <Route element={<OnlineLayout />}>
        <Route path="/order" element={<OnlineMenuPage />} />
        <Route path="/order/confirm" element={<OnlineConfirmPage />} />
        <Route path="/order/success" element={<OnlineSuccessPage />} />
      </Route>

      {/* Public QR self-order flow (no auth, table-specific) */}
      <Route element={<CustomerLayout />}>
        <Route path="/order/:tableId" element={<CustomerMenuPage />} />
        <Route path="/order/:tableId/cart" element={<CustomerCartPage />} />
        <Route path="/order/:tableId/confirm" element={<CustomerConfirmPage />} />
        <Route path="/order/:tableId/success/:orderId" element={<CustomerSuccessPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/ban" element={<Tables />} />
        <Route path="/goi-mon" element={<Order />} />
        <Route path="/goi-mon/:tableId" element={<Order />} />
        <Route path="/thuc-don" element={<Menu />} />
        <Route path="/hoa-don" element={<Invoices />} />
        <Route path="/khach-hang" element={<AdminRoute><Customers /></AdminRoute>} />
        <Route path="/nhan-vien" element={<AdminRoute><Staff /></AdminRoute>} />
        <Route path="/kho" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/bao-cao" element={<AdminRoute><Reports /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
