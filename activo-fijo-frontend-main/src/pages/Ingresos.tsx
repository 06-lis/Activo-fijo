import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import PageLayout from '../components/ui/PageLayout';
import { useAuth } from '../context/AuthContext';


// Helper functions to get office codes
function getOfficeFullCode(ofic: any): string {
  if (!ofic) return '';
  const parts = [];
  let current = ofic;
  while (current) {
    parts.unshift(current.codDpto);
    current = current.codPadre;
  }
  return parts.join('-');
}

function getOfficeUnifiedCode(ofic: any): string {
  if (!ofic) return '';
  const parts = [];
  let current = ofic;
  while (current) {
    parts.unshift(current.codDpto);
    current = current.codPadre;
  }
  return parts.join('');
}

const GET_INGRESOS = gql`
  query {
    todosIngresos {
      nroIngreso
      gestion
      actaRecep
      glosa
      estado
      fechaRecep
      nroFactura
      fechaFactura
      nroEgreso
      codProv { nombre }
      codOficDest {
        codOfic
        codDpto
        desDpto
        nivel
        codPadre {
          codOfic
          codDpto
          nivel
          codPadre {
            codOfic
            codDpto
            nivel
          }
        }
      }
    }
  }
`;

const GET_CATALOGOS = gql`
  query {
    todosProvedores { codProv nombre }
    todasOficinas {
      codOfic
      codDpto
      desDpto
      nivel
      codPadre {
        codOfic
        codDpto
        nivel
        codPadre {
          codOfic
          codDpto
          nivel
        }
      }
    }
    todosResponsables {
      codResp
      codEstprog
      codEmp {
        idEmpleado
        nombre
        apellido
        cargo
      }
    }
  }
`;

const CREAR_INGRESO = gql`
  mutation CrearIngreso(
    $gestion: Int, $tipoIngreso: Int, $actaRecep: String,
    $fechaRecep: Date, $codProv: Int, $codOficDest: Int,
    $codEmpRecep: Int, $tipoEmpRecep: Int,
    $codEmpDest: Int, $tipoEmpDest: Int,
    $glosa: String, $nroFactura: Int, $fechaFactura: Date,
    $nroEgreso: Int, $fechaEgreso: Date, $estado: String
  ) {
    crearIngreso(
      gestion: $gestion, tipoIngreso: $tipoIngreso, actaRecep: $actaRecep,
      fechaRecep: $fechaRecep, codProv: $codProv, codOficDest: $codOficDest,
      codEmpRecep: $codEmpRecep, tipoEmpRecep: $tipoEmpRecep,
      codEmpDest: $codEmpDest, tipoEmpDest: $tipoEmpDest,
      glosa: $glosa, nroFactura: $nroFactura, fechaFactura: $fechaFactura,
      nroEgreso: $nroEgreso, fechaEgreso: $fechaEgreso, estado: $estado
    ) {
      ingreso { nroIngreso glosa estado }
    }
  }
`;

const EDITAR_INGRESO = gql`
  mutation EditarIngreso($nroIngreso: Int!, $glosa: String, $estado: String, $nroFactura: Int, $actaRecep: String) {
    editarIngreso(nroIngreso: $nroIngreso, glosa: $glosa, estado: $estado, nroFactura: $nroFactura, actaRecep: $actaRecep) {
      ingreso { nroIngreso glosa estado }
    }
  }
`;

const estadoLabel: Record<string, string> = { 'E': 'Elaborado', 'A': 'Aprobado', 'C': 'Cerrado' };
const estadoClass: Record<string, string> = { 'E': 'badge-warning', 'A': 'badge-success', 'C': 'badge-info' };

const FORM_VACIO = {
  gestion: '', actaRecep: '', glosa: '', codProv: '', codOficDest: '',
  codEmpRecep: '', codEmpDest: '', nroFactura: '', fechaFactura: '',
  fechaRecep: '', nroEgreso: '', estado: 'E'
};

