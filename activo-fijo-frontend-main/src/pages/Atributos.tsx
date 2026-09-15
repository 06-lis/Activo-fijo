import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

// ==================== QUERIES & MUTATIONS ====================
const GET_GRUPOS_Y_ATRIBUTOS = gql`
  query GetGrupos {
    todosGrupos {
      codGrupo
      codHijo
      desGrupo
      nivel
      codPadre {
        codGrupo
      }
    }
  }
`;

const GET_ATRIBUTOS_POR_GRUPO = gql`
  query GetAtributosPorGrupo($codGrupo: Int!) {
    atributosPorGrupo(codGrupo: $codGrupo, soloActivos: false) {
      codAtrib
      des
      aB
      codGrupo {
        codGrupo
      }
    }
  }
`;

const GET_DET_ATRIBS = gql`
  query GetDetAtribs($codAtrib: Int!) {
    detAtribsPorAtrib(codAtrib: $codAtrib, soloActivos: false) {
      codDetAtrib
      nroAtrib
      des
      aB
    }
  }
`;

const CREAR_ATRIBUTO = gql`
  mutation CrearAtributo($codGrupo: Int!, $des: String!) {
    crearAtributo(codGrupo: $codGrupo, des: $des) {
      atributo {
        codAtrib
        des
        aB
      }
    }
  }
`;

const EDITAR_ATRIBUTO = gql`
  mutation EditarAtributo($codAtrib: Int!, $des: String!) {
    editarAtributo(codAtrib: $codAtrib, des: $des) {
      atributo {
        codAtrib
        des
      }
    }
  }
`;

const DAR_BAJA_ATRIBUTO = gql`
  mutation DarDeBajaAtributo($codAtrib: Int!) {
    darDeBajaAtributo(codAtrib: $codAtrib) {
      atributo {
        codAtrib
        aB
      }
    }
  }
`;

const CREAR_DET_ATRIB = gql`
  mutation CrearDetAtrib($codAtrib: Int!, $nroAtrib: String!, $des: String!) {
    crearDetAtrib(codAtrib: $codAtrib, nroAtrib: $nroAtrib, des: $des) {
      detAtrib {
        codDetAtrib
        nroAtrib
        des
        aB
      }
    }
  }
`;

const EDITAR_DET_ATRIB = gql`
  mutation EditarDetAtrib($codDetAtrib: Int!, $nroAtrib: String, $des: String) {
    editarDetAtrib(codDetAtrib: $codDetAtrib, nroAtrib: $nroAtrib, des: $des) {
      detAtrib {
        codDetAtrib
        nroAtrib
        des
      }
    }
  }
`;

const DAR_BAJA_DET_ATRIB = gql`
  mutation DarDeBajaDetAtrib($codDetAtrib: Int!) {
    darDeBajaDetAtrib(codDetAtrib: $codDetAtrib) {
      detAtrib {
        codDetAtrib
        aB
      }
    }
  }
`;

// Helper to get group unified code
function getGroupUnifiedCode(grupo: any, allGroups: any[]): string {
  if (!grupo) return '';
  const parts = [];
  let current = grupo;
  while (current) {
    parts.unshift(current.codHijo);
    if (current.codPadre) {
      const parentId = current.codPadre.codGrupo;
      current = allGroups.find((g: any) => g.codGrupo === parentId);
    } else {
      current = null;
    }
  }
  return parts.join('');
}

