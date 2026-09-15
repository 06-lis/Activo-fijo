import PageLayout from '../components/ui/PageLayout';
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { GET_ASIGNACIONES_PAGINADAS } from '../graphql/queries';
import { QRCodeImage, Code39Barcode } from '../utils/barcodes';

const GET_CATS = gql`
  query GetCats {
    todosActivos {
      nroActivo
      codActivo
      descripcion
    }
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
    todosTiposAsig {
      tipoAsig
      des
    }
  }
`;

const CREAR_ASIG = gql`
  mutation CrearAsignacion($tipoAsig: Int!, $tipoResp: Int!, $codResp: Int!, $codOfic: Int!, $fechaAsig: Date!) {
    crearAsignacion(tipoAsig: $tipoAsig, tipoResp: $tipoResp, codResp: $codResp, codOfic: $codOfic, fechaAsig: $fechaAsig) {
      asignado {
        codAsig
        fechaAsig
      }
    }
  }
`;

const ASIGNAR_ACTIVO = gql`
  mutation AsignarActivo($codAsig: Int!, $nroActivo: Int!, $cantidad: Int) {
    asignarActivo(codAsig: $codAsig, nroActivo: $nroActivo, cantidad: $cantidad) {
      detAsig {
        codAsig { codAsig }
        nroActivo { codActivo }
      }
    }
  }
`;

const ANULAR_ASIGNACION = gql`
  mutation AnularAsignacion($codAsig: Int!, $fechaFin: Date) {
    anularAsignacion(codAsig: $codAsig, fechaFin: $fechaFin) {
      asignado {
        codAsig
        estado
      }
    }
  }
`;

const CREAR_TIPO_ASIG = gql`
  mutation CrearTipoAsig($tipoAsig: Int!, $des: String!, $abrev: String!) {
    crearTipoAsig(tipoAsig: $tipoAsig, des: $des, abrev: $abrev) {
      tipoAsigObj {
        tipoAsig
        des
        abrev
      }
    }
  }
`;

// Helper functions for office codes
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

const ITEMS_POR_PAGINA = 8;

