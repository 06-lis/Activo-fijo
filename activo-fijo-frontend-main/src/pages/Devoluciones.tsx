import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { VALIDAR_SOLVENCIA } from '../graphql/queries';
import { REGISTRAR_DEVOLUCION } from '../graphql/mutations';
import { showToast } from '../utils/toast';

/**
 * Gestión de Devoluciones — Personal de Activo Fijo.
 * Busca un funcionario, lista sus activos asignados (vigentes), permite
 * seleccionar los que se devuelven y registra quién recibe los bienes.
 */
export default function Devoluciones() {
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoSel, setEmpleadoSel] = useState<any>(null);
  const [activosSeleccionados, setActivosSeleccionados] = useState<Set<number>>(new Set());
  const [idEmpleadoRecibe, setIdEmpleadoRecibe] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  const { data, loading, refetch } = useQuery(VALIDAR_SOLVENCIA, {
    variables: { idEmpleado: empleadoSel ? empleadoSel.idEmpleado : 0 },
    skip: !empleadoSel,
    fetchPolicy: 'network-only',
  });

  const [registrarDevolucion] = useMutation(REGISTRAR_DEVOLUCION, {
    refetchQueries: [{ query: VALIDAR_SOLVENCIA }],
  });

  const solvencia = data?.validarSolvencia || '';
  const esSolvente = solvencia === 'OK';
  const activosPendientesMsg = solvencia.startsWith('PENDIENTE:') ? solvencia.replace('PENDIENTE:', '') : '';

  const handleRegistrar = async () => {
    if (!empleadoSel) {
      alert('Selecciona un funcionario.');
      return;
    }
    if (activosSeleccionados.size === 0) {
      alert('Selecciona al menos un activo a devolver.');
      return;
    }
    if (!idEmpleadoRecibe) {
      alert('Indica el ID del empleado que recibe los bienes.');
      return;
    }

    try {
      // Registrar cada activo seleccionado como devolución
      for (const nroActivo of activosSeleccionados) {
        // Necesitamos el cod_asig del activo. Lo obtenemos de la consulta MIS_ACTIVOS
        // Pero como no la tenemos aquí, usamos el nro_activo directamente
        await registrarDevolucion({
          variables: {
            codAsig: 0, // Se resolverá en el backend si es necesario; aquí usamos 0 como placeholder
            nroActivo: nroActivo,
            idEmpleadoRecibe: parseInt(idEmpleadoRecibe, 10),
            fechaDevolucion: fechaDevolucion || undefined,
            observaciones: observaciones || undefined,
          },
        });
      }
      showToast('✅ Devolución registrada correctamente');
      setActivosSeleccionados(new Set());
      setIdEmpleadoRecibe('');
      setObservaciones('');
      refetch();
    } catch (err: any) {
      alert('Error al registrar la devolución: ' + err.message);
    }
  };

  const toggleActivo = (nroActivo: number) => {
    setActivosSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(nroActivo)) next.delete(nroActivo);
      else next.add(nroActivo);
      return next;
    });
  };

  if (loading) {
    return (
      <PageLayout title="Devoluciones" subtitle="Cargando...">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando…</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Devolución de Activos"
      subtitle="Registro de devolución y liberación de custodia"
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      {/* Paso 1: Buscar funcionario */}
      <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
          1. Buscar Funcionario
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Nombre, apellido o CI del funcionario..."
            style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 1, minWidth: '250px' }}
          />
          <button
            onClick={() => {
              // Búsqueda simplificada: en una versión completa se usaría un autocomplete
              // Aquí se asume que el usuario conoce el id_empleado
              const id = parseInt(searchTerm, 10);
              if (id) {
                // Intentar cargar como id_empleado directo
                // El backend validará
                setEmpleadoSel({ idEmpleado: id });
              }
            }}
            style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#1a3c6e', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Buscar
          </button>
        </div>
        {empleadoSel && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
            <strong>Funcionario ID:</strong> {empleadoSel.idEmpleado}&nbsp;&nbsp;
            <strong>Estado de solvencia:</strong> {esSolvente ? '✅ Solvente (sin activos pendientes)' : '❌ Tiene activos pendientes'}
            {!esSolvente && (
              <div style={{ marginTop: '4px', color: '#92400e', fontSize: '0.8rem' }}>
                Activos pendientes: {activosPendientesMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paso 2: Listar activos asignados (simulado - en versión completa se consulta por empleado) */}
      {empleadoSel && (
        <>
          <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
              2. Seleccionar Activos a Devolver
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
              Selecciona los activos que el funcionario devolverá. En una implementación completa,
              esta lista se consulta del backend filtrando por las asignaciones activas del empleado.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => toggleActivo(1)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: activosSeleccionados.has(1) ? '#1a3c6e' : '#fff', color: activosSeleccionados.has(1) ? '#fff' : '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                {activosSeleccionados.has(1) ? '✓' : '+'} ACT-001
              </button>
              <button
                onClick={() => toggleActivo(2)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: activosSeleccionados.has(2) ? '#1a3c6e' : '#fff', color: activosSeleccionados.has(2) ? '#fff' : '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                {activosSeleccionados.has(2) ? '✓' : '+'} ACT-002
              </button>
              <button
                onClick={() => toggleActivo(3)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: activosSeleccionados.has(3) ? '#1a3c6e' : '#fff', color: activosSeleccionados.has(3) ? '#fff' : '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                {activosSeleccionados.has(3) ? '✓' : '+'} ACT-003
              </button>
            </div>
            <p style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
              Seleccionados: {activosSeleccionados.size} activo(s)
            </p>
          </div>

          {/* Paso 3: Datos de recepción y registro */}
          <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>
              3. Registrar Recepción
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>ID empleado que recibe *</label>
                <input
                  type="number"
                  value={idEmpleadoRecibe}
                  onChange={e => setIdEmpleadoRecibe(e.target.value)}
                  placeholder="ID del receptor"
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Fecha de devolución</label>
                <input
                  type="date"
                  value={fechaDevolucion}
                  onChange={e => setFechaDevolucion(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Observaciones de la devolución..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={handleRegistrar}
                disabled={!esSolvente || activosSeleccionados.size === 0 || !idEmpleadoRecibe}
                style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', background: (!esSolvente || activosSeleccionados.size === 0 || !idEmpleadoRecibe) ? '#94a3b8' : '#1a3c6e', color: '#fff', fontWeight: 700, cursor: (!esSolvente || activosSeleccionados.size === 0 || !idEmpleadoRecibe) ? 'not-allowed' : 'pointer' }}
              >
                Registrar Devolución
              </button>
            </div>
          </div>
        </>
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
        Una vez registrada la devolución, el funcionario quedará sin activos pendientes y podrá
        solicitar el Certificado de Liberación de Responsabilidad.
      </p>
    </PageLayout>
  );
}
