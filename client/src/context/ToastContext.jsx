import { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

const ICONS = { success: '✓', error: '✗', warning: '⚠' };
const STYLES = {
  success: { bar: 'border-l-[#2E7D32]', circle: 'bg-[#E8F5E9] text-[#2E7D32]' },
  error: { bar: 'border-l-[#C62828]', circle: 'bg-[#FFEBEE] text-[#C62828]' },
  warning: { bar: 'border-l-[#E65100]', circle: 'bg-[#FBE9E7] text-[#E65100]' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'success') => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    warning: (m) => push(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 min-w-[300px] sm:min-w-[320px] max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-brdr border-l-4 px-4 py-3 shadow-lg animate-toast-in ${STYLES[t.type].bar}`}
          >
            <span
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${STYLES[t.type].circle}`}
            >
              {ICONS[t.type]}
            </span>
            <p className="text-sm font-medium text-text-body flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-text-muted hover:text-text-body"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
