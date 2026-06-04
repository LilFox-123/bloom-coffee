import { IconInbox } from './Icons';

export function Badge({ children, color = 'green', className = '' }) {
  const map = {
    gold: 'bg-[#FEF3DC] text-[#8B6020]',
    green: 'bg-[#E8F5E9] text-[#2E7D32]',
    red: 'bg-[#FFEBEE] text-[#C62828]',
    yellow: 'bg-[#FBE9E7] text-[#E65100]',
    blue: 'bg-[#E3F2FD] text-[#1565C0]',
    gray: 'bg-[#F5F0EB] text-[#9C8472]',
    purple: 'bg-[#EDE7F6] text-[#6A1B9A]',
  };
  return <span className={`badge ${map[color] || map.gray} ${className}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="h-12 bg-muted" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-6 py-4 border-b border-brdr">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-4 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="skeleton h-10 w-10 rounded-full mb-4" />
          <div className="skeleton h-3 w-24 rounded mb-2" />
          <div className="skeleton h-7 w-32 rounded" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Chưa có dữ liệu', message, action }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-text-muted mb-4">
        <IconInbox width={32} height={32} />
      </div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
      {message && <p className="text-text-muted text-sm mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
