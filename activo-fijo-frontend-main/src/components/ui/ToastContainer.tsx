import React, { useState, useEffect } from 'react';
import { addToastListener, ToastEvent } from '../../utils/toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const unsubscribe = addToastListener((toast) => {
      setToasts((prev) => [...prev, toast]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let emoji = 'ℹ️';
        if (toast.type === 'success') {
          emoji = '✅';
        } else if (toast.type === 'error') {
          emoji = '❌';
        } else if (toast.type === 'warning') {
          emoji = '⚠️';
        }

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              {emoji}
            </span>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close-btn" onClick={() => handleClose(toast.id)} aria-label="Cerrar">
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
