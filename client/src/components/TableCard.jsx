import { Badge } from './ui';
import { timeAgo } from '../utils/format';

const STATE = {
  trong: {
    border: 'border-[#2E7D32]',
    strip: 'from-[#2E7D32] to-[#79B78A]',
    glow: 'shadow-[0_14px_34px_rgba(46,125,50,0.12)]',
    badge: 'green',
    label: 'Trống',
    next: 'Sẵn sàng nhận khách',
  },
  dangdung: {
    border: 'border-[#C62828]',
    strip: 'from-[#C62828] to-[#F87171]',
    glow: 'shadow-[0_14px_34px_rgba(198,40,40,0.14)]',
    badge: 'red',
    label: 'Đang dùng',
    next: 'Xem order hoặc thanh toán',
  },
  ghepban: {
    border: 'border-[#E65100]',
    strip: 'from-[#E65100] to-[#FBBF24]',
    glow: 'shadow-[0_14px_34px_rgba(230,81,0,0.14)]',
    badge: 'yellow',
    label: 'Ghép bàn',
    next: 'Theo dõi order ghép',
  },
};

export default function TableCard({ table, children, onClick, selectable, selected, compact = false }) {
  const state = STATE[table.status] || STATE.trong;
  const guests = Number(table.guests || 0);
  const occupancy = table.capacity ? Math.min(100, Math.round((guests / table.capacity) * 100)) : 0;

  return (
    <article
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[22px] border-2 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(59,35,20,0.14)] ${state.border} ${state.glow} ${
        selectable ? 'cursor-pointer' : ''
      } ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className={`h-2 bg-gradient-to-r ${state.strip}`} />
      <div className={compact ? 'p-4' : 'p-4 sm:p-5'}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <Badge color={state.badge} className="shadow-sm">
            {state.label}
          </Badge>
          <span className="rounded-full bg-[#FAF6F1] px-3 py-1 text-xs font-bold text-[#8A6F5D]">
            {table.zone}
          </span>
        </div>

        <div className="relative">
          <div className="absolute -right-3 -top-6 hidden h-20 w-20 rounded-full bg-[#C89B3C]/10 sm:block" />
          <div className="relative text-center">
            <p className={compact ? 'text-3xl font-black text-[#1A0F00]' : 'text-4xl font-black text-[#1A0F00] sm:text-5xl'}>
              {table.name}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#9C8472]">Sức chứa {table.capacity} khách</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#FAF6F1] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span className="text-[#6B4B37]">{guests ? `${guests} khách` : 'Chưa có khách'}</span>
            <span className="text-[#9C8472]">{table.status === 'dangdung' ? timeAgo(table.occupiedAt) : state.next}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E8D5BC]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${state.strip} transition-all`}
              style={{ width: table.status === 'trong' ? '0%' : `${Math.max(occupancy, 12)}%` }}
            />
          </div>
        </div>

        {children && <div className="mt-4 flex flex-col gap-2">{children}</div>}
      </div>
    </article>
  );
}
