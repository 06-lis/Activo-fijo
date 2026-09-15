import PageLayout from '../components/ui/PageLayout';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import {
  GET_LOGS_ACTIVOS_PAGINADOS,
  GET_LOGS_INGRESOS_PAGINADOS,
  GET_LOGS_ASIGNADOS_PAGINADOS,
  GET_LOGS_DET_ASIG_PAGINADOS,
  GET_LOGS_OFICINA_PAGINADOS,
  GET_LOGS_DET_REVAL_PAGINADOS,
  GET_LOGS_BAJA_ACT_PAGINADOS
} from '../graphql/queries';

const ITEMS_POR_PAGINA = 15;

export default function Logs() {
  const { user } = useAuth();
  const puedeVerAuditoria = user?.esAdmin || user?.permisos.includes('ver_auditoria');

  const [activeTab, setActiveTab] = useState<'activos' | 'ingresos' | 'asignaciones' | 'det_asignaciones' | 'oficinas' | 'revaluos' | 'bajas'>('activos');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  const variables = {
    limit: ITEMS_POR_PAGINA,
    offset: (paginaActual - 1) * ITEMS_POR_PAGINA,
    search: busqueda.trim() || ""
  };

  // Queries executed conditionally using skip
  const { data: dataActivos, loading: loadingActivos, refetch: refetchActivos } = useQuery(GET_LOGS_ACTIVOS_PAGINADOS, { variables, skip: activeTab !== 'activos' });
  const { data: dataIngresos, loading: loadingIngresos, refetch: refetchIngresos } = useQuery(GET_LOGS_INGRESOS_PAGINADOS, { variables, skip: activeTab !== 'ingresos' });
  const { data: dataAsignados, loading: loadingAsignados, refetch: refetchAsignados } = useQuery(GET_LOGS_ASIGNADOS_PAGINADOS, { variables, skip: activeTab !== 'asignaciones' });
  const { data: dataDetAsig, loading: loadingDetAsig, refetch: refetchDetAsig } = useQuery(GET_LOGS_DET_ASIG_PAGINADOS, { variables, skip: activeTab !== 'det_asignaciones' });
  const { data: dataOficina, loading: loadingOficina, refetch: refetchOficina } = useQuery(GET_LOGS_OFICINA_PAGINADOS, { variables, skip: activeTab !== 'oficinas' });
  const { data: dataDetReval, loading: loadingDetReval, refetch: refetchDetReval } = useQuery(GET_LOGS_DET_REVAL_PAGINADOS, { variables, skip: activeTab !== 'revaluos' });
  const { data: dataBajaAct, loading: loadingBajaAct, refetch: refetchBajaAct } = useQuery(GET_LOGS_BAJA_ACT_PAGINADOS, { variables, skip: activeTab !== 'bajas' });

  const handleRefresh = () => {
    if (activeTab === 'activos' && refetchActivos) refetchActivos();
    if (activeTab === 'ingresos' && refetchIngresos) refetchIngresos();
    if (activeTab === 'asignaciones' && refetchAsignados) refetchAsignados();
    if (activeTab === 'det_asignaciones' && refetchDetAsig) refetchDetAsig();
    if (activeTab === 'oficinas' && refetchOficina) refetchOficina();
    if (activeTab === 'revaluos' && refetchDetReval) refetchDetReval();
    if (activeTab === 'bajas' && refetchBajaAct) refetchBajaAct();
  };

  // Get active dataset, total count, and loading state
  const { currentList, totalCount, loading } = useMemo(() => {
    switch (activeTab) {
      case 'activos':
        return {
          currentList: dataActivos?.todosLogsActivosPaginados?.results || [],
          totalCount: dataActivos?.todosLogsActivosPaginados?.totalCount || 0,
          loading: loadingActivos
        };
      case 'ingresos':
        return {
          currentList: dataIngresos?.todosLogsIngresosPaginados?.results || [],
          totalCount: dataIngresos?.todosLogsIngresosPaginados?.totalCount || 0,
          loading: loadingIngresos
        };
      case 'asignaciones':
        return {
          currentList: dataAsignados?.todosLogsAsignadosPaginados?.results || [],
          totalCount: dataAsignados?.todosLogsAsignadosPaginados?.totalCount || 0,
          loading: loadingAsignados
        };
      case 'det_asignaciones':
        return {
          currentList: dataDetAsig?.todosLogsDetAsigPaginados?.results || [],
          totalCount: dataDetAsig?.todosLogsDetAsigPaginados?.totalCount || 0,
          loading: loadingDetAsig
        };
      case 'oficinas':
        return {
          currentList: dataOficina?.todosLogsOficinaPaginados?.results || [],
          totalCount: dataOficina?.todosLogsOficinaPaginados?.totalCount || 0,
          loading: loadingOficina
        };
      case 'revaluos':
        return {
          currentList: dataDetReval?.todosLogsDetRevalPaginados?.results || [],
          totalCount: dataDetReval?.todosLogsDetRevalPaginados?.totalCount || 0,
          loading: loadingDetReval
        };
      case 'bajas':
        return {
          currentList: dataBajaAct?.todosLogsBajaActPaginados?.results || [],
          totalCount: dataBajaAct?.todosLogsBajaActPaginados?.totalCount || 0,
          loading: loadingBajaAct
        };
      default:
        return { currentList: [], totalCount: 0, loading: false };
    }
  }, [
    activeTab,
    dataActivos, loadingActivos,
    dataIngresos, loadingIngresos,
    dataAsignados, loadingAsignados,
    dataDetAsig, loadingDetAsig,
    dataOficina, loadingOficina,
    dataDetReval, loadingDetReval,
    dataBajaAct, loadingBajaAct
  ]);

  // Handle Tab Switch (reset page and query search)
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setBusqueda('');
    setPaginaActual(1);
  };

  // Pagination calculations
  const totalPaginas = Math.ceil(totalCount / ITEMS_POR_PAGINA);
  const paginaActualSegura = Math.min(paginaActual, totalPaginas || 1);
  const paginatedList = currentList;


  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('es-BO');
    } catch {
      return dateStr;
    }
  };

  const getTipoActualLabel = (tipo: string) => {
    if (tipo === 'I') return <span className="badge badge-success">INSERT</span>;
    if (tipo === 'U') return <span className="badge badge-warning">UPDATE</span>;
    if (tipo === 'D') return <span className="badge badge-danger">DELETE</span>;
    return <span className="badge badge-secondary">{tipo || 'MOD'}</span>;
  };

  if (!puedeVerAuditoria) {
    return (
      <PageLayout
        title="Acceso Restringido"
        subtitle="No tiene los permisos necesarios para ver esta sección."
      >
        <div className="error-container" style={{ padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#666' }}>Se requiere el permiso de 'Ver Auditoría' para ingresar a la bitácora de transacciones.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Bitácora de Transacciones"
      subtitle="Historial y auditoría de los movimientos registrados en las tablas del sistema."
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: handleRefresh },
      ]}
    >


      {/* TABS HEADER */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e2e8f0', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'activos', label: 'Activos' },
          { id: 'ingresos', label: 'Ingresos' },
          { id: 'asignaciones', label: 'Asignaciones' },
          { id: 'det_asignaciones', label: 'Detalle Asignaciones' },
          { id: 'oficinas', label: 'Oficinas' },
          { id: 'revaluos', label: 'Revalúos' },
          { id: 'bajas', label: 'Bajas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '0.6rem 1.1rem',
              border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid #1a3c6e' : '3px solid transparent',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#1a3c6e' : '#64748b',
              cursor: 'pointer',
              fontSize: '0.88rem',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 shadow-sm">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Buscar en logs de ${activeTab}...`}
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPaginaActual(1); }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-2 rounded-lg">
            Total Logs: {totalCount}
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="loading py-16 text-center text-slate-500">Cargando bitácora de auditoría...</div>
      ) : (
        <div className="table-container shadow-md border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              {activeTab === 'activos' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nro Activo</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Adquisición</th>
                  <th className="px-4 py-3">Nro Serie</th>
                  <th className="px-4 py-3">Fecha Transacción</th>
                  <th className="px-4 py-3">Operación</th>
                </tr>
              )}
              {activeTab === 'ingresos' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nro Ingreso</th>
                  <th className="px-4 py-3">Gestión</th>
                  <th className="px-4 py-3">Fecha Recepción</th>
                  <th className="px-4 py-3">Glosa</th>
                  <th className="px-4 py-3">Fecha Transacción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Operación</th>
                </tr>
              )}
              {activeTab === 'asignaciones' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cod Asig</th>
                  <th className="px-4 py-3">Resp. ID</th>
                  <th className="px-4 py-3">Oficina ID</th>
                  <th className="px-4 py-3">Fecha Asig</th>
                  <th className="px-4 py-3">Observaciones</th>
                  <th className="px-4 py-3">Fecha Log</th>
                  <th className="px-4 py-3">Operación</th>
                </tr>
              )}
              {activeTab === 'det_asignaciones' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cod Asig</th>
                  <th className="px-4 py-3">Nro Activo</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Fecha Trans.</th>
                  <th className="px-4 py-3">Actualizado</th>
                  <th className="px-4 py-3">Operación</th>
                </tr>
              )}
              {activeTab === 'oficinas' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cod Ofic</th>
                  <th className="px-4 py-3">Cod Dpto</th>
                  <th className="px-4 py-3">Descripción Oficina</th>
                  <th className="px-4 py-3">Padre</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">A/B</th>
                  <th className="px-4 py-3">Fecha Cambio</th>
                  <th className="px-4 py-3">Operación</th>
                </tr>
              )}
              {activeTab === 'revaluos' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cod Reval</th>
                  <th className="px-4 py-3">Nro Activo</th>
                  <th className="px-4 py-3">Vida Útil (Mes/Año)</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Fecha Reval</th>
                  <th className="px-4 py-3">Fecha Log</th>
                  <th className="px-4 py-3">Operación</th>
                </tr>
              )}
              {activeTab === 'bajas' && (
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Baja Nro</th>
                  <th className="px-4 py-3">Cod Asig</th>
                  <th className="px-4 py-3">Nro Activo</th>
                  <th className="px-4 py-3">Autorizador ID</th>
                  <th className="px-4 py-3">Baja Técnica</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Valor Final</th>
                  <th className="px-4 py-3">Fecha Log</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 italic">
                    No se encontraron registros de auditoría en esta sección.
                  </td>
                </tr>
              )}

              {activeTab === 'activos' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-600">{item.nroActivo}</td>
                  <td className="px-4 py-2.5 font-mono text-blue-600 text-xs">{item.codActivo || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-[280px] truncate">{item.descripcion || '-'}</td>
                  <td className="px-4 py-2.5 font-medium text-emerald-600">
                    {item.monto ? `Bs. ${parseFloat(item.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.fecAdqui || '-'}</td>
                  <td className="px-4 py-2.5 text-xs font-mono">{item.nroSerie || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaTrans)}</td>
                  <td className="px-4 py-2.5">{getTipoActualLabel(item.tipoActual)}</td>
                </tr>
              ))}

              {activeTab === 'ingresos' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-600">{item.nroIngreso}</td>
                  <td className="px-4 py-2.5">{item.gestion || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.fechaRecep || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-[240px] truncate">{item.glosa || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaTrans)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.estado === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                      {item.estado === 'A' ? 'ACTIVO' : item.estado || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{getTipoActualLabel(item.tipoME)}</td>
                </tr>
              ))}

              {activeTab === 'asignaciones' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-600">{item.codAsig}</td>
                  <td className="px-4 py-2.5 text-xs">Emp. #{item.codResp}</td>
                  <td className="px-4 py-2.5 text-xs">Ofic. #{item.codOfic}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.fechaAsig || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">{item.obs || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaAct)}</td>
                  <td className="px-4 py-2.5">{getTipoActualLabel(item.tipoLog)}</td>
                </tr>
              ))}

              {activeTab === 'det_asignaciones' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-semibold">{item.codAsig}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-blue-600">Activo #{item.nroActivo}</td>
                  <td className="px-4 py-2.5 text-xs">{item.cantidad}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.fechaTrans || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaTransAct)}</td>
                  <td className="px-4 py-2.5">{getTipoActualLabel(item.tipoActual)}</td>
                </tr>
              ))}

              {activeTab === 'oficinas' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-semibold">{item.codOfic}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{item.codDpto}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-medium">{item.desDpto}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">Padre #{item.codPadre}</td>
                  <td className="px-4 py-2.5 text-xs">{item.nivel}</td>
                  <td className="px-4 py-2.5 font-bold text-center">
                    <span className={item.aB === 'A' ? 'text-emerald-600' : 'text-red-500'}>{item.aB}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaMe)}</td>
                  <td className="px-4 py-2.5">{getTipoActualLabel(item.tipoMe)}</td>
                </tr>
              ))}

              {activeTab === 'revaluos' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-semibold">Resol. #{item.codReval}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-blue-600">Activo #{item.nroActivo}</td>
                  <td className="px-4 py-2.5 text-xs">{item.vidaUtilMes} mes / {item.vidaUtilAno} año</td>
                  <td className="px-4 py-2.5 font-medium text-emerald-600">Bs. {parseFloat(item.costo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.fechaReval || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaActual)}</td>
                  <td className="px-4 py-2.5">{getTipoActualLabel(item.tipoActual)}</td>
                </tr>
              ))}

              {activeTab === 'bajas' && paginatedList.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">#{item.id}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-semibold">{item.nro}</td>
                  <td className="px-4 py-2.5 text-xs">Asig. #{item.codAsig}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-blue-600">Activo #{item.nroActivo}</td>
                  <td className="px-4 py-2.5 text-xs">Aut. #{item.codEmpAut}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{item.fechaBajaTe || '-'}</td>
                  <td className="px-4 py-2.5 font-bold uppercase">{item.motivo || '-'}</td>
                  <td className="px-4 py-2.5 font-medium text-red-500">
                    {item.valorFinal ? `Bs. ${parseFloat(item.valorFinal).toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(item.fechaTrans)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION PANEL */}
      {!loading && totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
          <span className="text-slate-500 text-sm">
            Página {paginaActualSegura} de {totalPaginas} (Mostrando {paginatedList.length} de {totalCount} registros)
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))} 
              disabled={paginaActualSegura === 1} 
              className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            <button 
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} 
              disabled={paginaActualSegura === totalPaginas} 
              className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
