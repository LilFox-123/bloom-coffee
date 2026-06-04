import { Outlet } from 'react-router-dom';
import { CartProvider } from '../../../context/CartContext';

// Public single-link customer ordering flow (no auth, no table required).
export default function OnlineLayout() {
  return (
    <CartProvider>
      <div
        className="min-h-screen bg-[#FDF8F3] text-[#3D2B1F]"
        style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}
      >
        <Outlet />
      </div>
    </CartProvider>
  );
}