export default function Atributos() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_atributo');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_atributo');
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_atributo');

  const [selectedGrupoId, setSelectedGrupoId] = useState<string>('');
  const [selectedAtrib, setSelectedAtrib] = useState<any>(null);

  // Modal states
  const [showAtribModal, setShowAtribModal] = useState(false);
  const [editAtribObj, setEditAtribObj] = useState<any>(null);
  const [atribDes, setAtribDes] = useState('');

  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editOptionObj, setEditOptionObj] = useState<any>(null);
  const [optionNro, setOptionNro] = useState('');
  const [optionDes, setOptionDes] = useState('');

  // Fetch groups
  const { data: groupsData, refetch: refetchGroups } = useQuery(GET_GRUPOS_Y_ATRIBUTOS);

  // Fetch attributes of selected group
  const { data: atribsData, loading: loadingAtribs, refetch: refetchAtribs } = useQuery(GET_ATRIBUTOS_POR_GRUPO, {
    variables: { codGrupo: parseInt(selectedGrupoId) || 0 },
    skip: !selectedGrupoId
  });

  // Fetch options of selected attribute
  const { data: optionsData, loading: loadingOptions, refetch: refetchOptions } = useQuery(GET_DET_ATRIBS, {
    variables: { codAtrib: selectedAtrib ? parseInt(selectedAtrib.codAtrib) : 0 },
    skip: !selectedAtrib
  });

  // Mutations
  const [crearAtributo] = useMutation(CREAR_ATRIBUTO);
  const [editarAtributo] = useMutation(EDITAR_ATRIBUTO);
  const [darDeBajaAtributo] = useMutation(DAR_BAJA_ATRIBUTO);
  const [crearDetAtrib] = useMutation(CREAR_DET_ATRIB);
  const [editarDetAtrib] = useMutation(EDITAR_DET_ATRIB);
  const [darDeBajaDetAtrib] = useMutation(DAR_BAJA_DET_ATRIB);

  const handleSaveAtrib = async () => {
    if (!atribDes.trim()) { alert('La descripción es obligatoria'); return; }
    try {
      if (editAtribObj) {
        await editarAtributo({
          variables: {
            codAtrib: parseInt(editAtribObj.codAtrib),
            des: atribDes
          }
        });
      } else {
        await crearAtributo({
          variables: {
            codGrupo: parseInt(selectedGrupoId),
            des: atribDes
          }
        });
      }
      setShowAtribModal(false);
      setAtribDes('');
      setEditAtribObj(null);
      refetchAtribs();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleBajaAtrib = async (codAtrib: any) => {
    if (!window.confirm('¿Está seguro de dar de baja este atributo?')) return;
    try {
      await darDeBajaAtributo({
        variables: { codAtrib: parseInt(codAtrib) }
      });
      if (selectedAtrib && selectedAtrib.codAtrib === codAtrib) {
        setSelectedAtrib(null);
      }
      refetchAtribs();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleSaveOption = async () => {
    if (!optionNro.trim() || optionNro.length > 2) {
      alert('El código debe ser de máximo 2 caracteres (Ej: 01, AA)');
      return;
    }
    if (!optionDes.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    try {
      if (editOptionObj) {
        await editarDetAtrib({
          variables: {
            codDetAtrib: parseInt(editOptionObj.codDetAtrib),
            nroAtrib: optionNro,
            des: optionDes
          }
        });
      } else {
        await crearDetAtrib({
          variables: {
            codAtrib: parseInt(selectedAtrib.codAtrib),
            nroAtrib: optionNro,
            des: optionDes
          }
        });
      }
      setShowOptionModal(false);
      setOptionNro('');
      setOptionDes('');
      setEditOptionObj(null);
      refetchOptions();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleBajaOption = async (codDetAtrib: any) => {
    if (!window.confirm('¿Está seguro de dar de baja esta opción?')) return;
    try {
      await darDeBajaDetAtrib({
        variables: { codDetAtrib: parseInt(codDetAtrib) }
      });
      refetchOptions();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <PageLayout
      title="Configuración de Atributos Técnicos"
      actions={[
        ...(puedeCrear && selectedGrupoId ? [{
          label: 'Nuevo Atributo',
          icon: '+',
          variant: 'primary' as const,
          onClick: () => { setEditAtribObj(null); setAtribDes(''); setShowAtribModal(true); }
        }] : []),
        { label: 'Actualizar', icon: '↺', onClick: () => { refetchGroups(); if (selectedGrupoId) refetchAtribs(); if (selectedAtrib) refetchOptions(); } },
      ]}
    >


      {/* Selector de Grupo */}
      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, color: '#334155', margin: 0 }}>Grupo de Activos:</label>
          <select
            value={selectedGrupoId}
            onChange={e => {
              setSelectedGrupoId(e.target.value);
              setSelectedAtrib(null);
            }}
            style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '320px', maxWidth: '100%' }}
          >
            <option value="">Seleccione un grupo...</option>
            {groupsData?.todosGrupos?.map((g: any) => {
              const code = getGroupUnifiedCode(g, groupsData.todosGrupos);
              const sangria = '   '.repeat(g.nivel - 1);
              return (
                <option key={g.codGrupo} value={g.codGrupo}>
                  {sangria}[{code}] {g.desGrupo}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {selectedGrupoId ? (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAtrib ? '1.2fr 1.2fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Panel de Atributos */}
          <div className="table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3c6e', margin: 0 }}>
                Atributos del Grupo
              </h3>
              {puedeCrear && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditAtribObj(null);
                    setAtribDes('');
                    setShowAtribModal(true);
                  }}
                >
                  + Nuevo Atributo
                </button>
              )}
            </div>

            {loadingAtribs ? (
              <div className="loading" style={{ padding: '2rem' }}>Cargando atributos...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {atribsData?.atributosPorGrupo?.length === 0 && (
                    <tr><td colSpan={4} className="empty">Este grupo no tiene atributos definidos.</td></tr>
                  )}
                  {atribsData?.atributosPorGrupo?.map((a: any) => {
                    const isSelected = selectedAtrib?.codAtrib === a.codAtrib;
                    return (
                      <tr
                        key={a.codAtrib}
                        onClick={() => setSelectedAtrib(a)}
                        style={{ cursor: 'pointer', background: isSelected ? '#e8f4fd' : 'white' }}
                      >
                        <td><strong>#{a.codAtrib}</strong></td>
                        <td>{a.des}</td>
                        <td>
                          <span className={`badge ${a.aB === 'A' ? 'badge-success' : 'badge-danger'}`}>
                            {a.aB === 'A' ? 'Activo' : 'Baja'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="btn-group">
                            {puedeEditar && (
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => {
                                  setEditAtribObj(a);
                                  setAtribDes(a.des);
                                  setShowAtribModal(true);
                                }}
                              >
                                Editar
                              </button>
                            )}
                            {puedeEliminar && a.aB === 'A' && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleBajaAtrib(a.codAtrib)}
                              >
                                Baja
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Panel de Opciones del Atributo seleccionado */}
          {selectedAtrib && (
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d6a4f', margin: 0 }}>
                  Valores / Opciones para: <span style={{ color: '#1a3c6e' }}>{selectedAtrib.des}</span>
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => setSelectedAtrib(null)}
                >
                  ×
                </button>
              </div>

              {puedeCrear && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      setEditOptionObj(null);
                      setOptionNro('');
                      setOptionDes('');
                      setShowOptionModal(true);
                    }}
                  >
                    + Nueva Opción
                  </button>
                </div>
              )}

              {loadingOptions ? (
                <div className="loading" style={{ padding: '1rem' }}>Cargando opciones...</div>
              ) : (
                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optionsData?.detAtribsPorAtrib?.length === 0 && (
                        <tr><td colSpan={4} className="empty" style={{ padding: '1rem' }}>No hay opciones registradas.</td></tr>
                      )}
                      {optionsData?.detAtribsPorAtrib?.map((o: any) => (
                        <tr key={o.codDetAtrib}>
                          <td><strong>{o.nroAtrib}</strong></td>
                          <td>{o.des}</td>
                          <td>
                            <span className={`badge ${o.aB === 'A' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                              {o.aB === 'A' ? 'Activo' : 'Baja'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              {puedeEditar && (
                                <button
                                  className="btn btn-warning btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                                  onClick={() => {
                                    setEditOptionObj(o);
                                    setOptionNro(o.nroAtrib);
                                    setOptionDes(o.des);
                                    setShowOptionModal(true);
                                  }}
                                >
                                  Editar
                                </button>
                              )}
                              {puedeEliminar && o.aB === 'A' && (
                                <button
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                                  onClick={() => handleBajaOption(o.codDetAtrib)}
                                >
                                  Baja
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          Por favor seleccione un grupo de activos arriba para ver y configurar sus atributos técnicos.
        </div>
      )}

      {/* ==================== MODAL: ABM ATRIBUTO ==================== */}
      {showAtribModal && (
        <div className="modal-overlay" onClick={() => setShowAtribModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editAtribObj ? 'Editar Atributo' : 'Nuevo Atributo'}</h2>
            <div className="form-group">
              <label>Descripción / Nombre del Atributo *</label>
              <input
                type="text"
                placeholder="Ej. Memoria RAM, Procesador, Color"
                value={atribDes}
                onChange={e => setAtribDes(e.target.value)}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowAtribModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveAtrib}>Guardar Atributo</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ABM OPCIÓN (DETALLE) ==================== */}
      {showOptionModal && (
        <div className="modal-overlay" onClick={() => setShowOptionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editOptionObj ? 'Editar Opción' : 'Nueva Opción de Valor'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Código Opción (Max 2 car.) *</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="Ej. 01, AA"
                  value={optionNro}
                  onChange={e => setOptionNro(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Descripción / Valor *</label>
                <input
                  type="text"
                  placeholder="Ej. 16 GB, Intel Core i7, Negro"
                  value={optionDes}
                  onChange={e => setOptionDes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowOptionModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveOption}>Guardar Opción</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
