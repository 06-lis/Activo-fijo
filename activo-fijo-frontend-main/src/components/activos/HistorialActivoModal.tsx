import React from 'react';
import { useQuery, gql } from '@apollo/client';

/* Historial de movimientos de un activo: quién lo tiene ahora, quién lo tenía antes
   y la línea de tiempo (ingreso, asignaciones, transferencias).
   Usa la query `historialActivo` (activo/schema/historial.py). */

const GET_HISTORIAL = gql`
  query GetHistorialActivo($nroActivo: Int!) {
    historialActivo(nroActivo: $nroActivo) {
      custodioActual
      oficinaActual
      desdeActual
      custodioAnterior
      oficinaAnterior
      movimientos { fecha tipo responsable oficina detalle }
    }
  }
`;

const COLOR_TIPO: Record<string, string> = {
  'Ingreso': '#1a3c6e',
  'Asignación': '#2e7d32',
  'Fin de asignación': '#e68a00',
  'Transferencia': '#6a1b9a',
};

const tarjeta = (borde: string): React.CSSProperties => ({
  flex: 1,
  padding: '10px 14px',
  borderLeft: `4px solid ${borde}`,
  background: '#f8fafc',
});

const etiqueta: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#64748b',
  letterSpacing: '0.04em',
};

export default function HistorialActivoModal({ activo, onClose }: { activo: any; onClose: () => void }) {
  const { data, loading, error } = useQuery(GET_HISTORIAL, {
    variables: { nroActivo: parseInt(activo.nroActivo) },
    fetchPolicy: 'network-only',
  });

  const h = data?.historialActivo;
  const movimientos: any[] = h?.movimientos || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>MOVIMIENTOS · {activo.codActivo}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '12px' }}>
            {activo.descripcion}
          </div>

          {loading && <div style={{ color: '#7a96b8', fontStyle: 'italic' }}>Cargando movimientos...</div>}

          {error && (
            <div className="error">No se pudo cargar el historial: {error.message}</div>
          )}

          {h && (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={tarjeta('#2e7d32')}>
                  <div style={etiqueta}>Lo tiene ahora</div>
                  <div style={{ fontWeight: 700, color: '#1a3c6e' }}>{h.custodioActual}</div>
                  {h.oficinaActual && <div style={{ fontSize: '0.78rem' }}>{h.oficinaActual}</div>}
                  {h.desdeActual && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Desde {h.desdeActual}</div>
                  )}
                </div>
                <div style={tarjeta('#e68a00')}>
                  <div style={etiqueta}>Lo tenía antes</div>
                  {h.custodioAnterior ? (
                    <>
                      <div style={{ fontWeight: 700, color: '#1a3c6e' }}>{h.custodioAnterior}</div>
                      {h.oficinaAnterior && <div style={{ fontSize: '0.78rem' }}>{h.oficinaAnterior}</div>}
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin custodio anterior</div>
                  )}
                </div>
              </div>

              <div style={{ ...etiqueta, marginBottom: '8px' }}>Línea de tiempo (lo más reciente primero)</div>
              {movimientos.length === 0 ? (
                <div style={{ color: '#7a96b8', fontStyle: 'italic' }}>Este activo todavía no tiene movimientos.</div>
              ) : (
                <div style={{ borderLeft: '2px solid #cbd5e1', marginLeft: '6px', paddingLeft: '16px' }}>
                  {movimientos.map((m, i) => (
                    <div key={i} style={{ position: 'relative', paddingBottom: '14px' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '-23px',
                          top: '3px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: COLOR_TIPO[m.tipo] || '#64748b',
                          border: '2px solid #fff',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                          {m.fecha || 'Sin fecha'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: COLOR_TIPO[m.tipo] || '#334155' }}>
                          {m.tipo}
                        </span>
                      </div>
                      {m.responsable && <div style={{ fontSize: '0.8rem' }}>{m.responsable}</div>}
                      {m.oficina && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.oficina}</div>}
                      {m.detalle && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.detalle}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
