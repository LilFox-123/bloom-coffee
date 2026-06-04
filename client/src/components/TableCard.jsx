import { Badge } from './ui';
import { timeAgo } from '../utils/format';

const STATE = {
  trong: {
    border: 'border-[#2E7D32]',
    strip: 'bg-[#2E7D32]',
    badge: 'green',
    label: 'Trống',
  },
  dangdung: {
    border: 'border-[#C62828]',
    strip: 'bg-[#C62828]',
    badge: 'red',
    label: 'Đang dùng',
  },
  ghepban: {
    border: 'border-[#E65100]',
    strip: 'bg-[#E65100]',
    badge: 'yellow',
    label: 'Ghép bàn',
  },
};

export default function TableCard({ table, children, onClick, selectable, selected }) {
  const s = STATE[table.status] || STATE.trong;
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border-2 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${s.border} ${
        selectable ? 'cursor-pointer' : ''
      } ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      <div className={`h-1.5 ${s.strip}`} />
      <div className="p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <Badge color={s.badge}>{s.label}</Badge>
          <span className="text-xs text-text-muted hidden sm:inline">{table.zone}</span>
        </div>
        <div className="text-center py-3 sm:py-4">
          <p className="text-4xl sm:text-5xl font-black text-text-primary leading-none">{table.name}</p>
          <p className="text-xs text-text-muted mt-2">Sức chứa {table.capacity} khách</p>
        </div>
        {table.status === 'dangdung' && (
          <p className="text-center text-xs text-[#C62828] font-medium mb-2">
            {table.guests} khách · {timeAgo(table.occupiedAt)}
          </p>
        )}
        {children && <div className="mt-3 flex flex-col gap-2">{children}</div>}
      </div>
    </div>
  );
}
