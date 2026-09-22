import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, Close } from './Icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, kind = 'success') => {
    setToast({ message, kind, id: Date.now() });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const hide = () => setToast(null);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status" key={toast.id}>
          <span className="toast-icon">
            {toast.kind === 'error' ? <Close size={15} /> : <Check size={15} />}
          </span>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}
