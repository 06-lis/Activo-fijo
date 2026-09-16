import PageLayout from '../components/ui/PageLayout';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_OFICINAS } from '../graphql/queries';
import { CREAR_OFIC, ELIMINAR_OFIC } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';

const buildTree = (oficinas: any[]) => {
  const map: Record<number, any> = {};
  const roots: any[] = [];
  oficinas.forEach(o => { map[o.codOfic] = { ...o, children: [] }; });
  oficinas.forEach(o => {
    if (o.codPadre) {
      map[o.codPadre.codOfic]?.children.push(map[o.codOfic]);
    } else {
      roots.push(map[o.codOfic]);
    }
  });
  return roots;
};

const getSugerenciaCodigo = (oficinas: any[], nivel: number, codPadreId: number | null) => {
  if (nivel > 1 && !codPadreId) return ''; // No sugerir si falta padre

  const hermanas = oficinas.filter(o => 
    o.nivel === nivel && (codPadreId ? String(o.codPadre?.codOfic) === String(codPadreId) : !o.codPadre)
  );
  
  const codigosOcupados = new Set(hermanas.map(o => {
    if (!o.codDpto) return '';
    const parts = o.codDpto.split('-');
    return parts[parts.length - 1].toUpperCase();
  }));

  let secuencia: string[] = [];
  if (nivel === 1) {
    for (let i = 1; i <= 9; i++) secuencia.push(i.toString());
    for (let i = 65; i <= 90; i++) secuencia.push(String.fromCharCode(i));
  } else {
    for (let i = 1; i <= 200; i++) secuencia.push(i.toString().padStart(2, '0'));
  }

  let nextSufijo = '';
  for (const cod of secuencia) {
    if (!codigosOcupados.has(cod)) {
      nextSufijo = cod;
      break;
    }
  }

  if (nivel > 1 && codPadreId) {
    const padre = oficinas.find(o => String(o.codOfic) === String(codPadreId));
    if (padre && padre.codDpto) {
      return `${padre.codDpto}-${nextSufijo}`;
    }
  }

  return nextSufijo;
};

// Componente para búsqueda con autocompletado
const SearchableSelect = ({ options, value, onChange, placeholder }: any) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((o: any) => String(o.value) === String(value));
    if (selected) setSearch(`[${selected.code}] ${selected.label}`);
    else setSearch('');
  }, [value, options]);

  const filtered = options.filter((o: any) => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    o.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text" 
        value={search} 
        placeholder={placeholder}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
          onChange(''); // Limpiar valor seleccionado al escribir
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
      />
      {isOpen && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', background: 'white', border: '1px solid #ccc', zIndex: 100, listStyle: 'none', padding: 0, margin: 0, borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {filtered.map((o: any) => (
            <li 
              key={o.value} 
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
              onMouseDown={() => {
                onChange(o.value);
                setSearch(`[${o.code}] ${o.label}`);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f4ff')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              <strong>[{o.code}]</strong> {o.label}
            </li>
          ))}
          {filtered.length === 0 && <li style={{ padding: '10px', color: '#999' }}>No se encontraron coincidencias</li>}
        </ul>
      )}
    </div>
  );
};

const nivelNombre: Record<number, string> = {
  1: 'Campus / Institución',
  2: 'Edificio / Facultad',
  3: 'Unidad / Departamento',
};

const OficinFila = ({ oficina, onEliminar }: { oficina: any; onEliminar: (id: number) => void }) => {
  const { user } = useAuth();
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_ubicacion');

  const sangria = ((oficina.nivel || 1) - 1) * 28;
  const prefijos = ['', '├─ ', '└── '];
  const prefijo = prefijos[Math.min((oficina.nivel || 1) - 1, 2)];

  return (
    <>
      <tr style={{ backgroundColor: oficina.nivel === 1 ? '#f0f4ff' : oficina.nivel === 2 ? '#f8fff8' : 'white' }}>
        <td>
          <div style={{ paddingLeft: sangria, fontWeight: oficina.nivel === 1 ? 700 : 400, color: oficina.nivel === 1 ? '#1a3c6e' : oficina.nivel === 2 ? '#2d6a4f' : '#333' }}>
            <span style={{ color: '#bbb', marginRight: 4 }}>{prefijo}</span>
            {oficina.desDpto}
          </div>
        </td>
        <td>{oficina.codDpto}</td>
        <td>
          <span className={`badge ${oficina.nivel === 1 ? 'badge-info' : oficina.nivel === 2 ? 'badge-success' : 'badge-secondary'}`}>
            {nivelNombre[oficina.nivel] || `Nivel ${oficina.nivel}`}
          </span>
        </td>
        <td><span className={`badge ${oficina.aB === 'A' ? 'badge-success' : 'badge-danger'}`}>{oficina.aB === 'A' ? 'Activo' : 'Baja'}</span></td>
        <td>
          {puedeEliminar && <button className="btn btn-danger btn-sm" onClick={() => onEliminar(oficina.codOfic)}>Eliminar</button>}
        </td>
      </tr>
      {oficina.children?.map((hijo: any) => (
        <OficinFila key={hijo.codOfic} oficina={hijo} onEliminar={onEliminar} />
      ))}
    </>
  );
};

