import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import PageLayout from '../components/ui/PageLayout';
import { useAuth } from '../context/AuthContext';

const GET_INMUEBLES = gql`
  query GetInmuebles($search: String) {
    todosInmuebles(search: $search) {
      nroActivo {
        nroActivo
        codActivo
        descripcion
      }
      uv
      manzana
      lote
      codCatastral
      tipologiaConstructiva
      patologias
    }
  }
`;

const GET_ACTIVOS_SELECT = gql`
  query GetActivosParaInmuebles {
    todosActivos(soloActivos: true) {
      nroActivo
      codActivo
      descripcion
    }
  }
`;

const GUARDAR_INMUEBLE = gql`
  mutation GuardarInmueble(
    $nroActivo: Int!, $uv: String, $manzana: String, $lote: String,
    $codCatastral: String, $tipologiaConstructiva: String, $patologias: String
  ) {
    guardarInmueble(
      nroActivo: $nroActivo, uv: $uv, manzana: $manzana, lote: $lote,
      codCatastral: $codCatastral, tipologiaConstructiva: $tipologiaConstructiva,
      patologias: $patologias
    ) {
      inmueble {
        nroActivo { nroActivo }
        uv
      }
    }
  }
`;

const VACIO = {
  nroActivo: '', uv: '', manzana: '', lote: '',
  codCatastral: '', tipologiaConstructiva: '', patologias: '',
};

const estiloInput: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px',
};
const estiloTh: React.CSSProperties = {
  padding: '0.5rem', background: '#1a3c6e', color: '#ffffff', textAlign: 'left',
};

export default function Inmuebles() {
  const { user } = useAuth();
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_activo');

  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_INMUEBLES, {
    variables: { search: busqueda.trim() || null },
    fetchPolicy: 'network-only',
  });
  const { data: dataActivos } = useQuery(GET_ACTIVOS_SELECT);
  const [guardarInmueble] = useMutation(GUARDAR_INMUEBLE);

  const inmuebles: any[] = data?.todosInmuebles || [];

  const activosFiltrados = useMemo(() => {
    const texto = filtroActivo.trim().toLowerCase();
    const lista: any[] = dataActivos?.todosActivos || [];
    if (!texto) return lista;
    return lista.filter((a: any) =>
      `${a.codActivo} ${a.descripcion}`.toLowerCase().includes(texto)
    );
  }, [dataActivos, filtroActivo]);

  const cambiar = (campo: string, valor: string) =>
    setForm((prev: any) => ({ ...prev, [campo]: valor }));

  const abrirNueva = () => {
    setEditando(false);
    setFiltroActivo('');
    setForm({ ...VACIO });
  };

  const abrirEditar = (i: any) => {
    setEditando(true);
    setForm({
      nroActivo: String(i.nroActivo?.nroActivo ?? ''),
      uv: i.uv || '',
      manzana: i.manzana || '',
      lote: i.lote || '',
      codCatastral: i.codCatastral || '',
      tipologiaConstructiva: i.tipologiaConstructiva || '',
      patologias: i.patologias || '',
    });
  };

  const guardar = async () => {
    if (!form?.nroActivo) {
      alert('Selecciona el activo al que pertenece el inmueble.');
      return;
    }
    setGuardando(true);
    try {
      await guardarInmueble({
        variables: {
          nroActivo: Number(form.nroActivo),
          uv: form.uv || null,
          manzana: form.manzana || null,
          lote: form.lote || null,
          codCatastral: form.codCatastral || null,
          tipologiaConstructiva: form.tipologiaConstructiva || null,
          patologias: form.patologias || null,
        },
      });
      alert('Ficha de inmueble guardada correctamente');
      setForm(null);
      refetch();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (error) return <div className="error">Error: {error.message}</div>;

  const campo = (etiqueta: string, nombre: string, ancho = '1 1 12rem') => (
    <div style={{ flex: ancho }}>
      <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>{etiqueta}</label>
      <input
        type="text"
        value={form?.[nombre] || ''}
        onChange={e => cambiar(nombre, e.target.value)}
        style={estiloInput}
      />
    </div>
  );

  return (
    <PageLayout
      title="Ficha de Inmuebles e Inspección Técnica (I.T.E.)"
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
          placeholder="Buscar por código, descripción, UV, manzana, lote o código catastral..."
          style={estiloInput}
        />
      </div>

      {form && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <div style={{ fontWeight: 700, color: '#1a3c6e', marginBottom: '1rem' }}>
            {editando ? 'Editar ficha de inmueble' : 'Nueva ficha de inmueble'}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Activo (inmueble)</label>
            {!editando && (
              <input
                type="text"
                value={filtroActivo}
                onChange={e => setFiltroActivo(e.target.value)}
                placeholder="Filtrar activos por código o descripción..."
                style={{ ...estiloInput, marginBottom: '0.5rem' }}
              />
            )}
            <select
              value={form.nroActivo}
              onChange={e => cambiar('nroActivo', e.target.value)}
              disabled={editando}
              style={estiloInput}
            >
              <option value="">-- Seleccione un activo --</option>
              {activosFiltrados.map((a: any) => (
                <option key={a.nroActivo} value={String(a.nroActivo)}>
                  {a.codActivo} — {a.descripcion}
                </option>
              ))}
              {editando && !activosFiltrados.some((a: any) => String(a.nroActivo) === form.nroActivo) && (
                <option value={form.nroActivo}>Activo #{form.nroActivo}</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            {campo('UV (Unidad Vecinal)', 'uv', '1 1 8rem')}
            {campo('Manzana', 'manzana', '1 1 8rem')}
            {campo('Lote', 'lote', '1 1 8rem')}
            {campo('Código catastral', 'codCatastral', '1 1 14rem')}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            {campo('Tipología constructiva', 'tipologiaConstructiva', '1 1 100%')}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
              Patologías detectadas (inspección técnica)
            </label>
            <textarea
              value={form.patologias}
              onChange={e => cambiar('patologias', e.target.value)}
              rows={4}
              style={estiloInput}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary px-6" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar ficha'}
            </button>
            <button className="btn px-6" onClick={() => setForm(null)} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm" style={{ overflowX: 'auto' }}>
        {loading && !data ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando fichas...</div>
        ) : inmuebles.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No hay fichas de inmuebles registradas.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={estiloTh}>Código</th>
                <th style={estiloTh}>Descripción</th>
                <th style={estiloTh}>UV</th>
                <th style={estiloTh}>Manzana</th>
                <th style={estiloTh}>Lote</th>
                <th style={estiloTh}>Cód. catastral</th>
                <th style={estiloTh}>Tipología</th>
                <th style={estiloTh}>Patologías</th>
                {puedeEditar && <th style={estiloTh}></th>}
              </tr>
            </thead>
            <tbody>
              {inmuebles.map((i: any) => (
                <tr key={i.nroActivo?.nroActivo} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{i.nroActivo?.codActivo}</td>
                  <td style={{ padding: '0.5rem' }}>{i.nroActivo?.descripcion}</td>
                  <td style={{ padding: '0.5rem' }}>{i.uv || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{i.manzana || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{i.lote || '-'}</td>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{i.codCatastral || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{i.tipologiaConstructiva || '-'}</td>
                  <td style={{ padding: '0.5rem', maxWidth: '18rem' }}>{i.patologias || '-'}</td>
                  {puedeEditar && (
                    <td style={{ padding: '0.5rem' }}>
                      <button className="btn" onClick={() => abrirEditar(i)}>Editar</button>
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
