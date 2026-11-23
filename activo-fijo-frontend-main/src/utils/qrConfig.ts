
// Dirección original del proyecto.
// Se conserva para no alterar la configuración anterior.
export const PUBLIC_TUNNEL_URL =
  'https://intended-cleanup-veteran-tournament.trycloudflare.com';

export function getAssetQrUrl(codActivo: string): string {
  const localUrl = process.env.REACT_APP_QR_BASE_URL?.trim();

  let baseUrl: string;

  if (localUrl) {
    // Configuración individual de cada computadora.
    baseUrl = localUrl;
  } else if (
    window.location.protocol === 'https:' ||
    window.location.hostname.includes('trycloudflare.com')
  ) {
    baseUrl = window.location.origin;
  } else {
    // Comportamiento original.
    baseUrl = PUBLIC_TUNNEL_URL;
  }

  return `${baseUrl.replace(/\/$/, '')}/consulta/${encodeURIComponent(codActivo)}`;
}
