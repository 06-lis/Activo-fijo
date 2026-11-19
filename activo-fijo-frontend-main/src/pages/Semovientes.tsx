import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import PageLayout from '../components/ui/PageLayout';
import { useAuth } from '../context/AuthContext';

const GET_SEMOVIENTES = gql`
  query GetSemovientes($search: String) {
    todosSemovientes(search: $search) {
      nroActivo { nroActivo codActivo descripcion aB }
      especie
      raza
      sexo
      fechaNacimiento
      pesoKg
      marcaHierro
      regZoosanitario
      causalBaja
      fechaBajaZoo
      medicoVeterinario
      nroInformeVet
      nroActaNecropsia
      obsZoo
    }
  }
`;

const GET_ACTIVOS_SELECT = gql`
  query GetActivosParaSemovientes {
    todosActivos(soloActivos: true) {
      nroActivo
      codActivo
      descripcion
      codGrupo {
        desGrupo
        codPadre { desGrupo codPadre { desGrupo codPadre { desGrupo codPadre { desGrupo } } } }
      }
    }
  }
`;

const GUARDAR_SEMOVIENTE = gql`
  mutation GuardarSemoviente(
    $nroActivo: Int!, $especie: String, $raza: String, $sexo: String,
    $fechaNacimiento: Date, $pesoKg: Float, $marcaHierro: String, $regZoosanitario: String,
    $causalBaja: String, $fechaBajaZoo: Date, $medicoVeterinario: String,
    $nroInformeVet: String, $nroActaNecropsia: String, $obsZoo: String
  ) {
    guardarSemoviente(
      nroActivo: $nroActivo, especie: $especie, raza: $raza, sexo: $sexo,
      fechaNacimiento: $fechaNacimiento, pesoKg: $pesoKg, marcaHierro: $marcaHierro,
      regZoosanitario: $regZoosanitario, causalBaja: $causalBaja, fechaBajaZoo: $fechaBajaZoo,
      medicoVeterinario: $medicoVeterinario, nroInformeVet: $nroInformeVet,
      nroActaNecropsia: $nroActaNecropsia, obsZoo: $obsZoo
    ) {
      semoviente { nroActivo { nroActivo } }
    }
  }
`;

const CAUSALES: Record<string, string> = {
  MUERTE: 'Muerte',
  VEJEZ: 'Vejez',
  SACRIFICIO_SANITARIO: 'Sacrificio sanitario',
};

