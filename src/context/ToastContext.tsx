import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
  error:   <XCircle      className="w-4 h-4 text-red-500    flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500  flex-shrink-0" />,
  info:    <Info          className="w-4 h-4 text-blue-500   flex-shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error:   'bg-red-50    border-red-200    text-red-900',
  warning: 'bg-amber-50  border-amber-200  text-amber-900',
  info:    'bg-blue-50   border-blue-200   text-blue-900',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    // Trigger exit animation first
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 3200) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type }]); // max 4 visible
    const timer = setTimeout(() => removeToast(id), duration);
    timers.current.set(id, timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container — fixed top center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[min(360px,90vw)] pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg pointer-events-auto ${BG[toast.type]} ${
              toast.exiting ? 'toast-out' : 'toast-in'
            }`}
          >
            {ICONS[toast.type]}
            <span className="text-sm font-semibold flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
