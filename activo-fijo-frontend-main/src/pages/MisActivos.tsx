import PageLayout from '../components/ui/PageLayout';
import React from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MIS_ACTIVOS } from '../graphql/queries';

/**
 * Portal «Mis Activos» — Dashboard del funcionario.
 * Muestra exclusivamente los activos bajo custodia del usuario autenticado.
 * El filtrado por empleado se impone en el backend (resolver mis_activos),
 * no solo ocultando en la interfaz.
 */
export default function MisActivos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const puedeReportar = user?.esAdmin || (user?.permisos?.includes('reportar_incidencia') ?? false);

  const { data, loading, error, refetch } = useQuery(MIS_ACTIVOS, {
    fetchPolicy: 'cache-and-network',
  });

  const activos = data?.misActivos || [];
  const totalActivos = activos.length;
  const activosEnUso = activos.filter((a: any) => {
    const est = (a.codEstado?.desEstado || '').toLowerCase();
    return est.includes('uso') || est.includes('activo') || est.includes('vigente');
  }).length;

  if (loading) {
    return (
      <PageLayout title="Mis Activos" subtitle="Cargando tus activos asignados...">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando…</div>
      </PageLayout>
    );
  }
  if (error) {
    return (
      <PageLayout title="Mis Activos" subtitle="Error al cargar">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
          Error: {error.message}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Mis Activos"
      subtitle={`Activos bajo tu custodia · ${user?.email}`}
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ...(puedeReportar ? [{ label: 'Reportar Incidencia', icon: '⚠', variant: 'primary' as const, onClick: () => {} }] : []),
      ]}
    >
      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Total de activos</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a3c6e' }}>{totalActivos}</div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>En uso / asignados</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{activosEnUso}</div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Otros estados</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ca8a04' }}>{totalActivos - activosEnUso}</div>
        </div>
      </div>

      {/* Listado de activos */}
      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#0f172a', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Código</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Descripción</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Marca / Modelo</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Serie</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Estado</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Oficina</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Fecha Asig.</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '.3px' }}>Ver</th>
            </tr>
          </thead>
          <tbody>
            {activos.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No tienes activos asignados bajo tu custodia en este momento.
                </td>
              </tr>
            )}
            {activos.map((a: any) => {
              const asig = a.inDetAsigSet?.[0]?.codAsig || {};
              const oficina = asig.codOfic || {};
              const oficinaPath = [oficina.desDpto, oficina.codPadre?.desDpto, oficina.codPadre?.codPadre?.desDpto].filter(Boolean).join(' / ') || 'Sin oficina';
              return (
                <tr key={a.nroActivo} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => {}}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#1a3c6e' }}>{a.codActivo}</td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{a.descripcion || 'Sin descripción'}</td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{(a.codMarca?.desMarca || 'S/M')} / {(a.codModelo?.desModelo || 'S/Mod')}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#334155' }}>{a.nroSerie || 'S/N'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, background: '#e2e8f0', color: '#475569' }}>
                      {a.codEstado?.desEstado || 'Sin estado'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#64748b' }}>{oficinaPath}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#64748b' }}>{asig.fechaAsig || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => navigate(`/mis-activos/${a.nroActivo}`)}
                      style={{ background: 'none', border: '1px solid #1a3c6e', color: '#1a3c6e', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activos.length > 0 && (
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
          Selecciona un activo para ver su detalle completo. Solo puedes consultar los activos que están bajo tu responsabilidad.
        </p>
      )}
    </PageLayout>
  );
}
