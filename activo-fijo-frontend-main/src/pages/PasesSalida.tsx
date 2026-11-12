import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import PageLayout from '../components/ui/PageLayout';
import { useAuth } from '../context/AuthContext';

const GET_PASES = gql`
  query GetPasesSalida($search: String, $estado: String) {
    todosPasesSalida(search: $search, estado: $estado) {
      idPase
      destino
      motivo
      fechaSalida
      fechaRetornoEst
      fechaRetornoReal
      estado
      vbSeguridad
      observacion
      solicitante { idEmpleado nombre apellido }
      oficina { codOfic desDpto }
      autorizadoPor { nombre apellido }
      inDetPaseSet {
        nroActivo { nroActivo codActivo descripcion }
      }
    }
  }
`;

const GET_DATOS_FORM = gql`
  query GetDatosPase {
    todosEmpleados { idEmpleado nombre apellido cargo }
    todasOficinas { codOfic desDpto }
    todosActivos(soloActivos: true) { nroActivo codActivo descripcion }
  }
`;

const CREAR_PASE = gql`
  mutation CrearPaseSalida(
    $idSolicitante: Int!, $codOfic: Int, $destino: String!, $motivo: String,
    $fechaSalida: Date!, $fechaRetornoEst: Date!, $activos: [Int]!
  ) {
    crearPaseSalida(
      idSolicitante: $idSolicitante, codOfic: $codOfic, destino: $destino, motivo: $motivo,
      fechaSalida: $fechaSalida, fechaRetornoEst: $fechaRetornoEst, activos: $activos
    ) {
      pase { idPase estado }
    }
  }
`;

const CAMBIAR_ESTADO = gql`
  mutation CambiarEstadoPase($idPase: Int!, $estado: String!, $vbSeguridad: Boolean, $observacion: String) {
    cambiarEstadoPase(idPase: $idPase, estado: $estado, vbSeguridad: $vbSeguridad, observacion: $observacion) {
      pase { idPase estado }
    }
  }
`;

const ESTADOS = ['PENDIENTE', 'AUTORIZADO', 'SALIDO', 'DEVUELTO', 'RECHAZADO'];

const COLOR_ESTADO: Record<string, { fondo: string; texto: string }> = {
  PENDIENTE: { fondo: '#fef3c7', texto: '#b45309' },
  AUTORIZADO: { fondo: '#dbeafe', texto: '#1d4ed8' },
  SALIDO: { fondo: '#ede9fe', texto: '#6d28d9' },
  DEVUELTO: { fondo: '#dcfce7', texto: '#15803d' },
  RECHAZADO: { fondo: '#fee2e2', texto: '#b91c1c' },
};

const FORM_VACIO = {
  idSolicitante: '', codOfic: '', destino: '', motivo: '',
  fechaSalida: '', fechaRetornoEst: '', activos: [] as string[],
};

const estiloInput: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px',
};
const estiloTh: React.CSSProperties = {
  padding: '0.5rem', background: '#1a3c6e', color: '#ffffff', textAlign: 'left',
};
const estiloLabel: React.CSSProperties = {
  fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem',
};

const hoy = () => new Date().toISOString().slice(0, 10);

