import PageLayout from '../components/ui/PageLayout';
import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    todosActivos(soloActivos: false) {
      nroActivo
      codActivo
      descripcion
      monto
      aB
      estadoRegistro
    }
    todasAsignaciones {
      codAsig
      estado
    }
    todosIngresos {
      nroIngreso
      glosa
      estado
    }
    ultimasDepreciaciones {
      nroSerie
      depresiacion
      acumulada
      valorActual
    }
    todasBajasDetalladas {
      nro
      valorFinal
    }
  }
`;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    fetchPolicy: 'cache-and-network'
  });

  // Permissions check
  const puedeVerActivos = !!(user?.esAdmin || user?.permisos?.includes('ver_activos'));
  const puedeVerIngresos = !!(user?.esAdmin || user?.permisos?.includes('ver_ingresos'));
  const puedeVerAsignaciones = !!(user?.esAdmin || user?.permisos?.includes('ver_asignaciones'));
  const puedeVerBajas = !!(user?.esAdmin || user?.permisos?.includes('ver_bajas'));
  const puedeVerDepreciaciones = !!(user?.esAdmin || user?.permisos?.includes('ver_depreciaciones'));

  // Calculations
  const statsActivos = useMemo(() => {
    if (!data?.todosActivos) return null;
    const list = data.todosActivos;
    const activos = list.filter((a: any) => a.aB !== 'B');
    const bajas = list.filter((a: any) => a.aB === 'B');
    const totalValoration = activos.reduce((acc: number, curr: any) => acc + (parseFloat(curr.monto) || 0), 0);
    return {
      total: list.length,
      activosCount: activos.length,
      bajasCount: bajas.length,
      valoracion: totalValoration,
      promedio: activos.length ? totalValoration / activos.length : 0
    };
  }, [data]);

  const statsIngresos = useMemo(() => {
    if (!data?.todosIngresos) return null;
    const list = data.todosIngresos;
    const activos = list.filter((i: any) => i.estado === 'A' || i.estado === '1');
    return {
      total: list.length,
      activosCount: activos.length,
      recientes: list.slice(-3).reverse()
    };
  }, [data]);

  const statsAsignaciones = useMemo(() => {
    if (!data?.todasAsignaciones) return null;
    const list = data.todasAsignaciones;
    const activas = list.filter((a: any) => a.estado === 'A');
    return {
      total: list.length,
      activasCount: activas.length
    };
  }, [data]);

  const statsBajas = useMemo(() => {
    if (!data?.todasBajasDetalladas) return null;
    const list = data.todasBajasDetalladas;
    const totalImpacto = list.reduce((acc: number, curr: any) => acc + (parseFloat(curr.valorFinal) || 0), 0);
    return {
      total: list.length,
      impacto: totalImpacto
    };
  }, [data]);

  const statsDepreciaciones = useMemo(() => {
    if (!data?.ultimasDepreciaciones) return null;
    const list = data.ultimasDepreciaciones;
    const totalAcumulada = list.reduce((acc: number, curr: any) => acc + (parseFloat(curr.acumulada) || 0), 0);
    const totalActual = list.reduce((acc: number, curr: any) => acc + (parseFloat(curr.valorActual) || 0), 0);
    return {
      total: list.length,
      acumulada: totalAcumulada,
      actual: totalActual,
      recientes: list.slice(-3).reverse()
    };
  }, [data]);

  if (loading) return <div className="loading">Cargando panel de control...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const hasAnyReport = puedeVerActivos || puedeVerIngresos || puedeVerAsignaciones || puedeVerBajas || puedeVerDepreciaciones;

  const handlePrint = () => {
    window.print();
  };

  const handleExportValuacionCSV = () => {
    if (!statsActivos) return;
    const headers = ['Concepto', 'Monto/Cantidad', 'Detalle'];
    const rows = [
      ['Valoración Total del Inventario', `${statsActivos.valoracion.toFixed(2)} Bs.`, 'Suma de adquisición de activos vigentes'],
      ['Valor Promedio por Activo', `${statsActivos.promedio.toFixed(2)} Bs.`, 'Promedio de adquisición por activo vigente'],
      ['Activos Fijos Vigentes', String(statsActivos.activosCount), 'Cantidad física activa'],
      ['Activos Dados de Baja', String(statsActivos.bajasCount), 'Cantidad física dada de baja']
    ];

    const csvContent = "\uFEFF"
      + [headers.join(';'), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_valoracion_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDepreciacionCSV = () => {
    if (!data?.ultimasDepreciaciones) return;
    const headers = ['Nro Serie', 'Depreciación del Período', 'Depreciación Acumulada', 'Valor Actual Neto'];
    const rows = data.ultimasDepreciaciones.map((d: any) => [
      d.nroSerie || '',
      parseFloat(d.depresiacion).toFixed(2),
      parseFloat(d.acumulada).toFixed(2),
      parseFloat(d.valorActual).toFixed(2)
    ]);

    const csvContent = "\uFEFF"
      + [headers.join(';'), ...rows.map((r: any) => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_depreciaciones_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportIngresosCSV = () => {
    if (!data?.todosIngresos) return;
    const headers = ['Nro Ingreso', 'Glosa', 'Estado'];
    const rows = data.todosIngresos.map((i: any) => [
      i.nroIngreso || '',
      i.glosa || 'Sin glosa',
      i.estado === 'A' || i.estado === '1' ? 'Activo' : 'Cerrado'
    ]);

    const csvContent = "\uFEFF"
      + [headers.join(';'), ...rows.map((r: any) => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_ingresos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* CSS overrides for print layout */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .page-card, .sidebar, .topbar, .no-print {
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
      <PageLayout
        title="Panel de Control (Dashboard)"
        subtitle="Resumen ejecutivo y estadísticas clave del sistema"
        actions={[
          { label: 'Exportar Reporte (PDF)', icon: '↓', variant: 'primary', onClick: handlePrint },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() }
        ]}
      >
        {!hasAnyReport ? (
          <div className="dash-no-report">
            Bienvenido al sistema. Su usuario no posee permisos para visualizar reportes en el panel de control.
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Fila de Tarjetas Resumen Principales */}
            <div className="dashboard-grid-4">
              {puedeVerActivos && statsActivos && (
                <div className="dash-stat-card activos">
                  <span className="dash-stat-card-title">
                    Activos Fijos Vigentes
                  </span>
                  <span className="dash-stat-card-value">
                    {statsActivos.activosCount}
                  </span>
                  <Link to="/activos" className="dash-stat-card-link">
                    Ver inventario →
                  </Link>
                </div>
              )}

              {puedeVerIngresos && statsIngresos && (
                <div className="dash-stat-card ingresos">
                  <span className="dash-stat-card-title">
                    Ingresos de Bienes
                  </span>
                  <span className="dash-stat-card-value">
                    {statsIngresos.total}
                  </span>
                  <Link to="/ingresos" className="dash-stat-card-link" style={{ color: '#006600' }}>
                    Ver ingresos →
                  </Link>
                </div>
              )}

              {puedeVerAsignaciones && statsAsignaciones && (
                <div className="dash-stat-card asignaciones">
                  <span className="dash-stat-card-title">
                    Asignaciones Activas
                  </span>
                  <span className="dash-stat-card-value">
                    {statsAsignaciones.activasCount}
                  </span>
                  <Link to="/asignaciones" className="dash-stat-card-link" style={{ color: '#6a1b9a' }}>
                    Ver asignaciones →
                  </Link>
                </div>
              )}

              {puedeVerBajas && statsBajas && (
                <div className="dash-stat-card bajas">
                  <span className="dash-stat-card-title">
                    Bajas de Activos
                  </span>
                  <span className="dash-stat-card-value">
                    {statsBajas.total}
                  </span>
                  <Link to="/bajas" className="dash-stat-card-link" style={{ color: '#cc0000' }}>
                    Ver bajas →
                  </Link>
                </div>
              )}
            </div>

            {/* Gráficos Estadísticos */}
            {(puedeVerActivos || puedeVerDepreciaciones) && (
              <div className="dashboard-grid-2" style={{ marginTop: '12px' }}>
                {puedeVerActivos && statsActivos && (
                  <div className="panel">
                    <div className="panel-header">Composición Física de Activos</div>
                    <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', background: 'var(--bg-white)' }}>
                      <DonutChart
                        vigentes={statsActivos.activosCount}
                        bajas={statsActivos.bajasCount}
                        onSliceClick={(label) => {
                          if (label === 'Vigentes') navigate('/activos');
                          if (label === 'Bajas') navigate('/bajas');
                        }}
                      />
                    </div>
                  </div>
                )}
                {puedeVerActivos && statsActivos && (
                  <div className="panel">
                    <div className="panel-header">Distribución Monetaria del Inventario</div>
                    <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', background: 'var(--bg-white)' }}>
                      <BarChart
                        valoracion={statsActivos.valoracion}
                        acumulada={statsDepreciaciones?.acumulada || 0}
                        actual={statsDepreciaciones?.actual || 0}
                        bajas={statsBajas?.impacto || 0}
                        onBarClick={(label) => {
                          if (label === 'Val. Inicial') navigate('/activos');
                          if (label === 'Dep. Acum.') navigate('/depreciaciones');
                          if (label === 'Valor Neto') navigate('/depreciaciones');
                          if (label === 'Imp. Bajas') navigate('/bajas');
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reportes Detallados Agrupados */}
            <div className="dash-panel-group">
              
              {/* Reporte de Activos & Valoración */}
              {puedeVerActivos && statsActivos && (
                <div className="panel">
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Valoración del Inventario</span>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '1px 6px', fontSize: '0.65rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      onClick={handleExportValuacionCSV}
                    >
                      Exportar CSV
                    </button>
                  </div>
                  <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="dash-stat-inner-grid">
                      <div className="dash-stat-inner-box">
                        <span className="dash-stat-inner-label">VALORACIÓN TOTAL</span>
                        <span className="dash-stat-inner-val">
                          {statsActivos.valoracion.toFixed(2)} Bs.
                        </span>
                      </div>
                      <div className="dash-stat-inner-box">
                        <span className="dash-stat-inner-label">VALOR PROMEDIO ACTIVO</span>
                        <span className="dash-stat-inner-val" style={{ color: '#4a6490' }}>
                          {statsActivos.promedio.toFixed(2)} Bs.
                        </span>
                      </div>
                    </div>
                    <div className="dash-list-items">
                      <div className="dash-row-details">
                        <span>Activos registrados (Borradores + Aprobados)</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{statsActivos.total}</span>
                      </div>
                      <div className="dash-row-details">
                        <span>Activos dados de baja físicamente</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{statsActivos.bajasCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reporte de Depreciación */}
              {puedeVerDepreciaciones && statsDepreciaciones && (
                <div className="panel">
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Depreciación Contable Consolidada</span>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '1px 6px', fontSize: '0.65rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      onClick={handleExportDepreciacionCSV}
                    >
                      Exportar CSV
                    </button>
                  </div>
                  <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="dash-stat-inner-grid">
                      <div className="dash-stat-inner-box">
                        <span className="dash-stat-inner-label">DEPRECIACIÓN ACUMULADA</span>
                        <span className="dash-stat-inner-val depreciacion">
                          {statsDepreciaciones.acumulada.toFixed(2)} Bs.
                        </span>
                      </div>
                      <div className="dash-stat-inner-box">
                        <span className="dash-stat-inner-label">VALOR ACTUAL NETO</span>
                        <span className="dash-stat-inner-val actual">
                          {statsDepreciaciones.actual.toFixed(2)} Bs.
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="dash-sub-panel-title" style={{ display: 'block', fontSize: '0.62rem', marginBottom: '6px' }}>Últimos Cálculos de Depreciación</span>
                      <div className="dash-list-items">
                        {statsDepreciaciones.recientes.length === 0 ? (
                          <div style={{ fontSize: '0.7rem', color: '#7a96b8', fontStyle: 'italic' }}>No hay registros de depreciación recientes.</div>
                        ) : (
                          statsDepreciaciones.recientes.map((d: any, idx: number) => (
                            <div key={`${d.nroSerie}-${idx}`} className="dash-list-item">
                              <span>Depreciación Serie #{d.nroSerie}</span>
                              <span className="dash-stat-inner-val depreciacion" style={{ fontSize: '0.72rem' }}>
                                -{parseFloat(d.depresiacion).toFixed(2)} Bs.
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reporte de Ingresos Recientes */}
              {puedeVerIngresos && statsIngresos && (
                <div className="panel">
                  <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Resumen de Ingresos de Bienes</span>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: '1px 6px', fontSize: '0.65rem', color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                      onClick={handleExportIngresosCSV}
                    >
                      Exportar CSV
                    </button>
                  </div>
                  <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="dash-row-details">
                      <span>Total de transacciones de ingreso:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{statsIngresos.total}</span>
                    </div>
                    <div>
                      <span className="dash-sub-panel-title" style={{ display: 'block', fontSize: '0.62rem', marginBottom: '6px' }}>Últimas Actas / Glosas de Ingreso</span>
                      <div className="dash-list-items">
                        {statsIngresos.recientes.length === 0 ? (
                          <div style={{ fontSize: '0.7rem', color: '#7a96b8', fontStyle: 'italic' }}>No hay ingresos recientes.</div>
                        ) : (
                          statsIngresos.recientes.map((i: any, idx: number) => (
                            <div key={`${i.nroIngreso}-${idx}`} className="dash-list-item">
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                                <strong style={{ fontFamily: 'monospace' }}>#{i.nroIngreso}</strong>
                                <span style={{ color: '#4a6490', marginLeft: '6px', fontStyle: 'italic' }}>{i.glosa || 'Sin glosa'}</span>
                              </div>
                              <span className="dash-badge-status" style={{
                                color: i.estado === 'A' || i.estado === '1' ? '#006600' : '#5a5a5a',
                                background: i.estado === 'A' || i.estado === '1' ? '#dcfce7' : '#f1f5f9',
                                border: i.estado === 'A' || i.estado === '1' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                padding: '1px 4px'
                              }}>
                                {i.estado === 'A' || i.estado === '1' ? 'Activo' : 'Cerrado'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reporte de Bajas e Impacto Financiero */}
              {puedeVerBajas && statsBajas && (
                <div className="panel">
                  <div className="panel-header">Bajas de Activos Consolidadas</div>
                  <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="dash-stat-full-box">
                      <span className="dash-stat-inner-label">IMPACTO FINANCIERO TOTAL</span>
                      <span className="dash-stat-inner-val bajas" style={{ fontSize: '1.5rem' }}>
                        -{statsBajas.impacto.toFixed(2)} Bs.
                      </span>
                      <p style={{ color: '#4a6490', fontSize: '0.65rem', marginTop: '6px', lineHeight: '1.3' }}>
                        Valor total de los activos retirados del servicio por obsolescencia, daño o desuso.
                      </p>
                    </div>
                    <div className="dash-row-details">
                      <span>Cantidad de actas de baja técnica formal:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{statsBajas.total}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </PageLayout>

      {/* HIDDEN PRINT COMPONENT */}
      <div className="print-container">
        <PrintableDashboard 
          statsActivos={statsActivos}
          statsIngresos={statsIngresos}
          statsAsignaciones={statsAsignaciones}
          statsBajas={statsBajas}
          statsDepreciaciones={statsDepreciaciones}
          puedeVerActivos={puedeVerActivos}
          puedeVerIngresos={puedeVerIngresos}
          puedeVerAsignaciones={puedeVerAsignaciones}
          puedeVerBajas={puedeVerBajas}
          puedeVerDepreciaciones={puedeVerDepreciaciones}
        />
      </div>
    </>
  );
}

// ==================== VISUAL CHART COMPONENTS (SVG NATIVE) ====================
function DonutChart({ vigentes, bajas, onSliceClick }: { vigentes: number, bajas: number, onSliceClick?: (label: string) => void }) {
  const total = vigentes + bajas;
  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        No hay datos suficientes para graficar.
      </div>
    );
  }

  const pctVigentes = (vigentes / total) * 100;
  const pctBajas = (bajas / total) * 100;

  const radius = 35;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~219.9
  
  const vigentesLength = (pctVigentes / 100) * circumference;
  const bajasLength = (pctBajas / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
      <style>{`
        .clickable-slice {
          transition: all 0.25s ease-in-out;
          transform-origin: center;
        }
        .clickable-slice:hover {
          stroke-width: 14.5px;
          filter: brightness(1.2);
        }
        .clickable-legend {
          transition: all 0.2s ease;
          padding: 3px 6px;
          border-radius: 4px;
        }
        .clickable-legend:hover {
          background-color: #f1f5f9;
        }
      `}</style>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Vigentes slice (Blue) */}
          {vigentes > 0 && (
            <circle
              className="clickable-slice"
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--blue)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${vigentesLength} ${circumference}`}
              strokeDashoffset="0"
              style={{ transition: 'stroke-dasharray 0.5s ease', cursor: 'pointer' }}
              onClick={() => onSliceClick?.('Vigentes')}
            />
          )}
          {/* Bajas slice (Red) */}
          {bajas > 0 && (
            <circle
              className="clickable-slice"
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#cc0000"
              strokeWidth={strokeWidth}
              strokeDasharray={`${bajasLength} ${circumference}`}
              strokeDashoffset={`-${vigentesLength}`}
              style={{ transition: 'stroke-dasharray 0.5s ease', cursor: 'pointer' }}
              onClick={() => onSliceClick?.('Bajas')}
            />
          )}
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total</span>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--navy)' }}>{total}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', minWidth: '120px' }}>
        <div className="clickable-legend" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => onSliceClick?.('Vigentes')}>
          <div style={{ width: '10px', height: '10px', background: 'var(--blue)' }}></div>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Vigentes:</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'monospace' }}>{vigentes} ({pctVigentes.toFixed(1)}%)</span>
        </div>
        <div className="clickable-legend" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => onSliceClick?.('Bajas')}>
          <div style={{ width: '10px', height: '10px', background: '#cc0000' }}></div>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Bajas:</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'monospace' }}>{bajas} ({pctBajas.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}

function BarChart({ valoracion, acumulada, actual, bajas, onBarClick }: { valoracion: number, acumulada: number, actual: number, bajas: number, onBarClick?: (label: string) => void }) {
  const values = [valoracion, acumulada, actual, bajas];
  const maxVal = Math.max(...values, 100); // Evitar división por cero, escala mínima 100
  
  const formatBs = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M Bs.`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k Bs.`;
    return `${v.toFixed(0)} Bs.`;
  };

  const categories = [
    { label: 'Val. Inicial', val: valoracion, color: 'var(--blue)' },
    { label: 'Dep. Acum.', val: acumulada, color: 'var(--orange)' },
    { label: 'Valor Neto', val: actual, color: '#006600' },
    { label: 'Imp. Bajas', val: bajas, color: '#cc0000' }
  ];

  const svgWidth = 350;
  const svgHeight = 150;
  const chartHeight = 110; // Altura para las barras
  const paddingLeft = 55;
  const paddingRight = 10;
  const paddingTop = 15;

  const barWidth = 30;
  const gap = 30;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        .clickable-bar-group {
          transition: all 0.2s ease-in-out;
        }
        .clickable-bar-group:hover rect.val-rect {
          filter: brightness(1.25);
        }
        .clickable-bar-group:hover text {
          fill: #000000 !important;
          font-weight: 800 !important;
        }
      `}</style>
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
        {/* Líneas de cuadrícula e indicador de eje Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = paddingTop + chartHeight - ratio * chartHeight;
          const labelVal = ratio * maxVal;
          return (
            <g key={index}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="8px"
                fontWeight="bold"
                fill="var(--text-muted)"
              >
                {ratio === 0 ? '0' : formatBs(labelVal)}
              </text>
            </g>
          );
        })}

        {/* Barras verticales */}
        {categories.map((c, i) => {
          const barHeight = (c.val / maxVal) * chartHeight;
          const x = paddingLeft + gap + i * (barWidth + gap);
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={i} className="clickable-bar-group" style={{ cursor: 'pointer' }} onClick={() => onBarClick?.(c.label)}>
              <rect
                className="val-rect"
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)} // Altura mínima de 2px para que se note
                fill={c.color}
                style={{ transition: 'all 0.5s ease' }}
              />
              {c.val > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize="7.5px"
                  fontWeight="bold"
                  fill="var(--text-primary)"
                >
                  {c.val >= 1000000 ? `${(c.val / 1000000).toFixed(1)}M` : c.val >= 1000 ? `${(c.val / 1000).toFixed(0)}k` : c.val.toFixed(0)}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 12}
                textAnchor="middle"
                fontSize="8px"
                fontWeight="bold"
                fill="var(--text-label)"
              >
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ==================== PRINTABLE DASHBOARD SHEET ====================
function PrintableDashboard({
  statsActivos,
  statsIngresos,
  statsAsignaciones,
  statsBajas,
  statsDepreciaciones,
  puedeVerActivos,
  puedeVerIngresos,
  puedeVerAsignaciones,
  puedeVerBajas,
  puedeVerDepreciaciones
}: {
  statsActivos: any;
  statsIngresos: any;
  statsAsignaciones: any;
  statsBajas: any;
  statsDepreciaciones: any;
  puedeVerActivos: boolean;
  puedeVerIngresos: boolean;
  puedeVerAsignaciones: boolean;
  puedeVerBajas: boolean;
  puedeVerDepreciaciones: boolean;
}) {
  const formatBs = (v: number) => {
    return `Bs. ${v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ background: 'white', padding: '30px', color: 'black', fontFamily: '"Arial", sans-serif', maxWidth: '800px', margin: '0 auto', fontSize: '11px', lineHeight: '1.4' }}>
      {/* Membrete e Institución */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #0f172a', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#475569' }}>Dirección Universitaria de Activos Fijos</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', border: '2px solid #0f6fc5', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', color: '#0f6fc5' }}>
            REPORTE CONSOLIDADO EJECUTIVO
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontSize: '10px', color: '#64748b' }}>
        <span><strong>Fecha de Emisión:</strong> {new Date().toLocaleString('es-BO')}</span>
        <span style={{ marginLeft: '20px' }}><strong>Tipo de Reporte:</strong> Resumen General de Módulos</span>
      </div>

      {/* 1. RESUMEN FÍSICO */}
      <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10.5px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', borderLeft: '4px solid #0f6fc5' }}>
        1. Resumen Físico del Inventario (Cantidades)
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #0f172a', background: '#f8fafc' }}>
            <th style={{ padding: '6px', textAlign: 'left' }}>Módulo</th>
            <th style={{ padding: '6px', textAlign: 'left' }}>Métrica de Control</th>
            <th style={{ padding: '6px', textAlign: 'right' }}>Total Registrado</th>
            <th style={{ padding: '6px', textAlign: 'left' }}>Detalle/Estado</th>
          </tr>
        </thead>
        <tbody>
          {puedeVerActivos && statsActivos && (
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Activos Fijos</td>
              <td style={{ padding: '6px' }}>Bienes de Uso Activos</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{statsActivos.activosCount}</td>
              <td style={{ padding: '6px', color: '#475569' }}>De un total de {statsActivos.total} bienes registrados (incluyendo bajas)</td>
            </tr>
          )}
          {puedeVerIngresos && statsIngresos && (
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Ingresos</td>
              <td style={{ padding: '6px' }}>Actas de Ingreso</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{statsIngresos.total}</td>
              <td style={{ padding: '6px', color: '#475569' }}>{statsIngresos.activosCount} actas en estado activo</td>
            </tr>
          )}
          {puedeVerAsignaciones && statsAsignaciones && (
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Asignaciones</td>
              <td style={{ padding: '6px' }}>Actas de Asignación Activas</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{statsAsignaciones.activasCount}</td>
              <td style={{ padding: '6px', color: '#475569' }}>Total de actas de custodia vigentes en oficinas</td>
            </tr>
          )}
          {puedeVerBajas && statsBajas && (
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px', fontWeight: 'bold' }}>Bajas</td>
              <td style={{ padding: '6px' }}>Actas de Baja Técnica</td>
              <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{statsBajas.total}</td>
              <td style={{ padding: '6px', color: '#475569' }}>Retirados formalmente de la contabilidad</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 2. VALORACIÓN FINANCIERA */}
      <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10.5px', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase', borderLeft: '4px solid #0f6fc5' }}>
        2. Estado Financiero Contable Consolidado
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
        <div>
          <h3 style={{ fontSize: '9.5px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#475569' }}>Valoración de Activos Vigentes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              {puedeVerActivos && statsActivos && (
                <>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Valoración Total Inicial:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold' }}>{formatBs(statsActivos.valoracion)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Valor Promedio por Bien:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right' }}>{formatBs(statsActivos.promedio)}</td>
                  </tr>
                </>
              )}
              {puedeVerBajas && statsBajas && (
                <tr>
                  <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#cc0000' }}>Impacto de Bajas Acumulado:</td>
                  <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold', color: '#cc0000' }}>-{formatBs(statsBajas.impacto)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div>
          <h3 style={{ fontSize: '9.5px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#475569' }}>Cálculos de Depreciación</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              {puedeVerDepreciaciones && statsDepreciaciones && (
                <>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#ea580c' }}>Depreciación Acumulada:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold', color: '#ea580c' }}>-{formatBs(statsDepreciaciones.acumulada)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#006600' }}>Valor Neto Actual:</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 'bold', color: '#006600' }}>{formatBs(statsDepreciaciones.actual)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. GRÁFICOS IMPRESOS */}
      <h2 style={{ background: '#f1f5f9', padding: '4px 8px', fontSize: '10.5px', fontWeight: 'bold', margin: '20px 0 10px 0', textTransform: 'uppercase', borderLeft: '4px solid #0f6fc5' }}>
        3. Representación Gráfica del Inventario
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', marginBottom: '40px', alignItems: 'center', justifyItems: 'center' }}>
        {puedeVerActivos && statsActivos && (
          <div style={{ width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', padding: '15px', background: '#f8fafc' }}>
            <span style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Composición Física de Activos</span>
            <DonutChart vigentes={statsActivos.activosCount} bajas={statsActivos.bajasCount} />
          </div>
        )}
        {puedeVerActivos && statsActivos && (
          <div style={{ width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', padding: '15px', background: '#f8fafc' }}>
            <span style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distribución Monetaria (Bs.)</span>
            <BarChart
              valoracion={statsActivos.valoracion}
              acumulada={statsDepreciaciones?.acumulada || 0}
              actual={statsDepreciaciones?.actual || 0}
              bajas={statsBajas?.impacto || 0}
            />
          </div>
        )}
      </div>

      {/* Firmas Autorizadas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '70px', textAlign: 'center' }}>
        <div>
          <div style={{ borderTop: '1px solid #475569', width: '220px', margin: '0 auto 5px auto' }}></div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '9px' }}>JEFE DE CONTROL DE BIENES</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#64748b' }}>Dirección de Activos Fijos — UAGRM</p>
        </div>
        <div>
          <div style={{ borderTop: '1px solid #475569', width: '220px', margin: '0 auto 5px auto' }}></div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '9px' }}>DIRECTOR ADM. FINANCIERO</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '8px', color: '#64748b' }}>Autoridad Universitaria — UAGRM</p>
        </div>
      </div>

      {/* Pie de Página */}
      <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '50px', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#64748b' }}>
        <span>Sistema de Gestión de Activos Fijos UAGRM v2.0</span>
        <span>Fecha de Impresión: {new Date().toLocaleString('es-BO')}</span>
      </div>
    </div>
  );
}