export default function Asignaciones() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_asignacion');
  const puedeAnular = user?.esAdmin || user?.permisos.includes('eliminar_asignacion');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    tipoAsig: '',
    codOfic: '',
    codResp: '',
    fechaAsig: new Date().toISOString().split('T')[0]
  });

  // Autocomplete states inside Modal
  const [oficinaSearch, setOficinaSearch] = useState('');
  const [showOficinasDropdown, setShowOficinasDropdown] = useState(false);

  const [respSearch, setRespSearch] = useState('');
  const [showRespDropdown, setShowRespDropdown] = useState(false);

  const [activoSearch, setActivoSearch] = useState('');
  const [showActivosDropdown, setShowActivosDropdown] = useState(false);

  // Filter state for Office on the Main Table
  const [oficinaFilterSearch, setOficinaFilterSearch] = useState('');
  const [showOficinaFilterDropdown, setShowOficinaFilterDropdown] = useState(false);
  const [oficinaFilterObj, setOficinaFilterObj] = useState<any>(null);

  // Selected assets state for massive assignment
  const [activosSeleccionados, setActivosSeleccionados] = useState<any[]>([]);

  // Batch progress state
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  const [paginaActual, setPaginaActual] = useState(1);

  // Tipos de Asignación States
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [formTipoAsig, setFormTipoAsig] = useState({ tipoAsig: '', des: '', abrev: '' });

  // Bulk Print states
  const [printAssetsList, setPrintAssetsList] = useState<any[] | null>(null);
  const [printLocationName, setPrintLocationName] = useState<string>('');

  const { data, loading, error, refetch } = useQuery(GET_ASIGNACIONES_PAGINADAS, {
    variables: {
      limit: ITEMS_POR_PAGINA,
      offset: (paginaActual - 1) * ITEMS_POR_PAGINA,
      search: oficinaFilterObj ? String(oficinaFilterObj.codOfic) : ""
    }
  });
  const { data: cats, refetch: refetchCats } = useQuery(GET_CATS);
  const [crearAsig] = useMutation(CREAR_ASIG);
  const [asignarActivo] = useMutation(ASIGNAR_ACTIVO);
  const [anularAsignacion] = useMutation(ANULAR_ASIGNACION);
  const [crearTipoAsig] = useMutation(CREAR_TIPO_ASIG);

  // ==================== FILTERING & PAGINATION ====================
  const totalCount = data?.todasAsignacionesPaginadas?.totalCount || 0;
  const totalPaginas = Math.ceil(totalCount / ITEMS_POR_PAGINA);
  const paginaActualSegura = Math.min(paginaActual, totalPaginas || 1);
  const asignacionesPaginadas = useMemo(() => data?.todasAsignacionesPaginadas?.results || [], [data]);

  const groupedAsignaciones = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    asignacionesPaginadas.forEach((a: any) => {
      const officeId = a.codOfic?.codOfic ? String(a.codOfic.codOfic) : 'sin-oficina';
      if (!groups[officeId]) {
        groups[officeId] = [];
      }
      groups[officeId].push(a);
    });
    return groups;
  }, [asignacionesPaginadas]);

  // ==================== AUTOCOMPLETE HANDLERS ====================
  // 1. Office Filter Autocomplete
  const handleSelectOficinaFilter = (o: any) => {
    const unified = getOfficeUnifiedCode(o);
    setOficinaFilterObj(o);
    setOficinaFilterSearch(`[${unified}] ${o.desDpto}`);
    setShowOficinaFilterDropdown(false);
    setPaginaActual(1);
  };

  const clearOficinaFilter = () => {
    setOficinaFilterObj(null);
    setOficinaFilterSearch('');
    setShowOficinaFilterDropdown(false);
    setPaginaActual(1);
  };

  const filteredOficinasFilter = cats?.todasOficinas?.filter((o: any) => {
    const fullCode = getOfficeFullCode(o).toLowerCase();
    const unifiedCode = getOfficeUnifiedCode(o).toLowerCase();
    const text = o.desDpto.toLowerCase();
    const query = oficinaFilterSearch.toLowerCase();
    return text.includes(query) || fullCode.includes(query) || unifiedCode.includes(query);
  }) || [];

  // 2. Modal Office Autocomplete
  const handleSelectOficinaModal = (o: any) => {
    const unified = getOfficeUnifiedCode(o);
    setForm(prev => ({ ...prev, codOfic: o.codOfic.toString() }));
    setOficinaSearch(`[${unified}] ${o.desDpto}`);
    setShowOficinasDropdown(false);
  };

  const filteredOficinasModal = cats?.todasOficinas?.filter((o: any) => {
    const fullCode = getOfficeFullCode(o).toLowerCase();
    const unifiedCode = getOfficeUnifiedCode(o).toLowerCase();
    const text = o.desDpto.toLowerCase();
    const query = oficinaSearch.toLowerCase();
    return text.includes(query) || fullCode.includes(query) || unifiedCode.includes(query);
  }) || [];

  // 3. Modal Responsible Autocomplete
  const handleSelectRespModal = (r: any) => {
    setForm(prev => ({ ...prev, codResp: r.codResp.toString() }));
    setRespSearch(`[${r.codEstprog}] ${r.codEmp.nombre} ${r.codEmp.apellido}`);
    setShowRespDropdown(false);
  };

  const filteredResponsiblesModal = cats?.todosResponsables?.filter((r: any) => {
    const code = r.codEstprog.toLowerCase();
    const name = `${r.codEmp.nombre} ${r.codEmp.apellido}`.toLowerCase();
    const query = respSearch.toLowerCase();
    return code.includes(query) || name.includes(query);
  }) || [];

  // 4. Modal Asset Selection Autocomplete
  const handleSelectActivoModal = (a: any) => {
    if (!activosSeleccionados.some(item => String(item.nroActivo) === String(a.nroActivo))) {
      setActivosSeleccionados(prev => [...prev, a]);
    }
    setActivoSearch('');
    setShowActivosDropdown(false);
  };

  const filteredActivosModal = cats?.todosActivos?.filter((a: any) => {
    const code = a.codActivo.toLowerCase();
    const desc = a.descripcion.toLowerCase();
    const query = activoSearch.toLowerCase();
    return code.includes(query) || desc.includes(query);
  }) || [];

  // ==================== REAL-TIME ASSET VALIDATION ====================
  // Check if an asset is assigned to another office in an active assignment
  const getAssetAssignmentStatus = useCallback((asset: any) => {
    const currentAsig = data?.todasAsignaciones?.find((a: any) => 
      a.estado === 'A' && 
      a.inDetAsigSet?.some((d: any) => String(d.nroActivo?.nroActivo) === String(asset.nroActivo))
    );

    if (currentAsig) {
      const officeName = currentAsig.codOfic?.desDpto || 'Ubicación Desconocida';
      const officeCode = getOfficeUnifiedCode(currentAsig.codOfic);
      
      if (String(currentAsig.codOfic?.codOfic) === String(form.codOfic)) {
        return {
          status: 'warning',
          message: `Ya asignado a esta oficina`,
          isCritical: false
        };
      } else {
        return {
          status: 'danger',
          message: `Asignado en: ${officeName} [${officeCode}]`,
          isCritical: true
        };
      }
    }

    return {
      status: 'success',
      message: 'Disponible',
      isCritical: false
    };
  }, [data, form.codOfic]);

  const hasErrors = useMemo(() => {
    return activosSeleccionados.some(asset => getAssetAssignmentStatus(asset).isCritical);
  }, [activosSeleccionados, getAssetAssignmentStatus]);

  // ==================== ACTIONS HANDLERS ====================
  const handleCrearTipoAsig = async () => {
    if (!formTipoAsig.tipoAsig || !formTipoAsig.des || !formTipoAsig.abrev) {
      alert('Por favor complete todos los campos.');
      return;
    }
    try {
      await crearTipoAsig({
        variables: {
          tipoAsig: parseInt(formTipoAsig.tipoAsig),
          des: formTipoAsig.des,
          abrev: formTipoAsig.abrev
        }
      });
      alert('Tipo de asignación creado con éxito.');
      setFormTipoAsig({ tipoAsig: '', des: '', abrev: '' });
      refetchCats();
    } catch (e: any) {
      alert('Error al crear tipo de asignación: ' + e.message);
    }
  };

  const handleCrearAsignaciones = async () => {
    if (!form.codOfic || !form.codResp || !form.tipoAsig || !form.fechaAsig) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }
    if (activosSeleccionados.length === 0) {
      alert('Por favor agregue al menos un activo a la lista.');
      return;
    }
    if (hasErrors) {
      alert('Hay activos asignados a otras oficinas. Por favor remuévalos antes de guardar.');
      return;
    }

    setGuardando(true);
    setProgreso({ actual: 0, total: activosSeleccionados.length });

    try {
      // 1. Crear el encabezado de asignación
      const res = await crearAsig({
        variables: {
          tipoAsig: parseInt(form.tipoAsig),
          tipoResp: 1, // Tipo de empleado/responsable original
          codResp: parseInt(form.codResp),
          codOfic: parseInt(form.codOfic),
          fechaAsig: form.fechaAsig
        }
      });

      const newCodAsig = res.data?.crearAsignacion?.asignado?.codAsig;
      if (!newCodAsig) throw new Error('No se pudo crear la asignación.');

      // 2. Asociar los activos en lote de manera secuencial
      for (let i = 0; i < activosSeleccionados.length; i++) {
        await asignarActivo({
          variables: {
            codAsig: parseInt(String(newCodAsig)),
            nroActivo: parseInt(activosSeleccionados[i].nroActivo),
            cantidad: 1
          }
        });
        setProgreso({ actual: i + 1, total: activosSeleccionados.length });
      }

      setGuardando(false);
      setShowModal(false);
      setActivosSeleccionados([]);
      setForm({
        tipoAsig: '',
        codOfic: '',
        codResp: '',
        fechaAsig: new Date().toISOString().split('T')[0]
      });
      setOficinaSearch('');
      setRespSearch('');
      refetch();
      alert('Asignación masiva creada correctamente.');
    } catch (e: any) {
      setGuardando(false);
      alert('Error: ' + e.message);
    }
  };

  const handleAnular = async (codAsig: number) => {
    if (!window.confirm(`¿Está seguro de anular la asignación #${codAsig}? Los activos quedarán liberados.`)) {
      return;
    }

    try {
      await anularAsignacion({
        variables: {
          codAsig: parseInt(String(codAsig)),
          fechaFin: new Date().toISOString().split('T')[0]
        }
      });
      alert('Asignación anulada.');
      refetch();
    } catch (e: any) {
      alert('Error al anular: ' + e.message);
    }
  };

  const handlePrintOficina = (location: string, list: any[]) => {
    const assetsToPrint: any[] = [];
    list.forEach(asig => {
      if (asig.estado === 'A' && asig.inDetAsigSet) {
        asig.inDetAsigSet.forEach((det: any) => {
          assetsToPrint.push(det.nroActivo);
        });
      }
    });
    if (assetsToPrint.length === 0) {
      alert("No hay activos asignados vigentes en esta oficina.");
      return;
    }
    setPrintLocationName(location);
    setPrintAssetsList(assetsToPrint);
  };

  const abrirNuevo = () => {
    setActivosSeleccionados([]);
    setForm({
      tipoAsig: cats?.todosTiposAsig?.[0]?.tipoAsig?.toString() || '',
      codOfic: '',
      codResp: '',
      fechaAsig: new Date().toISOString().split('T')[0]
    });
    setOficinaSearch('');
    setRespSearch('');
    setActivoSearch('');
    setShowModal(true);
  };

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Asignación de Activos"
      actions={[
        ...(puedeCrear ? [
          { label: 'Asignación Masiva', icon: '+', variant: 'primary' as const, onClick: abrirNuevo },
          { label: 'Tipos de Asignación', icon: '▤', onClick: () => { setFormTipoAsig({ tipoAsig: '', des: '', abrev: '' }); setShowTiposModal(true); } }
        ] : []),
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1 autocomplete-container">
            <input
              type="text"
              placeholder="Filtrar por oficina..."
              value={oficinaFilterSearch}
              onChange={e => {
                setOficinaFilterSearch(e.target.value);
                if (!e.target.value) setOficinaFilterObj(null);
                setShowOficinaFilterDropdown(true);
              }}
              onFocus={() => setShowOficinaFilterDropdown(true)}
              onBlur={() => setTimeout(() => setShowOficinaFilterDropdown(false), 200)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
            />
            {showOficinaFilterDropdown && (
              <ul className="autocomplete-dropdown" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
                {filteredOficinasFilter.slice(0, 15).map((o: any) => {
                  const unified = getOfficeUnifiedCode(o);
                  return (
                    <li
                      key={o.codOfic}
                      className="autocomplete-item hover:bg-slate-50 text-slate-700 border-slate-100"
                      onClick={() => handleSelectOficinaFilter(o)}
                    >
                      [{unified}] {o.desDpto}
                    </li>
                  );
                })}
                {filteredOficinasFilter.length === 0 && (
                  <li className="autocomplete-no-results text-slate-500">No se encontraron oficinas</li>
                )}
              </ul>
            )}
          </div>
          {oficinaFilterObj && (
            <button className="btn btn-secondary px-3 py-2 text-xs" onClick={clearOficinaFilter}>
              Limpiar Filtro
            </button>
          )}
        </div>
      </div>

      {/* Listado agrupado por Oficina */}
      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 2 }).map((_, gIdx) => (
            <div key={gIdx} className="bg-slate-800 rounded-xl border border-slate-700/60 overflow-hidden shadow-2xl animate-pulse">
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950/20 border-b border-slate-700/80 border-l-8 border-blue-500 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 bg-slate-700 rounded-full"></div>
                  <div className="h-5 bg-slate-700 rounded w-64"></div>
                </div>
                <div className="h-6 bg-slate-700 rounded w-24"></div>
              </div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700/70 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700/50 rounded w-4/5"></div>
              </div>
            </div>
          ))
        ) : asignacionesPaginadas.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center text-slate-500 shadow-xl">
            No hay asignaciones registradas
          </div>
        ) : (
          Object.entries(groupedAsignaciones).map(([oficinaId, list]) => {
            const firstAsig = list[0];
            const office = firstAsig.codOfic;
            
            // Build parent path recursively
            const path: string[] = [];
            let current = office;
            while (current) {
              if (current.desDpto) {
                path.unshift(current.desDpto);
              }
              current = current.codPadre;
            }
            const unified = getOfficeUnifiedCode(office);

            return (
              <div key={oficinaId} className="bg-slate-800 rounded-xl border border-slate-700/60 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-blue-950/20 hover:border-slate-600/80">
                {/* Barra de Oficina Super Premium */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950/20 border-b border-slate-700/80 border-l-8 border-blue-500 px-6 py-4.5 text-white font-bold text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <span className="text-xs tracking-widest uppercase bg-blue-600/90 text-blue-50 px-2.5 py-1 rounded border border-blue-400/30 font-extrabold font-mono w-max">
                        Ubicación / Oficina
                      </span>
                      <span className="text-white text-lg md:text-xl font-extrabold tracking-wide drop-shadow-md">
                        {office ? `[${unified || office.codOfic}] ${path.join(' > ')}` : 'Sin Oficina'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => handlePrintOficina(`[${unified || office.codOfic}] ${path.join(' > ')}`, list)}
                      className="bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600/50 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="font-mono text-lg" style={{ marginRight: '4px' }}>⎙</span>
                      Etiquetas
                    </button>
                    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/50 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 shadow-inner">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{list.length} {list.length === 1 ? 'asignación' : 'asignaciones'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-700/50 border-b border-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider w-24">Nro</th>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider">Responsable</th>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider w-36">Tipo</th>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider w-36">Fecha Asig</th>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider">Activos Asignados</th>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider w-28">Estado</th>
                        <th className="px-4 py-3 text-slate-300 text-xs font-semibold uppercase tracking-wider w-28 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((a: any) => {
                        const resp = cats?.todosResponsables?.find((r: any) => String(r.codResp) === String(a.codResp));
                        return (
                          <tr key={a.codAsig} className="border-b border-slate-700 hover:bg-slate-700/30 transition">
                            <td className="px-4 py-3 font-mono text-blue-400 text-sm">#{a.codAsig}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">
                              {resp ? `[${resp.codEstprog}] ${resp.codEmp.nombre} ${resp.codEmp.apellido}` : `ID: ${a.codResp}`}
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{a.tipoAsig?.des || '-'}</td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{a.fechaAsig || '-'}</td>
                            <td className="px-4 py-3 text-slate-300 text-xs">
                              <div className="flex flex-col gap-1 max-w-md">
                                {a.inDetAsigSet?.map((d: any) => (
                                  <div key={d.nroActivo.nroActivo} className="bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600/30 font-mono">
                                    <span className="text-blue-300">[{d.nroActivo.codActivo}]</span> <span className="inline-block max-w-[200px] truncate align-bottom" title={d.nroActivo.descripcion}>{d.nroActivo.descripcion}</span>
                                  </div>
                                ))}
                                {(!a.inDetAsigSet || a.inDetAsigSet.length === 0) && '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                a.estado === 'A' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-600/20'
                              }`}>
                                {a.estado === 'A' ? 'Activo' : 'Anulado'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {puedeAnular && a.estado === 'A' && (
                                <button
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg text-xs font-medium transition"
                                  onClick={() => handleAnular(a.codAsig)}
                                >
                                  Anular
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 bg-slate-800/80 border border-slate-700/60 rounded-2xl px-5 py-4">
          <span className="text-slate-400 text-sm">
            Página {paginaActualSegura} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActualSegura === 1}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActualSegura === totalPaginas}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal - Asignación Masiva */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !guardando && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nueva Asignación Masiva</h2>

            {guardando ? (
              <div className="p-8 text-center">
                <p className="text-blue-400 text-sm mb-3">Registrando asignación masiva...</p>
                <p className="text-white text-lg font-semibold mb-2">Asociando activo {progreso.actual} de {progreso.total}</p>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Form grid */}
                <div className="form-grid">
                  <div className="form-group">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <label className="mb-0">Tipo Asignación *</label>
                      <span 
                        className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                        title="Tipo formal de la asignación del bien (ej. Individual, Colectiva, Temporal)."
                      >
                        ?
                      </span>
                    </div>
                    <select
                      value={form.tipoAsig}
                      onChange={e => setForm({ ...form, tipoAsig: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {cats?.todosTiposAsig?.map((t: any) => (
                        <option key={t.tipoAsig} value={t.tipoAsig}>{t.des}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha Asignación *</label>
                    <input
                      type="date"
                      value={form.fechaAsig}
                      onChange={e => setForm({ ...form, fechaAsig: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Oficina Destino *</label>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={oficinaSearch}
                        onChange={e => {
                          setOficinaSearch(e.target.value);
                          setForm(prev => ({ ...prev, codOfic: '' }));
                          setShowOficinasDropdown(true);
                        }}
                        onFocus={() => setShowOficinasDropdown(true)}
                        onBlur={() => setTimeout(() => setShowOficinasDropdown(false), 200)}
                        placeholder="Buscar oficina por código o nombre..."
                      />
                      {showOficinasDropdown && (
                        <ul className="autocomplete-dropdown">
                          {filteredOficinasModal.slice(0, 15).map((o: any) => {
                            const unified = getOfficeUnifiedCode(o);
                            return (
                              <li
                                key={o.codOfic}
                                className="autocomplete-item"
                                onClick={() => handleSelectOficinaModal(o)}
                              >
                                [{unified}] {o.desDpto}
                              </li>
                            );
                          })}
                          {filteredOficinasModal.length === 0 && (
                            <li className="autocomplete-no-results">No se encontraron oficinas</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Responsable *</label>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={respSearch}
                        onChange={e => {
                          setRespSearch(e.target.value);
                          setForm(prev => ({ ...prev, codResp: '' }));
                          setShowRespDropdown(true);
                        }}
                        onFocus={() => setShowRespDropdown(true)}
                        onBlur={() => setTimeout(() => setShowRespDropdown(false), 200)}
                        placeholder="Buscar responsable por código o nombre..."
                      />
                      {showRespDropdown && (
                        <ul className="autocomplete-dropdown">
                          {filteredResponsiblesModal.slice(0, 15).map((r: any) => (
                            <li
                              key={r.codResp}
                              className="autocomplete-item"
                              onClick={() => handleSelectRespModal(r)}
                            >
                              [{r.codEstprog}] {r.codEmp.nombre} {r.codEmp.apellido}
                            </li>
                          ))}
                          {filteredResponsiblesModal.length === 0 && (
                            <li className="autocomplete-no-results">No se encontraron responsables</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-700/50" />

                {/* Asset Selection */}
                <div className="form-group">
                  <label>Buscar Activos para Asignar</label>
                  <div className="autocomplete-container">
                    <input
                      type="text"
                      value={activoSearch}
                      onChange={e => {
                        setActivoSearch(e.target.value);
                        setShowActivosDropdown(true);
                      }}
                      onFocus={() => setShowActivosDropdown(true)}
                      onBlur={() => setTimeout(() => setShowActivosDropdown(false), 200)}
                      placeholder="Escribe el código del activo o descripción para buscar..."
                    />
                    {showActivosDropdown && (
                      <ul className="autocomplete-dropdown">
                        {filteredActivosModal.slice(0, 15).map((a: any) => (
                          <li
                            key={a.nroActivo}
                            className="autocomplete-item"
                            onClick={() => handleSelectActivoModal(a)}
                          >
                            [{a.codActivo}] {a.descripcion}
                          </li>
                        ))}
                        {filteredActivosModal.length === 0 && (
                          <li className="autocomplete-no-results">No se encontraron activos</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Selected assets list */}
                <div>
                  <h3 className="text-slate-300 text-sm font-semibold mb-2">Activos Seleccionados ({activosSeleccionados.length})</h3>
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 border-b border-slate-700 text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Código</th>
                          <th className="px-3 py-2">Descripción</th>
                          <th className="px-3 py-2">Estado de Ubicación</th>
                          <th className="px-3 py-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activosSeleccionados.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-slate-500 italic">
                              Ningún activo seleccionado. Use el buscador superior para agregar activos.
                            </td>
                          </tr>
                        )}
                        {activosSeleccionados.map(asset => {
                          const validation = getAssetAssignmentStatus(asset);
                          return (
                            <tr key={asset.nroActivo} className="border-b border-slate-800 hover:bg-slate-800/40">
                              <td className="px-3 py-2 font-mono text-blue-400">{asset.codActivo}</td>
                              <td className="px-3 py-2 text-slate-300">{asset.descripcion}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  validation.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                  validation.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-red-500/10 text-red-400'
                                }`}>
                                  {validation.message}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  className="text-red-400 hover:text-red-300 font-semibold px-2 py-1"
                                  onClick={() => setActivosSeleccionados(prev => prev.filter(item => item.nroActivo !== asset.nroActivo))}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {hasErrors && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                    <span className="text-xl text-amber-500 font-bold">⚠</span>
                    <span className="text-amber-700 text-sm">Hay activos con error de ubicación (ya están asignados a otra oficina).</span>
                    Por favor, remuévalos antes de poder guardar la asignación.
                  </div>
                )}

                {/* Modal footer */}
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={hasErrors || activosSeleccionados.length === 0}
                    onClick={handleCrearAsignaciones}
                  >
                    Registrar Asignaciones
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Tipos de Asignación */}
      {showTiposModal && (
        <div className="modal-overlay" onClick={() => setShowTiposModal(false)}>
          <div className="modal" style={{ maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Administrar Tipos de Asignación</h2>
            
            {/* Formulario Rápido */}
            <div className="bg-slate-900/40 p-4 border border-slate-700/50 rounded-xl mb-4 space-y-3">
              <h3 className="text-slate-200 text-xs font-semibold uppercase tracking-wider">Nuevo Tipo de Asignación</h3>
              <div className="form-grid text-xs">
                <div className="form-group" style={{ marginBottom: '0px' }}>
                  <label>Código (Número) *</label>
                  <input
                    type="number"
                    value={formTipoAsig.tipoAsig}
                    onChange={e => setFormTipoAsig({ ...formTipoAsig, tipoAsig: e.target.value })}
                    placeholder="Ej: 3"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0px' }}>
                  <label>Abreviación *</label>
                  <input
                    type="text"
                    value={formTipoAsig.abrev}
                    onChange={e => setFormTipoAsig({ ...formTipoAsig, abrev: e.target.value })}
                    placeholder="Ej: COMP"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>
              </div>
              <div className="form-group text-xs" style={{ marginBottom: '0px' }}>
                <label>Descripción *</label>
                <input
                  type="text"
                  value={formTipoAsig.des}
                  onChange={e => setFormTipoAsig({ ...formTipoAsig, des: e.target.value })}
                  placeholder="Ej: Uso Compartido"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
              <div className="text-right" style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-primary text-xs py-1 px-3" onClick={handleCrearTipoAsig}>
                  + Registrar Tipo
                </button>
              </div>
            </div>

            {/* Listado */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2">Abrev.</th>
                  </tr>
                </thead>
                <tbody>
                  {cats?.todosTiposAsig?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500 italic">
                        No hay tipos de asignación registrados
                      </td>
                    </tr>
                  )}
                  {cats?.todosTiposAsig?.map((t: any) => (
                    <tr key={t.tipoAsig} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-mono text-blue-400">#{t.tipoAsig}</td>
                      <td className="px-3 py-2 text-slate-200">{t.des}</td>
                      <td className="px-3 py-2 text-slate-200">{t.abrev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions mt-4" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary text-xs" onClick={() => setShowTiposModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print Modal */}
      {printAssetsList && (
        <BulkLabelModal
          activos={printAssetsList}
          location={printLocationName}
          onClose={() => setPrintAssetsList(null)}
        />
      )}
    </PageLayout>
  );
}

// ==================== BULK LABEL PRINTING MODAL ====================
function BulkLabelModal({ activos, location, onClose }: { activos: any[]; location: string; onClose: () => void }) {
  const [printMode, setPrintMode] = useState<'qr' | 'barcode'>('qr');

  const getActivoUsefulLife = (act: any): string => {
    const activeReval = act.inDetRevalSet?.find((det: any) => det.estado === 'A');
    if (activeReval) return `${activeReval.vidaUtilAno}a ${activeReval.vidaUtilMes}m`;
    const defaultYears = act.codGrupo?.vidaUtilDefault;
    if (defaultYears !== undefined && defaultYears !== null) return `${defaultYears} años`;
    return 'No definida';
  };

  const getActivoValues = (act: any) => {
    const montoCompra = typeof act.monto === 'number' ? act.monto : (parseFloat(act.monto) || 0);
    const depSet = act.inDepAcumuladaSet || [];
    let depAcum = 0; let valActual = montoCompra;
    if (depSet.length > 0) {
      const sorted = [...depSet].sort((a: any, b: any) => b.nroSerie - a.nroSerie);
      const latest = sorted[0];
      if (latest.acumulada !== undefined && latest.acumulada !== null) depAcum = typeof latest.acumulada === 'number' ? latest.acumulada : (parseFloat(latest.acumulada) || 0);
      if (latest.valorActual !== undefined && latest.valorActual !== null) valActual = typeof latest.valorActual === 'number' ? latest.valorActual : (parseFloat(latest.valorActual) || 0);
    }
    return { montoCompra, depAcum, valActual };
  };

  return (
    <div
      className="modal-overlay"
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bulk-print-container, #bulk-print-container * { visibility: visible !important; }
          #bulk-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .print-label {
            width: 60mm !important;
            height: 30mm !important;
            padding: 3mm !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: always !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            background: white !important;
          }
          .no-print-btn { display: none !important; }
        }
      `}</style>
      
      <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 max-w-4xl w-[95%] h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between no-print-btn">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl text-slate-800 font-bold">⎙</span>
          <h2 className="text-xl font-bold text-slate-800">Imprimir {activos.length} Etiquetas</h2>
        </div>
          <div className="flex gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPrintMode('qr')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${printMode === 'qr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                QR
              </button>
              <button
                onClick={() => setPrintMode('barcode')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${printMode === 'barcode' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                Barras
              </button>
            </div>
            <button className="btn btn-primary px-6" onClick={() => window.print()}>Imprimir ({activos.length})</button>
            <button className="btn btn-secondary px-6" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <div id="bulk-print-container" className="flex-1 overflow-y-auto bg-slate-100 p-4 rounded-lg flex flex-wrap gap-4 justify-center items-start content-start">
          {activos.map((activo: any, idx: number) => {
            const values = getActivoValues(activo);
            const usefulLife = getActivoUsefulLife(activo);
            const qrString = [
              "U.A.G.R.M. - VSIAF 2.0", "----------------------",
              `CÓDIGO: ${activo.codActivo}`,
              `DETALLE: ${activo.descripcion}`,
              `GRUPO: ${activo.codGrupo?.desGrupo || 'Sin Grupo'}`,
              `UBICACIÓN: ${location}`,
              `VIDA ÚTIL: ${usefulLife}`,
              `COMPRA: ${values.montoCompra.toFixed(2)} Bs.`,
              `DEP. ACUM.: ${values.depAcum.toFixed(2)} Bs.`,
              `VALOR ACTUAL: ${values.valActual.toFixed(2)} Bs.`
            ].join('\n');

            return (
              <div
                key={idx}
                className="print-label"
                style={{
                  width: '240px',
                  height: '120px',
                  border: '2px solid #0f172a',
                  borderRadius: '6px',
                  padding: '8px',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontFamily: 'system-ui, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '3px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.3px' }}>U.A.G.R.M.</span>
                    <span style={{ fontSize: '6.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Activos Fijos</span>
                  </div>
                  <span style={{ fontSize: '7.5px', fontWeight: 800, border: '1px solid #0f172a', padding: '1px 3px', borderRadius: '3px', color: '#0f172a' }}>VSIAF 2.0</span>
                </div>

                {/* Main area: Left metadata, Right QR */}
                <div style={{ display: 'flex', flex: 1, gap: '6px', marginTop: '5px', overflow: 'hidden' }}>
                  {/* Left metadata */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '5.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.2px' }}>Código de Activo</span>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{activo.codActivo}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '5.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.2px' }}>Descripción</span>
                      <span style={{ fontSize: '8px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1e293b' }} title={activo.descripcion}>
                        {activo.descripcion}
                      </span>
                    </div>
                  </div>

                  {/* Right QR */}
                  {printMode === 'qr' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QRCodeImage value={qrString} size={60} />
                    </div>
                  )}
                </div>

                {/* Bottom Barcode */}
                {printMode === 'barcode' && (
                  <div style={{ borderTop: '1px dashed #0f172a', paddingTop: '3px', marginTop: '3px', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <Code39Barcode value={activo.codActivo} height={35} showText={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}