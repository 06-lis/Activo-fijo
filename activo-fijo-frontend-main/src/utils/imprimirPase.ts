/* Hoja imprimible del pase de salida temporal de activos.
   Se abre en una ventana aparte para no depender de los estilos del sistema. */

// Escapa el texto antes de meterlo al HTML (destino, motivo, etc. los escribe el usuario)
const esc = (t: any) =>
  String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// '2026-11-12' -> '12/11/2026'
const fecha = (f?: string | null) =>
  f && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f.split('-').reverse().join('/') : f || '';

const nombreCompleto = (e: any) => (e ? `${e.nombre} ${e.apellido}` : '');

// Cuenta cuántas veces se imprimió el pase desde este equipo.
// Ojo: se guarda en el navegador, no en la base de datos.
function contarImpresion(idPase: string): number {
  const clave = `pase_impresiones_${idPase}`;
  try {
    const n = Number(localStorage.getItem(clave) || '0') + 1;
    localStorage.setItem(clave, String(n));
    return n;
  } catch {
    return 1;
  }
}

const ESTILOS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; margin: 0; }
  h1 { font-size: 16px; margin: 0; letter-spacing: 0.3px; }
  h2 { font-size: 11px; margin: 14px 0 6px; padding: 3px 6px; background: #e8eef7; border-left: 4px solid #1a3c6e; text-transform: uppercase; }
  .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a3c6e; padding-bottom: 8px; }
  .cab small { color: #475569; }
  .caja { border: 2px solid #1a3c6e; padding: 4px 10px; text-align: center; font-weight: bold; color: #1a3c6e; }
  .caja span { display: block; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #94a3b8; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #1a3c6e; color: #fff; font-size: 10px; }
  .datos td { border: none; border-bottom: 1px solid #e2e8f0; padding: 3px 4px; }
  .datos td.et { width: 22%; color: #475569; font-weight: bold; }
  .fila td { height: 24px; }
  .centro { text-align: center; }
  .texto { font-size: 10px; color: #334155; margin: 8px 0; line-height: 1.4; }
  .control { display: flex; gap: 12px; }
  .control > div { flex: 1; border: 1px solid #94a3b8; padding: 6px 8px; min-height: 96px; }
  .control b { display: block; margin-bottom: 6px; color: #1a3c6e; }
  .linea { border-bottom: 1px solid #475569; height: 18px; margin-top: 6px; }
  .firmas { display: flex; gap: 30px; margin-top: 46px; text-align: center; }
  .firmas > div { flex: 1; border-top: 1px solid #111; padding-top: 3px; font-size: 10px; }
  .firmas small { display: block; color: #475569; }
  .pie { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
  .marca { position: fixed; top: 38%; left: 8%; font-size: 96px; font-weight: bold; color: rgba(185, 28, 28, 0.10); transform: rotate(-28deg); z-index: -1; }
`;

export function imprimirPase(p: any, impresoPor: string = '') {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) {
    alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio y vuelve a intentar.');
    return;
  }

  const veces = contarImpresion(String(p.idPase));
  const etiqueta = veces === 1 ? 'ORIGINAL' : `COPIA ${veces - 1}`;
  const numero = String(p.idPase).padStart(4, '0');
  const activos: any[] = (p.inDetPaseSet || []).map((d: any) => d.nroActivo);

  const filas = activos
    .map(
      (a, i) => `
      <tr class="fila">
        <td class="centro">${i + 1}</td>
        <td>${esc(a.codActivo)}</td>
        <td>${esc(a.descripcion)}</td>
        <td></td>
        <td class="centro">☐</td>
        <td></td>
        <td class="centro">☐</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Pase de salida N° ${numero}</title>
  <style>${ESTILOS}</style>
</head>
<body>
  ${veces > 1 ? `<div class="marca">COPIA</div>` : ''}

  <div class="cab">
    <div>
      <h1>PASE DE SALIDA TEMPORAL DE ACTIVOS</h1>
      <small>Dirección Universitaria de Activos Fijos — UAGRM</small>
    </div>
    <div class="caja">Pase N°<span>${numero}</span>${etiqueta}</div>
  </div>

  <h2>Datos del pase</h2>
  <table class="datos">
    <tr><td class="et">Solicitante</td><td>${esc(nombreCompleto(p.solicitante))}</td>
        <td class="et">Unidad</td><td>${esc(p.oficina?.desDpto)}</td></tr>
    <tr><td class="et">Destino</td><td>${esc(p.destino)}</td>
        <td class="et">Motivo</td><td>${esc(p.motivo)}</td></tr>
    <tr><td class="et">Fecha de salida</td><td>${fecha(p.fechaSalida)}</td>
        <td class="et">Retorno estimado</td><td>${fecha(p.fechaRetornoEst)}</td></tr>
    <tr><td class="et">Autorizado por</td><td>${esc(nombreCompleto(p.autorizadoPor)) || '—'}</td>
        <td class="et">V°B° Seguridad</td><td>${p.vbSeguridad ? 'Otorgado' : 'Pendiente (se otorga al registrar la salida)'}</td></tr>
    <tr><td class="et">Estado del pase</td><td>${esc(p.estado)}</td>
        <td class="et">Devuelto el</td><td>${fecha(p.fechaRetornoReal) || '—'}</td></tr>
  </table>

  <h2>Bienes que salen (${activos.length})</h2>
  <table>
    <thead>
      <tr>
        <th style="width:4%">N°</th>
        <th style="width:14%">Código</th>
        <th>Descripción</th>
        <th style="width:16%">Estado al salir</th>
        <th style="width:7%">Salida</th>
        <th style="width:16%">Estado al retorno</th>
        <th style="width:7%">Retorno</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <p class="texto">
    El solicitante declara recibir los bienes detallados, en el estado indicado, y se compromete a devolverlos
    en la fecha de retorno estimada y en las mismas condiciones. Cualquier pérdida, daño o retraso debe
    comunicarse de inmediato a la Dirección de Activos Fijos.
  </p>

  <h2>Control de salida y de retorno</h2>
  <div class="control">
    <div>
      <b>Salida (Seguridad)</b>
      Fecha y hora: ________________________
      <div class="linea"></div>
      Nombre del guardia:
      <div class="linea"></div>
      Observaciones:
      <div class="linea"></div>
    </div>
    <div>
      <b>Retorno (recepción)</b>
      Fecha y hora: ________________________
      <div class="linea"></div>
      Recibido por:
      <div class="linea"></div>
      Observaciones:
      <div class="linea"></div>
    </div>
  </div>

  <div class="firmas">
    <div>${esc(nombreCompleto(p.solicitante))}<small>Solicitante</small></div>
    <div>${esc(nombreCompleto(p.autorizadoPor))}<small>Autoriza</small></div>
    <div><small>V°B° Seguridad (salida)</small></div>
    <div><small>Recibe (retorno)</small></div>
  </div>

  <div class="pie">
    <span>Sistema de Gestión de Activos Fijos UAGRM · Pase N° ${numero} · ${etiqueta}</span>
    <span>Impreso el ${new Date().toLocaleString('es-BO')}${impresoPor ? ' por ' + esc(impresoPor) : ''}</span>
  </div>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
