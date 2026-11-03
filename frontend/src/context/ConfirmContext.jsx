import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((config = {}) => new Promise((resolve) => {
    if (resolver.current) {
      resolver.current(false);
      resolver.current = null;
    }
    resolver.current = resolve;
    setOptions({
      title: config.title || 'Confirmar acción',
      message: config.message || '',
      confirmText: config.confirmText || 'Sí, confirmar',
    });
  }), []);

  const close = useCallback((accepted) => {
    setOptions(null);
    if (resolver.current) {
      resolver.current(accepted);
      resolver.current = null;
    }
  }, []);

  useEffect(() => {
    if (!options) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close(false);
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [options, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <>
          <div
            className="modal fade nova-confirm-modal show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="novaConfirmTitle"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <button
                  type="button"
                  className="btn-close nova-modal-close"
                  onClick={() => close(false)}
                  aria-label="Cerrar"
                />
                <div className="nova-modal-body">
                  <div className="nova-modal-icon" aria-hidden="true">
                    <i className="bi bi-exclamation-lg" />
                  </div>
                  <h2 className="nova-modal-title" id="novaConfirmTitle">{options.title}</h2>
                  <p className="nova-modal-message">{options.message}</p>
                  <div className="nova-modal-actions">
                    <button type="button" className="btn nova-modal-cancel" onClick={() => close(false)}>
                      Cancelar
                    </button>
                    <button type="button" className="btn nova-modal-confirm" onClick={() => close(true)}>
                      {options.confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return context;
}
