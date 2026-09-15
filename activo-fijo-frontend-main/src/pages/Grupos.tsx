import PageLayout from '../components/ui/PageLayout';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_GRUPOS } from '../graphql/queries';
import { CREAR_GRUPO, EDITAR_GRUPO, ELIMINAR_GRUPO } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';

// Construir árbol desde lista plana
const buildTree = (grupos: any[]) => {
  const map: Record<number, any> = {};
  const roots: any[] = [];
  grupos.forEach(g => { map[g.codGrupo] = { ...g, children: [] }; });
  grupos.forEach(g => {
    if (g.codPadre) {
      map[g.codPadre.codGrupo]?.children.push(map[g.codGrupo]);
    } else {
      roots.push(map[g.codGrupo]);
    }
  });
  return roots;
};

const getSugerenciaCodigo = (grupos: any[], nivel: number, codPadreId: number | null) => {
  if (nivel > 1 && !codPadreId) return ''; // No sugerir si falta padre

  const hermanas = grupos.filter(g => 
    g.nivel === nivel && (codPadreId ? String(g.codPadre?.codGrupo) === String(codPadreId) : !g.codPadre)
  );
  const codigosOcupados = new Set(hermanas.map(g => g.codHijo?.toUpperCase()));

  let secuencia: string[] = [];
  if (nivel === 1 || nivel === 3) {
    for (let i = 1; i <= 9; i++) secuencia.push(i.toString());
    for (let i = 65; i <= 90; i++) secuencia.push(String.fromCharCode(i));
  } else if (nivel === 2) {
    for (let i = 1; i <= 99; i++) secuencia.push(i.toString().padStart(2, '0'));
    secuencia.push('00'); // Por si acaso se usa como caso especial
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        secuencia.push(String.fromCharCode(i) + String.fromCharCode(j));
      }
    }
  }

  for (const cod of secuencia) {
    if (!codigosOcupados.has(cod)) {
      return cod;
    }
  }
  return '';
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

const nivelColores: Record<number, string> = {
  1: '#1a3c6e',
  2: '#2d6a4f',
  3: '#666',
};

const GrupoFila = ({
  grupo,
  onEditar,
  onEliminar,
}: {
  grupo: any;
  onEditar: (g: any) => void;
  onEliminar: (id: number) => void;
}) => {
  const { user } = useAuth();
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_grupo');
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_grupo');

  const sangria = ((grupo.nivel || 1) - 1) * 24;
  const prefijos = ['', '├─ ', '└── '];
  const prefijo = prefijos[Math.min((grupo.nivel || 1) - 1, 2)];

  return (
    <>
      <tr style={{ backgroundColor: grupo.nivel === 1 ? '#f0f4ff' : grupo.nivel === 2 ? '#f8fff8' : 'white' }}>
        <td>
          <div style={{ paddingLeft: sangria, color: nivelColores[grupo.nivel] || '#333', fontWeight: grupo.nivel === 1 ? 700 : 400 }}>
            <span style={{ color: '#aaa', marginRight: 4 }}>{prefijo}</span>
            {grupo.desGrupo || grupo.codHijo}
          </div>
        </td>
        <td>{grupo.codHijo}</td>
        <td>
          <span className={`badge ${grupo.nivel === 1 ? 'badge-info' : grupo.nivel === 2 ? 'badge-success' : 'badge-secondary'}`}>
            Nivel {grupo.nivel}
          </span>
        </td>
        <td>{grupo.vidaUtilDefault !== null && grupo.vidaUtilDefault !== undefined ? `${grupo.vidaUtilDefault} años` : '-'}</td>
        <td>{grupo.codigoContable || '-'}</td>
        <td><span className={`badge ${grupo.aB === 'A' ? 'badge-success' : 'badge-danger'}`}>{grupo.aB === 'A' ? 'Activo' : 'Baja'}</span></td>
        <td>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {puedeEditar && <button className="btn btn-secondary btn-sm" onClick={() => onEditar(grupo)}>Editar</button>}
            {puedeEliminar && <button className="btn btn-danger btn-sm" onClick={() => onEliminar(grupo.codGrupo)}>Eliminar</button>}
          </div>
        </td>
      </tr>
      {grupo.children?.map((hijo: any) => (
        <GrupoFila key={hijo.codGrupo} grupo={hijo} onEditar={onEditar} onEliminar={onEliminar} />
      ))}
    </>
  );
};

