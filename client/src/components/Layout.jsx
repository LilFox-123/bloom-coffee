import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-page">
      <MobileHeader onOpen={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main
        key={location.pathname}
        className="bg-page min-h-screen animate-fade-in mt-14 md:mt-0 md:ml-[60px] lg:ml-[240px] p-4 sm:p-6 md:p-8"
      >
        <Outlet />
      </main>
    </div>
  );
}
