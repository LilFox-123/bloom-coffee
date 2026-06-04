export function formatVND(value) {
  const n = Number(value || 0);
  return `${n.toLocaleString('vi-VN')} ₫`;
}

export function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  const d = new Date(value);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function timeAgo(value) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export const PAYMENT_LABELS = {
  tienmat: 'Tiền mặt',
  chuyenkhoan: 'Chuyển khoản',
  vidientu: 'Ví điện tử',
};

export const PAYMENT_STYLES = {
  tienmat: 'bg-[#F5F0EB] text-[#9C8472]',
  chuyenkhoan: 'bg-[#E3F2FD] text-[#1565C0]',
  vidientu: 'bg-[#EDE7F6] text-[#6A1B9A]',
};
