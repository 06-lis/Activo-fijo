import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { VALIDAR_SOLVENCIA, TODOS_CERTIFICADOS, CERTIFICADO_POR_ID } from '../graphql/queries';
import { GENERAR_CERTIFICADO_LIBERACION } from '../graphql/mutations';
import { showToast } from '../utils/toast';

/**
 * Certificado de Liberación de Responsabilidad.
 * Valida solvencia del funcionario, genera el certificado y lo renderiza
 * como hoja imprimible (HTML para impresión desde el navegador, patrón
 * consistente con la Ficha Técnica).
 */
export default function CertificadoLiberacion() {
  const [searchId, setSearchId] = useState('');
  const [empleadoSel, setEmpleadoSel] = useState<any>(null);
  const [solvencia] = useState<string>('');
  const [certificado, setCertificado] = useState<any>(null);
  const [certificadoSeleccionado, setCertificadoSeleccionado] = useState<any>(null);
  const [nroDevolucion, setNroDevolucion] = useState('');

  useQuery(VALIDAR_SOLVENCIA, {
    variables: { idEmpleado: empleadoSel ? empleadoSel.idEmpleado : 0 },
    skip: !empleadoSel,
    fetchPolicy: 'network-only',
  });

  const { data: certsData, refetch: refetchCerts } = useQuery(TODOS_CERTIFICADOS, {
    fetchPolicy: 'cache-and-network',
  });

  const [generarCertificado] = useMutation(GENERAR_CERTIFICADO_LIBERACION, {
    refetchQueries: [{ query: VALIDAR_SOLVENCIA }, { query: TODOS_CERTIFICADOS }],
  });

  const { data: certPorIdData } = useQuery(CERTIFICADO_POR_ID, {
    variables: { nroCertificado: certificadoSeleccionado ? certificadoSeleccionado.nroCertificado : 0 },
    skip: !certificadoSeleccionado,
    fetchPolicy: 'network-only',
  });

  const esSolvente = solvencia === 'OK';
  const activosPendientesMsg = solvencia.startsWith('PENDIENTE:') ? solvencia.replace('PENDIENTE:', '') : '';

  const dateFmt = (v?: string | null) => {
    if (!v) return '-';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  };

  const handleGenerar = async () => {
    if (!empleadoSel) {
      alert('Selecciona un funcionario.');
      return;
    }
    if (!esSolvente) {
      alert('No se puede emitir el certificado: el funcionario tiene activos pendientes.\n' + activosPendientesMsg);
      return;
    }

    try {
      const res = await generarCertificado({
        variables: {
          idEmpleado: empleadoSel.idEmpleado,
          nroDevolucion: nroDevolucion ? parseInt(nroDevolucion, 10) : null,
        },
      });
      const nuevo = res.data?.generarCertificadoLiberacion?.certificado;
      if (nuevo) {
        setCertificado(nuevo);
        setCertificadoSeleccionado(nuevo);
        showToast('✅ Certificado de Liberación generado');
        refetchCerts();
      }
    } catch (err: any) {
      alert('Error al generar el certificado: ' + err.message);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const certificados = certsData?.todasCertificados || [];
  const certActual = certPorIdData?.certificado || certificado;

  return (
    <PageLayout
      title="Certificado de Liberación de Responsabilidad"
      subtitle="Solvencia de Activo Fijo — UAGRM"
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: () => refetchCerts() },
        { label: 'Imprimir Certificado', icon: '🖨', variant: 'primary' as const, onClick: handleImprimir, show: !!certActual },
      ]}
    >
      {/* Paso 1: Validar solvencia */}
      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
          1. Validar Solvencia del Funcionario
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            placeholder="ID de empleado (funcionario)..."
            style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 1, minWidth: '220px' }}
          />
          <button
            onClick={() => {
              const id = parseInt(searchId, 10);
              if (id) setEmpleadoSel({ idEmpleado: id });
              else alert('Ingresa un ID de empleado válido.');
            }}
            style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#1a3c6e', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Validar
          </button>
        </div>
        {empleadoSel && (
          <div style={{ marginTop: '10px', padding: '12px', background: esSolvente ? '#ecfdf5' : '#fef2f2', borderRadius: '6px', border: `1px solid ${esSolvente ? '#86efac' : '#fca5a5'}` }}>
            <strong>Funcionario ID:</strong> {empleadoSel.idEmpleado}&nbsp;&nbsp;
            <strong>Estado:</strong> {esSolvente ? '✅ Solvente — puede emitirse certificado' : '❌ No solvente — tiene activos pendientes'}
            {!esSolvente && (
              <div style={{ marginTop: '6px', color: '#92400e', fontSize: '0.8rem' }}>
                Activos pendientes: {activosPendientesMsg}
              </div>
            )}
            {esSolvente && (
              <div style={{ marginTop: '6px', color: '#166534', fontSize: '0.8rem' }}>
                El funcionario no registra activos bajo su responsabilidad. Habilitado para certificado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paso 2: Generar certificado */}
      {empleadoSel && esSolvente && (
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
            2. Generar Certificado
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Nro. Devolución (opcional)</label>
              <input
                type="number"
                value={nroDevolucion}
                onChange={e => setNroDevolucion(e.target.value)}
                placeholder="Nro. devolución relacionada"
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
              <button
                onClick={handleGenerar}
                style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', background: '#1a3c6e', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Generar Certificado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 3: Certificado generado (vista previa imprimible) */}
      {certActual && (
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
            3. Certificado Generado
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>N° {certActual.nroCertificado}</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>· Emitido: {dateFmt(certActual.fechaEmision)}</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>· Estado: {certActual.estado === 'E' ? 'Emitido' : certActual.estado}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Funcionario</div>
              <div style={{ fontWeight: 700, color: '#1a3c6e' }}>{certActual.idEmpleado?.nombre} {certActual.idEmpleado?.apellido}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>C.I.</div>
              <div style={{ color: '#334155' }}>{certActual.idEmpleado?.numeroDocumento || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cargo</div>
              <div style={{ color: '#334155' }}>{certActual.idEmpleado?.cargo || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Relación Devolución</div>
              <div style={{ color: '#334155' }}>{certActual.nroDevolucion?.nroDevolucion || '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Certificado imprimible (hoja formal) */}
      {certActual && (
        <div id="certificado-print" style={{ display: 'none' }}>
          <div className="cert-sheet">
            <header className="cert-header">
              <div className="cert-head-left">
                <div className="cert-uni">UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</div>
                <div className="cert-dir">Dirección Administrativa Financiera (DAF)</div>
                <div className="cert-depto">Departamento de Activo Fijo</div>
              </div>
              <div className="cert-nro">CERTIFICADO N° {certActual.nroCertificado}</div>
            </header>

            <div className="cert-body">
              <p className="cert-par">Por la presente se certifica que el servidor:</p>
              <div className="cert-dato">
                <strong>{certActual.idEmpleado?.nombre} {certActual.idEmpleado?.apellido}</strong>, titular de C.I. N° {certActual.idEmpleado?.numeroDocumento || '—'}, cargo de {certActual.idEmpleado?.cargo || '—'}, no registra activos fijos pendientes bajo su responsabilidad a la fecha de emisión del presente documento.
              </div>
              <p className="cert-par">
                Todos los bienes muebles que estaban bajo su custodia fueron devueltos y el registro de custodia se encuentra actualizado, conforme al proceso de devolución N° {certActual.nroDevolucion?.nroDevolucion || '—'}.
              </p>
              <p className="cert-par">
                El presente certificado se extiende a solicitud del interesado para los fines legales que estime conveniente, en la ciudad de Santa Cruz de la Sierra, a los {dateFmt(certActual.fechaEmision)} días del mes de {dateFmt(certActual.fechaEmision)} del año {dateFmt(certActual.fechaEmision)}.
              </p>
            </div>

            <div className="cert-firmas">
              <div className="cert-firma">
                <div className="cert-line" />
                <div className="cert-nombre">Jefe de Departamento de Activo Fijo</div>
                <div className="cert-cargo">Dirección Administrativa Financiera (DAF)</div>
              </div>
              <div className="cert-firma">
                <div className="cert-line" />
                <div className="cert-nombre">{certActual.idEmpleado?.nombre} {certActual.idEmpleado?.apellido}</div>
                <div className="cert-cargo">Funcionario / Titular del Certificado</div>
              </div>
            </div>

            <div className="cert-footer">
              <span>Sistema de Administración de Bienes y Activos Fijos — VSIAF 2.0 · UAGRM</span>
              <span>Certificado N° {certActual.nroCertificado} · Emitido: {dateFmt(certActual.fechaEmision)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Historial de certificados */}
      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
          Historial de Certificados Emitidos
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#0f172a', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem' }}>N° Certificado</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem' }}>Funcionario</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem' }}>C.I.</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem' }}>Fecha Emisión</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem' }}>Estado</th>
              <th style={{ padding: '8px 10px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem' }}>Ver</th>
            </tr>
          </thead>
          <tbody>
            {certificados.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay certificados emitidos.</td></tr>
            )}
            {certificados.map((c: any) => (
              <tr key={c.nroCertificado} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setCertificadoSeleccionado(c)}>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{c.nroCertificado}</td>
                <td style={{ padding: '8px 10px' }}>{c.idEmpleado?.nombre} {c.idEmpleado?.apellido}</td>
                <td style={{ padding: '8px 10px', fontSize: '0.8rem' }}>{c.idEmpleado?.numeroDocumento || '-'}</td>
                <td style={{ padding: '8px 10px', fontSize: '0.8rem' }}>{dateFmt(c.fechaEmision)}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: c.estado === 'E' ? '#dbeafe' : c.estado === 'V' ? '#d1fae5' : '#fef2f2', color: c.estado === 'E' ? '#1e3a8a' : c.estado === 'V' ? '#065f46' : '#991b1b' }}>
                    {c.estado === 'E' ? 'Emitido' : c.estado === 'V' ? 'Vigente' : 'Anulado'}
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <button onClick={() => setCertificadoSeleccionado(c)} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        #certificado-print { display: none; }
        .cert-sheet {
          width: 210mm; min-height: 200mm; padding: 15mm 18mm 12mm 18mm;
          background: #ffffff; color: #111827; font-family: 'Times New Roman', serif;
          font-size: 11px; line-height: 1.4; margin: 0 auto; box-shadow: 0 2px 12px rgba(15,23,42,0.15);
        }
        .cert-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0d2347; padding-bottom: 6px; margin-bottom: 14px; }
        .cert-head-left .cert-uni { font-weight: 800; font-size: 14px; color: #0d2347; letter-spacing: .3px; text-transform: uppercase; }
        .cert-head-left .cert-dir { font-weight: 700; font-size: 11.5px; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; }
        .cert-head-left .cert-depto { font-weight: 700; font-size: 10.5px; color: #0f172a; margin-top: 1px; }
        .cert-nro { font-family: 'Courier New', monospace; font-weight: 800; font-size: 13px; color: #0d2347; white-space: nowrap; border: 1px solid #0d2347; padding: 4px 8px; border-radius: 3px; }
        .cert-body { margin-bottom: 16px; text-align: justify; }
        .cert-par { margin: 0 0 8px 0; text-align: justify; }
        .cert-dato { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0d2347; padding: 10px 14px; margin: 10px 0; font-size: 11.5px; }
        .cert-firmas { display: flex; justify-content: space-between; gap: 30px; margin-top: 22px; page-break-inside: avoid; }
        .cert-firma { text-align: center; padding-top: 30px; }
        .cert-line { border-top: 1px solid #334155; margin-bottom: 4px; }
        .cert-nombre { font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #0f172a; min-height: 12px; }
        .cert-cargo { font-size: 8.5px; color: #475569; line-height: 1.3; }
        .cert-footer { display: flex; justify-content: space-between; gap: 10px; border-top: 1px solid #cbd5e1; margin-top: 14px; padding-top: 4px; font-size: 7.5px; color: #64748b; text-transform: uppercase; letter-spacing: .2px; }

        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body > *:not(#certificado-print) { display: none !important; }
          #certificado-print { display: block !important; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: #fff; }
          #certificado-print .cert-sheet { width: 210mm !important; margin: 0 !important; box-shadow: none !important; }
        }
      `}</style>
    </PageLayout>
  );
}
