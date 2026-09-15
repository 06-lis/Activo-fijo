import PageLayout from '../components/ui/PageLayout';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { GET_BAJAS_DATA } from '../graphql/queries';
import {
  CREAR_BAJA_ACT,
  CREAR_MOTIVO_BAJA,
  EDITAR_MOTIVO_BAJA,
  ELIMINAR_MOTIVO_BAJA
} from '../graphql/mutations';

export default function Bajas() {
  const { user } = useAuth();
  const puedeCrearBaja = user?.esAdmin || user?.permisos.includes('solicitar_baja');
  const puedeCrearMotivo = user?.esAdmin || user?.permisos.includes('crear_motivo_baja');
  const puedeEditarMotivo = user?.esAdmin || user?.permisos.includes('editar_motivo_baja');
  const puedeEliminarMotivo = user?.esAdmin || user?.permisos.includes('eliminar_motivo_baja');

  const [activeTab, setActiveTab] = useState<'bajas' | 'motivos'>('bajas');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nroActivo: '',
    motivo: '',
    codEmpAut: '',
    documento: '',
    fechaBajaTe: new Date().toISOString().split('T')[0],
    fechaBajaEf: '',
    observacion: '',
    codEmpResp: '',
    valorFinal: ''
  });

  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoForm, setMotivoForm] = useState({ motivo: '', descripcion: '' });
  const [editingMotivo, setEditingMotivo] = useState<number | null>(null);

  // Autocomplete search states
  const [activoSearch, setActivoSearch] = useState('');
  const [showActivosDropdown, setShowActivosDropdown] = useState(false);

  const [empAutSearch, setEmpAutSearch] = useState('');
  const [showEmpAutDropdown, setShowEmpAutDropdown] = useState(false);

  const [empRespSearch, setEmpRespSearch] = useState('');
  const [showEmpRespDropdown, setShowEmpRespDropdown] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_BAJAS_DATA);
  
  const [crearBaja] = useMutation(CREAR_BAJA_ACT);
  const [crearMotivo] = useMutation(CREAR_MOTIVO_BAJA);
  const [editarMotivo] = useMutation(EDITAR_MOTIVO_BAJA);
  const [eliminarMotivo] = useMutation(ELIMINAR_MOTIVO_BAJA);

  const activosBaja = data?.todasBajasDetalladas || [];
  const activosDisponibles = useMemo(() => {
    return data?.todosActivos?.filter((a: any) => a.aB !== 'B') || [];
  }, [data]);

  const handleSelectActivo = (a: any) => {
    setForm(prev => ({ ...prev, nroActivo: a.nroActivo.toString() }));
    setActivoSearch(`[${a.codActivo}] ${a.descripcion}`);
    setShowActivosDropdown(false);
  };

  const handleSelectEmpAut = (e: any) => {
    setForm(prev => ({ ...prev, codEmpAut: e.idEmpleado.toString() }));
    setEmpAutSearch(`${e.nombre} ${e.apellido} (${e.cargo || 'Sin cargo'})`);
    setShowEmpAutDropdown(false);
  };

  const handleSelectEmpResp = (e: any) => {
    setForm(prev => ({ ...prev, codEmpResp: e.idEmpleado.toString() }));
    setEmpRespSearch(`${e.nombre} ${e.apellido} (${e.cargo || 'Sin cargo'})`);
    setShowEmpRespDropdown(false);
  };

  const getMotivoDescription = (motivoCode: string) => {
    const mObj = data?.todosMotivos?.find((m: any) => String(m.motivo) === String(motivoCode));
    return mObj ? mObj.descripcion : `Motivo ${motivoCode}`;
  };

  const getEmpleadoName = (empId: number) => {
    const eObj = data?.todosEmpleados?.find((e: any) => String(e.idEmpleado) === String(empId));
    return eObj ? `${eObj.nombre} ${eObj.apellido} (${eObj.cargo || 'Sin cargo'})` : `ID: ${empId}`;
  };

  const handleSubmit = async () => {
    if (!form.nroActivo) { alert('Seleccione un activo'); return; }
    if (!form.motivo) { alert('Seleccione un motivo'); return; }
    if (!form.codEmpAut) { alert('Seleccione el empleado autorizador'); return; }
    if (!form.fechaBajaTe) { alert('Ingrese la fecha de baja técnica'); return; }

    try {
      const variables: any = {
        nroActivo: parseInt(form.nroActivo),
        tipoPerAut: 1,
        codEmpAut: parseInt(form.codEmpAut),
        fechaBajaTe: form.fechaBajaTe,
        motivo: form.motivo,
        documento: form.documento || null,
        fechaBajaEf: form.fechaBajaEf || null,
        observacion: form.observacion || null,
        tipoPerResp: form.codEmpResp ? 1 : null,
        codEmpResp: form.codEmpResp ? parseInt(form.codEmpResp) : null,
        valorFinal: form.valorFinal ? parseFloat(form.valorFinal) : null
      };

      await crearBaja({ variables });
      alert('✅ Baja formal registrada correctamente');
      setShowModal(false);
      
      setForm({
        nroActivo: '',
        motivo: '',
        codEmpAut: '',
        documento: '',
        fechaBajaTe: new Date().toISOString().split('T')[0],
        fechaBajaEf: '',
        observacion: '',
        codEmpResp: '',
        valorFinal: ''
      });
      setActivoSearch('');
      setEmpAutSearch('');
      setEmpRespSearch('');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleMotivoSubmit = async () => {
    if (!motivoForm.motivo || !motivoForm.descripcion) {
      alert('Por favor complete todos los campos.');
      return;
    }
    try {
      if (editingMotivo !== null) {
        await editarMotivo({
          variables: {
            motivo: parseInt(motivoForm.motivo),
            descripcion: motivoForm.descripcion
          }
        });
        alert('✅ Motivo editado correctamente');
      } else {
        await crearMotivo({
          variables: {
            motivo: parseInt(motivoForm.motivo),
            descripcion: motivoForm.descripcion
          }
        });
        alert('✅ Motivo registrado correctamente');
      }
      setShowMotivoModal(false);
      setMotivoForm({ motivo: '', descripcion: '' });
      setEditingMotivo(null);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleEliminarMotivo = async (motivoCode: number) => {
    if (!window.confirm(`¿Está seguro de eliminar el motivo #${motivoCode}?`)) {
      return;
    }
    try {
      await eliminarMotivo({
        variables: {
          motivo: motivoCode
        }
      });
      alert('✅ Motivo eliminado correctamente');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const filteredActivos = useMemo(() => {
    const query = activoSearch.toLowerCase().trim();
    if (!query) return activosDisponibles.slice(0, 15);
    return activosDisponibles.filter((a: any) =>
      a.codActivo.toLowerCase().includes(query) ||
      a.descripcion.toLowerCase().includes(query)
    ).slice(0, 15);
  }, [activosDisponibles, activoSearch]);

  const filteredEmpAut = useMemo(() => {
    const query = empAutSearch.toLowerCase().trim();
    const list = data?.todosEmpleados || [];
    if (!query) return list.slice(0, 10);
    return list.filter((e: any) =>
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(query) ||
      (e.cargo && e.cargo.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [data?.todosEmpleados, empAutSearch]);

  const filteredEmpResp = useMemo(() => {
    const query = empRespSearch.toLowerCase().trim();
    const list = data?.todosEmpleados || [];
    if (!query) return list.slice(0, 10);
    return list.filter((e: any) =>
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(query) ||
      (e.cargo && e.cargo.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [data?.todosEmpleados, empRespSearch]);

  const pageActions = useMemo(() => {
    const list = [];
    if (activeTab === 'bajas') {
      if (puedeCrearBaja) {
        list.push({ label: 'Nueva Baja Formal', icon: '+', variant: 'primary' as const, onClick: () => setShowModal(true) });
      }
    } else {
      if (puedeCrearMotivo) {
        list.push({
          label: 'Nuevo Motivo',
          icon: '+',
          variant: 'primary' as const,
          onClick: () => {
            setEditingMotivo(null);
            setMotivoForm({ motivo: '', descripcion: '' });
            setShowMotivoModal(true);
          }
        });
      }
    }
    list.push({ label: 'Actualizar', icon: '↺', onClick: () => refetch() });
    return list;
  }, [activeTab, puedeCrearBaja, puedeCrearMotivo, refetch]);

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Baja de Activos"
      actions={pageActions}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50 w-fit">
        <button
          onClick={() => setActiveTab('bajas')}
          className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
            activeTab === 'bajas'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Bajas de Activos
        </button>
        <button
          onClick={() => setActiveTab('motivos')}
          className={`px-6 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
            activeTab === 'motivos'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Motivos de Baja
        </button>
      </div>

      {activeTab === 'bajas' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nro.</th>
                <th>Activo</th>
                <th>Motivo</th>
                <th>Autorizador</th>
                <th>Documento</th>
                <th>Fecha Técnica</th>
                <th>Valor Final</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-b border-slate-700/30">
                    <td><div className="h-4 bg-slate-700 rounded w-8"></div></td>
                    <td>
                      <div className="h-4 bg-slate-700 rounded w-36 mb-2"></div>
                      <div className="h-3 bg-slate-700/60 rounded w-20"></div>
                    </td>
                    <td><div className="h-5 bg-slate-700 rounded-full w-24"></div></td>
                    <td><div className="h-4 bg-slate-700 rounded w-32"></div></td>
                    <td><div className="h-4 bg-slate-700 rounded w-24"></div></td>
                    <td><div className="h-4 bg-slate-700 rounded w-24"></div></td>
                    <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                    <td><div className="h-4 bg-slate-700 rounded w-28"></div></td>
                  </tr>
                ))
              ) : (
                <>
                  {activosBaja.length === 0 && (
                    <tr><td colSpan={8} className="empty">No hay bajas formales registradas</td></tr>
                  )}
                  {activosBaja.map((b: any) => (
                    <tr key={b.nro} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                      <td><strong>#{b.nro}</strong></td>
                      <td>
                        <div className="font-semibold text-slate-200">
                          {b.nroActivo ? b.nroActivo.descripcion : 'Activo Eliminado'}
                        </div>
                        <div className="text-xs text-blue-400 font-mono">
                          {b.nroActivo ? b.nroActivo.codActivo : '-'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-danger text-xs font-semibold px-2 py-0.5 rounded">
                          {getMotivoDescription(b.motivo)}
                        </span>
                      </td>
                      <td className="text-slate-300 text-sm">{getEmpleadoName(b.codEmpAut)}</td>
                      <td className="text-slate-300 text-sm">{b.documento || '-'}</td>
                      <td className="text-slate-300 text-sm font-mono">{b.fechaBajaTe}</td>
                      <td className="text-slate-300 text-sm font-mono">
                        {b.valorFinal !== null && b.valorFinal !== undefined ? `${parseFloat(b.valorFinal).toFixed(2)} Bs.` : '-'}
                      </td>
                      <td className="text-slate-400 text-xs italic max-w-[150px] truncate" title={b.observacion || ''}>
                        {b.observacion || '-'}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                {(puedeEditarMotivo || puedeEliminarMotivo) && <th className="text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-b border-slate-700/30">
                    <td><div className="h-4 bg-slate-700 rounded w-8"></div></td>
                    <td><div className="h-4 bg-slate-700 rounded w-60"></div></td>
                    {(puedeEditarMotivo || puedeEliminarMotivo) && (
                      <td className="text-right">
                        <div className="h-6 bg-slate-700 rounded-lg w-24 ml-auto"></div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <>
                  {data?.todosMotivos?.length === 0 && (
                    <tr>
                      <td colSpan={puedeEditarMotivo || puedeEliminarMotivo ? 3 : 2} className="empty">
                        No hay motivos de baja registrados
                      </td>
                    </tr>
                  )}
                  {data?.todosMotivos?.map((m: any) => (
                    <tr key={m.motivo} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                      <td><strong>#{m.motivo}</strong></td>
                      <td className="text-slate-200">{m.descripcion}</td>
                      {(puedeEditarMotivo || puedeEliminarMotivo) && (
                        <td className="text-right">
                          <div className="flex gap-2 justify-end">
                            {puedeEditarMotivo && (
                              <button
                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-medium transition"
                                onClick={() => {
                                  setEditingMotivo(m.motivo);
                                  setMotivoForm({ motivo: m.motivo.toString(), descripcion: m.descripcion });
                                  setShowMotivoModal(true);
                                }}
                              >
                                Editar
                              </button>
                            )}
                            {puedeEliminarMotivo && (
                              <button
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs font-medium transition"
                                onClick={() => handleEliminarMotivo(m.motivo)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '750px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Registrar Baja Formal de Activo</h2>
            
            <div className="space-y-4">
              {/* Activo Autocomplete */}
              <div className="form-group">
                <label>Activo a dar de Baja *</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    value={activoSearch}
                    onChange={e => {
                      setActivoSearch(e.target.value);
                      setForm(prev => ({ ...prev, nroActivo: '' }));
                      setShowActivosDropdown(true);
                    }}
                    onFocus={() => setShowActivosDropdown(true)}
                    onBlur={() => setTimeout(() => setShowActivosDropdown(false), 200)}
                    placeholder="Buscar activo por código o descripción..."
                  />
                  {showActivosDropdown && (
                    <ul className="autocomplete-dropdown">
                      {filteredActivos.map((a: any) => (
                        <li
                          key={a.nroActivo}
                          className="autocomplete-item"
                          onClick={() => handleSelectActivo(a)}
                        >
                          [{a.codActivo}] {a.descripcion}
                        </li>
                      ))}
                      {filteredActivos.length === 0 && (
                        <li className="autocomplete-no-results">No se encontraron activos</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Motivo & Autorizador */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Motivo de Baja *</label>
                  <select
                    value={form.motivo}
                    onChange={e => setForm({ ...form, motivo: e.target.value })}
                  >
                    <option value="">Seleccionar motivo...</option>
                    {data?.todosMotivos?.map((m: any) => (
                      <option key={m.motivo} value={m.motivo.toString()}>
                        {m.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Autorizador (Empleado) *</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={empAutSearch}
                      onChange={e => {
                        setEmpAutSearch(e.target.value);
                        setForm(prev => ({ ...prev, codEmpAut: '' }));
                        setShowEmpAutDropdown(true);
                      }}
                      onFocus={() => setShowEmpAutDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEmpAutDropdown(false), 200)}
                      placeholder="Buscar empleado autorizador..."
                    />
                    {showEmpAutDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredEmpAut.map((e: any) => (
                          <li
                            key={e.idEmpleado}
                            className="autocomplete-item"
                            onClick={() => handleSelectEmpAut(e)}
                          >
                            {e.nombre} {e.apellido} ({e.cargo || 'Sin cargo'})
                          </li>
                        ))}
                        {filteredEmpAut.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron empleados</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Documento & Valor Final */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Documento de Respaldo</label>
                  <input
                    type="text"
                    value={form.documento}
                    onChange={e => setForm({ ...form, documento: e.target.value })}
                    placeholder="Ej: Resolución de Directorio Nº 12/2026"
                  />
                </div>

                <div className="form-group">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="mb-0">Valor Final (Bs.)</label>
                    <span 
                      className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                      title="Opcional. Si se deja vacío, el sistema calculará automáticamente el valor actual depreciado del bien."
                    >
                      ?
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorFinal}
                    onChange={e => setForm({ ...form, valorFinal: e.target.value })}
                    placeholder="Opcional (se calculará valor actual si se deja vacío)"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Fecha de Baja Técnica *</label>
                  <input
                    type="date"
                    value={form.fechaBajaTe}
                    onChange={e => setForm({ ...form, fechaBajaTe: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Baja Efectiva</label>
                  <input
                    type="date"
                    value={form.fechaBajaEf}
                    onChange={e => setForm({ ...form, fechaBajaEf: e.target.value })}
                  />
                </div>
              </div>

              {/* Responsable (Opcional) */}
              <div className="form-group">
                <label>Empleado Responsable (Opcional)</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    value={empRespSearch}
                    onChange={e => {
                      setEmpRespSearch(e.target.value);
                      setForm(prev => ({ ...prev, codEmpResp: '' }));
                      setShowEmpRespDropdown(true);
                    }}
                    onFocus={() => setShowEmpRespDropdown(true)}
                    onBlur={() => setTimeout(() => setShowEmpRespDropdown(false), 200)}
                    placeholder="Buscar empleado responsable..."
                  />
                  {showEmpRespDropdown && (
                    <ul className="autocomplete-dropdown">
                      {filteredEmpResp.map((e: any) => (
                        <li
                          key={e.idEmpleado}
                          className="autocomplete-item"
                          onClick={() => handleSelectEmpResp(e)}
                        >
                          {e.nombre} {e.apellido} ({e.cargo || 'Sin cargo'})
                        </li>
                      ))}
                      {filteredEmpResp.length === 0 && (
                        <li className="autocomplete-no-results">No se encontraron empleados</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Observación */}
              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={form.observacion}
                  onChange={e => setForm({ ...form, observacion: e.target.value })}
                  placeholder="Detalles o motivos adicionales de la baja..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="modal-actions mt-6">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleSubmit}>Registrar Baja Formal</button>
            </div>
          </div>
        </div>
      )}

      {showMotivoModal && (
        <div className="modal-overlay" onClick={() => setShowMotivoModal(false)}>
          <div className="modal" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingMotivo !== null ? 'Editar Motivo de Baja' : 'Nuevo Motivo de Baja'}
            </h2>
            
            <div className="space-y-4">
              <div className="form-group">
                <label>Código Numérico *</label>
                <input
                  type="number"
                  value={motivoForm.motivo}
                  onChange={e => setMotivoForm({ ...motivoForm, motivo: e.target.value })}
                  placeholder="Ej: 5"
                  disabled={editingMotivo !== null}
                />
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <input
                  type="text"
                  value={motivoForm.descripcion}
                  onChange={e => setMotivoForm({ ...motivoForm, descripcion: e.target.value })}
                  placeholder="Ej: Obsolescencia Tecnológica"
                />
              </div>
            </div>

            <div className="modal-actions mt-6">
              <button className="btn btn-secondary" onClick={() => setShowMotivoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleMotivoSubmit}>
                {editingMotivo !== null ? 'Guardar Cambios' : 'Registrar Motivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}