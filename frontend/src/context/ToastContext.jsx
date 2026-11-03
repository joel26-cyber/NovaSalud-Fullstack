import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((type, message) => {
    counter.current += 1;
    const id = counter.current;
    const safeType = ICONS[type] ? type : 'info';
    setToasts((current) => [...current, { id, type: safeType, message }]);
    window.setTimeout(() => remove(id), 5000);
  }, [remove]);

  const value = useMemo(() => ({ notify, remove }), [notify, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`alert alert-${toast.type} alert-dismissible fade show toast-alert`} role="alert">
            <i className={`bi ${ICONS[toast.type]} me-2`} />
            <span>{toast.message}</span>
            <button type="button" className="btn-close" onClick={() => remove(toast.id)} aria-label="Cerrar" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
}
