// Configuración inteligente y automática de URLs para Códigos QR escaneables públicamente
export const PUBLIC_TUNNEL_URL = 'http://192.168.0.104:3000';

let cachedDetectedUrl = '';

// Consulta dinámica del backend para obtener la IP Wi-Fi local o el túnel activo
export async function syncQrConfigFromBackend(): Promise<string> {
  if (typeof window === 'undefined') return PUBLIC_TUNNEL_URL;
  try {
    const backendHost = window.location.hostname || 'localhost';
    const isTunnel = window.location.protocol === 'https:' || backendHost.includes('trycloudflare.com') || backendHost.includes('loca.lt');
    const endpoint = isTunnel ? '/api/qr-config/' : `http://${backendHost}:8000/api/qr-config/`;
    
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      const recommended = data.recommended_url || data.local_url;
      if (recommended) {
        cachedDetectedUrl = recommended;
        localStorage.setItem('detected_qr_base_url', recommended);
        return recommended;
      }
    }
  } catch {
    // Si falla la consulta, continuar con el fallback
  }
  return getQrBaseUrl();
}

// Iniciar sincronización en segundo plano al cargar
if (typeof window !== 'undefined') {
  syncQrConfigFromBackend();
}

export function getCustomQrBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('custom_qr_base_url') || '';
  }
  return '';
}

export function setCustomQrBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem('custom_qr_base_url', clean);
    } else {
      localStorage.removeItem('custom_qr_base_url');
    }
  }
}

export function getQrBaseUrl(): string {
  // 1. Variable de entorno local (.env / REACT_APP_QR_BASE_URL)
  const envUrl = process.env.REACT_APP_QR_BASE_URL?.trim();
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    // 2. Si el usuario fijó manualmente una URL en la interfaz
    const custom = getCustomQrBaseUrl();
    if (custom) return custom;

    // 3. Si ya estamos navegando desde el túnel o cualquier dominio público / HTTPS
    if (window.location.protocol === 'https:' || window.location.hostname.includes('trycloudflare.com') || window.location.hostname.includes('loca.lt')) {
      return window.location.origin;
    }

    // 4. Si estamos navegando desde una IP LAN (celular o PC conectada por Wi-Fi)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//${window.location.hostname}${port}`;
    }

    // 5. Si el backend ya nos reportó el túnel activo o la IP de red
    const detected = cachedDetectedUrl || localStorage.getItem('detected_qr_base_url');
    if (detected) return detected;
  }

  // 6. Fallback por defecto a la IP Wi-Fi de la PC
  return PUBLIC_TUNNEL_URL;
}

export function getAssetQrUrl(codActivo: string): string {
  const base = getQrBaseUrl().replace(/\/+$/, '');
  return `${base}/consulta/${encodeURIComponent(codActivo)}`;
}
