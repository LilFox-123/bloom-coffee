import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 no-print">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-brdr max-h-[90vh] overflow-y-auto animate-slide-up md:animate-scale-in`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-brdr sticky top-0 bg-white rounded-t-3xl md:rounded-t-2xl z-10">
          <h3 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="icon-btn hover:!text-danger">
            ✕
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
