export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastEvent) => void;
const listeners = new Set<ToastListener>();

export const addToastListener = (listener: ToastListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const showToast = (message: string, type: ToastType = 'info') => {
  const toast: ToastEvent = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  };
  listeners.forEach((listener) => listener(toast));
};

// Override window.alert globally
if (typeof window !== 'undefined') {
  const originalAlert = window.alert;

  window.alert = (message: any) => {
    const msgStr = String(message);

    // Fallback if no listeners are registered yet
    if (listeners.size === 0) {
      if (typeof originalAlert === 'function') {
        originalAlert(msgStr);
      } else {
        console.log('Alert (No Listeners):', msgStr);
      }
      return;
    }

    let type: ToastType = 'info';
    const msgLower = msgStr.toLowerCase();

    // Check for success emojis or keywords
    if (
      msgStr.includes('✅') ||
      msgStr.includes('📸') ||
      msgStr.includes('🚗') ||
      msgLower.includes('éxito') ||
      msgLower.includes('exito') ||
      msgLower.includes('correctamente') ||
      msgLower.includes('guardado') ||
      msgLower.includes('creado') ||
      msgLower.includes('creada') ||
      msgLower.includes('aprobada') ||
      msgLower.includes('aprobado') ||
      msgLower.includes('registrado') ||
      msgLower.includes('registrada') ||
      msgLower.includes('finalizado') ||
      msgLower.includes('completado')
    ) {
      type = 'success';
    }
    // Check for error/warning emojis or keywords
    else if (
      msgStr.includes('❌') ||
      msgStr.includes('⚠️') ||
      msgLower.includes('error') ||
      msgLower.includes('falló') ||
      msgLower.includes('fallo') ||
      msgLower.includes('incorrecto') ||
      msgLower.includes('denegado') ||
      msgLower.includes('restringido') ||
      msgLower.includes('obligatorio') ||
      msgLower.includes('obligatorios') ||
      msgLower.includes('seleccione') ||
      msgLower.includes('complete') ||
      msgLower.includes('remueva')
    ) {
      type = 'error';
    }

    showToast(msgStr, type);
  };
}