export default function Grupos() {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    codHijo: '',
    desGrupo: '',
    codPadre: '',
    nivel: '1',
    aB: 'A',
    vidaUtilDefault: '',
    codigoContable: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_GRUPOS);
  const [crearGrupo] = useMutation(CREAR_GRUPO);
  const [editarGrupo] = useMutation(EDITAR_GRUPO);
  const [eliminarGrupo] = useMutation(ELIMINAR_GRUPO);

  useEffect(() => {
    // Solo sugerir si NO estamos editando (es decir, creando uno nuevo)
    if (showModal && !editId && data?.todosGrupos) {
      const nivelInt = parseInt(form.nivel);
      const padreInt = form.codPadre ? parseInt(form.codPadre) : null;
      const sugerencia = getSugerenciaCodigo(data.todosGrupos, nivelInt, padreInt);
      
      setForm(prev => ({ ...prev, codHijo: sugerencia }));
    }
  }, [form.nivel, form.codPadre, showModal, editId, data]);

  const handleNivelAutomatico = (codPadreId: string) => {
    if (!codPadreId) { setForm(f => ({...f, codPadre: '', nivel: '1'})); return; }
    const padre = data?.todosGrupos?.find((g: any) => String(g.codGrupo) === String(codPadreId));
    const nivelPadre = padre?.nivel || 1;
    setForm(f => ({...f, codPadre: codPadreId, nivel: String(Math.min(nivelPadre + 1, 3))}));
  };

  const handleSubmit = async () => {
    if (!form.codHijo) { alert('El código es obligatorio'); return; }
    try {
      const variables: any = {
        codHijo: form.codHijo,
        desGrupo: form.desGrupo || null,
        codGest: 1,
        codPadre: form.codPadre ? parseInt(form.codPadre) : null,
        nivel: parseInt(form.nivel),
        aB: form.aB,
        vidaUtilDefault: form.vidaUtilDefault ? parseInt(form.vidaUtilDefault) : null,
        codigoContable: form.codigoContable || null,
      };

      if (editId) {
        await editarGrupo({ variables: { codGrupo: Number(editId), ...variables } });
      } else {
        await crearGrupo({ variables });
      }
      setShowModal(false);
      setEditId(null);
      setForm({
        codHijo: '',
        desGrupo: '',
        codPadre: '',
        nivel: '1',
        aB: 'A',
        vidaUtilDefault: '',
        codigoContable: '',
      });
      refetch();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleEditar = (grupo: any) => {
    setEditId(grupo.codGrupo);
    setForm({
      codHijo: grupo.codHijo || '',
      desGrupo: grupo.desGrupo || '',
      codPadre: grupo.codPadre ? String(grupo.codPadre.codGrupo) : '',
      nivel: String(grupo.nivel || 1),
      aB: grupo.aB || 'A',
      vidaUtilDefault: grupo.vidaUtilDefault !== null && grupo.vidaUtilDefault !== undefined ? String(grupo.vidaUtilDefault) : '',
      codigoContable: grupo.codigoContable || '',
    });
    setShowModal(true);
  };

  const handleEliminar = async (codGrupo: number) => {
    if (!window.confirm('¿Eliminar este grupo?')) return;
    try {
    await eliminarGrupo({ variables: { codGrupo: Number(codGrupo) } });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_grupo');

  const tree = data ? buildTree(data.todosGrupos) : [];

  if (loading) return <div className="loading">Cargando grupos...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const getParentOptions = () => {
    if (!data?.todosGrupos) return [];
    return data.todosGrupos
      .filter((g: any) => g.nivel === parseInt(form.nivel) - 1)
      .map((g: any) => ({ value: g.codGrupo, label: g.desGrupo || g.codHijo, code: g.codHijo }));
  };

  return (
    <PageLayout
      title="Grupos de Activos"
      actions={
        puedeCrear ? [
          {
            label: 'Nuevo',
            icon: '+',
            variant: 'primary' as const,
            onClick: () => {
              setEditId(null);
              setForm({
                codHijo: '',
                desGrupo: '',
                codPadre: '',
                nivel: '1',
                aB: 'A',
                vidaUtilDefault: '',
                codigoContable: '',
              });
              setShowModal(true);
            }
          },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ] : [
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ]
      }
    >


      {/* Leyenda de niveles */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <span className="badge badge-info">Nivel 1 — Categoría principal</span>
        <span className="badge badge-success">Nivel 2 — Subcategoría</span>
        <span className="badge badge-secondary">Nivel 3 — Tipo específico</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Código</th>
              <th>Nivel</th>
              <th>Vida Útil (Años)</th>
              <th>Cuenta Contable</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 && <tr><td colSpan={7} className="empty">No hay grupos registrados</td></tr>}
            {tree.map((g: any) => (
              <GrupoFila key={g.codGrupo} grupo={g} onEditar={handleEditar} onEliminar={handleEliminar} />
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editId ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Nivel *</label>
                <select value={form.nivel} onChange={e => setForm({...form, nivel: e.target.value, codPadre: ''})}>
                  <option value="1">Nivel 1 — Categoría principal</option>
                  <option value="2">Nivel 2 — Subcategoría</option>
                  <option value="3">Nivel 3 — Tipo específico</option>
                </select>
              </div>
              <div className="form-group">
                <label>Código *</label>
                <input value={form.codHijo} onChange={e => setForm({...form, codHijo: e.target.value})} placeholder="Ej: 01" />
              </div>
              <div className="form-group form-group-full">
                <label>Descripción</label>
                <input value={form.desGrupo} onChange={e => setForm({...form, desGrupo: e.target.value})} placeholder="Nombre del grupo" />
              </div>
              {parseInt(form.nivel) > 1 && (
                <div className="form-group form-group-full">
                  <label>Grupo Padre *</label>
                  <SearchableSelect 
                    options={getParentOptions()}
                    value={form.codPadre}
                    onChange={(val: string) => handleNivelAutomatico(val)}
                    placeholder="Buscar por código o nombre..."
                  />
                </div>
              )}
              <div className="form-group">
                <label>Vida Útil (Años)</label>
                <input
                  type="number"
                  value={form.vidaUtilDefault}
                  onChange={e => setForm({...form, vidaUtilDefault: e.target.value})}
                  placeholder="Ej: 5"
                />
              </div>
              <div className="form-group">
                <label>Cuenta Contable</label>
                <input
                  value={form.codigoContable}
                  onChange={e => setForm({...form, codigoContable: e.target.value})}
                  placeholder="Ej: 12345"
                />
              </div>
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