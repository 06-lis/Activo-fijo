// Configuración centralizada de URLs para Códigos QR escaneables públicamente
export const PUBLIC_TUNNEL_URL = 'https://intended-cleanup-veteran-tournament.trycloudflare.com';

export function getAssetQrUrl(codActivo: string): string {
  if (typeof window !== 'undefined') {
    // Si ya estamos navegando desde el túnel o cualquier dominio https, usar ese origin
    if (window.location.protocol === 'https:' || window.location.hostname.includes('trycloudflare.com')) {
      return `${window.location.origin}/consulta/${codActivo}`;
    }
  }
  // Si estamos en localhost, usar el túnel público de Cloudflare para que cualquier celular con megas pueda escanearlo
  return `${PUBLIC_TUNNEL_URL}/consulta/${codActivo}`;
}
