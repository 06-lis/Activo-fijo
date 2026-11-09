import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { TODAS_INCIDENCIAS } from '../graphql/queries';
import { ATENDER_INCIDENCIA } from '../graphql/mutations';
import { showToast } from '../utils/toast';

/**
 * Gestión de Incidencias — Solo personal autorizado de Activo Fijo.
 * Permite listar todas las incidencias reportadas y cambiar su estado de atención.
 */
export default function GestionarIncidencias() {
  const { user } = useAuth();
  const puedeAtender = user?.esAdmin || (user?.permisos?.includes('atender_incidencia') ?? false);

  const { data, loading, error, refetch } = useQuery(TODAS_INCIDENCIAS, {
    fetchPolicy: 'cache-and-network',
  });

  const [atenderIncidencia] = useMutation(ATENDER_INCIDENCIA, {
    refetchQueries: [{ query: TODAS_INCIDENCIAS }],
  });

  const incidencias = data?.todasIncidencias || [];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [editObs, setEditObs] = useState('');

  const estadoLabel: Record<string, string> = {
    P: 'Pendiente',
    E: 'En proceso',
    A: 'Atendida',
    C: 'Cerrada',
  };

  if (loading) {
    return (
      <PageLayout title="Gestión de Incidencias" subtitle="Cargando...">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando…</div>
      </PageLayout>
    );
  }
  if (error) {
    return (
      <PageLayout title="Gestión de Incidencias" subtitle="Error">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{error.message}</div>
      </PageLayout>
    );
  }

  const handleAtender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEstado) {
      alert('Selecciona un estado.');
      return;
    }
    try {
      await atenderIncidencia({
        variables: {
          nroIncidencia: editingId,
          estado: editEstado,
          observacionAtencion: editObs || null,
        },
      });
      showToast('✅ Incidencia actualizada', 'success');
      setEditingId(null);
      setEditEstado('');
      setEditObs('');
      refetch();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <PageLayout
      title="Gestión de Incidencias"
      subtitle="Atención de reportes de funcionarios"
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px' }}>Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a3c6e' }}>{incidencias.length}</div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px' }}>Pendientes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ca8a04' }}>
            {incidencias.filter((i: any) => i.estado === 'P').length}
          </div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px' }}>En proceso</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
            {incidencias.filter((i: any) => i.estado === 'E').length}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#0f172a', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>N° Inc.</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Activo</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Funcionario</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Descripción</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Fecha Reporte</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {incidencias.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No hay incidencias registradas.
                </td>
              </tr>
            )}
            {incidencias.map((inc: any) => {
              const isEditing = editingId === inc.nroIncidencia;
              return (
                <tr key={inc.nroIncidencia} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#1a3c6e' }}>{inc.nroIncidencia}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inc.nroActivo?.codActivo}</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inc.nroActivo?.descripcion || ''}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{inc.idEmpleado?.nombre} {inc.idEmpleado?.apellido}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inc.idEmpleado?.numeroDocumento || ''}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{inc.descripcion || ''}</td>
                  <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#64748b' }}>{inc.fechaReporte || '-'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600,
                      background: inc.estado === 'P' ? '#fef3c7' : inc.estado === 'E' ? '#dbeafe' : inc.estado === 'A' ? '#d1fae5' : '#e2e8f0',
                      color: inc.estado === 'P' ? '#92400e' : inc.estado === 'E' ? '#1e3a8a' : inc.estado === 'A' ? '#065f46' : '#475569' }}>
                      {estadoLabel[inc.estado] || inc.estado}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {isEditing ? (
                      <form onSubmit={handleAtender} style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <select
                          value={editEstado}
                          onChange={e => setEditEstado(e.target.value)}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                        >
                          <option value="P">Pendiente</option>
                          <option value="E">En proceso</option>
                          <option value="A">Atendida</option>
                          <option value="C">Cerrada</option>
                        </select>
                        <input
                          type="text"
                          value={editObs}
                          onChange={e => setEditObs(e.target.value)}
                          placeholder="Observación"
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', minWidth: '120px' }}
                        />
                        <button
                          type="submit"
                          style={{ padding: '4px 10px', borderRadius: '4px', background: '#1a3c6e', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditEstado(''); setEditObs(''); }}
                          style={{ padding: '4px 10px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      puedeAtender && (
                        <button
                          onClick={() => {
                            setEditingId(inc.nroIncidencia);
                            setEditEstado(inc.estado);
                            setEditObs(inc.observacionAtencion || '');
                          }}
                          style={{ padding: '4px 10px', borderRadius: '4px', background: '#1a3c6e', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Atender
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
        Solo el personal autorizado de Activo Fijo puede cambiar el estado de las incidencias.
      </p>
    </PageLayout>
  );
}
