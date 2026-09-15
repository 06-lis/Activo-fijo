import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { PERMISOS_METADATA } from '../utils/permisosMetadata';
import { useAuth } from '../context/AuthContext';

// ==================== QUERIES & MUTATIONS ====================
const GET_ROLES_DATA = gql`
  query GetRolesData {
    todosRoles {
      idRol
      nombre
      descripcion
      permisos {
        id
        estado
        idPermiso {
          idPermiso
          nombre
        }
      }
    }
    todosPermisos {
      idPermiso
      nombre
    }
  }
`;

const CREAR_ROL = gql`
  mutation CrearRol($nombre: String!, $descripcion: String) {
    crearRol(nombre: $nombre, descripcion: $descripcion) {
      rol {
        idRol
        nombre
        descripcion
      }
    }
  }
`;

const EDITAR_ROL = gql`
  mutation EditarRol($idRol: Int!, $nombre: String, $descripcion: String) {
    editarRol(idRol: $idRol, nombre: $nombre, descripcion: $descripcion) {
      rol {
        idRol
        nombre
        descripcion
      }
    }
  }
`;

const CREAR_PERMISO = gql`
  mutation CrearPermiso($nombre: String!) {
    crearPermiso(nombre: $nombre) {
      permiso {
        idPermiso
        nombre
      }
    }
  }
`;

const EDITAR_PERMISO = gql`
  mutation EditarPermiso($idPermiso: Int!, $nombre: String) {
    editarPermiso(idPermiso: $idPermiso, nombre: $nombre) {
      permiso {
        idPermiso
        nombre
      }
    }
  }
`;

const ASIGNAR_ROL_PERMISO = gql`
  mutation AsignarRolPermiso($idRol: Int!, $idPermiso: Int!, $descripcion: String, $estado: Boolean) {
    asignarRolPermiso(idRol: $idRol, idPermiso: $idPermiso, descripcion: $descripcion, estado: $estado) {
      rolPermiso {
        id
        estado
      }
    }
  }
`;

