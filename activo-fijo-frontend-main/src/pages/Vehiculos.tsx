import PageLayout from '../components/ui/PageLayout';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';


// ==================== QUERIES & MUTATIONS ====================
const GET_VEHICULOS_AND_ACTIVOS = gql`
  query GetVehiculosAndActivos($limit: Int, $offset: Int, $search: String) {
    todosVehiculosPaginados(limit: $limit, offset: $offset, search: $search) {
      totalCount
      results {
        nroActivo {
          nroActivo
          codActivo
          descripcion
          monto
          fecAdqui
          nroSerie
        }
        tipo
        marca
        modelo
        anio
        color
        placa
        motor
        chasis
        cilindrada
        industria
        ruat
        carnetProp
        poliza
        factura
        resMin
        resAdm
        infTec
        leyEstado
        ds
        docTransf
        docCompVen
        minuta
        actaCoVe
        imagen
      }
    }
    todosActivos {
      nroActivo
      codActivo
      descripcion
      nroSerie
      fecAdqui
      codMarca {
        codMarca
        desMarca
      }
      codModelo {
        codModelo
        desModelo
      }
    }
  }
`;

const GUARDAR_VEHICULO = gql`
  mutation GuardarVehiculo(
    $nroActivo: Int!, $tipo: String, $marca: String, $modelo: String,
    $anio: Int, $color: String, $placa: String, $motor: String, $chasis: String,
    $cilindrada: Int, $industria: String, $ruat: String, $carnetProp: String,
    $poliza: String, $factura: Int, $resMin: String, $resAdm: String,
    $infTec: String, $leyEstado: String, $ds: String, $docTransf: String,
    $docCompVen: String, $minuta: String, $actaCoVe: String, $imagen: String
  ) {
    guardarVehiculo(
      nroActivo: $nroActivo, tipo: $tipo, marca: $marca, modelo: $modelo,
      anio: $anio, color: $color, placa: $placa, motor: $motor, chasis: $chasis,
      cilindrada: $cilindrada, industria: $industria, ruat: $ruat, carnetProp: $carnetProp,
      poliza: $poliza, factura: $factura, resMin: $resMin, resAdm: $resAdm,
      infTec: $infTec, leyEstado: $leyEstado, ds: $ds, docTransf: $docTransf,
      docCompVen: $docCompVen, minuta: $minuta, actaCoVe: $actaCoVe, imagen: $imagen
    ) {
      vehiculo {
        nroActivo {
          nroActivo
        }
        placa
      }
    }
  }
`;

