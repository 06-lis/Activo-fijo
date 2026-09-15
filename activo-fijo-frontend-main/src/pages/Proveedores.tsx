import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_PROVEDORES = gql`
  query GetProvedores {
    todosProvedores {
      codProv
      nombre
      direccion
      telefono
      ruc
      ciudad
      inContactoSet {
        codCont
        nombre
        tipoDocid
        doctoIdn
        doctoIdl
        telefono
      }
    }
  }
`;

const CREAR_PROV = gql`
  mutation CrearProvedor($nombre: String!, $direccion: String, $telefono: String, $ruc: String, $ciudad: String) {
    crearProvedor(nombre: $nombre, direccion: $direccion, telefono: $telefono, ruc: $ruc, ciudad: $ciudad) {
      provedor { codProv nombre }
    }
  }
`;

const EDITAR_PROV = gql`
  mutation EditarProvedor($codProv: Int!, $nombre: String, $direccion: String, $telefono: String, $ruc: String, $ciudad: String) {
    editarProvedor(codProv: $codProv, nombre: $nombre, direccion: $direccion, telefono: $telefono, ruc: $ruc, ciudad: $ciudad) {
      provedor { codProv nombre }
    }
  }
`;

const ELIMINAR_PROV = gql`
  mutation EliminarProvedor($codProv: Int!) {
    eliminarProvedor(codProv: $codProv) { ok }
  }
`;

const CREAR_CONTACTO = gql`
  mutation CrearContacto($codProv: Int!, $nombre: String!, $tipoDocid: String!, $doctoIdn: String!, $doctoIdl: String!, $telefono: String!) {
    crearContacto(codProv: $codProv, nombre: $nombre, tipoDocid: $tipoDocid, doctoIdn: $doctoIdn, doctoIdl: $doctoIdl, telefono: $telefono) {
      contacto {
        codCont
        nombre
      }
    }
  }
`;

const EDITAR_CONTACTO = gql`
  mutation EditarContacto($codCont: Int!, $nombre: String, $tipoDocid: String, $doctoIdn: String, $doctoIdl: String, $telefono: String) {
    editarContacto(codCont: $codCont, nombre: $nombre, tipoDocid: $tipoDocid, doctoIdn: $doctoIdn, doctoIdl: $doctoIdl, telefono: $telefono) {
      contacto {
        codCont
        nombre
      }
    }
  }
`;

const VACIO_PROV = { nombre: '', direccion: '', telefono: '', ruc: '', ciudad: '' };
const VACIO_CONT = { nombre: '', tipoDocid: 'C', doctoIdn: '', doctoIdl: '', telefono: '' };

