import PageLayout from '../components/ui/PageLayout';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_REVALUOS, GET_CATALOGOS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import {
  CREAR_REVALUO,
  EDITAR_REVALUO,
  ANULAR_REVALUO,
  AGREGAR_DET_REVAL,
  ANULAR_DET_REVAL,
} from '../graphql/mutations';

const TIPO_LABEL: Record<number, string> = {
  1: 'Revalúo Técnico',
  2: 'Revalúo Contable',
  3: 'Actualización'
};

const ESTADO_LABEL: Record<string, string> = {
  'A': 'Activo',
  'C': 'Cerrado',
  'B': 'Anulado'
};

const ESTADO_CLASS: Record<string, string> = {
  'A': 'badge-success',
  'C': 'badge-info',
  'B': 'badge-secondary'
};

// ==================== COMPONENT ====================
export default function Revaluos() {
  const { user } = useAuth();
  const puedeVer = user?.esAdmin || user?.permisos.includes('ver_reevaluos');
  const puedeAutorizar = user?.esAdmin || user?.permisos.includes('autorizar_reevaluo');

  // Page states
  const [showModal, setShowModal] = useState(false);
  const [showDetModal, setShowDetModal] = useState(false);
  const [revaluoSeleccionado, setRevaluoSeleccionado] = useState<any>(null);
  
  // Filtering & expanding states
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('ALL');
  const [expandedRevals, setExpandedRevals] = useState<{ [key: number]: boolean }>({});

  // Forms states
  const [formRevaluo, setFormRevaluo] = useState({ tipoReval: '1', documento: '', fechaIni: '' });
  const [formDet, setFormDet] = useState({
    nroActivo: '',
    vidaUtilMes: '',
    vidaUtilAno: '',
    costo: '',
    fechaReval: '',
    nroSerie: '1'
  });
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Search autocomplete state for asset
  const [assetSearch, setAssetSearch] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState<any>(null);

  // Depreciation calculation state
  const [depCalculada, setDepCalculada] = useState<any>(null);

  // Apollo operations
  const { data, loading, error, refetch } = useQuery(GET_REVALUOS);
  const { data: cats } = useQuery(GET_CATALOGOS);

  const [crearRevaluo] = useMutation(CREAR_REVALUO);
  const [editarRevaluo] = useMutation(EDITAR_REVALUO);
  const [anularRevaluo] = useMutation(ANULAR_REVALUO);
  const [agregarDetReval] = useMutation(AGREGAR_DET_REVAL);
  const [anularDetReval] = useMutation(ANULAR_DET_REVAL);

  // File upload handler
  const handleUploadFile = async (file: File): Promise<string | null> => {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Fallo al subir el archivo');
      }
      const result = await response.json();
      return result.filePath;
    } catch (e: any) {
      alert('⚠️ Error al subir archivo: ' + e.message);
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // Autocomplete asset selection
  const filteredActivos = useMemo(() => {
    if (!cats?.todosActivos) return [];
    const query = assetSearch.toLowerCase();
    return cats.todosActivos.filter((a: any) =>
      a.codActivo.toLowerCase().includes(query) ||
      a.descripcion.toLowerCase().includes(query)
    );
  }, [cats?.todosActivos, assetSearch]);

  const handleSelectActivo = (activo: any) => {
    setActivoSeleccionado(activo);
    setAssetSearch(`[${activo.codActivo}] ${activo.descripcion.slice(0, 50)}`);
    setShowAssetDropdown(false);

    const costoLimpio = activo.monto ? String(parseFloat(activo.monto)) : '';
    setFormDet(prev => ({
      ...prev,
      nroActivo: String(activo.nroActivo),
      costo: costoLimpio
    }));
    
    if (costoLimpio) {
      calcularDep(costoLimpio, formDet.vidaUtilAno, formDet.vidaUtilMes);
    }
  };

  // Calculate live depreciation
  const calcularDep = (costo: string, vidaUtilAno: string, vidaUtilMes: string) => {
    const c = parseFloat(costo);
    const anos = parseInt(vidaUtilAno) || 0;
    const meses = parseInt(vidaUtilMes) || 0;
    const totalMeses = (anos * 12) + meses;
    if (c > 0 && totalMeses > 0) {
      const depMensual = c / totalMeses;
      const depAnual = depMensual * 12;
      setDepCalculada({
        depMensual: depMensual.toFixed(2),
        depAnual: depAnual.toFixed(2),
        totalMeses
      });
    } else {
      setDepCalculada(null);
    }
  };

  // Toggle expand/collapse row
  const toggleExpand = (id: number) => {
    setExpandedRevals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Submit new revaluo
  const handleCrearRevaluo = async () => {
    if (!formRevaluo.fechaIni) {
      alert('Por favor ingrese la fecha de inicio');
      return;
    }

    try {
      let docPath = '';
      if (selectedFile) {
        const filePath = await handleUploadFile(selectedFile);
        if (!filePath) return;
        docPath = filePath;
      } else {
        docPath = formRevaluo.documento;
      }

      await crearRevaluo({
        variables: {
          tipoReval: parseInt(formRevaluo.tipoReval),
          documento: docPath || null,
          fechaIni: formRevaluo.fechaIni
        }
      });

      setShowModal(false);
      setFormRevaluo({ tipoReval: '1', documento: '', fechaIni: '' });
      setSelectedFile(null);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Upload PDF for an existing active revaluation
  const handleUploadComprobanteExistente = async (codReval: any, file: File | undefined) => {
    if (!file) return;
    const filePath = await handleUploadFile(file);
    if (!filePath) return;

    try {
      await editarRevaluo({
        variables: {
          codReval: parseInt(String(codReval)),
          documento: filePath
        }
      });
      alert('✅ Comprobante subido y actualizado correctamente.');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Anular Revalúo
  const handleAnularRevaluo = async (codReval: any) => {
    if (!window.confirm('¿Está seguro de que desea anular esta resolución de revalúo?')) return;
    try {
      await anularRevaluo({
        variables: {
          codReval: parseInt(String(codReval))
        }
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Cerrar Revalúo (Cerrado 'C')
  const handleCerrarRevaluo = async (codReval: any) => {
    if (!window.confirm('¿Está seguro de finalizar este revalúo? Se registrará la fecha fin.')) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await editarRevaluo({
        variables: {
          codReval: parseInt(String(codReval)),
          fechaFin: today,
          estado: 'C'
        }
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Submit new asset to revaluation detail
  const handleAgregarDet = async () => {
    if (!formDet.nroActivo || !formDet.costo || !formDet.fechaReval) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }
    const anos = parseInt(formDet.vidaUtilAno) || 0;
    const meses = parseInt(formDet.vidaUtilMes) || 0;
    if (anos === 0 && meses === 0) {
      alert('La vida útil debe ser de al menos 1 mes.');
      return;
    }

    try {
      const res = await agregarDetReval({
        variables: {
          codReval: parseInt(String(revaluoSeleccionado.codReval)),
          nroActivo: parseInt(String(formDet.nroActivo)),
          vidaUtilMes: meses,
          vidaUtilAno: anos,
          costo: parseFloat(formDet.costo),
          fechaReval: formDet.fechaReval,
          nroSerie: parseInt(formDet.nroSerie) || 1
        }
      });

      const dep = res.data?.agregarDetRevalConDepreciacion?.depAcumulada;
      if (dep) {
        alert(
          `✅ Activo agregado al Revalúo con éxito\n\n` +
          `Nueva Depreciación Mensual: Bs. ${parseFloat(dep.depresiacion).toFixed(2)}\n` +
          `Depreciación Acumulada: Bs. ${parseFloat(dep.acumulada).toFixed(2)}\n` +
          `Nuevo Valor Residual Actual: Bs. ${parseFloat(dep.valorActual).toFixed(2)}`
        );
      }
      setShowDetModal(false);
      setFormDet({ nroActivo: '', vidaUtilMes: '', vidaUtilAno: '', costo: '', fechaReval: '', nroSerie: '1' });
      setAssetSearch('');
      setActivoSeleccionado(null);
      setDepCalculada(null);
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Anular detalle de revaluación
  const handleAnularDetalle = async (codReval: any, nroActivo: any) => {
    if (!window.confirm('¿Está seguro de retirar este activo del revalúo?')) return;
    try {
      await anularDetReval({
        variables: {
          codReval: parseInt(String(codReval)),
          nroActivo: parseInt(String(nroActivo))
        }
      });
      alert('✅ Activo retirado del revalúo.');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Filtered revaluations list
  const filteredRevaluos = useMemo(() => {
    if (!data?.todosRevaluos) return [];
    return data.todosRevaluos.filter((r: any) => {
      const matchesSearch =
        String(r.codReval).includes(searchQuery) ||
        (r.documento && r.documento.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        estadoFilter === 'ALL' ||
        r.estado === estadoFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data?.todosRevaluos, searchQuery, estadoFilter]);

  if (error) return <div className="error">Error: {error.message}</div>;

  if (!puedeVer) {
    return (
      <PageLayout
        title="Acceso Restringido"
        subtitle="No tiene los permisos necesarios para ver esta sección."
      >
        <div className="error-container" style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#666' }}>Se requiere el permiso de 'Ver Revalúos' para ingresar a este módulo.</p>
        </div>
      </PageLayout>
    );
  }

  const pageActions = [];
  if (puedeAutorizar) {
    pageActions.push({
      label: 'Nuevo',
      icon: '+',
      variant: 'primary' as const,
      onClick: () => {
        setFormRevaluo({ tipoReval: '1', documento: '', fechaIni: '' });
        setSelectedFile(null);
        setShowModal(true);
      }
    });
  }
  pageActions.push({ label: 'Actualizar', icon: '↺', onClick: () => refetch() });

  return (
    <PageLayout
      title="Revalúos y Depreciaciones"
      actions={pageActions}
    >


      {/* Barra de Filtros y Búsqueda (Estilo Ingresos) */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            className="form-group-light"
            style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '0.88rem' }}
            placeholder="🔍 Buscar por número de resolución o ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            style={{ padding: '0.45rem 0.75rem', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '0.88rem', background: 'white' }}
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="A">Activos</option>
            <option value="C">Cerrados</option>
            <option value="B">Anulados</option>
          </select>
        </div>
      </div>

      {/* Listado de Revalúos en Tabla Estándar (Estilo Ingresos) */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo de Revalúo</th>
              <th>Documento / Comprobante</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td><div className="h-8 bg-gray-200 rounded w-32"></div></td>
                </tr>
              ))
            ) : filteredRevaluos.length === 0 ? (
              <tr><td colSpan={7} className="empty">No se encontraron revalúos</td></tr>
            ) : (
              filteredRevaluos.map((r: any) => {
                const isExpanded = !!expandedRevals[r.codReval];
                const hasPdf = r.documento && (r.documento.toLowerCase().endsWith('.pdf') || r.documento.startsWith('/media'));
                
                return (
                  <React.Fragment key={r.codReval}>
                    <tr style={{ background: isExpanded ? '#f8fafc' : 'white' }}>
                      <td><strong>#{r.codReval}</strong></td>
                      <td>{TIPO_LABEL[r.tipoReval] || r.tipoReval}</td>
                      <td>
                        {hasPdf ? (
                          <a
                            href={`http://localhost:8000${r.documento}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ textDecoration: 'none', padding: '2px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            Ver PDF
                          </a>
                        ) : r.estado === 'A' && puedeAutorizar ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                              Subir PDF
                            </button>
                            <input
                              type="file"
                              accept="application/pdf"
                              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                              onChange={e => handleUploadComprobanteExistente(r.codReval, e.target.files?.[0])}
                            />
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin PDF</span>
                        )}
                      </td>
                      <td>{r.fechaIni || '-'}</td>
                      <td>{r.fechaFin || '-'}</td>
                      <td>
                        <span className={`badge ${ESTADO_CLASS[r.estado] || 'badge-secondary'}`}>
                          {ESTADO_LABEL[r.estado] || r.estado}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => toggleExpand(r.codReval)}
                          >
                            {isExpanded ? 'Ocultar Detalle' : 'Ver Activos'}
                          </button>
                          
                          {r.estado === 'A' && puedeAutorizar && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  setRevaluoSeleccionado(r);
                                  setFormDet({
                                    nroActivo: '',
                                    vidaUtilMes: '',
                                    vidaUtilAno: '',
                                    costo: '',
                                    fechaReval: r.fechaIni || '',
                                    nroSerie: '1'
                                  });
                                  setAssetSearch('');
                                  setActivoSeleccionado(null);
                                  setDepCalculada(null);
                                  setShowDetModal(true);
                                }}
                              >
                                + Activo
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleCerrarRevaluo(r.codReval)}
                              >
                                Cerrar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleAnularRevaluo(r.codReval)}
                              >
                                Anular
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Fila Desplegable con Detalles de Activos */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ background: '#f8fafc', padding: '1.25rem 2rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Activos revalorizados en esta resolución
                          </div>
                          
                          {(!r.inDetRevalSet || r.inDetRevalSet.filter((d: any) => d.estado !== 'B').length === 0) ? (
                            <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem', padding: '0.5rem 0' }}>
                              Ningún activo ha sido revaluado aún bajo esta resolución.
                            </div>
                          ) : (
                            <table style={{ width: '100%', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', borderCollapse: 'collapse', overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Código Activo</th>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Descripción</th>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Monto Original</th>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Costo Revaluado</th>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Diferencia</th>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Nueva Vida Útil</th>
                                  <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Fecha</th>
                                  {r.estado === 'A' && puedeAutorizar && <th style={{ padding: '0.6rem 1rem', fontSize: '0.78rem', color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Acciones</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {r.inDetRevalSet.filter((d: any) => d.estado !== 'B').map((det: any, idx: number) => {
                                  const origVal = parseFloat(det.nroActivo?.monto || '0');
                                  const newVal = parseFloat(det.costo || '0');
                                  const diff = newVal - origVal;
                                  
                                  return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}><strong>{det.nroActivo?.codActivo}</strong></td>
                                      <td
                                        style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', maxWidth: '250px' }}
                                        className="truncate"
                                        title={det.nroActivo?.descripcion}
                                      >
                                        {det.nroActivo?.descripcion}
                                      </td>
                                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}>Bs. {origVal.toFixed(2)}</td>
                                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 600 }}>Bs. {newVal.toFixed(2)}</td>
                                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                                        {diff >= 0 ? '+' : ''}Bs. {diff.toFixed(2)}
                                      </td>
                                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}>{det.vidaUtilAno}a {det.vidaUtilMes}m</td>
                                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}>{det.fechaReval}</td>
                                      {r.estado === 'A' && puedeAutorizar && (
                                        <td style={{ padding: '0.6rem 1rem' }}>
                                          <button
                                            className="btn btn-danger btn-sm"
                                            style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                            onClick={() => handleAnularDetalle(r.codReval, det.nroActivo.nroActivo)}
                                          >
                                            Retirar
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
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

      {/* ==================== MODAL: NUEVA RESOLUCIÓN REVALÚO ==================== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nuevo Revalúo / Resolución</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Tipo de Revalúo</label>
                <select
                  value={formRevaluo.tipoReval}
                  onChange={e => setFormRevaluo({ ...formRevaluo, tipoReval: e.target.value })}
                >
                  <option value="1">Revalúo Técnico (Perito)</option>
                  <option value="2">Revalúo Contable</option>
                  <option value="3">Actualización de Valor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nro. de Resolución / Documento</label>
                <input
                  type="text"
                  placeholder="Ej: RES-022/2026"
                  value={formRevaluo.documento}
                  onChange={e => setFormRevaluo({ ...formRevaluo, documento: e.target.value })}
                  disabled={!!selectedFile}
                />
              </div>

              <div className="form-group form-group-full">
                <label>
                  Comprobante PDF (Opcional)
                  <span className="text-blue-500 cursor-help ml-1" title="Suba el documento de resolución escaneado en formato PDF.">🛈</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                      setFormRevaluo(prev => ({ ...prev, documento: e.target.files![0].name }));
                    }
                  }}
                />
                {selectedFile && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#155724', background: '#d4edda', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                    PDF Seleccionado: <strong>{selectedFile.name}</strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Fecha de Inicio *</label>
                <input
                  type="date"
                  value={formRevaluo.fechaIni}
                  onChange={e => setFormRevaluo({ ...formRevaluo, fechaIni: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCrearRevaluo}
                disabled={uploadingFile}
              >
                {uploadingFile ? 'Subiendo PDF...' : 'Crear Resolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: AGREGAR ACTIVO Y MODIFICAR VIDA ÚTIL ==================== */}
      {showDetModal && revaluoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowDetModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Revalúo #{revaluoSeleccionado.codReval} — Revalorizar Activo</h2>
            
            <div className="form-grid">
              {/* Autocomplete de Búsqueda de Activos */}
              <div className="form-group form-group-full">
                <label>Buscar Activo a Revaluar *</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    placeholder="Escribe el código o descripción del activo..."
                    value={assetSearch}
                    onChange={e => {
                      setAssetSearch(e.target.value);
                      setShowAssetDropdown(true);
                      setActivoSeleccionado(null);
                      setFormDet(prev => ({ ...prev, nroActivo: '', costo: '' }));
                      setDepCalculada(null);
                    }}
                    onFocus={() => setShowAssetDropdown(true)}
                  />
                  {showAssetDropdown && assetSearch.trim() !== '' && (
                    <ul className="autocomplete-dropdown">
                      {filteredActivos.slice(0, 10).map((a: any) => (
                        <li
                           key={a.nroActivo}
                          className="autocomplete-item"
                          onClick={() => handleSelectActivo(a)}
                        >
                          [{a.codActivo}] {a.descripcion}
                        </li>
                      ))}
                      {filteredActivos.length === 0 && (
                        <li className="autocomplete-item" style={{ color: '#aaa', fontStyle: 'italic', cursor: 'default' }}>
                          No se encontraron activos
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {activoSeleccionado && (
                  <div className="dep-info" style={{ margin: '0.5rem 0 0 0', background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
                      Valor actual registrado: <strong>Bs. {parseFloat(activoSeleccionado.monto || '0').toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  Nuevo Costo Revaluado (Bs.) *
                  <span className="text-blue-500 cursor-help ml-1" title="El nuevo valor asignado al activo fijo según tasación técnica o reajuste contable.">🛈</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej: 5200.00"
                  value={formDet.costo}
                  onChange={e => {
                    setFormDet({ ...formDet, costo: e.target.value });
                    calcularDep(e.target.value, formDet.vidaUtilAno, formDet.vidaUtilMes);
                  }}
                />
              </div>

              <div className="form-group">
                <label>Fecha de Revalúo *</label>
                <input
                  type="date"
                  value={formDet.fechaReval}
                  onChange={e => setFormDet({ ...formDet, fechaReval: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Nueva Vida Útil (Años) *
                  <span className="text-blue-500 cursor-help ml-1" title="La nueva estimación de años de vida útil que le restan al activo tras el revalúo.">🛈</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej: 5"
                  value={formDet.vidaUtilAno}
                  onChange={e => {
                    setFormDet({ ...formDet, vidaUtilAno: e.target.value });
                    calcularDep(formDet.costo, e.target.value, formDet.vidaUtilMes);
                  }}
                />
              </div>

              <div className="form-group">
                <label>
                  Vida Útil (Meses adicionales)
                  <span className="text-blue-500 cursor-help ml-1" title="Meses adicionales a los años de vida útil. La suma de años y meses debe ser al menos 1 mes.">🛈</span>
                </label>
                <input
                  type="number"
                  placeholder="Ej: 0"
                  value={formDet.vidaUtilMes}
                  onChange={e => {
                    setFormDet({ ...formDet, vidaUtilMes: e.target.value });
                    calcularDep(formDet.costo, formDet.vidaUtilAno, e.target.value);
                  }}
                />
              </div>

              <div className="form-group">
                <label>
                  Nro. Serie Depreciación
                  <span className="text-blue-500 cursor-help ml-1" title="Secuencia o número de serie del registro de depreciación para este activo.">🛈</span>
                </label>
                <input
                  type="number"
                  value={formDet.nroSerie}
                  onChange={e => setFormDet({ ...formDet, nroSerie: e.target.value })}
                />
              </div>

              {/* Cuadro de cálculo rápido (Estilo del sistema) */}
              {depCalculada && (
                <div className="form-group form-group-full dep-info">
                  <h4>📉 Nueva Depreciación Proyectada (Tasación Perito)</h4>
                  <p>Vida útil calculada: <strong>{depCalculada.totalMeses} meses</strong></p>
                  <p>Nueva Cuota Mensual: <strong>Bs. {depCalculada.depMensual}</strong></p>
                  <p>Depreciación Anual: <strong>Bs. {depCalculada.depAnual}</strong></p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAgregarDet}>
                Registrar con Depreciación
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}