export default function Vehiculos() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_vehiculo');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_vehiculo');

  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  const { data, loading, error, refetch } = useQuery(GET_VEHICULOS_AND_ACTIVOS, {
    variables: {
      limit: ITEMS_POR_PAGINA,
      offset: (paginaActual - 1) * ITEMS_POR_PAGINA,
      search: busqueda.trim() || ""
    }
  });
  const [guardarVehiculo] = useMutation(GUARDAR_VEHICULO);

  const [tipoFiltro, setTipoFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  
  // Selection states
  const [selectedVehiculo, setSelectedVehiculo] = useState<any>(null);
  const [editingVehiculo, setEditingVehiculo] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [printTarget, setPrintTarget] = useState<any>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Form state for editing/creating
  const [form, setForm] = useState<any>({
    nroActivo: '',
    tipo: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    placa: '',
    motor: '',
    chasis: '',
    cilindrada: '',
    industria: '',
    ruat: '',
    carnetProp: '',
    poliza: '',
    factura: '',
    resMin: '',
    resAdm: '',
    infTec: '',
    leyEstado: '',
    ds: '',
    docTransf: '',
    docCompVen: '',
    minuta: '',
    actaCoVe: '',
    imagen: ''
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract unique types and brands for filter dropdowns
  const uniqueTypes = useMemo<string[]>(() => {
    const list = data?.todosVehiculosPaginados?.results?.map((v: any) => v.tipo).filter(Boolean) || [];
    return Array.from(new Set(list)) as string[];
  }, [data]);

  const uniqueBrands = useMemo<string[]>(() => {
    const list = data?.todosVehiculosPaginados?.results?.map((v: any) => v.marca).filter(Boolean) || [];
    return Array.from(new Set(list)) as string[];
  }, [data]);

  // Filter vehicles
  const filteredVehiculos = useMemo(() => {
    let list = data?.todosVehiculosPaginados?.results || [];
    if (tipoFiltro) {
      list = list.filter((v: any) => v.tipo === tipoFiltro);
    }
    if (marcaFiltro) {
      list = list.filter((v: any) => v.marca === marcaFiltro);
    }
    return list;
  }, [data, tipoFiltro, marcaFiltro]);

  const totalCount = data?.todosVehiculosPaginados?.totalCount || 0;
  const totalPaginas = Math.ceil(totalCount / ITEMS_POR_PAGINA);
  const paginaActualSegura = Math.min(paginaActual, totalPaginas || 1);

  // Get assets that do not have a vehicle file yet
  const availableAssets = useMemo(() => {
    const all = data?.todosActivos || [];
    const usedIds = new Set(data?.todosVehiculosPaginados?.results?.map((v: any) => v.nroActivo?.nroActivo) || []);
    return all.filter((a: any) => !usedIds.has(a.nroActivo));
  }, [data]);

  // Auto-fill values from the selected asset
  useEffect(() => {
    if (isCreating && form.nroActivo) {
      const allActivos = data?.todosActivos || [];
      const asset = allActivos.find((a: any) => String(a.nroActivo) === String(form.nroActivo));
      if (asset) {
        setForm((prev: any) => ({
          ...prev,
          marca: prev.marca || asset.codMarca?.desMarca || '',
          modelo: prev.modelo || asset.codModelo?.desModelo || '',
          chasis: prev.chasis || asset.nroSerie || '',
          anio: prev.anio || (asset.fecAdqui ? new Date(asset.fecAdqui).getFullYear().toString() : '')
        }));
      }
    }
  }, [form.nroActivo, isCreating, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload_image/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al subir la imagen');
      }

      const result = await response.json();
      setForm((prev: any) => ({ ...prev, imagen: result.filePath }));
      alert('Imagen subida correctamente');
    } catch (err: any) {
      alert('Error al subir la imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nroActivo) {
      alert('Por favor, asocie un Activo Fijo.');
      return;
    }
    setSaving(true);
    try {
      await guardarVehiculo({
        variables: {
          nroActivo: parseInt(form.nroActivo),
          tipo: form.tipo,
          marca: form.marca,
          modelo: form.modelo,
          anio: form.anio ? parseInt(form.anio) : null,
          color: form.color,
          placa: form.placa,
          motor: form.motor,
          chasis: form.chasis,
          cilindrada: form.cilindrada ? parseInt(form.cilindrada) : null,
          industria: form.industria,
          ruat: form.ruat,
          carnetProp: form.carnetProp,
          poliza: form.poliza,
          factura: form.factura ? parseInt(form.factura) : null,
          resMin: form.resMin,
          resAdm: form.resAdm,
          infTec: form.infTec,
          leyEstado: form.leyEstado,
          ds: form.ds,
          docTransf: form.docTransf,
          docCompVen: form.docCompVen,
          minuta: form.minuta,
          actaCoVe: form.actaCoVe,
          imagen: form.imagen
        }
      });
      alert('Ficha de vehículo guardada correctamente');
      setIsCreating(false);
      setEditingVehiculo(null);
      refetch();
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (v: any) => {
    setForm({
      nroActivo: v.nroActivo?.nroActivo,
      tipo: v.tipo || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      anio: v.anio ? String(v.anio) : '',
      color: v.color || '',
      placa: v.placa || '',
      motor: v.motor || '',
      chasis: v.chasis || '',
      cilindrada: v.cilindrada ? String(v.cilindrada) : '',
      industria: v.industria || '',
      ruat: v.ruat || '',
      carnetProp: v.carnetProp || '',
      poliza: v.poliza || '',
      factura: v.factura ? String(v.factura) : '',
      resMin: v.resMin || '',
      resAdm: v.resAdm || '',
      infTec: v.infTec || '',
      leyEstado: v.leyEstado || '',
      ds: v.ds || '',
      docTransf: v.docTransf || '',
      docCompVen: v.docCompVen || '',
      minuta: v.minuta || '',
      actaCoVe: v.actaCoVe || '',
      imagen: v.imagen || ''
    });
    setEditingVehiculo(v);
  };

  const handleCreateClick = () => {
    setForm({
      nroActivo: '',
      tipo: '',
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      placa: '',
      motor: '',
      chasis: '',
      cilindrada: '',
      industria: '',
      ruat: '',
      carnetProp: '',
      poliza: '',
      factura: '',
      resMin: '',
      resAdm: '',
      infTec: '',
      leyEstado: '',
      ds: '',
      docTransf: '',
      docCompVen: '',
      minuta: '',
      actaCoVe: '',
      imagen: ''
    });
    setIsCreating(true);
  };

  const handleExportCSV = () => {
    const headers = [
      'Código Activo', 'Descripción', 'Placa', 'Tipo', 'Marca', 'Modelo',
      'Año', 'Color', 'Motor', 'Chasis', 'Cilindrada', 'Industria', 'RUAT',
      'Factura', 'Póliza', 'Nro Serie'
    ];
    
    const rows = filteredVehiculos.map((v: any) => [
      v.nroActivo?.codActivo || '',
      v.nroActivo?.descripcion || '',
      v.placa || '',
      v.tipo || '',
      v.marca || '',
      v.modelo || '',
      v.anio || '',
      v.color || '',
      v.motor || '',
      v.chasis || '',
      v.cilindrada || '',
      v.industria || '',
      v.ruat || '',
      v.factura || '',
      v.poliza || '',
      v.nroActivo?.nroSerie || ''
    ]);

    const csvContent = "\uFEFF" // UTF-8 BOM
      + [headers.join(';'), ...rows.map((r: any) => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `flota_vehiculos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (v: any) => {
    setPrintTarget(v);
  };

  useEffect(() => {
    if (printTarget) {
      const timer = setTimeout(() => {
        window.print();
        setPrintTarget(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printTarget]);

  if (error) return <div className="error">Error: {error.message}</div>;

  const vehiculosList = filteredVehiculos;

  return (
    <PageLayout
      title="Flota de Vehículos"
      actions={[
        ...(puedeCrear ? [{ label: 'Registrar Ficha', icon: '+', variant: 'primary' as const, onClick: handleCreateClick }] : []),
        { label: 'Exportar CSV', icon: '↓', onClick: handleExportCSV },
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
      toolbar={
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Búsqueda:</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por placa, marca, modelo..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
              style={{ width: '220px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tipo:</span>
            <select
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid var(--border-dark)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: 'var(--bg-white)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}
            >
              <option value="">Todos</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Marca:</span>
            <select
              value={marcaFiltro}
              onChange={e => setMarcaFiltro(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid var(--border-dark)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                background: 'var(--bg-white)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}
            >
              <option value="">Todas</option>
              {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      }
    >
      {/* CSS overrides for print layout */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .navbar, .btn, .no-print, .filters-panel, .vehiculos-page > *:not(.print-container) {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white !important;
          }
        }
        .print-container {
          display: none;
        }
      `}</style>

      {/* RENDER NORMAL VIEW */}
      <div className="no-print">
        {(!loading && vehiculosList.length === 0) ? (
          <div className="table-empty" style={{ border: '1px solid var(--border)', background: 'var(--bg-white)', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--navy)', marginBottom: '0.25rem' }}>No se encontraron vehículos</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Intente cambiar los filtros o registre un nuevo vehículo.</p>
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto', border: '1px solid var(--border-dark)' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Imagen</th>
                  <th style={{ width: '120px' }}>Código Activo</th>
                  <th>Descripción del Activo</th>
                  <th style={{ width: '100px' }}>Placa</th>
                  <th style={{ width: '100px' }}>Tipo</th>
                  <th style={{ width: '120px' }}>Marca / Modelo</th>
                  <th style={{ width: '120px' }}>Año / Color</th>
                  <th style={{ width: '150px' }}>Chasis / Motor</th>
                  <th style={{ width: '110px' }}>RUAT</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse border-b border-slate-700/30">
                      <td><div className="h-8 bg-slate-700 rounded w-10 mx-auto"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-20"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-44"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-24"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-20"></div></td>
                      <td><div className="h-6 bg-slate-700 rounded w-28"></div></td>
                      <td><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                      <td><div className="h-6 bg-slate-700 rounded w-28 mx-auto"></div></td>
                    </tr>
                  ))
                ) : (
                  vehiculosList.map((v: any) => (
                  <tr key={v.nroActivo?.nroActivo}>
                    <td style={{ textAlign: 'center', padding: '4px' }}>
                      {v.imagen ? (
                        <img
                          src={`http://localhost:8000${v.imagen}`}
                          alt="Vehículo"
                          style={{ width: '40px', height: '30px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.src.includes('http://localhost:8000/media/')) {
                              img.src = v.imagen;
                            }
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', padding: '4px 2px', textTransform: 'uppercase', fontWeight: 'bold', width: '40px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          S/F
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--navy)' }}>
                      {v.nroActivo?.codActivo}
                    </td>
                    <td className="max-w-[200px] truncate" title={v.nroActivo?.descripcion}>{v.nroActivo?.descripcion}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {v.placa ? v.placa.toUpperCase() : 'SIN PLACA'}
                    </td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{v.tipo || '-'}</td>
                    <td>{v.marca || '-'} / {v.modelo || '-'}</td>
                    <td>{v.anio || '-'} / {v.color || '-'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      C: {v.chasis || '-'}<br />
                      M: {v.motor || '-'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{v.ruat || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px', fontSize: '0.75rem' }}
                          onClick={() => setSelectedVehiculo(v)}
                          title="Ver Ficha Técnica"
                        >
                          Ver
                        </button>
                        {puedeEditar && (
                          <button
                            className="btn btn-warning btn-sm"
                            style={{ padding: '3px 6px', fontSize: '0.75rem' }}
                            onClick={() => handleEditClick(v)}
                            title="Editar Ficha"
                          >
                            Editar
                          </button>
                        )}
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 6px', fontSize: '0.75rem' }}
                          onClick={() => handlePrint(v)}
                          title="Imprimir Ficha"
                        >
                          Imp.
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
        {totalPaginas > 1 && (
          <div className="pagination" style={{ marginTop: '1rem' }}>
            <span>Página {paginaActualSegura} de {totalPaginas} — {totalCount} registros</span>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActualSegura === 1}
              >Anterior</button>
              <button
                className="pagination-btn"
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActualSegura === totalPaginas}
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (FICHA TÉCNICA VIEW) */}
      {selectedVehiculo && (
        <div className="modal-overlay" onClick={() => setSelectedVehiculo(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Ficha Técnica Vehicular</span>
              <button 
                onClick={() => setSelectedVehiculo(null)} 
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', overflowY: 'auto' }}>
                <PrintableSheet vehicle={selectedVehiculo} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => handlePrint(selectedVehiculo)}>
                Imprimir Ficha
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedVehiculo(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE MODAL */}
      {(editingVehiculo || isCreating) && (
        <div className="modal-overlay" onClick={() => { setEditingVehiculo(null); setIsCreating(false); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>{isCreating ? 'Registrar Ficha Técnica de Vehículo' : 'Editar Ficha Técnica de Vehículo'}</span>
              <button className="modal-close" onClick={() => { setEditingVehiculo(null); setIsCreating(false); }}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Interactive Help Assistant Banner */}
              <div style={{
                background: 'var(--blue-pale)',
                borderLeft: '4px solid var(--blue)',
                padding: '10px 12px',
                fontSize: '0.75rem',
                lineHeight: '1.4',
                marginBottom: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>Asistente de Llenado Rápido</strong>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: '2px 6px', fontSize: '0.65rem' }} 
                    onClick={() => setShowTutorial(!showTutorial)}
                  >
                    {showTutorial ? 'Ocultar Guía' : 'Ver Guía / Ayuda'}
                  </button>
                </div>
                {showTutorial && (
                  <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: '6px' }}>Siga estos sencillos pasos para registrar la ficha de vehículo rápidamente:</p>
                    <ol style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <li>
                        <strong>Auto-completado Inteligente:</strong> Al seleccionar un activo, el sistema <span style={{ color: '#006600', fontWeight: 'bold' }}>rellenará automáticamente</span> la marca, modelo, chasis (según número de serie del activo) y año de adquisición si el activo tiene dichos datos.
                      </li>
                      <li>
                        <strong>Solo 1 campo obligatorio:</strong> Únicamente es necesario relacionar el Activo Fijo. Se recomienda ingresar la Placa para facilitar las búsquedas.
                      </li>
                      <li>
                        <strong>Evite campos innecesarios:</strong> Todos los demás campos de especificaciones y documentación legal están marcados con <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>(Opcional)</span>. Si no los tiene a mano, puede dejarlos en blanco y guardarlo. Podrá editarlos en cualquier momento.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Asset Selector (Only on Creation) */}
              <div className="form-group">
                <label>Activo Fijo Relacionado *</label>
                {isCreating ? (
                  <select 
                    name="nroActivo" 
                    value={form.nroActivo} 
                    onChange={handleChange}
                    style={{ width: '100%' }}
                  >
                    <option value="">Seleccionar activo...</option>
                    {availableAssets.map((a: any) => (
                      <option key={a.nroActivo} value={a.nroActivo}>
                        [{a.codActivo}] {a.descripcion}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ background: 'var(--blue-pale)', padding: '6px 10px', border: '1px solid var(--border-light)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                    [{editingVehiculo?.nroActivo?.codActivo}] {editingVehiculo?.nroActivo?.descripcion}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                {/* Image and Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-panel)', padding: '8px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-label)', fontWeight: 700, textTransform: 'uppercase' }}>Fotografía <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Opcional)</span></span>
                  <div style={{ width: '100%', height: '120px', background: 'var(--bg-white)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', position: 'relative' }}>
                    {form.imagen ? (
                      <img 
                        src={`http://localhost:8000${form.imagen}`} 
                        alt="Vehículo" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src.includes('http://localhost:8000/media/')) {
                            img.src = form.imagen; 
                          }
                        }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>SIN FOTO</span>
                    )}
                    {uploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--navy)', fontWeight: 'bold' }}>
                        Subiendo...
                      </div>
                    )}
                  </div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', textAlign: 'center', width: '100%', display: 'block', padding: '4px' }}>
                    {form.imagen ? 'Cambiar Foto' : 'Subir Foto'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Grid of Main Fields */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo de Vehículo <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <input type="text" name="tipo" value={form.tipo} onChange={handleChange} placeholder="Ej: Camioneta, Sedan" />
                  </div>
                  <div className="form-group">
                    <label>Placa <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <input type="text" name="placa" value={form.placa} onChange={handleChange} placeholder="Ej: 1234ABC" />
                  </div>
                  <div className="form-group">
                    <label>Marca <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <input type="text" name="marca" value={form.marca} onChange={handleChange} placeholder="Ej: Toyota" />
                  </div>
                  <div className="form-group">
                    <label>Modelo <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <input type="text" name="modelo" value={form.modelo} onChange={handleChange} placeholder="Ej: Hilux" />
                  </div>
                  <div className="form-group">
                    <label>Año <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <input type="number" name="anio" value={form.anio} onChange={handleChange} placeholder="Ej: 2020" />
                  </div>
                  <div className="form-group">
                    <label>Color <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <input type="text" name="color" value={form.color} onChange={handleChange} placeholder="Ej: Blanco" />
                  </div>
                </div>
              </div>

              <div className="section-bar" style={{ margin: '4px 0 2px 0' }}>Identificación y Mecánica</div>
              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label>Motor <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="motor" value={form.motor} onChange={handleChange} placeholder="Nro de Motor" />
                </div>
                <div className="form-group">
                  <label>Chasis <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="chasis" value={form.chasis} onChange={handleChange} placeholder="Nro de Chasis" />
                </div>
                <div className="form-group">
                  <label>Cilindrada (cc) <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="number" name="cilindrada" value={form.cilindrada} onChange={handleChange} placeholder="Ej: 2400" />
                </div>
                <div className="form-group">
                  <label>Industria <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="industria" value={form.industria} onChange={handleChange} placeholder="Ej: Japón" />
                </div>
                <div className="form-group">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="mb-0">RUAT <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                    <span 
                      className="cursor-help text-blue-400 hover:text-blue-300 font-bold font-mono text-[10px] select-none bg-blue-500/10 border border-blue-500/20 w-4 h-4 rounded-full flex items-center justify-center transition-all"
                      title="Registro Único para la Administración Tributaria Municipal del vehículo."
                    >
                      ?
                    </span>
                  </div>
                  <input type="text" name="ruat" value={form.ruat} onChange={handleChange} placeholder="Nro RUAT" />
                </div>
                <div className="form-group">
                  <label>Carnet Propietario <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="carnetProp" value={form.carnetProp} onChange={handleChange} placeholder="Nro CRP" />
                </div>
              </div>

              <div className="section-bar" style={{ margin: '4px 0 2px 0' }}>Documentación y Resoluciones</div>
              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label>Póliza <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="poliza" value={form.poliza} onChange={handleChange} placeholder="Nro de Póliza" />
                </div>
                <div className="form-group">
                  <label>Factura <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="number" name="factura" value={form.factura} onChange={handleChange} placeholder="Nro de Factura" />
                </div>
                <div className="form-group">
                  <label>Res. Ministerial <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="resMin" value={form.resMin} onChange={handleChange} placeholder="Resolución Min." />
                </div>
                <div className="form-group">
                  <label>Res. Administrativa <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="resAdm" value={form.resAdm} onChange={handleChange} placeholder="Resolución Adm." />
                </div>
                <div className="form-group">
                  <label>Informe Técnico <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="infTec" value={form.infTec} onChange={handleChange} placeholder="Informe Técnico" />
                </div>
                <div className="form-group">
                  <label>Ley del Estado <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="leyEstado" value={form.leyEstado} onChange={handleChange} placeholder="Ley del Estado" />
                </div>
                <div className="form-group">
                  <label>D.S. (Decreto Supremo) <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="ds" value={form.ds} onChange={handleChange} placeholder="Decreto Supremo" />
                </div>
                <div className="form-group">
                  <label>Doc. Transferencia <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="docTransf" value={form.docTransf} onChange={handleChange} placeholder="Doc. Transferencia" />
                </div>
                <div className="form-group">
                  <label>Minuta <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="minuta" value={form.minuta} onChange={handleChange} placeholder="Minuta de Compra/Venta" />
                </div>
                <div className="form-group">
                  <label>Doc. Compra Venta <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="docCompVen" value={form.docCompVen} onChange={handleChange} placeholder="Doc. Compra/Venta" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Acta Compra Venta <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.7rem' }}>(Opcional)</span></label>
                  <input type="text" name="actaCoVe" value={form.actaCoVe} onChange={handleChange} placeholder="Acta de Compra/Venta" />
                </div>
              </div>

            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploading}>
                {saving ? 'Guardando...' : 'Guardar Ficha'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setEditingVehiculo(null); setIsCreating(false); }} disabled={saving}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT COMPONENT */}
      {printTarget && (
        <div className="print-container">
          <PrintableSheet vehicle={printTarget} />
        </div>
      )}
    </PageLayout>
  );
}

// ==================== PRINTABLE SHEET COMPONENT ====================
function PrintableSheet({ vehicle }: { vehicle: any }) {
  const v = vehicle;
  return (
    <div style={{ background: 'white', padding: '25px', color: 'black', fontFamily: '"Arial", sans-serif', maxWidth: '780px', margin: '0 auto', fontSize: '11px', lineHeight: '1.3' }}>
      
      {/* Institution Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#4a5568' }}>Dirección Universitaria de Activos Fijos</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', border: '1.5px solid #1a3c6e', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#1a3c6e' }}>
            FICHA TÉCNICA VEHICULAR
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '15px', marginBottom: '15px' }}>
        {/* Left Side: General Asset & Vehicle Identifiers */}
        <div>
          <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>1. Identificación del Activo Fijo</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold', width: '110px' }}>Código Activo:</td>
                <td style={{ padding: '3px 0', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px' }}>{v.nroActivo?.codActivo}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Descripción:</td>
                <td style={{ padding: '3px 0' }}>{v.nroActivo?.descripcion}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Nro. Serie Activo:</td>
                <td style={{ padding: '3px 0' }}>{v.nroActivo?.nroSerie || 'S/N'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Monto Adq. / Fecha:</td>
                <td style={{ padding: '3px 0' }}>
                  {v.nroActivo?.monto ? `Bs. ${parseFloat(v.nroActivo.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : 'S/M'} 
                  {v.nroActivo?.fecAdqui ? ` — ${v.nroActivo.fecAdqui}` : ''}
                </td>
              </tr>
            </tbody>
          </table>

          <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>2. Especificaciones Principales del Vehículo</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold', width: '110px' }}>Placa de Control:</td>
                <td style={{ padding: '3px 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', color: '#1e3a8a' }}>{v.placa || 'SIN PLACA'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Tipo:</td>
                <td style={{ padding: '3px 0' }}>{v.tipo || 'No especificado'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Marca / Modelo:</td>
                <td style={{ padding: '3px 0' }}>{v.marca || 'S/M'} / {v.modelo || 'S/Mod'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', fontWeight: 'bold' }}>Año / Color:</td>
                <td style={{ padding: '3px 0' }}>{v.anio || 'S/A'} / {v.color || 'S/C'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Side: Vehicle Image */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', height: '150px', border: '1.5px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', marginBottom: '5px' }}>
            {v.imagen ? (
              <img 
                src={`http://localhost:8000${v.imagen}`} 
                alt="Vehículo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.includes('http://localhost:8000/media/')) {
                    img.src = v.imagen; 
                  }
                }}
              />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}>SIN FOTO</div>
            )}
          </div>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>FOTOGRAFÍA REGISTRADA</span>
        </div>
      </div>

      {/* Mechanical specifications */}
      <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>3. Datos Mecánicos e Identificadores</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold', width: '110px' }}>Número de Motor:</td>
              <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>{v.motor || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Número de Chasis:</td>
              <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>{v.chasis || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Cilindrada (cc):</td>
              <td style={{ padding: '4px 0' }}>{v.cilindrada ? `${v.cilindrada} cc` : '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>País Industria:</td>
              <td style={{ padding: '4px 0' }}>{v.industria || '-'}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold', width: '110px' }}>Nro. RUAT:</td>
              <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>{v.ruat || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>C. Propietario (CRP):</td>
              <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>{v.carnetProp || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Nro. Póliza Import:</td>
              <td style={{ padding: '4px 0' }}>{v.poliza || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Nro. Factura Compra:</td>
              <td style={{ padding: '4px 0' }}>{v.factura || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resolutions and legal files */}
      <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>4. Respaldos Legales y Resoluciones Administrativas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold', width: '130px' }}>Resolución Ministerial:</td>
              <td style={{ padding: '4px 0' }}>{v.resMin || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Resolución Administrativa:</td>
              <td style={{ padding: '4px 0' }}>{v.resAdm || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Informe Técnico:</td>
              <td style={{ padding: '4px 0' }}>{v.infTec || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Ley del Estado:</td>
              <td style={{ padding: '4px 0' }}>{v.leyEstado || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Decreto Supremo (D.S.):</td>
              <td style={{ padding: '4px 0' }}>{v.ds || '-'}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold', width: '130px' }}>Doc. Transferencia:</td>
              <td style={{ padding: '4px 0' }}>{v.docTransf || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Minuta Compra Venta:</td>
              <td style={{ padding: '4px 0' }}>{v.minuta || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Doc. Compra Venta:</td>
              <td style={{ padding: '4px 0' }}>{v.docCompVen || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Acta Compra Venta:</td>
              <td style={{ padding: '4px 0' }}>{v.actaCoVe || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '60px', textAlign: 'center' }}>
        <div>
          <div style={{ borderTop: '1px solid #4a5568', width: '220px', margin: '0 auto 5px auto' }}></div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '9px' }}>RESPONSABLE FLOTA VEHICULAR</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#718096' }}>Dpto. Activos Fijos UAGRM</p>
        </div>
        <div>
          <div style={{ borderTop: '1px solid #4a5568', width: '220px', margin: '0 auto 5px auto' }}></div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '9px' }}>DIRECTOR ADM. FINANCIERO</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#718096' }}>Autoridad Universitaria UAGRM</p>
        </div>
      </div>

      {/* Print Footer Metadata */}
      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '40px', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#718096' }}>
        <span>Fecha de Impresión: {new Date().toLocaleString('es-BO')}</span>
        <span>Sistema de Gestión de Activos Fijos UAGRM v2.0</span>
      </div>

    </div>
  );
}