export default function Proveedores() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_proveedor');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_proveedor');
  const puedeEliminar = user?.esAdmin || user?.permisos.includes('eliminar_proveedor');

  const [showProvModal, setShowProvModal] = useState(false);
  const [showContModal, setShowContModal] = useState(false);
  
  const [editandoProv, setEditandoProv] = useState<any>(null);
  const [editandoCont, setEditandoCont] = useState<any>(null);
  
  const [provForm, setProvForm] = useState<any>(VACIO_PROV);
  const [contForm, setContForm] = useState<any>(VACIO_CONT);
  
  const [expandedProvId, setExpandedProvId] = useState<number | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_PROVEDORES);
  
  const [crearProv] = useMutation(CREAR_PROV);
  const [editarProv] = useMutation(EDITAR_PROV);
  const [eliminarProv] = useMutation(ELIMINAR_PROV);
  
  const [crearContacto] = useMutation(CREAR_CONTACTO);
  const [editarContacto] = useMutation(EDITAR_CONTACTO);

  const abrirNuevoProv = () => {
    setEditandoProv(null);
    setProvForm(VACIO_PROV);
    setShowProvModal(true);
  };

  const abrirEditarProv = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditandoProv(p);
    setProvForm({
      nombre: p.nombre,
      direccion: p.direccion || '',
      telefono: p.telefono || '',
      ruc: p.ruc || '',
      ciudad: p.ciudad || ''
    });
    setShowProvModal(true);
  };

  const abrirNuevoCont = (provId: number) => {
    setEditandoCont(null);
    setContForm({ ...VACIO_CONT, codProv: provId });
    setShowContModal(true);
  };

  const abrirEditarCont = (c: any) => {
    setEditandoCont(c);
    setContForm({
      nombre: c.nombre,
      tipoDocid: c.tipoDocid || 'C',
      doctoIdn: c.doctoIdn,
      doctoIdl: c.doctoIdl,
      telefono: c.telefono || ''
    });
    setShowContModal(true);
  };

  const handleSubmitProv = async () => {
    if (!provForm.nombre.trim()) { alert('El nombre es obligatorio'); return; }
    try {
      if (editandoProv) {
        await editarProv({ variables: { codProv: parseInt(editandoProv.codProv), ...provForm } });
      } else {
        await crearProv({ variables: provForm });
      }
      setShowProvModal(false);
      refetch();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleSubmitCont = async () => {
    if (!contForm.nombre.trim()) { alert('El nombre del contacto es obligatorio'); return; }
    if (!contForm.doctoIdn.trim()) { alert('El número de documento es obligatorio'); return; }
    if (!contForm.doctoIdl.trim()) { alert('El lugar / extensión es obligatorio'); return; }
    if (!contForm.telefono.trim()) { alert('El teléfono del contacto es obligatorio'); return; }
    
    try {
      if (editandoCont) {
        await editarContacto({
          variables: {
            codCont: parseInt(editandoCont.codCont),
            nombre: contForm.nombre,
            tipoDocid: contForm.tipoDocid,
            doctoIdn: contForm.doctoIdn,
            doctoIdl: contForm.doctoIdl,
            telefono: contForm.telefono
          }
        });
      } else {
        await crearContacto({
          variables: {
            codProv: parseInt(contForm.codProv),
            nombre: contForm.nombre,
            tipoDocid: contForm.tipoDocid,
            doctoIdn: contForm.doctoIdn,
            doctoIdl: contForm.doctoIdl,
            telefono: contForm.telefono
          }
        });
      }
      setShowContModal(false);
      refetch();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const toggleExpand = (provId: number) => {
    if (expandedProvId === provId) {
      setExpandedProvId(null);
    } else {
      setExpandedProvId(provId);
    }
  };

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Proveedores y Contactos"
      actions={
        puedeCrear ? [
          { label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: abrirNuevoProv },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ] : [
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ]
      }
    >

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>RUC / NIT</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Dirección</th>
              <th>Contactos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                  <td><div className="h-8 bg-gray-200 rounded w-24"></div></td>
                  <td><div className="h-8 bg-gray-200 rounded w-28"></div></td>
                </tr>
              ))
            ) : data?.todosProvedores?.length === 0 ? (
              <tr><td colSpan={8} className="empty">No hay proveedores registrados</td></tr>
            ) : (
              data?.todosProvedores?.map((p: any) => {
                const isExpanded = expandedProvId === p.codProv;
                const contactCount = p.inContactoSet?.length || 0;
                return (
                  <React.Fragment key={p.codProv}>
                    <tr 
                      onClick={() => toggleExpand(p.codProv)}
                      style={{ cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
                    >
                      <td><strong>#{p.codProv}</strong></td>
                      <td style={{ maxWidth: '200px' }} className="truncate" title={p.nombre}>
                        <strong>{p.nombre}</strong>
                      </td>
                      <td>{p.ruc || '-'}</td>
                      <td>{p.telefono || '-'}</td>
                      <td>{p.ciudad || '-'}</td>
                      <td style={{ maxWidth: '180px' }} className="truncate" title={p.direccion || ''}>
                        {p.direccion || '-'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #cbd5e1' }}
                          onClick={(e) => { e.stopPropagation(); toggleExpand(p.codProv); }}
                        >
                          📞 {contactCount} {contactCount === 1 ? 'contacto' : 'contactos'}
                        </button>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="btn-group">
                          {puedeEditar && <button className="btn btn-warning btn-sm" onClick={(e) => abrirEditarProv(p, e)}>Editar</button>}
                          {puedeEliminar && (
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={async (e) => { 
                                e.stopPropagation();
                                if (window.confirm('¿Está seguro de eliminar este proveedor? Tenga en cuenta que no debe tener contactos asociados.')) { 
                                  try {
                                    await eliminarProv({ variables: { codProv: p.codProv } }); 
                                    refetch(); 
                                  } catch (err: any) {
                                    alert('Error al eliminar: ' + err.message);
                                  }
                                } 
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con contactos */}
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={8} style={{ padding: '1.25rem 2rem', borderLeft: '4px solid #3b82f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>
                              👤 Personas de Contacto de: {p.nombre}
                            </h4>
                            {puedeCrear && (
                              <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => abrirNuevoCont(p.codProv)}
                              >
                                + Agregar Contacto
                              </button>
                            )}
                          </div>

                          {contactCount === 0 ? (
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                              No hay personas de contacto registradas para este proveedor.
                            </div>
                          ) : (
                            <table className="sub-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                  <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Nombre Completo</th>
                                  <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Tipo Doc.</th>
                                  <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Nro. Documento</th>
                                  <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Lugar (Extensión)</th>
                                  <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Teléfono</th>
                                  <th style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.inContactoSet.map((c: any) => (
                                  <tr key={c.codCont} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{c.nombre}</td>
                                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                      {c.tipoDocid === 'C' ? 'Cédula (C)' : c.tipoDocid === 'P' ? 'Pasaporte (P)' : c.tipoDocid === 'N' ? 'NIT (N)' : c.tipoDocid === 'E' ? 'Extranjero (E)' : c.tipoDocid}
                                    </td>
                                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>{c.doctoIdn}</td>
                                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}><span className="badge badge-info">{c.doctoIdl}</span></td>
                                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>{c.telefono}</td>
                                    <td style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textAlign: 'right' }}>
                                      {puedeEditar && (
                                        <button 
                                          className="btn btn-warning btn-sm" 
                                          style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                                          onClick={() => abrirEditarCont(c)}
                                        >
                                          Editar
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== MODAL: PROVEEDOR ==================== */}
      {showProvModal && (
        <div className="modal-overlay" onClick={() => setShowProvModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editandoProv ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            <div className="form-grid">
              <div className="form-group form-group-full">
                <label>Nombre *</label>
                <input 
                  type="text"
                  maxLength={45}
                  value={provForm.nombre} 
                  onChange={e => setProvForm({ ...provForm, nombre: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>
                  RUC / NIT
                  <span className="text-blue-500 cursor-help ml-1" title="Número de Registro Único de Contribuyentes o Número de Identificación Tributaria del proveedor.">🛈</span>
                </label>
                <input 
                  type="text"
                  maxLength={12}
                  value={provForm.ruc} 
                  onChange={e => setProvForm({ ...provForm, ruc: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="text"
                  maxLength={12}
                  value={provForm.telefono} 
                  onChange={e => setProvForm({ ...provForm, telefono: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>
                  Ciudad
                  <span className="text-blue-500 cursor-help ml-1" title="Ciudad base o departamento de la sucursal del proveedor.">🛈</span>
                </label>
                <input 
                  type="text"
                  maxLength={25}
                  value={provForm.ciudad} 
                  onChange={e => setProvForm({ ...provForm, ciudad: e.target.value })} 
                />
              </div>
              <div className="form-group form-group-full">
                <label>Dirección</label>
                <input 
                  type="text"
                  maxLength={40}
                  value={provForm.direccion} 
                  onChange={e => setProvForm({ ...provForm, direccion: e.target.value })} 
                />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowProvModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmitProv}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CONTACTO ==================== */}
      {showContModal && (
        <div className="modal-overlay" onClick={() => setShowContModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editandoCont ? 'Editar Persona de Contacto' : 'Nueva Persona de Contacto'}</h2>
            <div className="form-grid">
              <div className="form-group form-group-full">
                <label>Nombre del Contacto *</label>
                <input 
                  type="text" 
                  maxLength={45} 
                  placeholder="Ej. Juan Pérez"
                  value={contForm.nombre} 
                  onChange={e => setContForm({ ...contForm, nombre: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Tipo Documento *</label>
                <select 
                  value={contForm.tipoDocid} 
                  onChange={e => setContForm({ ...contForm, tipoDocid: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="C">Cédula (C)</option>
                  <option value="P">Pasaporte (P)</option>
                  <option value="N">NIT (N)</option>
                  <option value="E">Extranjero (E)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nro. Documento *</label>
                <input 
                  type="text" 
                  maxLength={12} 
                  placeholder="Ej. 6543210"
                  value={contForm.doctoIdn} 
                  onChange={e => setContForm({ ...contForm, doctoIdn: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>
                  Lugar / Extensión *
                  <span className="text-blue-500 cursor-help ml-1" title="Lugar de expedición del documento de identidad (ej: LP, SC, CB).">🛈</span>
                </label>
                <input 
                  type="text" 
                  maxLength={3} 
                  placeholder="Ej. LP, CB, SC"
                  value={contForm.doctoIdl} 
                  onChange={e => setContForm({ ...contForm, doctoIdl: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Teléfono del Contacto *</label>
                <input 
                  type="text" 
                  maxLength={12} 
                  placeholder="Ej. 76543210"
                  value={contForm.telefono} 
                  onChange={e => setContForm({ ...contForm, telefono: e.target.value })} 
                />
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowContModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmitCont}>Guardar Contacto</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}