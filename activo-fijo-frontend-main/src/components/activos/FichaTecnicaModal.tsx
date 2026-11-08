import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { createPortal } from 'react-dom';
import { GET_FICHA_TECNICA_ACTIVO } from '../../graphql/queries';
import { QRCodeImage } from '../../utils/barcodes';

interface FichaTecnicaModalProps {
  activo: any;
  onClose: () => void;
}

const money = (value: any): string => {
  if (value === null || value === undefined || value === '') return 'S/M';
  const n = Number(value);
  if (Number.isNaN(n)) return 'S/M';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const dateFmt = (value?: string | null): string => {
  if (!value) return '-';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const periodFmt = (value: any): string => {
  const n = Number(value);
  if (!n || Number.isNaN(n)) return '-';
  return `${Math.floor(n / 100)}-${String(n % 100).padStart(2, '0')}`;
};

const officePath = (oficina: any): string => {
  if (!oficina) return 'No asignada';
  const parts: string[] = [];
  let current = oficina;
  while (current) {
    if (current.desDpto) parts.unshift(current.desDpto);
    current = current.codPadre;
  }
  return parts.length ? parts.join(' / ') : 'No asignada';
};

const groupPath = (grupo: any): string => {
  if (!grupo) return '-';
  const codes: string[] = [];
  const names: string[] = [];
  let current = grupo;
  while (current) {
    if (current.codHijo) codes.unshift(current.codHijo);
    if (current.desGrupo) names.unshift(current.desGrupo);
    current = current.codPadre;
  }
  const code = codes.join('-');
  const name = names.join(' > ');
  if (code && name) return `${code} — ${name}`;
  return name || code || '-';
};

const personName = (empleado: any): string => {
  if (!empleado) return '';
  return [empleado.nombre, empleado.apellido].filter(Boolean).join(' ');
};

const buildQrUrl = (codActivo: string): string => {
  const hostname = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '192.168.0.104'
    : window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${hostname}${port}/consulta/${codActivo}`;
};

const FICHA_CSS = `
  @page { size: A4 portrait; margin: 0; }

  .ft-sheet {
    width: 210mm;
    min-height: 296mm;
    box-sizing: border-box;
    padding: 9mm 11mm 8mm 11mm;
    background: #ffffff;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8.4px;
    line-height: 1.28;
    margin: 0 auto;
    box-shadow: 0 2px 16px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ft-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 5px;
    border-bottom: 2.5px solid #0d2347;
  }
  .ft-head-left { display: flex; align-items: center; gap: 9px; min-width: 0; }
  .ft-crest { flex-shrink: 0; }
  .ft-uni {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 13.5px;
    font-weight: 700;
    color: #0d2347;
    letter-spacing: .25px;
    line-height: 1.1;
  }
  .ft-dir {
    font-size: 9px;
    font-weight: 700;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: .55px;
    margin-top: 2px;
  }
  .ft-system {
    font-size: 6.8px;
    color: #475569;
    letter-spacing: .35px;
    margin-top: 1px;
    text-transform: uppercase;
  }
  .ft-loc { font-size: 6.8px; color: #64748b; margin-top: 1px; }
  .ft-qr-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid #94a3b8;
    border-radius: 3px;
    padding: 3px 5px 2px;
    min-width: 82px;
    background: #ffffff;
  }
  .ft-qr-code {
    font-family: 'Courier New', monospace;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .4px;
    margin-top: 1px;
    color: #0f172a;
  }
  .ft-qr-caption {
    font-size: 5.8px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .3px;
  }

  .ft-title-band {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    background: #0d2347;
    color: #ffffff;
    padding: 3px 7px;
    margin: 5px 0;
    font-size: 8.2px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .45px;
  }
  .ft-title-band span:last-child {
    font-family: 'Courier New', monospace;
    font-size: 7.2px;
    white-space: nowrap;
  }

  .ft-section { break-inside: avoid; page-break-inside: avoid; }
  .ft-section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #e8eef7;
    border-left: 3px solid #0d2347;
    color: #0d2347;
    padding: 2px 6px;
    margin: 5px 0 3px;
    font-size: 7.8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .4px;
  }

  .ft-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .ft-table th, .ft-table td {
    border: .6px solid #94a3b8;
    padding: 2px 3.5px;
    vertical-align: top;
    font-size: 7.7px;
    line-height: 1.22;
    word-wrap: break-word;
  }
  .ft-table thead th {
    background: #f1f5f9;
    color: #0f172a;
    text-align: left;
    font-size: 7.2px;
    text-transform: uppercase;
    letter-spacing: .2px;
  }
  .ft-label { background: #f8fafc; color: #334155; font-weight: 700; }
  .ft-mono { font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: .15px; }
  .ft-money {
    text-align: right;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    white-space: nowrap;
  }
  .ft-center { text-align: center; }
  .ft-muted { color: #64748b; }
  .ft-current-row td { background: #ecfdf5; }
  .ft-badge {
    display: inline-block;
    border: 1px solid #94a3b8;
    border-radius: 2px;
    padding: 0 3px;
    font-size: 6.6px;
    font-weight: 700;
    letter-spacing: .2px;
  }
  .ft-badge-active { color: #166534; border-color: #86efac; background: #dcfce7; }
  .ft-note { font-size: 6.8px; color: #475569; margin-top: 2px; }

  .ft-signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    margin-top: auto;
    padding-top: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .ft-signature { text-align: center; padding-top: 34px; }
  .ft-sign-line { border-top: 1px solid #334155; margin: 0 6px 3px; }
  .ft-sign-name {
    font-size: 8.2px;
    font-weight: 700;
    text-transform: uppercase;
    color: #0f172a;
    min-height: 10px;
  }
  .ft-sign-role { font-size: 7px; color: #475569; line-height: 1.25; }
  .ft-sign-place { text-align: right; font-size: 7.2px; color: #475569; margin: 8px 4px 0 0; }

  .ft-footer {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid #cbd5e1;
    margin-top: 8px;
    padding-top: 2.5px;
    font-size: 6.3px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .25px;
  }

  .ficha-preview {
    padding: 14px;
    background: #e2e8f0;
    overflow: auto;
    flex: 1;
    min-height: 0;
  }
  .ficha-loading, .ficha-error {
    padding: 40px 20px;
    text-align: center;
    color: #475569;
    font-size: .9rem;
  }
  .ficha-error { color: #b91c1c; }
  .ficha-print-root { display: none; }

  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    body > *:not(.ficha-print-root) { display: none !important; }
    .ficha-print-root { display: block !important; }
    .ficha-print-root .ft-sheet {
      width: 210mm !important;
      min-height: 296mm !important;
      padding: 9mm 11mm 8mm 11mm !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
    .ft-sheet .ft-table tr { break-inside: avoid; page-break-inside: avoid; }
    .ft-sheet .ft-signatures { break-inside: avoid; page-break-inside: avoid; }
  }
`;

const UagrmCrest: React.FC = () => (
  <svg className="ft-crest" viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
    <circle cx="32" cy="32" r="30.5" fill="#0d2347" stroke="#b8860b" strokeWidth="2" />
    <circle cx="32" cy="32" r="26.5" fill="none" stroke="#ffffff" strokeWidth="1" />
    <path
      d="M32 9 L50 17 V33 C50 44 42 52 32 56 C22 52 14 44 14 33 V17 Z"
      fill="none"
      stroke="#ffffff"
      strokeWidth="1.3"
    />
    <text x="32" y="30" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ffffff" fontFamily="Arial, sans-serif" letterSpacing="0.3">U.A.G.R.M.</text>
    <text x="32" y="39" textAnchor="middle" fontSize="4.2" fill="#dbeafe" fontFamily="Arial, sans-serif" letterSpacing="0.4">ACTIVOS FIJOS</text>
    <text x="32" y="45" textAnchor="middle" fontSize="3.6" fill="#dbeafe" fontFamily="Arial, sans-serif" letterSpacing="0.35">D.U.A.F.</text>
  </svg>
);

function FichaTecnicaSheet({ ficha }: { ficha: any }) {
  const { a, latestDep, activeReval, history, currentRow, currentEmp, specRows, qrUrl, vehicle } = ficha;

  const depreciacionAcumulada = latestDep?.acumulada ?? 0;
  const valorActual = latestDep?.valorActual ?? a.monto;
  const vidaUtil = activeReval
    ? `${activeReval.vidaUtilAno ?? 0} año(s) ${activeReval.vidaUtilMes ?? 0} mes(es) (revaluado)`
    : (a.codGrupo?.vidaUtilDefault !== null && a.codGrupo?.vidaUtilDefault !== undefined
      ? `${a.codGrupo.vidaUtilDefault} años`
      : 'No definida');

  return (
    <div className="ft-sheet">
      {/* Membrete institucional */}
      <header className="ft-header">
        <div className="ft-head-left">
          <UagrmCrest />
          <div>
            <div className="ft-uni">UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</div>
            <div className="ft-dir">Dirección Universitaria de Activos Fijos</div>
            <div className="ft-system">Sistema de Administración de Bienes y Activos Fijos · VSIAF 2.0</div>
            <div className="ft-loc">Santa Cruz de la Sierra — Bolivia</div>
          </div>
        </div>
        <div className="ft-qr-box">
          <QRCodeImage value={qrUrl} size={72} />
          <span className="ft-qr-code">{a.codActivo}</span>
          <span className="ft-qr-caption">Verificación en línea</span>
        </div>
      </header>

      <div className="ft-title-band">
        <span>Ficha Técnica y Hoja de Vida del Activo Fijo</span>
        <span>HOJA DE VIDA · N° REG. {a.nroActivo}</span>
      </div>

      {/* 1. Identificación */}
      <section className="ft-section">
        <div className="ft-section-title">
          <span>1. Datos de identificación del activo</span>
          <span className="ft-muted" style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
            {a.codEstado?.desEstado || 'REGISTRADO'}
          </span>
        </div>
        <table className="ft-table">
          <colgroup>
            <col style={{ width: '17%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '33%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="ft-label">Código de activo</td>
              <td className="ft-mono">{a.codActivo}</td>
              <td className="ft-label">N° de registro</td>
              <td>{a.nroActivo}</td>
            </tr>
            <tr>
              <td className="ft-label">Descripción</td>
              <td colSpan={3}>{a.descripcion || 'Sin descripción'}</td>
            </tr>
            <tr>
              <td className="ft-label">Grupo contable</td>
              <td colSpan={3}>{groupPath(a.codGrupo)}</td>
            </tr>
            <tr>
              <td className="ft-label">Marca</td>
              <td>{a.codMarca?.desMarca || 'S/M'}</td>
              <td className="ft-label">Modelo</td>
              <td>{a.codModelo?.desModelo || 'S/M'}</td>
            </tr>
            <tr>
              <td className="ft-label">N° de serie</td>
              <td className="ft-mono">{a.nroSerie || 'S/N'}</td>
              <td className="ft-label">Condición física</td>
              <td>{a.codCond?.desCond || 'No registrada'}</td>
            </tr>
            <tr>
              <td className="ft-label">Estado del activo</td>
              <td>{a.codEstado?.desEstado || 'No registrado'}</td>
              <td className="ft-label">Estado de registro</td>
              <td>{a.estadoRegistro || '-'}</td>
            </tr>
            <tr>
              <td className="ft-label">Fecha de adquisición</td>
              <td>{dateFmt(a.fecAdqui)}</td>
              <td className="ft-label">Gestión</td>
              <td>{a.codGest?.gestIni || '-'}</td>
            </tr>
            <tr>
              <td className="ft-label">Proveedor</td>
              <td>{a.codProve?.nombre || 'No registrado'}</td>
              <td className="ft-label">Ingreso</td>
              <td>
                {a.nroIngreso?.nroIngreso
                  ? `N° ${a.nroIngreso.nroIngreso}${a.nroIngreso.glosa ? ` — ${a.nroIngreso.glosa}` : ''}`
                  : '-'}
              </td>
            </tr>
            <tr>
              <td className="ft-label">Organismo financiador</td>
              <td>{a.organismoFinanciador ?? '-'}</td>
              <td className="ft-label">Código RUBE</td>
              <td className="ft-mono">{a.codRube || '-'}</td>
            </tr>
            <tr>
              <td className="ft-label">N° de convenio</td>
              <td>{a.nroConvenio || '-'}</td>
              <td className="ft-label">Cantidad / unidad</td>
              <td>
                {currentRow?.cantidad ?? 1}
                {a.codUnidad?.desUnidad ? ` ${a.codUnidad.desUnidad}` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 2. Especificaciones técnicas */}
      <section className="ft-section">
        <div className="ft-section-title">
          <span>2. Especificaciones técnicas</span>
        </div>
        <table className="ft-table">
          <colgroup>
            <col style={{ width: '38%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Especificación</th>
              <th>Detalle / Opción</th>
              <th>Valor registrado</th>
            </tr>
          </thead>
          <tbody>
            {specRows.length === 0 && (
              <tr>
                <td colSpan={3} className="ft-center ft-muted">Sin especificaciones técnicas registradas.</td>
              </tr>
            )}
            {specRows.map((row: any, idx: number) => (
              <tr key={`${row.name}-${idx}`}>
                <td className="ft-label">{row.name}</td>
                <td>{row.detail}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {vehicle && (
          <>
            <div className="ft-section-title" style={{ marginTop: 4 }}>
              <span>2.1 Datos del vehículo</span>
            </div>
            <table className="ft-table">
              <colgroup>
                <col style={{ width: '17%' }} />
                <col style={{ width: '33%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '33%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <td className="ft-label">Placa</td>
                  <td className="ft-mono">{vehicle.placa || 'S/P'}</td>
                  <td className="ft-label">Año / Color</td>
                  <td>{vehicle.anio || '-'} / {vehicle.color || '-'}</td>
                </tr>
                <tr>
                  <td className="ft-label">N° de motor</td>
                  <td className="ft-mono">{vehicle.motor || 'S/N'}</td>
                  <td className="ft-label">N° de chasis</td>
                  <td className="ft-mono">{vehicle.chasis || 'S/N'}</td>
                </tr>
                <tr>
                  <td className="ft-label">Tipo</td>
                  <td>{vehicle.tipo || '-'}</td>
                  <td className="ft-label">Marca / Modelo</td>
                  <td>{vehicle.marca || 'S/M'} / {vehicle.modelo || 'S/Mod'}</td>
                </tr>
                <tr>
                  <td className="ft-label">Cilindrada</td>
                  <td>{vehicle.cilindrada ? `${vehicle.cilindrada} cc` : '-'}</td>
                  <td className="ft-label">Vencimiento SOAT</td>
                  <td>{dateFmt(vehicle.fechaVencimientoSoat)}</td>
                </tr>
                <tr>
                  <td className="ft-label">País de industria</td>
                  <td>{vehicle.industria || '-'}</td>
                  <td className="ft-label">RUAT</td>
                  <td className="ft-mono">{vehicle.ruat || '-'}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* 3. Valor contable */}
      <section className="ft-section">
        <div className="ft-section-title">
          <span>3. Valor contable</span>
        </div>
        <table className="ft-table">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Valor de adquisición</th>
              <th>Depreciación acumulada</th>
              <th>Valor neto actual</th>
              <th>Vida útil</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ft-money">{money(a.monto)}</td>
              <td className="ft-money">{money(depreciacionAcumulada)}</td>
              <td className="ft-money">{money(valorActual)}</td>
              <td>{vidaUtil}</td>
            </tr>
          </tbody>
        </table>
        <div className="ft-note">
          {latestDep ? `Último período depreciado: ${periodFmt(latestDep.nroSerie)}` : 'Sin depreciaciones registradas'}
          {activeReval ? ` · Fecha de revalúo: ${dateFmt(activeReval.fechaReval)}` : ''}
          {latestDep?.valorRevaluo !== null && latestDep?.valorRevaluo !== undefined
            ? ` · Valor de revalúo: ${money(latestDep.valorRevaluo)}`
            : ''}
        </div>
      </section>

      {/* 4. Historial de asignaciones */}
      <section className="ft-section">
        <div className="ft-section-title">
          <span>4. Historial de asignaciones</span>
          <span className="ft-muted" style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
            {history.length} registro(s)
          </span>
        </div>
        <table className="ft-table">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '29%' }} />
            <col style={{ width: '29%' }} />
            <col style={{ width: '13%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="ft-center">N°</th>
              <th>Fecha asignación</th>
              <th>Fecha fin</th>
              <th>Oficina / destino</th>
              <th>Custodio / responsable</th>
              <th className="ft-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="ft-center ft-muted">El activo no registra asignaciones.</td>
              </tr>
            )}
            {history.map((det: any, idx: number) => {
              const asig = det.codAsig || {};
              const employee = det.employee;
              const isActive = asig.estado === 'A';
              return (
                <tr key={`${asig.codAsig || 'asig'}-${idx}`} className={isActive ? 'ft-current-row' : ''}>
                  <td className="ft-center">{idx + 1}</td>
                  <td>{dateFmt(asig.fechaAsig)}</td>
                  <td>{isActive ? '—' : dateFmt(asig.fechaFin)}</td>
                  <td>{officePath(asig.codOfic)}</td>
                  <td>
                    {personName(employee) || (asig.codResp ? `Cód. responsable ${asig.codResp}` : 'Sin custodio individual')}
                  </td>
                  <td className="ft-center">
                    <span className={`ft-badge ${isActive ? 'ft-badge-active' : ''}`}>
                      {isActive ? 'VIGENTE' : 'CERRADA'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 5. Custodio actual */}
      <section className="ft-section">
        <div className="ft-section-title">
          <span>5. Custodio actual y ubicación</span>
        </div>
        <table className="ft-table">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '32%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td className="ft-label">Custodio actual</td>
              <td>{personName(currentEmp) || (currentRow ? 'Responsable por oficina / unidad' : 'Sin custodio asignado')}</td>
              <td className="ft-label">Cargo</td>
              <td>{currentEmp?.cargo || 'No registrado'}</td>
            </tr>
            <tr>
              <td className="ft-label">Documento de identidad</td>
              <td>{currentEmp?.numeroDocumento || 'No registrado'}</td>
              <td className="ft-label">Oficina / destino</td>
              <td>{currentRow ? officePath(currentRow.codAsig?.codOfic) : 'Almacén / custodia general'}</td>
            </tr>
            <tr>
              <td className="ft-label">Desde</td>
              <td>{currentRow ? dateFmt(currentRow.codAsig?.fechaAsig) : '-'}</td>
              <td className="ft-label">Situación</td>
              <td>{currentRow ? 'Bajo custodia y responsabilidad' : 'Sin asignación vigente'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Firmas */}
      <div className="ft-sign-place">
        Santa Cruz de la Sierra, ____ de ____________________ de ________
      </div>
      <section className="ft-signatures">
        <div className="ft-signature">
          <div className="ft-sign-line" />
          <div className="ft-sign-name">Encargado de Activos Fijos</div>
          <div className="ft-sign-role">Dirección Universitaria de Activos Fijos</div>
          <div className="ft-sign-role">Universidad Autónoma Gabriel René Moreno</div>
        </div>
        <div className="ft-signature">
          <div className="ft-sign-line" />
          <div className="ft-sign-name">{personName(currentEmp) || 'Custodio del Activo'}</div>
          <div className="ft-sign-role">Custodio / Responsable del Bien</div>
          <div className="ft-sign-role">
            {currentEmp?.numeroDocumento ? `C.I. ${currentEmp.numeroDocumento}` : 'Documento de identidad'}
          </div>
        </div>
      </section>

      <footer className="ft-footer">
        <span>Documento generado por el Sistema de Activos Fijos — UAGRM</span>
        <span>Impreso: {new Date().toLocaleString('es-BO')}</span>
        <span>VSIAF 2.0</span>
      </footer>
    </div>
  );
}

export default function FichaTecnicaModal({ activo, onClose }: FichaTecnicaModalProps) {
  const nroActivo = Number(activo?.nroActivo);
  const codGrupo = Number(activo?.codGrupo?.codGrupo);

  const { data, loading, error } = useQuery(GET_FICHA_TECNICA_ACTIVO, {
    variables: { nroActivo, codGrupo },
    skip: !nroActivo || !codGrupo,
    fetchPolicy: 'network-only'
  });

  const ficha = useMemo(() => {
    if (!data?.activo) return null;

    const a = data.activo;
    const responsables = data.todosResponsables || [];

    const resolveEmployee = (asig: any) => {
      if (!asig) return null;
      const resp = responsables.find((r: any) => String(r.codResp) === String(asig.codResp));
      if (resp?.codEmp) return resp.codEmp;
      return asig.empleadoResponsable || null;
    };

    const history = [...(a.inDetAsigSet || [])]
      .sort((x: any, y: any) =>
        String(x.codAsig?.fechaAsig || '').localeCompare(String(y.codAsig?.fechaAsig || ''))
      )
      .map((det: any) => ({ ...det, employee: resolveEmployee(det.codAsig) }));

    const currentRow = [...history].reverse().find((row: any) => row.codAsig?.estado === 'A') || null;
    const currentEmp = currentRow?.employee || null;

    const depSet = [...(a.inDepAcumuladaSet || [])]
      .sort((x: any, y: any) => Number(y.nroSerie) - Number(x.nroSerie));
    const latestDep = depSet[0] || null;
    const activeReval = (a.inDetRevalSet || []).find((r: any) => r.estado === 'A') || null;

    const assignedSpecs = (data.atribActivosPorActivo || []).filter((s: any) => s.ok === 'S');
    const groupAttrs = data.atributosPorGrupo || [];
    const specRows = groupAttrs.length
      ? groupAttrs.map((attr: any) => {
          const assigned = assignedSpecs.find(
            (s: any) => String(s.codDetAtrib?.codAtrib?.codAtrib) === String(attr.codAtrib)
          );
          return {
            name: attr.des,
            detail: assigned?.codDetAtrib?.des || 'No registrado',
            value: assigned?.valor || '-'
          };
        })
      : assignedSpecs.map((s: any) => ({
          name: s.codDetAtrib?.codAtrib?.des || 'Especificación',
          detail: s.codDetAtrib?.des || '-',
          value: s.valor || '-'
        }));

    return {
      a,
      latestDep,
      activeReval,
      history,
      currentRow,
      currentEmp,
      specRows,
      vehicle: a.vehiculo,
      qrUrl: buildQrUrl(a.codActivo)
    };
  }, [data]);

  return (
    <div className="modal-overlay ficha-modal-overlay" onClick={onClose}>
      <style>{FICHA_CSS}</style>

      <div
        className="modal modal-xl ficha-modal-shell"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title ficha-no-print">
          <span>Ficha Técnica / Hoja de Vida del Activo</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ficha-preview">
          {loading && <div className="ficha-loading">Cargando datos del activo...</div>}
          {!loading && error && (
            <div className="ficha-error">No se pudo cargar la ficha técnica: {error.message}</div>
          )}
          {!loading && !error && !ficha && (
            <div className="ficha-error">No se encontró información suficiente para generar la ficha del activo.</div>
          )}
          {!loading && !error && ficha && <FichaTecnicaSheet ficha={ficha} />}
        </div>

        <div className="modal-actions ficha-no-print">
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
            disabled={!ficha}
          >
            🖨️ Imprimir Ficha Técnica
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {ficha && typeof document !== 'undefined' && createPortal(
        <div className="ficha-print-root">
          <FichaTecnicaSheet ficha={ficha} />
        </div>,
        document.body
      )}
    </div>
  );
}