export default function Roles() {
  const { user } = useAuth();
  const puedeGestionarRoles = user?.esAdmin || user?.permisos.includes('gestionar_roles');
  const puedeGestionarPermisos = user?.esAdmin || user?.permisos.includes('gestionar_permisos');

  const [selectedRol, setSelectedRol] = useState<any>(null);

  // Modal states - Rol
  const [showRolModal, setShowRolModal] = useState(false);
  const [editRolObj, setEditRolObj] = useState<any>(null);
  const [rolName, setRolName] = useState('');
  const [rolDesc, setRolDesc] = useState('');

  // Modal states - Permiso
  const [showPermModal, setShowPermModal] = useState(false);
  const [editPermObj, setEditPermObj] = useState<any>(null);
  const [permName, setPermName] = useState('');

  // Search & Matrix state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    gestion: true,
    contabilidad: true,
    adquisiciones: true,
    reportes: true,
    admin: true,
    catalogos: false, // Default catalogs collapsed
  });

  // Apollo queries
  const { data, loading, error, refetch } = useQuery(GET_ROLES_DATA);

  // Apollo mutations
  const [crearRol] = useMutation(CREAR_ROL);
  const [editarRol] = useMutation(EDITAR_ROL);
  const [crearPermiso] = useMutation(CREAR_PERMISO);
  const [editarPermiso] = useMutation(EDITAR_PERMISO);
  const [asignarRolPermiso] = useMutation(ASIGNAR_ROL_PERMISO);

  // Memoized lookups
  const permissionLookup = React.useMemo(() => {
    const map = new Map<string, number>();
    if (data?.todosPermisos) {
      data.todosPermisos.forEach((p: any) => {
        map.set(p.nombre, parseInt(p.idPermiso));
      });
    }
    return map;
  }, [data?.todosPermisos]);

  const activePermNames = React.useMemo(() => {
    const set = new Set<string>();
    if (selectedRol?.permisos) {
      selectedRol.permisos.forEach((rp: any) => {
        if (rp.estado) {
          set.add(rp.idPermiso.nombre);
        }
      });
    }
    return set;
  }, [selectedRol]);

  const filteredMetadata = React.useMemo(() => {
    if (!searchQuery.trim()) return PERMISOS_METADATA;
    const q = searchQuery.toLowerCase();
    return PERMISOS_METADATA.map(mod => {
      const submodules = mod.submodules.filter(sub =>
        sub.label.toLowerCase().includes(q) ||
        mod.label.toLowerCase().includes(q) ||
        sub.actions.some(a => a.label.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      );
      return { ...mod, submodules };
    }).filter(mod => mod.submodules.length > 0);
  }, [searchQuery]);

  if (loading) return <div className="loading">Cargando roles y permisos...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  // ==================== ROL HANDLERS ====================
  const handleSaveRol = async () => {
    if (!rolName.trim()) { alert('El nombre del rol es obligatorio'); return; }
    try {
      if (editRolObj) {
        await editarRol({
          variables: {
            idRol: parseInt(editRolObj.idRol),
            nombre: rolName,
            descripcion: rolDesc
          }
        });
      } else {
        await crearRol({
          variables: {
            nombre: rolName,
            descripcion: rolDesc
          }
        });
      }
      setShowRolModal(false);
      setRolName('');
      setRolDesc('');
      setEditRolObj(null);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // ==================== PERMISO HANDLERS ====================
  const handleSavePermiso = async () => {
    if (!permName.trim()) { alert('El nombre del permiso es obligatorio'); return; }
    try {
      if (editPermObj) {
        await editarPermiso({
          variables: {
            idPermiso: parseInt(editPermObj.idPermiso),
            nombre: permName
          }
        });
      } else {
        await crearPermiso({
          variables: {
            nombre: permName
          }
        });
      }
      setShowPermModal(false);
      setPermName('');
      setEditPermObj(null);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // ==================== MAPPING HANDLERS ====================
  interface PermUpdate {
    name: string;
    targetState: boolean;
  }

  const handleTogglePermission = async (permName: string) => {
    if (!selectedRol) return;
    setIsSaving(true);
    try {
      const permId = permissionLookup.get(permName);
      if (!permId) {
        alert(`El permiso ${permName} no existe en la base de datos local.`);
        setIsSaving(false);
        return;
      }
      const existingRp = selectedRol.permisos?.find((rp: any) => rp.idPermiso?.nombre === permName);
      const newStatus = existingRp ? !existingRp.estado : true;

      await asignarRolPermiso({
        variables: {
          idRol: parseInt(selectedRol.idRol),
          idPermiso: permId,
          estado: newStatus
        }
      });

      const prevId = selectedRol.idRol;
      const { data: newData } = await refetch();
      const updated = newData?.todosRoles?.find((r: any) => r.idRol === prevId);
      if (updated) setSelectedRol(updated);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkToggle = async (updates: PermUpdate[]) => {
    if (!selectedRol || updates.length === 0) return;
    setIsSaving(true);
    try {
      const promises = [];
      for (const update of updates) {
        const permId = permissionLookup.get(update.name);
        if (!permId) continue;

        const existingRp = selectedRol.permisos?.find((rp: any) => rp.idPermiso?.nombre === update.name);
        const currentStatus = existingRp ? existingRp.estado : false;

        if (currentStatus !== update.targetState) {
          promises.push(
            asignarRolPermiso({
              variables: {
                idRol: parseInt(selectedRol.idRol),
                idPermiso: permId,
                estado: update.targetState
              }
            })
          );
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        const prevId = selectedRol.idRol;
        const { data: newData } = await refetch();
        const updated = newData?.todosRoles?.find((r: any) => r.idRol === prevId);
        if (updated) setSelectedRol(updated);
      }
    } catch (e: any) {
      alert('Error al actualizar permisos en lote: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle helpers for UI
  const handleToggleModule = (moduleObj: any, targetState: boolean) => {
    const updates: PermUpdate[] = [];
    moduleObj.submodules.forEach((sub: any) => {
      sub.actions.forEach((act: any) => {
        updates.push({ name: act.name, targetState });
      });
    });
    handleBulkToggle(updates);
  };

  const handleToggleModuleColumn = (moduleObj: any, type: string, targetState: boolean) => {
    const updates: PermUpdate[] = [];
    moduleObj.submodules.forEach((sub: any) => {
      sub.actions.forEach((act: any) => {
        if (act.type === type) {
          updates.push({ name: act.name, targetState });
        }
      });
    });
    handleBulkToggle(updates);
  };

  const handleToggleSubmodule = (subObj: any, targetState: boolean) => {
    const updates: PermUpdate[] = [];
    subObj.actions.forEach((act: any) => {
      updates.push({ name: act.name, targetState });
    });
    handleBulkToggle(updates);
  };

  const handleToggleRoleAll = (targetState: boolean) => {
    const updates: PermUpdate[] = [];
    PERMISOS_METADATA.forEach(mod => {
      mod.submodules.forEach(sub => {
        sub.actions.forEach(act => {
          updates.push({ name: act.name, targetState });
        });
      });
    });
    handleBulkToggle(updates);
  };

  const handleToggleRoleReadOnly = () => {
    const updates: PermUpdate[] = [];
    PERMISOS_METADATA.forEach(mod => {
      mod.submodules.forEach(sub => {
        sub.actions.forEach(act => {
          updates.push({ name: act.name, targetState: act.type === 'ver' });
        });
      });
    });
    handleBulkToggle(updates);
  };

  const toggleExpandModule = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  return (
    <PageLayout
      title="Configuración de Roles y Permisos (RBAC)"
      actions={
        puedeGestionarRoles ? [
          { label: 'Nuevo Rol', icon: '+', variant: 'primary' as const, onClick: () => { setEditRolObj(null); setRolName(''); setRolDesc(''); setShowRolModal(true); } },
          { label: 'Nuevo Permiso', icon: '+', onClick: () => { setEditPermObj(null); setPermName(''); setShowPermModal(true); } },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ] : [
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ]
      }
    >

      <div style={{ display: 'grid', gridTemplateColumns: selectedRol ? '1fr 2.3fr' : '1.5fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA: Tablas de Roles y Permisos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Roles */}
          <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3c6e', margin: 0 }}>Roles de Usuario</h3>
              {puedeGestionarRoles && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditRolObj(null); setRolName(''); setRolDesc(''); setShowRolModal(true); }}>
                  + Nuevo Rol
                </button>
              )}
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del Rol</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data?.todosRoles?.map((r: any) => {
                  const isSelected = selectedRol?.idRol === r.idRol;
                  return (
                    <tr
                      key={r.idRol}
                      onClick={() => setSelectedRol(r)}
                      style={{ cursor: 'pointer', background: isSelected ? '#e8f4fd' : 'white' }}
                    >
                      <td><strong>#{r.idRol}</strong></td>
                      <td><strong>{r.nombre}</strong></td>
                      <td>{r.descripcion || '-'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        {puedeGestionarRoles && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => {
                              setEditRolObj(r);
                              setRolName(r.nombre);
                              setRolDesc(r.descripcion || '');
                              setShowRolModal(true);
                            }}
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Permisos */}
          <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3c6e', margin: 0 }}>Permisos Globales en BD</h3>
              {puedeGestionarRoles && (
                <button className="btn btn-primary btn-sm" onClick={() => { setEditPermObj(null); setPermName(''); setShowPermModal(true); }}>
                  + Nuevo Permiso
                </button>
              )}
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Permiso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.todosPermisos?.map((p: any) => (
                    <tr key={p.idPermiso}>
                      <td><strong>#{p.idPermiso}</strong></td>
                      <td><code>{p.nombre}</code></td>
                      <td>
                        {puedeGestionarRoles && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => {
                              setEditPermObj(p);
                              setPermName(p.nombre);
                              setShowPermModal(true);
                            }}
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Matriz de Mapeo de Permisos del Rol */}
        <div style={{
            background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: '1.5rem',
            maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto'
          }}>
          {selectedRol ? (
            <>
              {/* Spinner Overlay */}
              {isSaving && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.75)', zIndex: 100,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  borderRadius: '12px'
                }}>
                  <div className="loading-spinner" style={{
                    border: '4px solid #f3f3f3', borderTop: '4px solid #1a3c6e',
                    borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite',
                    marginBottom: '1rem'
                  }}></div>
                  <strong style={{ color: '#1a3c6e', fontSize: '0.9rem' }}>Actualizando permisos en la base de datos...</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a3c6e', margin: 0 }}>
                    Matriz de Permisos: {selectedRol.nombre}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedRol.descripcion || 'Sin descripción asignada.'}
                  </span>
                </div>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', padding: '0 5px' }}
                  onClick={() => setSelectedRol(null)}
                >
                  ×
                </button>
              </div>

              {/* Toolbar de Matriz */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="text"
                  placeholder="Buscar módulo o página..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, minWidth: '200px', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" disabled={!puedeGestionarPermisos} onClick={() => handleToggleRoleReadOnly()} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                    Solo Lectura
                  </button>
                  <button className="btn btn-primary btn-sm" disabled={!puedeGestionarPermisos} onClick={() => handleToggleRoleAll(true)} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                    Marcar Todo
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={!puedeGestionarPermisos} onClick={() => handleToggleRoleAll(false)} style={{ fontSize: '0.75rem', padding: '5px 10px', background: '#ef4444' }}>
                    Desmarcar Todo
                  </button>
                </div>
              </div>

              {/* Listado Jerárquico de Módulos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredMetadata.map(moduleObj => {
                  const isExpanded = expandedModules[moduleObj.id];
                  
                  // Calcular cuántos permisos de este módulo están activos
                  let activeCount = 0;
                  let totalCount = 0;
                  moduleObj.submodules.forEach(sub => {
                    sub.actions.forEach(act => {
                      totalCount++;
                      if (activePermNames.has(act.name)) activeCount++;
                    });
                  });

                  return (
                    <div key={moduleObj.id} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                      
                      {/* Banner del Módulo */}
                      <div style={{
                        background: '#1a3c6e', color: 'white', padding: '0.6rem 1rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', userSelect: 'none'
                      }} onClick={() => toggleExpandModule(moduleObj.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block', fontSize: '0.8rem' }}>▶</span>
                          <strong style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>{moduleObj.label}</strong>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                            {activeCount}/{totalCount}
                          </span>
                        </div>

                        {/* Controles de Lote a nivel de Módulo */}
                        <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-sm" disabled={!puedeGestionarPermisos} style={{ padding: '2px 6px', fontSize: '0.7rem', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none' }}
                                  onClick={() => handleToggleModule(moduleObj, true)}>
                            Marcar Módulo
                          </button>
                          <button className="btn btn-sm" disabled={!puedeGestionarPermisos} style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#ffb3b3', background: 'rgba(255,255,255,0.1)', border: 'none' }}
                                  onClick={() => handleToggleModule(moduleObj, false)}>
                            Quitar Módulo
                          </button>
                        </div>
                      </div>

                      {/* Submódulos del Módulo */}
                      {isExpanded && (
                        <div style={{ background: '#ffffff', padding: '0.5rem', overflowX: 'auto' }}>
                          <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Sub</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                  Ver
                                  <button title="Toggle columna Ver" disabled={!puedeGestionarPermisos} style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 4px', fontSize: '0.62rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                          onClick={() => {
                                            const allVerChecked = moduleObj.submodules.every(sub => {
                                              const act = sub.actions.find(a => a.type === 'ver');
                                              return !act || activePermNames.has(act.name);
                                            });
                                            handleToggleModuleColumn(moduleObj, 'ver', !allVerChecked);
                                          }}>⇅</button>
                                </th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                  Crear
                                  <button title="Toggle columna Crear" disabled={!puedeGestionarPermisos} style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 4px', fontSize: '0.62rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                          onClick={() => {
                                            const allCrearChecked = moduleObj.submodules.every(sub => {
                                              const act = sub.actions.find(a => a.type === 'crear');
                                              return !act || activePermNames.has(act.name);
                                            });
                                            handleToggleModuleColumn(moduleObj, 'crear', !allCrearChecked);
                                          }}>⇅</button>
                                </th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                  Editar
                                  <button title="Toggle columna Editar" disabled={!puedeGestionarPermisos} style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 4px', fontSize: '0.62rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                          onClick={() => {
                                            const allEditarChecked = moduleObj.submodules.every(sub => {
                                              const act = sub.actions.find(a => a.type === 'editar');
                                              return !act || activePermNames.has(act.name);
                                            });
                                            handleToggleModuleColumn(moduleObj, 'editar', !allEditarChecked);
                                          }}>⇅</button>
                                </th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                  Anul/Elim
                                  <button title="Toggle columna Eliminar" disabled={!puedeGestionarPermisos} style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 4px', fontSize: '0.62rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                          onClick={() => {
                                            const allElimChecked = moduleObj.submodules.every(sub => {
                                              const act = sub.actions.find(a => a.type === 'eliminar');
                                              return !act || activePermNames.has(act.name);
                                            });
                                            handleToggleModuleColumn(moduleObj, 'eliminar', !allElimChecked);
                                          }}>⇅</button>
                                </th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Acciones Especiales</th>
                              </tr>
                            </thead>
                            <tbody>
                              {moduleObj.submodules.map((sub, idx) => {
                                const verAction = sub.actions.find(a => a.type === 'ver');
                                const crearAction = sub.actions.find(a => a.type === 'crear');
                                const editarAction = sub.actions.find(a => a.type === 'editar');
                                const eliminarAction = sub.actions.find(a => a.type === 'eliminar');
                                const otrasActions = sub.actions.filter(a => a.type === 'otro');

                                // Check if all page actions are currently checked
                                const isPageAllChecked = sub.actions.every(a => activePermNames.has(a.name));

                                return (
                                  <tr key={sub.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                                    
                                    {/* Nombre de la página y Toggle de Fila */}
                                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#334155' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <input
                                          type="checkbox"
                                          title="Marcar toda la fila"
                                          checked={isPageAllChecked}
                                          disabled={!puedeGestionarPermisos}
                                          onChange={e => handleToggleSubmodule(sub, e.target.checked)}
                                          style={{ cursor: 'pointer', width: '13px', height: '13px' }}
                                        />
                                        <span>{sub.label}</span>
                                      </div>
                                    </td>

                                    {/* Checkbox Ver */}
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                      {verAction && (
                                        <input
                                          type="checkbox"
                                          checked={activePermNames.has(verAction.name)}
                                          disabled={!puedeGestionarPermisos}
                                          onChange={() => handleTogglePermission(verAction.name)}
                                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                        />
                                      )}
                                    </td>

                                    {/* Checkbox Crear */}
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                      {crearAction && (
                                        <input
                                          type="checkbox"
                                          checked={activePermNames.has(crearAction.name)}
                                          disabled={!puedeGestionarPermisos}
                                          onChange={() => handleTogglePermission(crearAction.name)}
                                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                        />
                                      )}
                                    </td>

                                    {/* Checkbox Editar */}
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                      {editarAction && (
                                        <input
                                          type="checkbox"
                                          checked={activePermNames.has(editarAction.name)}
                                          disabled={!puedeGestionarPermisos}
                                          onChange={() => handleTogglePermission(editarAction.name)}
                                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                        />
                                      )}
                                    </td>

                                    {/* Checkbox Eliminar */}
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                      {eliminarAction && (
                                        <input
                                          type="checkbox"
                                          checked={activePermNames.has(eliminarAction.name)}
                                          disabled={!puedeGestionarPermisos}
                                          onChange={() => handleTogglePermission(eliminarAction.name)}
                                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                        />
                                      )}
                                    </td>

                                    {/* Acciones Especiales (Otros) */}
                                    <td style={{ padding: '0.5rem' }}>
                                      {otrasActions.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                          {otrasActions.map(act => (
                                            <label key={act.name} style={{
                                              display: 'inline-flex', alignItems: 'center', gap: '3px',
                                              background: activePermNames.has(act.name) ? '#e0f2fe' : '#f1f5f9',
                                              border: '1px solid',
                                              borderColor: activePermNames.has(act.name) ? '#bae6fd' : '#cbd5e1',
                                              padding: '2px 5px', borderRadius: '4px', fontSize: '0.7rem',
                                              color: activePermNames.has(act.name) ? '#0369a1' : '#475569',
                                              cursor: 'pointer', userSelect: 'none'
                                            }}>
                                              <input
                                                type="checkbox"
                                                checked={activePermNames.has(act.name)}
                                                disabled={!puedeGestionarPermisos}
                                                onChange={() => handleTogglePermission(act.name)}
                                                style={{ width: '12px', height: '12px', cursor: 'pointer' }}
                                              />
                                              {act.label}
                                            </label>
                                          ))}
                                        </div>
                                      ) : (
                                        <span style={{ color: '#aaa', fontSize: '0.75rem', fontStyle: 'italic' }}>Ninguna</span>
                                      )}
                                    </td>

                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1a3c6e' }}>■</div>
              <h4 style={{ fontWeight: 700, color: '#1a3c6e', margin: '0 0 0.5rem 0' }}>Gestión de Accesos del Rol</h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
                Seleccione un rol de la columna izquierda para ver y editar su matriz de permisos asignados.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ==================== MODAL: ABM ROL ==================== */}
      {showRolModal && (
        <div className="modal-overlay" onClick={() => setShowRolModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editRolObj ? 'Editar Rol' : 'Nuevo Rol'}</h2>
            <div className="form-grid">
              <div className="form-group form-group-full">
                <label>Nombre del Rol *</label>
                <input
                  type="text"
                  placeholder="Ej. Auditor, Almacenero"
                  value={rolName}
                  onChange={e => setRolName(e.target.value)}
                />
              </div>
              <div className="form-group form-group-full">
                <label>Descripción</label>
                <input
                  type="text"
                  placeholder="Descripción de responsabilidades del rol"
                  value={rolDesc}
                  onChange={e => setRolDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowRolModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveRol}>Guardar Rol</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ABM PERMISO ==================== */}
      {showPermModal && (
        <div className="modal-overlay" onClick={() => setShowPermModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editPermObj ? 'Editar Permiso' : 'Nuevo Permiso'}</h2>
            <div className="form-group">
              <label>Nombre del Permiso *</label>
              <input
                type="text"
                placeholder="Ej. crear_activo, ver_reportes"
                value={permName}
                onChange={e => setPermName(e.target.value)}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowPermModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSavePermiso}>Guardar Permiso</button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  );
}
