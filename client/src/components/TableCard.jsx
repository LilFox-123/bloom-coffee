import { Badge } from './ui';
import { IconTable, IconUsers } from './Icons';
import { timeAgo } from '../utils/format';

const STATE = {
  trong: {
    border: 'border-[#2E7D32]',
    strip: 'from-[#2E7D32] to-[#79B78A]',
    glow: 'shadow-[0_14px_34px_rgba(46,125,50,0.12)]',
    iconWrap: 'bg-[#E8F5E9] text-[#2E7D32] ring-[#2E7D32]/12',
    soft: 'bg-[#F0FAF2] text-[#2E7D32]',
    badge: 'green',
    label: 'Trống',
    next: 'Sẵn sàng',
  },
  dangdung: {
    border: 'border-[#C62828]',
    strip: 'from-[#C62828] to-[#F87171]',
    glow: 'shadow-[0_14px_34px_rgba(198,40,40,0.14)]',
    iconWrap: 'bg-[#FFEBEE] text-[#C62828] ring-[#C62828]/12',
    soft: 'bg-[#FFF0F0] text-[#C62828]',
    badge: 'red',
    label: 'Đang dùng',
    next: 'Có khách',
  },
  ghepban: {
    border: 'border-[#E65100]',
    strip: 'from-[#E65100] to-[#FBBF24]',
    glow: 'shadow-[0_14px_34px_rgba(230,81,0,0.14)]',
    iconWrap: 'bg-[#FFF3D8] text-[#E65100] ring-[#E65100]/12',
    soft: 'bg-[#FFF8E8] text-[#A56D13]',
    badge: 'yellow',
    label: 'Ghép bàn',
    next: 'Bàn ghép',
  },
};

export default function TableCard({ table, children, onClick, selectable, selected, compact = false }) {
  const state = STATE[table.status] || STATE.trong;
  const guests = Number(table.guests || 0);
  const capacity = Number(table.capacity || 0);
  const occupancy = capacity ? Math.min(100, Math.round((guests / capacity) * 100)) : 0;
  const tableNumber = table.name?.replace(/^Bàn\s*/i, '') || table.name;
  const isBusy = table.status !== 'trong';

  return (
    <article
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[24px] border-2 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(59,35,20,0.14)] ${state.border} ${state.glow} ${
        selectable ? 'cursor-pointer' : ''
      } ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className={`h-2 bg-gradient-to-r ${state.strip}`} />
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C89B3C]/10 transition-transform duration-500 group-hover:scale-110" />
      <div className="pointer-events-none absolute bottom-16 left-5 h-16 w-16 rounded-full bg-[#FAF6F1]" />

      <div className={compact ? 'relative p-4' : 'relative p-4 sm:p-5'}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <Badge color={state.badge} className="shadow-sm">
            {state.label}
          </Badge>
          <span className="rounded-full bg-[#FAF6F1] px-3 py-1 text-xs font-bold text-[#8A6F5D] shadow-sm">
            {table.zone}
          </span>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-[28px] ring-8 ${state.iconWrap} transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28`}
          >
            <IconTable width={compact ? 42 : 50} height={compact ? 42 : 50} />
            <span className="absolute -right-2 -top-2 rounded-2xl bg-white px-3 py-1 text-lg font-black text-[#1A0F00] shadow-[0_8px_18px_rgba(59,35,20,0.14)]">
              {tableNumber}
            </span>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className={compact ? 'text-xl font-black text-[#1A0F00]' : 'text-2xl font-black text-[#1A0F00]'}>
            {table.name}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <span className="inline-flex min-h-[34px] items-center justify-center gap-1 rounded-xl bg-[#FAF6F1] px-3 text-xs font-black text-[#6B4B37]">
              <IconUsers width={14} height={14} />
              {guests || 0}/{capacity || '-'}
            </span>
            <span className={`inline-flex min-h-[34px] items-center justify-center rounded-xl px-3 text-xs font-black ${state.soft}`}>
              {isBusy ? timeAgo(table.occupiedAt) : state.next}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#FAF6F1] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-bold">
            <span className="text-[#6B4B37]">{isBusy ? 'Mức sử dụng' : 'Sẵn sàng nhận khách'}</span>
            <span className="text-[#9C8472]">{isBusy ? `${occupancy}%` : '0%'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E8D5BC]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${state.strip} transition-all`}
              style={{ width: isBusy ? `${Math.max(occupancy, 12)}%` : '0%' }}
            />
          </div>
        </div>

        {children && <div className="mt-4 flex flex-col gap-2">{children}</div>}
      </div>
    </article>
  );
}
