import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import { IconMenu } from './Icons';

export default function MobileHeader({ onOpen }) {
  const { user } = useAuth();
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar text-white flex items-center justify-between px-4 z-30 no-print">
      <button onClick={onOpen} className="p-1 -ml-1" aria-label="Mở menu">
        <IconMenu width={24} height={24} />
      </button>
      <span className="font-bold">Bloom Coffee</span>
      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
        {initials(user?.name)}
      </div>
    </header>
  );
}