const VACIO: Record<string, string> = {
  nroActivo: '', especie: '', raza: '', sexo: '', fechaNacimiento: '', pesoKg: '',
  marcaHierro: '', regZoosanitario: '', causalBaja: '', fechaBajaZoo: '',
  medicoVeterinario: '', nroInformeVet: '', nroActaNecropsia: '', obsZoo: '',
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

// Un activo es "ganadero" si su grupo, o alguno de sus grupos padre, es de Ganadería/Ganado
const esGanadero = (grupo: any): boolean => {
  let g = grupo;
  while (g) {
    if ((g.desGrupo || '').toLowerCase().includes('ganad')) return true;
    g = g.codPadre;
  }
  return false;
};

export default function Semovientes() {
  const { user } = useAuth();
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_activo');

  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_SEMOVIENTES, {
    variables: { search: busqueda.trim() || null },
    fetchPolicy: 'network-only',
  });
  const { data: dataActivos } = useQuery(GET_ACTIVOS_SELECT);
  const [guardarSemoviente] = useMutation(GUARDAR_SEMOVIENTE);

  const semovientes: any[] = data?.todosSemovientes || [];

  const activosFiltrados = useMemo(() => {
    const texto = filtroActivo.trim().toLowerCase();
    const lista: any[] = (dataActivos?.todosActivos || []).filter((a: any) => esGanadero(a.codGrupo));
    if (!texto) return lista;
    return lista.filter((a: any) => `${a.codActivo} ${a.descripcion}`.toLowerCase().includes(texto));
  }, [dataActivos, filtroActivo]);

  const cambiar = (campo: string, valor: string) => setForm((p: any) => ({ ...p, [campo]: valor }));

  const abrirNueva = () => {
    setEditando(false);
    setFiltroActivo('');
    setForm({ ...VACIO });
  };

  const abrirEditar = (s: any) => {
    setEditando(true);
    setForm({
      nroActivo: String(s.nroActivo?.nroActivo ?? ''),
      especie: s.especie || '', raza: s.raza || '', sexo: s.sexo || '',
      fechaNacimiento: s.fechaNacimiento || '',
      pesoKg: s.pesoKg !== null && s.pesoKg !== undefined ? String(s.pesoKg) : '',
      marcaHierro: s.marcaHierro || '', regZoosanitario: s.regZoosanitario || '',
      causalBaja: s.causalBaja || '', fechaBajaZoo: s.fechaBajaZoo || '',
      medicoVeterinario: s.medicoVeterinario || '', nroInformeVet: s.nroInformeVet || '',
      nroActaNecropsia: s.nroActaNecropsia || '', obsZoo: s.obsZoo || '',
    });
  };

  const guardar = async () => {
    if (!form.nroActivo) {
      alert('Selecciona el activo al que pertenece el semoviente.');
      return;
    }
    if (form.causalBaja && (!form.fechaBajaZoo || !form.nroInformeVet.trim())) {
      alert('La baja zoosanitaria requiere la fecha de baja y el número del informe veterinario.');
      return;
    }
    const vacioNulo = (v: string) => (v && v.trim() ? v.trim() : null);
    setGuardando(true);
    try {
      await guardarSemoviente({
        variables: {
          nroActivo: Number(form.nroActivo),
          especie: vacioNulo(form.especie), raza: vacioNulo(form.raza), sexo: vacioNulo(form.sexo),
          fechaNacimiento: form.fechaNacimiento || null,
          pesoKg: form.pesoKg ? Number(form.pesoKg) : null,
          marcaHierro: vacioNulo(form.marcaHierro), regZoosanitario: vacioNulo(form.regZoosanitario),
          causalBaja: form.causalBaja || null, fechaBajaZoo: form.fechaBajaZoo || null,
          medicoVeterinario: vacioNulo(form.medicoVeterinario),
          nroInformeVet: vacioNulo(form.nroInformeVet),
          nroActaNecropsia: vacioNulo(form.nroActaNecropsia),
          obsZoo: vacioNulo(form.obsZoo),
        },
      });
      alert('Ficha de semoviente guardada correctamente');
      setForm(null);
      refetch();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (error) return <div className="error">Error: {error.message}</div>;

  const campo = (etiqueta: string, nombre: string, tipo = 'text', ancho = '1 1 12rem') => (
    <div style={{ flex: ancho }}>
      <label style={estiloLabel}>{etiqueta}</label>
      <input type={tipo} value={form?.[nombre] || ''} onChange={e => cambiar(nombre, e.target.value)} style={estiloInput} />
    </div>
  );

  return (
    <PageLayout
      title="Ficha de Semovientes y Baja Zoosanitaria"
      actions={[
        ...(puedeEditar ? [{ label: 'Nueva ficha', icon: '+', onClick: abrirNueva }] : []),
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por código, descripción, especie, raza, marca o registro zoosanitario..."
          style={estiloInput}
        />
      </div>

      {form && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <div style={{ fontWeight: 700, color: '#1a3c6e', marginBottom: '1rem' }}>
            {editando ? 'Editar ficha de semoviente' : 'Nueva ficha de semoviente'}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={estiloLabel}>Activo (semoviente)</label>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
              Solo se listan activos del grupo Ganadería (o de sus subgrupos).
              {!editando && activosFiltrados.length === 0 && ' No hay activos de ese grupo: registra uno en Activos Fijos.'}
            </div>
            {!editando && (
              <input
                type="text"
                value={filtroActivo}
                onChange={e => setFiltroActivo(e.target.value)}
                placeholder="Filtrar activos por código o descripción..."
                style={{ ...estiloInput, marginBottom: '0.5rem' }}
              />
            )}
            <select value={form.nroActivo} onChange={e => cambiar('nroActivo', e.target.value)} disabled={editando} style={estiloInput}>
              <option value="">-- Seleccione un activo --</option>
              {activosFiltrados.map((a: any) => (
                <option key={a.nroActivo} value={String(a.nroActivo)}>{a.codActivo} — {a.descripcion}</option>
              ))}
              {editando && !activosFiltrados.some((a: any) => String(a.nroActivo) === form.nroActivo) && (
                <option value={form.nroActivo}>Activo #{form.nroActivo}</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            {campo('Especie', 'especie')}
            {campo('Raza', 'raza')}
            {campo('Sexo', 'sexo', 'text', '1 1 8rem')}
            {campo('Fecha de nacimiento', 'fechaNacimiento', 'date')}
            {campo('Peso (kg)', 'pesoKg', 'number', '1 1 8rem')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {campo('Marca / hierro', 'marcaHierro')}
            {campo('Registro zoosanitario', 'regZoosanitario', 'text', '1 1 16rem')}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.75rem' }}>Baja zoosanitaria (solo si corresponde)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: '1 1 14rem' }}>
                <label style={estiloLabel}>Causal de baja</label>
                <select value={form.causalBaja} onChange={e => cambiar('causalBaja', e.target.value)} style={estiloInput}>
                  <option value="">-- Sin baja --</option>
                  {Object.entries(CAUSALES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {form.causalBaja && campo('Fecha de la baja', 'fechaBajaZoo', 'date')}
            </div>
            {form.causalBaja && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  {campo('Médico Veterinario Zootecnista', 'medicoVeterinario', 'text', '1 1 16rem')}
                  {campo('Nº informe veterinario', 'nroInformeVet')}
                  {campo('Nº acta de necropsia', 'nroActaNecropsia')}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={estiloLabel}>Observaciones</label>
                  <textarea value={form.obsZoo} onChange={e => cambiar('obsZoo', e.target.value)} rows={3} style={estiloInput} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Después de registrar la baja zoosanitaria, completa la baja formal del activo desde Gestión de Activos → Bajas.
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary px-6" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar ficha'}
            </button>
            <button className="btn px-6" onClick={() => setForm(null)} disabled={guardando}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm" style={{ overflowX: 'auto' }}>
        {loading && !data ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando fichas...</div>
        ) : semovientes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay fichas de semovientes registradas.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={estiloTh}>Código</th>
                <th style={estiloTh}>Descripción</th>
                <th style={estiloTh}>Especie / Raza</th>
                <th style={estiloTh}>Sexo</th>
                <th style={estiloTh}>Reg. zoosanitario</th>
                <th style={estiloTh}>Estado</th>
                <th style={estiloTh}>Baja formal</th>
                {puedeEditar && <th style={estiloTh}></th>}
              </tr>
            </thead>
            <tbody>
              {semovientes.map((s: any) => (
                <tr key={s.nroActivo?.nroActivo} style={{ borderTop: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{s.nroActivo?.codActivo}</td>
                  <td style={{ padding: '0.5rem' }}>{s.nroActivo?.descripcion}</td>
                  <td style={{ padding: '0.5rem' }}>{s.especie || '-'}{s.raza ? ` / ${s.raza}` : ''}</td>
                  <td style={{ padding: '0.5rem' }}>{s.sexo || '-'}</td>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{s.regZoosanitario || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {s.causalBaja ? (
                      <>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>
                          BAJA: {CAUSALES[s.causalBaja] || s.causalBaja}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {s.fechaBajaZoo} · Inf. {s.nroInformeVet}{s.nroActaNecropsia ? ` · Acta ${s.nroActaNecropsia}` : ''}
                        </div>
                      </>
                    ) : (
                      <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700 }}>
                        EN INVENTARIO
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {s.nroActivo?.aB === 'B' ? 'Sí' : s.causalBaja ? <span style={{ color: '#b45309', fontWeight: 700 }}>Pendiente</span> : 'No'}
                  </td>
                  {puedeEditar && (
                    <td style={{ padding: '0.5rem' }}>
                      <button className="btn" onClick={() => abrirEditar(s)}>Editar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  );
}