export default function Oficinas() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ codDpto: '', desDpto: '', codPadre: '', nivel: '1', aB: 'A' });

  const { data, loading, error, refetch } = useQuery(GET_OFICINAS);
  const [crearOfic] = useMutation(CREAR_OFIC);
  const [eliminarOfic] = useMutation(ELIMINAR_OFIC);

  useEffect(() => {
    if (showModal && data?.todasOficinas) {
      const nivelInt = parseInt(form.nivel);
      const padreInt = form.codPadre ? parseInt(form.codPadre) : null;
      const sugerencia = getSugerenciaCodigo(data.todasOficinas, nivelInt, padreInt);
      
      setForm(prev => ({ ...prev, codDpto: sugerencia }));
    }
  }, [form.nivel, form.codPadre, showModal, data]);

  const handleSubmit = async () => {
    if (!form.codDpto) { alert('El código es obligatorio'); return; }
    try {
      await crearOfic({ variables: {
        codDpto: form.codDpto, desDpto: form.desDpto, codGest: 1,
        codPadre: form.codPadre ? parseInt(form.codPadre) : null
      }});
      setShowModal(false); setForm({ codDpto: '', desDpto: '', codPadre: '', nivel: '1', aB: 'A' }); refetch();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleEliminar = async (codOfic: number) => {
    if (!window.confirm('¿Eliminar esta oficina?')) return;
    await eliminarOfic({ variables: { codOfic: Number(codOfic) } }); refetch();
  };

  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_ubicacion');

  const tree = data ? buildTree(data.todasOficinas) : [];

  if (loading) return <div className="loading">Cargando oficinas...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const getParentOptions = () => {
    if (!data?.todasOficinas) return [];
    return data.todasOficinas
      .filter((o: any) => o.nivel === parseInt(form.nivel) - 1)
      .map((o: any) => ({ value: o.codOfic, label: o.desDpto, code: o.codDpto }));
  };

  return (
    <PageLayout
      title="Oficinas / Unidades"
      actions={
        puedeCrear ? [
          { label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: () => { setForm({ codDpto: '', desDpto: '', codPadre: '', nivel: '1', aB: 'A' }); setShowModal(true); } },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ] : [
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ]
      }
    >


      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <span className="badge badge-info">Nivel 1 — Campus / Institución</span>
        <span className="badge badge-success">Nivel 2 — Edificio / Facultad</span>
        <span className="badge badge-secondary">Nivel 3 — Unidad / Departamento</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Código</th>
              <th>Nivel</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 && <tr><td colSpan={5} className="empty">No hay oficinas registradas</td></tr>}
            {tree.map((o: any) => <OficinFila key={o.codOfic} oficina={o} onEliminar={handleEliminar} />)}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nueva Oficina / Unidad</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Nivel *</label>
                <select value={form.nivel} onChange={e => setForm({...form, nivel: e.target.value, codPadre: ''})}>
                  <option value="1">Nivel 1 — Campus / Institución</option>
                  <option value="2">Nivel 2 — Edificio / Facultad</option>
                  <option value="3">Nivel 3 — Unidad / Departamento</option>
                </select>
              </div>
              <div className="form-group">
                <label>Código *</label>
                <input value={form.codDpto} onChange={e => setForm({...form, codDpto: e.target.value})} placeholder="Ej: 01" />
              </div>
              <div className="form-group form-group-full">
                <label>Descripción *</label>
                <input value={form.desDpto} onChange={e => setForm({...form, desDpto: e.target.value})} placeholder="Nombre de la oficina" />
              </div>
              {parseInt(form.nivel) > 1 && (
                <div className="form-group form-group-full">
                  <label>Oficina Padre *</label>
                  <SearchableSelect 
                    options={getParentOptions()}
                    value={form.codPadre}
                    onChange={(val: string) => setForm({...form, codPadre: val})}
                    placeholder="Buscar por código o nombre..."
                  />
                </div>
              )}
              <div className="form-group">
                <label>Estado</label>
                <select value={form.aB} onChange={e => setForm({...form, aB: e.target.value})}>
                  <option value="A">Activo</option>
                  <option value="B">Baja</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}