export default function Ingresos() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_ingreso');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_ingreso');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState<any>(FORM_VACIO);

  // Autocomplete search states
  const [oficinaSearch, setOficinaSearch] = useState('');
  const [showOficinasDropdown, setShowOficinasDropdown] = useState(false);

  const [recepSearch, setRecepSearch] = useState('');
  const [showRecepDropdown, setShowRecepDropdown] = useState(false);

  const [destSearch, setDestSearch] = useState('');
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_INGRESOS);
  const { data: cats } = useQuery(GET_CATALOGOS);
  const [crearIngreso] = useMutation(CREAR_INGRESO);
  const [editarIngreso] = useMutation(EDITAR_INGRESO);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setOficinaSearch('');
    setRecepSearch('');
    setDestSearch('');
    setShowModal(true);
  };

  const abrirEditar = (i: any) => {
    setEditando(i);
    setForm({ ...FORM_VACIO, glosa: i.glosa || '', estado: i.estado || 'E', nroFactura: i.nroFactura || '', actaRecep: i.actaRecep || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!editando) {
      if (!form.codProv || !form.codOficDest || !form.codEmpRecep || !form.codEmpDest) {
        alert('Por favor selecciona un Proveedor, Oficina Destino y ambos Responsables.');
        return;
      }
    }

    try {
      if (editando) {
        await editarIngreso({ variables: {
          nroIngreso: editando.nroIngreso,
          glosa: form.glosa || null,
          estado: form.estado,
          nroFactura: form.nroFactura ? parseInt(form.nroFactura) : null,
          actaRecep: form.actaRecep || null,
        }});
      } else {
        await crearIngreso({ variables: {
          gestion: form.gestion ? parseInt(form.gestion) : null,
          actaRecep: form.actaRecep || null,
          codProv: form.codProv ? parseInt(form.codProv) : null,
          codOficDest: form.codOficDest ? parseInt(form.codOficDest) : null,
          codEmpRecep: form.codEmpRecep ? parseInt(form.codEmpRecep) : null,
          tipoEmpRecep: form.codEmpRecep ? 2 : null, // 2 = Responsable
          codEmpDest: form.codEmpDest ? parseInt(form.codEmpDest) : null,
          tipoEmpDest: form.codEmpDest ? 2 : null, // 2 = Responsable
          glosa: form.glosa || null,
          nroFactura: form.nroFactura ? parseInt(form.nroFactura) : null,
          fechaFactura: form.fechaFactura || null,
          fechaRecep: form.fechaRecep || null,
          nroEgreso: form.nroEgreso ? parseInt(form.nroEgreso) : null,
          estado: form.estado,
        }});
      }
      setShowModal(false);
      refetch();
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  // Autocomplete selecting handlers
  const handleSelectOficina = (o: any) => {
    const unified = getOfficeUnifiedCode(o);
    setForm({ ...form, codOficDest: o.codOfic });
    setOficinaSearch(`[${unified}] ${o.desDpto}`);
    setShowOficinasDropdown(false);
  };

  const handleSelectRecep = (r: any) => {
    setForm({ ...form, codEmpRecep: r.codResp });
    setRecepSearch(`[${r.codEstprog}] ${r.codEmp.nombre} ${r.codEmp.apellido}`);
    setShowRecepDropdown(false);
  };

  const handleSelectDest = (r: any) => {
    setForm({ ...form, codEmpDest: r.codResp });
    setDestSearch(`[${r.codEstprog}] ${r.codEmp.nombre} ${r.codEmp.apellido}`);
    setShowDestDropdown(false);
  };

  // Autocomplete filtering helpers
  const filteredOficinas = cats?.todasOficinas?.filter((o: any) => {
    const fullCode = getOfficeFullCode(o).toLowerCase();
    const unifiedCode = getOfficeUnifiedCode(o).toLowerCase();
    const text = o.desDpto.toLowerCase();
    const query = oficinaSearch.toLowerCase();
    return text.includes(query) || fullCode.includes(query) || unifiedCode.includes(query);
  }) || [];

  const filteredResponsiblesRecep = cats?.todosResponsables?.filter((r: any) => {
    const code = r.codEstprog.toLowerCase();
    const name = `${r.codEmp.nombre} ${r.codEmp.apellido}`.toLowerCase();
    const query = recepSearch.toLowerCase();
    return code.includes(query) || name.includes(query);
  }) || [];

  const filteredResponsiblesDest = cats?.todosResponsables?.filter((r: any) => {
    const code = r.codEstprog.toLowerCase();
    const name = `${r.codEmp.nombre} ${r.codEmp.apellido}`.toLowerCase();
    const query = destSearch.toLowerCase();
    return code.includes(query) || name.includes(query);
  }) || [];

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Ingresos de Bienes"
      actions={[
        ...(puedeCrear ? [{ label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: abrirNuevo }] : []),
        { label: 'Actualizar', icon: '\u21BA', onClick: () => refetch() },
      ]}
    >

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nro.</th>
              <th>Gestión</th>
              <th>Acta Recep.</th>
              <th>Glosa</th>
              <th>Proveedor</th>
              <th>Oficina Destino</th>
              <th>Fecha Recep.</th>
              <th>Nro. Factura</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b border-slate-700/30">
                  <td><div className="h-4 bg-slate-700 rounded w-8"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-12"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-36"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-28"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-32"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-20"></div></td>
                  <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                  <td><div className="h-5 bg-slate-700 rounded-full w-16"></div></td>
                  <td><div className="h-6 bg-slate-700 rounded w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : (
              <>
                {data?.todosIngresos?.length === 0 && (
                  <tr><td colSpan={10} className="empty">No hay ingresos registrados</td></tr>
                )}
                {data?.todosIngresos?.map((i: any) => (
                  <tr key={i.nroIngreso} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                    <td><strong>#{i.nroIngreso}</strong></td>
                    <td>{i.gestion || '-'}</td>
                    <td>{i.actaRecep || '-'}</td>
                    <td className="max-w-[200px] truncate" title={i.glosa}>{i.glosa || '-'}</td>
                <td>{i.codProv?.nombre || '-'}</td>
                <td>
                  {i.codOficDest
                    ? `[${getOfficeUnifiedCode(i.codOficDest)}] ${i.codOficDest.desDpto}`
                    : '-'}
                </td>
                <td>{i.fechaRecep || '-'}</td>
                <td>{i.nroFactura || '-'}</td>
                <td>
                  <span className={`badge ${estadoClass[i.estado] || 'badge-secondary'}`}>
                    {estadoLabel[i.estado] || i.estado || '-'}
                  </span>
                </td>
                <td>
                  {puedeEditar && (
                    <div className="btn-group">
                      <button className="btn btn-warning btn-sm" onClick={() => abrirEditar(i)}>Editar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editando ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso'}</h2>

            <div className="form-grid">
              {!editando && <>
                <div className="form-group">
                  <label>Gestión (año)</label>
                  <input type="number" value={form.gestion} onChange={e => setForm({...form, gestion: e.target.value})} placeholder="2025" />
                </div>
                <div className="form-group">
                  <label>Acta de Recepción</label>
                  <input value={form.actaRecep} onChange={e => setForm({...form, actaRecep: e.target.value})} placeholder="Nro. acta" />
                </div>
              </>}

              <div className="form-group form-group-full">
                <label>Glosa / Descripción</label>
                <input value={form.glosa} onChange={e => setForm({...form, glosa: e.target.value})} placeholder="Descripción del ingreso" />
              </div>

              {!editando && <>
                <div className="section-label">Proveedor y Destino</div>
                <div className="form-group">
                  <label>Proveedor</label>
                  <select value={form.codProv} onChange={e => setForm({...form, codProv: e.target.value})}>
                    <option value="">Seleccionar...</option>
                    {cats?.todosProvedores?.map((p: any) => (
                      <option key={p.codProv} value={p.codProv}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Oficina Destino *</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={oficinaSearch}
                      onChange={e => {
                        setOficinaSearch(e.target.value);
                        setForm({ ...form, codOficDest: '' });
                        setShowOficinasDropdown(true);
                      }}
                      onFocus={() => setShowOficinasDropdown(true)}
                      onBlur={() => setTimeout(() => setShowOficinasDropdown(false), 200)}
                      placeholder="Buscar por código (1221, 1-22-1) o nombre..."
                    />
                    {showOficinasDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredOficinas.slice(0, 20).map((o: any) => {
                          const unified = getOfficeUnifiedCode(o);
                          return (
                            <li
                              key={o.codOfic}
                              className="autocomplete-item"
                              onClick={() => handleSelectOficina(o)}
                            >
                              [{unified}] {o.desDpto}
                            </li>
                          );
                        })}
                        {filteredOficinas.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron oficinas</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="section-label">Responsables</div>
                <div className="form-group">
                  <label>Responsable que Recepciona *</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={recepSearch}
                      onChange={e => {
                        setRecepSearch(e.target.value);
                        setForm({ ...form, codEmpRecep: '' });
                        setShowRecepDropdown(true);
                      }}
                      onFocus={() => setShowRecepDropdown(true)}
                      onBlur={() => setTimeout(() => setShowRecepDropdown(false), 200)}
                      placeholder="Buscar por código (ej. 1221) o nombre..."
                    />
                    {showRecepDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredResponsiblesRecep.slice(0, 20).map((r: any) => (
                          <li
                            key={r.codResp}
                            className="autocomplete-item"
                            onClick={() => handleSelectRecep(r)}
                          >
                            [{r.codEstprog}] {r.codEmp.nombre} {r.codEmp.apellido} ({r.codEmp.cargo || 'Sin cargo'})
                          </li>
                        ))}
                        {filteredResponsiblesRecep.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron responsables</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Responsable Destino *</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={destSearch}
                      onChange={e => {
                        setDestSearch(e.target.value);
                        setForm({ ...form, codEmpDest: '' });
                        setShowDestDropdown(true);
                      }}
                      onFocus={() => setShowDestDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                      placeholder="Buscar por código (ej. 1221) o nombre..."
                    />
                    {showDestDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredResponsiblesDest.slice(0, 20).map((r: any) => (
                          <li
                            key={r.codResp}
                            className="autocomplete-item"
                            onClick={() => handleSelectDest(r)}
                          >
                            [{r.codEstprog}] {r.codEmp.nombre} {r.codEmp.apellido} ({r.codEmp.cargo || 'Sin cargo'})
                          </li>
                        ))}
                        {filteredResponsiblesDest.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron responsables</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="section-label">Documentos</div>
                <div className="form-group">
                  <label>Fecha Recepción</label>
                  <input type="date" value={form.fechaRecep} onChange={e => setForm({...form, fechaRecep: e.target.value})} />
                </div>
                <div className="form-group">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="mb-0">Nro. Factura</label>
                    <span 
                      className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                      title="Opcional. Número de la factura comercial asociada a la adquisición."
                    >
                      ?
                    </span>
                  </div>
                  <input type="number" value={form.nroFactura} onChange={e => setForm({...form, nroFactura: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Fecha Factura</label>
                  <input type="date" value={form.fechaFactura} onChange={e => setForm({...form, fechaFactura: e.target.value})} />
                </div>
                <div className="form-group">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="mb-0">Nro. Egreso</label>
                    <span 
                      className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                      title="Opcional. Número de comprobante de egreso de caja/banco si aplica."
                    >
                      ?
                    </span>
                  </div>
                  <input type="number" value={form.nroEgreso} onChange={e => setForm({...form, nroEgreso: e.target.value})} />
                </div>
              </>}

              {editando && <>
                <div className="form-group">
                  <label>Nro. Factura</label>
                  <input type="number" value={form.nroFactura} onChange={e => setForm({...form, nroFactura: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Acta Recepción</label>
                  <input value={form.actaRecep} onChange={e => setForm({...form, actaRecep: e.target.value})} />
                </div>
              </>}

              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                  <option value="E">Elaborado</option>
                  <option value="A">Aprobado</option>
                  <option value="C">Cerrado</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Registrar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}