export default function PasesSalida() {
  const { user } = useAuth();
  const puedeGestionar = user?.esAdmin || user?.permisos.includes('editar_activo');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [form, setForm] = useState<any>(null);
  const [filtroActivo, setFiltroActivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_PASES, {
    variables: { search: busqueda.trim() || null, estado: filtroEstado || null },
    fetchPolicy: 'network-only',
  });
  const { data: datos } = useQuery(GET_DATOS_FORM);
  const [crearPase] = useMutation(CREAR_PASE);
  const [cambiarEstado] = useMutation(CAMBIAR_ESTADO);

  const pases: any[] = data?.todosPasesSalida || [];

  const activosFiltrados = useMemo(() => {
    const texto = filtroActivo.trim().toLowerCase();
    const lista: any[] = datos?.todosActivos || [];
    if (!texto) return lista.slice(0, 40);
    return lista.filter((a: any) => `${a.codActivo} ${a.descripcion}`.toLowerCase().includes(texto)).slice(0, 40);
  }, [datos, filtroActivo]);

  const cambiar = (campo: string, valor: any) => setForm((p: any) => ({ ...p, [campo]: valor }));

  const alternarActivo = (nro: string) =>
    setForm((p: any) => ({
      ...p,
      activos: p.activos.includes(nro) ? p.activos.filter((x: string) => x !== nro) : [...p.activos, nro],
    }));

  const guardar = async () => {
    if (!form.idSolicitante || !form.destino.trim() || !form.fechaSalida || !form.fechaRetornoEst) {
      alert('Completa solicitante, destino y las fechas de salida y retorno.');
      return;
    }
    if (form.activos.length === 0) {
      alert('Selecciona al menos un activo.');
      return;
    }
    setProcesando(true);
    try {
      await crearPase({
        variables: {
          idSolicitante: Number(form.idSolicitante),
          codOfic: form.codOfic ? Number(form.codOfic) : null,
          destino: form.destino.trim(),
          motivo: form.motivo || null,
          fechaSalida: form.fechaSalida,
          fechaRetornoEst: form.fechaRetornoEst,
          activos: form.activos.map((x: string) => Number(x)),
        },
      });
      alert('Pase de salida registrado');
      setForm(null);
      refetch();
    } catch (err: any) {
      alert('Error al registrar: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const accion = async (p: any, estado: string, extra: any = {}) => {
    setProcesando(true);
    try {
      await cambiarEstado({ variables: { idPase: p.idPase, estado, ...extra } });
      refetch();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  const registrarSalida = (p: any) => {
    if (window.confirm('¿Seguridad da el visto bueno y registra la salida de los activos?')) {
      accion(p, 'SALIDO', { vbSeguridad: true });
    }
  };

  const nombre = (e: any) => (e ? `${e.nombre} ${e.apellido}` : '-');

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Pases de Salida Temporal de Activos"
      actions={[
        ...(puedeGestionar ? [{ label: 'Nuevo pase', icon: '+', onClick: () => { setFiltroActivo(''); setForm({ ...FORM_VACIO }); } }] : []),
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por solicitante, destino o código de activo..."
            style={{ ...estiloInput, flex: '1 1 20rem', width: 'auto' }}
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ ...estiloInput, flex: '0 0 12rem', width: 'auto' }}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {form && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <div style={{ fontWeight: 700, color: '#1a3c6e', marginBottom: '1rem' }}>Nuevo pase de salida temporal</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: '1 1 16rem' }}>
              <label style={estiloLabel}>Funcionario solicitante</label>
              <select value={form.idSolicitante} onChange={e => cambiar('idSolicitante', e.target.value)} style={estiloInput}>
                <option value="">-- Seleccione --</option>
                {(datos?.todosEmpleados || []).map((e: any) => (
                  <option key={e.idEmpleado} value={String(e.idEmpleado)}>{e.apellido} {e.nombre}{e.cargo ? ` — ${e.cargo}` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 16rem' }}>
              <label style={estiloLabel}>Unidad solicitante</label>
              <select value={form.codOfic} onChange={e => cambiar('codOfic', e.target.value)} style={estiloInput}>
                <option value="">-- Opcional --</option>
                {(datos?.todasOficinas || []).map((o: any) => (
                  <option key={o.codOfic} value={String(o.codOfic)}>{o.desDpto}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: '1 1 16rem' }}>
              <label style={estiloLabel}>Destino</label>
              <input type="text" value={form.destino} onChange={e => cambiar('destino', e.target.value)} style={estiloInput} />
            </div>
            <div style={{ flex: '1 1 10rem' }}>
              <label style={estiloLabel}>Fecha de salida</label>
              <input type="date" value={form.fechaSalida} onChange={e => cambiar('fechaSalida', e.target.value)} style={estiloInput} />
            </div>
            <div style={{ flex: '1 1 10rem' }}>
              <label style={estiloLabel}>Retorno estimado</label>
              <input type="date" value={form.fechaRetornoEst} onChange={e => cambiar('fechaRetornoEst', e.target.value)} style={estiloInput} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={estiloLabel}>Motivo</label>
            <textarea value={form.motivo} onChange={e => cambiar('motivo', e.target.value)} rows={2} style={estiloInput} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={estiloLabel}>Activos a retirar ({form.activos.length} seleccionados)</label>
            <input
              type="text"
              value={filtroActivo}
              onChange={e => setFiltroActivo(e.target.value)}
              placeholder="Filtrar por código o descripción..."
              style={{ ...estiloInput, marginBottom: '0.5rem' }}
            />
            <div style={{ maxHeight: '12rem', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}>
              {activosFiltrados.map((a: any) => (
                <label key={a.nroActivo} style={{ display: 'flex', gap: '0.5rem', padding: '0.2rem 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.activos.includes(String(a.nroActivo))}
                    onChange={() => alternarActivo(String(a.nroActivo))}
                  />
                  <span style={{ fontFamily: 'monospace' }}>{a.codActivo}</span>
                  <span>{a.descripcion}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary px-6" onClick={guardar} disabled={procesando}>
              {procesando ? 'Guardando...' : 'Registrar pase'}
            </button>
            <button className="btn px-6" onClick={() => setForm(null)} disabled={procesando}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm" style={{ overflowX: 'auto' }}>
        {loading && !data ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando pases...</div>
        ) : pases.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay pases de salida registrados.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={estiloTh}>Nº</th>
                <th style={estiloTh}>Solicitante / Unidad</th>
                <th style={estiloTh}>Activos</th>
                <th style={estiloTh}>Destino</th>
                <th style={estiloTh}>Salida</th>
                <th style={estiloTh}>Retorno est.</th>
                <th style={estiloTh}>Estado</th>
                {puedeGestionar && <th style={estiloTh}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {pases.map((p: any) => {
                const color = COLOR_ESTADO[p.estado] || COLOR_ESTADO.PENDIENTE;
                const vencido = p.estado === 'SALIDO' && p.fechaRetornoEst < hoy();
                return (
                  <tr key={p.idPase} style={{ borderTop: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>#{p.idPase}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {nombre(p.solicitante)}
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.oficina?.desDpto || ''}</div>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {p.inDetPaseSet.map((d: any) => (
                        <div key={d.nroActivo.nroActivo}>
                          <span style={{ fontFamily: 'monospace' }}>{d.nroActivo.codActivo}</span> {d.nroActivo.descripcion}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {p.destino}
                      {p.motivo && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.motivo}</div>}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{p.fechaSalida}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {p.fechaRetornoEst}
                      {p.fechaRetornoReal && <div style={{ fontSize: '0.8rem', color: '#15803d' }}>Devuelto: {p.fechaRetornoReal}</div>}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', background: color.fondo, color: color.texto, fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.estado}
                      </span>
                      {vencido && <div style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>RETORNO VENCIDO</div>}
                      {p.vbSeguridad && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>V°B° Seguridad</div>}
                      {p.autorizadoPor && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Aut.: {nombre(p.autorizadoPor)}</div>}
                    </td>
                    {puedeGestionar && (
                      <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                        {p.estado === 'PENDIENTE' && (
                          <>
                            <button className="btn" disabled={procesando} onClick={() => accion(p, 'AUTORIZADO')}>Autorizar</button>{' '}
                            <button className="btn" disabled={procesando} onClick={() => accion(p, 'RECHAZADO')}>Rechazar</button>
                          </>
                        )}
                        {p.estado === 'AUTORIZADO' && (
                          <button className="btn" disabled={procesando} onClick={() => registrarSalida(p)}>Registrar salida</button>
                        )}
                        {p.estado === 'SALIDO' && (
                          <button className="btn" disabled={procesando} onClick={() => accion(p, 'DEVUELTO')}>Registrar devolución</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  );
}
