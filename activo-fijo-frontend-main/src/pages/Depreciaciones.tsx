import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DEPRECIACIONES_DATA, GET_DEP_ACUMULADA } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { CALCULAR_DEP_MASIVA } from '../graphql/mutations';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatPeriodo = (nroSerie: number) => {
  if (!nroSerie) return '-';
  const year = Math.floor(nroSerie / 100);
  const month = nroSerie % 100;
  if (month < 1 || month > 12) return `Serie ${nroSerie}`;
  return `${MESES[month - 1]} ${year}`;
};

export default function Depreciaciones() {
  const { user } = useAuth();
  const puedeVer = user?.esAdmin || user?.permisos.includes('ver_depreciaciones');
  const puedeCalcular = user?.esAdmin || user?.permisos.includes('crear_depreciacion');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'activos'>('resumen');
  const [gestion, setGestion] = useState(currentYear);
  const [periodo, setPeriodo] = useState(currentMonth);
  const [resultMsg, setResultMsg] = useState<any>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const { data: mainData, loading, error, refetch } = useQuery(GET_DEPRECIACIONES_DATA);
  const [calcularDepMasiva, { loading: calcLoading }] = useMutation(CALCULAR_DEP_MASIVA);

  if (error) return <div className="error">Error: {error.message}</div>;

  if (!puedeVer) {
    return (
      <PageLayout
        title="Acceso Restringido"
        subtitle="No tiene los permisos necesarios para ver esta sección."
      >
        <div className="error-container" style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#666' }}>Se requiere el permiso de 'Ver Depreciaciones' para ingresar a este módulo.</p>
        </div>
      </PageLayout>
    );
  }

  const ultimasDepr: any[] = mainData?.ultimasDepreciaciones || [];
  const todosActivos: any[] = mainData?.todosActivos || [];

  const activosConDep = ultimasDepr.length;
  const activosSinDep = todosActivos.length - activosConDep;
  const valorLibros = ultimasDepr.reduce((sum, d) => sum + parseFloat(d.valorActual || 0), 0);
  const depAcum = ultimasDepr.reduce((sum, d) => sum + parseFloat(d.acumulada || 0), 0);
  const costoOriginal = ultimasDepr.reduce((sum, d) => sum + parseFloat(d.valorRevaluo || 0), 0);

  const filteredDep = ultimasDepr.filter((d: any) =>
    d.nroActivo?.codActivo?.toLowerCase().includes(filterSearch.toLowerCase()) ||
    d.nroActivo?.descripcion?.toLowerCase().includes(filterSearch.toLowerCase()) ||
    d.nroActivo?.codGrupo?.desGrupo?.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const handleCalcular = async () => {
    if (!window.confirm(
      `¿Calcular depreciación para ${MESES[periodo - 1]} ${gestion}?\n\nSe registrará un período para todos los activos activos con grupo configurado. Los ya procesados en este período serán omitidos.`
    )) return;
    try {
      const res = await calcularDepMasiva({ variables: { gestion, periodo } });
      setResultMsg(res.data?.calcularDepreciacionMasiva);
      refetch();
    } catch (e: any) {
      alert('Error al calcular: ' + e.message);
    }
  };

  return (
    <PageLayout
      title="Módulo de Depreciaciones de Activos Fijos"
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >


      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{loading ? '...' : todosActivos.length}</div>
          <div className="stat-label">Activos Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{loading ? '...' : activosConDep}</div>
          <div className="stat-label">Con Depreciación</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{loading ? '...' : activosSinDep}</div>
          <div className="stat-label">Sin Depreciación</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '0.95rem', color: '#1a3c6e' }}>
            {loading ? 'Bs. ...' : `Bs. ${costoOriginal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
          </div>
          <div className="stat-label">Costo Original</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '0.95rem', color: '#ef4444' }}>
            {loading ? 'Bs. ...' : `Bs. ${depAcum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
          </div>
          <div className="stat-label">Dep. Acumulada</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '0.95rem', color: '#059669' }}>
            {loading ? 'Bs. ...' : `Bs. ${valorLibros.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
          </div>
          <div className="stat-label">Valor en Libros</div>
        </div>
      </div>

      {/* Cálculo masivo panel */}
      <div className="table-container" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#1a3c6e' }}>
          Calcular Depreciación Mensual Automática
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>
              Gestión (Año)
              <span className="text-blue-500 cursor-help ml-1" title="El año fiscal para el cual se correrá el proceso de depreciación.">🛈</span>
            </label>
            <input type="number" value={gestion} onChange={e => setGestion(parseInt(e.target.value))}
              min={2000} max={2100} style={{ width: '110px' }} disabled={!puedeCalcular} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>
              Período (Mes)
              <span className="text-blue-500 cursor-help ml-1" title="El mes específico del año fiscal seleccionado para realizar el cálculo.">🛈</span>
            </label>
            <select value={periodo} onChange={e => setPeriodo(parseInt(e.target.value))} style={{ width: '150px' }} disabled={!puedeCalcular}>
              {MESES.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCalcular} disabled={calcLoading || !puedeCalcular}>
            {calcLoading ? 'Calculando...' : `Calcular ${MESES[periodo - 1]} ${gestion}`}
          </button>
        </div>

        {resultMsg && (
          <div style={{
            marginTop: '1rem', padding: '1rem', borderRadius: '8px',
            background: resultMsg.errores?.length > 0 ? '#fef3c7' : '#f0fdf4',
            border: `1px solid ${resultMsg.errores?.length > 0 ? '#f59e0b' : '#86efac'}`
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1a3c6e' }}>
              Resultado: {MESES[periodo - 1]} {gestion}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
              <span>✅ <strong>{resultMsg.procesados}</strong> activos procesados</span>
              <span>⏭️ <strong>{resultMsg.omitidos}</strong> omitidos</span>
              {resultMsg.errores?.length > 0 && (
                <span style={{ color: '#ef4444' }}>❌ <strong>{resultMsg.errores.length}</strong> errores</span>
              )}
            </div>
            {resultMsg.errores?.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#b45309' }}>
                {resultMsg.errores.map((e: string, i: number) => <div key={i}>• {e}</div>)}
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
          💡 Depreciación mensual = Costo / (Vida Útil en meses del grupo). Activos sin monto o sin grupo configurado serán omitidos. No se duplican registros para el mismo período.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '1rem', gap: '0.5rem' }}>
        <button onClick={() => setActiveTab('resumen')} style={{
          padding: '0.6rem 1.25rem', border: 'none',
          borderBottom: activeTab === 'resumen' ? '3px solid #3b82f6' : '3px solid transparent',
          background: 'none', fontWeight: activeTab === 'resumen' ? '700' : '500',
          color: activeTab === 'resumen' ? '#3b82f6' : '#64748b', cursor: 'pointer'
        }}>📊 Resumen Actual por Activo</button>
        <button onClick={() => setActiveTab('activos')} style={{
          padding: '0.6rem 1.25rem', border: 'none',
          borderBottom: activeTab === 'activos' ? '3px solid #10b981' : '3px solid transparent',
          background: 'none', fontWeight: activeTab === 'activos' ? '700' : '500',
          color: activeTab === 'activos' ? '#10b981' : '#64748b', cursor: 'pointer'
        }}>📋 Proyección / Historial por Activo</button>
      </div>

      {/* TAB: Resumen última depreciación */}
      {activeTab === 'resumen' && (
        <div className="table-container">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1a3c6e' }}>
              Estado Actual de Depreciaciones ({filteredDep.length} activos)
            </h3>
            <input type="text" placeholder="Buscar activo, grupo..."
              value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', width: '260px' }} />
          </div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Grupo</th>
                <th>Último Período</th>
                <th style={{ textAlign: 'right' }}>Costo Orig.</th>
                <th style={{ textAlign: 'right' }}>Dep. Mensual</th>
                <th style={{ textAlign: 'right' }}>Dep. Acumulada</th>
                <th style={{ textAlign: 'right' }}>Valor en Libros</th>
                <th>% Depreciado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                  </tr>
                ))
              ) : filteredDep.length === 0 ? (
                <tr><td colSpan={9} className="empty">No hay registros de depreciación. Use el panel superior para calcular.</td></tr>
              ) : (
                filteredDep.map((d: any) => {
                  const costo = parseFloat(d.valorRevaluo || 0);
                  const acum = parseFloat(d.acumulada || 0);
                  const pct = costo > 0 ? Math.min((acum / costo) * 100, 100) : 0;
                  return (
                    <tr key={`${d.nroSerie}-${d.nroActivo?.nroActivo}`}>
                      <td><strong>{d.nroActivo?.codActivo}</strong></td>
                      <td
                        style={{ maxWidth: '180px' }}
                        className="truncate"
                        title={d.nroActivo?.descripcion}
                      >
                        {d.nroActivo?.descripcion}
                      </td>
                      <td><span className="badge badge-info">{d.nroActivo?.codGrupo?.desGrupo}</span></td>
                      <td><span style={{ fontSize: '0.78rem', color: '#64748b' }}>{formatPeriodo(d.nroSerie)}</span></td>
                      <td style={{ textAlign: 'right' }}>Bs. {costo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444' }}>Bs. {parseFloat(d.depresiacion || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626' }}>Bs. {acum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700 }}>
                        Bs. {parseFloat(d.valorActual || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px', width: `${pct}%`,
                              background: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', minWidth: '36px' }}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: Proyección / Historial por activo */}
      {activeTab === 'activos' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAsset ? '1.2fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="table-container">
            <div style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3c6e', margin: 0 }}>Todos los Activos</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Seleccione un activo para ver el historial acumulado o proyección lineal.</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Código Activo</th>
                  <th>Descripción</th>
                  <th>Grupo</th>
                  <th>Valor Inicial</th>
                  <th>Tasa Anual</th>
                  <th>Dep. Mensual</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                      <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      <td><div className="h-8 bg-gray-200 rounded w-20"></div></td>
                    </tr>
                  ))
                ) : mainData?.todosActivos?.length === 0 ? (
                  <tr><td colSpan={7} className="empty">No hay activos registrados para depreciar</td></tr>
                ) : (
                  mainData?.todosActivos?.map((a: any) => {
                    const monto = a.monto || 0;
                    const tasa = a.codGrupo?.tasaDepreciacion || 0;
                    const depMensual = (monto * tasa) / 100 / 12;
                    const isSelected = selectedAsset?.nroActivo === a.nroActivo;
                    return (
                      <tr key={a.nroActivo} onClick={() => setSelectedAsset(a)}
                        style={{ cursor: 'pointer', background: isSelected ? '#e8f4fd' : 'white' }}>
                        <td><strong>{a.codActivo}</strong></td>
                        <td
                          style={{ maxWidth: '180px' }}
                          className="truncate"
                          title={a.descripcion}
                        >
                          {a.descripcion}
                        </td>
                        <td><span className="badge badge-info">{a.codGrupo?.desGrupo || '-'}</span></td>
                        <td><strong>{monto.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</strong></td>
                        <td>{tasa > 0 ? `${tasa}%` : '-'}</td>
                        <td>{depMensual > 0 ? `${depMensual.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.` : '0.00 Bs.'}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <button className="btn btn-primary btn-sm" onClick={() => setSelectedAsset(a)}>Ver Detalle</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {selectedAsset && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a3c6e', margin: 0 }}>📊 Detalle de Depreciación</h3>
                <button style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setSelectedAsset(null)}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Activo</label>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{selectedAsset.codActivo} — {selectedAsset.descripcion}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Fecha Adquisición</label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedAsset.fecAdqui || 'No registrada'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Valor Inicial</label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a' }}>{(selectedAsset.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Vida Útil del Grupo</label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedAsset.codGrupo?.vidaUtilDefault ? `${selectedAsset.codGrupo.vidaUtilDefault} años` : '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Tasa de Depreciación</label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedAsset.codGrupo?.tasaDepreciacion || 0}% anual</div>
                  </div>
                </div>
              </div>
              <AssetDepList asset={selectedAsset} formatPeriodo={formatPeriodo} />
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

// Subcomponent to query historical records and project if missing
function AssetDepList({ asset, formatPeriodo }: { asset: any; formatPeriodo: (n: number) => string }) {
  const { data, loading, error } = useQuery(GET_DEP_ACUMULADA, {
    variables: { nroActivo: parseInt(asset.nroActivo) },
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  if (error) return <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>Error: {error.message}</div>;

  const realRecords = data?.depAcumuladaPorActivo || [];

  if (realRecords.length > 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
            🧮 Historial de Depreciación (Real por Período)
          </label>
          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Real</span>
        </div>
        <table className="sub-table" style={{ width: '100%', fontSize: '0.8rem', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.4rem 0.75rem' }}>Período</th>
              <th style={{ padding: '0.4rem 0.75rem' }}>Dep. Mensual</th>
              <th style={{ padding: '0.4rem 0.75rem' }}>Acumulada</th>
              <th style={{ padding: '0.4rem 0.75rem' }}>Valor Actual</th>
            </tr>
          </thead>
          <tbody>
            {realRecords.map((r: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx === realRecords.length - 1 ? '#f0fdf4' : 'white' }}>
                <td style={{ padding: '0.4rem 0.75rem' }}><strong>{formatPeriodo(r.nroSerie)}</strong></td>
                <td style={{ padding: '0.4rem 0.75rem', color: '#dc2626' }}>{parseFloat(r.depresiacion || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</td>
                <td style={{ padding: '0.4rem 0.75rem' }}>{parseFloat(r.acumulada || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</td>
                <td style={{ padding: '0.4rem 0.75rem', fontWeight: 600, color: '#16a34a' }}>{parseFloat(r.valorActual || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
          {realRecords.length} período(s) registrado(s) — La fila verde es el más reciente.
        </div>
      </div>
    );
  }

  // Linear projection if no records
  const monto = asset.monto || 0;
  const tasa = asset.codGrupo?.tasaDepreciacion || 0;
  const vidaUtilDefault = asset.codGrupo?.vidaUtilDefault || 5;

  if (monto === 0 || tasa === 0) {
    return (
      <div style={{ padding: '1rem', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
        No se puede generar proyección. El activo no tiene monto o el grupo no tiene tasa anual configurada.
        <br /><small style={{ color: '#64748b' }}>Use el botón "⚙️ Calcular" del panel superior para registrar depreciaciones reales.</small>
      </div>
    );
  }

  const projections = [];
  const depAnual = (monto * tasa) / 100;
  let acumulada = 0;
  for (let year = 1; year <= vidaUtilDefault; year++) {
    acumulada += depAnual;
    projections.push({ year, depAnual, acumulada, valorActual: Math.max(monto - acumulada, 0) });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
          🔮 Proyección Lineal (no hay registros reales aún)
        </label>
        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Proyección</span>
      </div>
      <table className="sub-table" style={{ width: '100%', fontSize: '0.8rem', background: '#f0f9ff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#e0f2fe', textAlign: 'left' }}>
            <th style={{ padding: '0.4rem 0.75rem' }}>Año</th>
            <th style={{ padding: '0.4rem 0.75rem' }}>Dep. Anual</th>
            <th style={{ padding: '0.4rem 0.75rem' }}>Acumulada</th>
            <th style={{ padding: '0.4rem 0.75rem' }}>Valor Residual</th>
          </tr>
        </thead>
        <tbody>
          {projections.map((p, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #bae6fd' }}>
              <td style={{ padding: '0.4rem 0.75rem' }}><strong>Año {p.year}</strong></td>
              <td style={{ padding: '0.4rem 0.75rem' }}>{p.depAnual.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</td>
              <td style={{ padding: '0.4rem 0.75rem' }}>{p.acumulada.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.</td>
              <td style={{ padding: '0.4rem 0.75rem', fontWeight: 600, color: p.valorActual === 0 ? '#b91c1c' : '#0284c7' }}>
                {p.valorActual.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
