import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/* HU-LEG-NEW-02 — Dashboard Ejecutivo de Métricas Patrimoniales.
   Usa la query `dashboardResumen` (activo/schema/dashboard.py). */

const GET_DASHBOARD_RESUMEN = gql`
  query GetDashboardResumen {
    dashboardResumen {
      totalActivos
      valorTotal
      enUso
      enAlmacen
      otrosEstados
      bajasGestion
      gestion
      porGrupo { etiqueta cantidad monto }
      porFacultad { etiqueta cantidad }
      actividadReciente { tipo referencia detalle fecha }
    }
  }
`;

const COLORES = ['#1a3c6e', '#2e7d32', '#6a1b9a', '#cc0000', '#e68a00', '#00838f', '#7a96b8', '#5d4037'];

const formatoBs = (n: number) =>
  `${(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;

const sinDatos: React.CSSProperties = {
  color: '#7a96b8',
  fontStyle: 'italic',
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: '24px 0',
};

export default function DashboardEjecutivo() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_RESUMEN, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading && !data) {
    return <div style={sinDatos}>Cargando métricas patrimoniales...</div>;
  }
  if (error) {
    return (
      <div className="error" style={{ marginBottom: '12px' }}>
        No se pudieron cargar las métricas patrimoniales: {error.message}
      </div>
    );
  }

  const r = data?.dashboardResumen;
  if (!r) return null;

  const total: number = r.totalActivos;
  const pctUso = total > 0 ? Math.round((r.enUso * 100) / total) : 0;
  const pctAlmacen = total > 0 ? Math.round((r.enAlmacen * 100) / total) : 0;

  const grupos: any[] = r.porGrupo || [];
  const facultades: any[] = r.porFacultad || [];
  const actividad: any[] = r.actividadReciente || [];

  const dataDona = {
    labels: grupos.map(g => g.etiqueta),
    datasets: [
      {
        data: grupos.map(g => g.cantidad),
        backgroundColor: grupos.map((_, i) => COLORES[i % COLORES.length]),
        borderWidth: 1,
      },
    ],
  };

  const dataBarras = {
    labels: facultades.map(f => f.etiqueta),
    datasets: [
      {
        label: 'Activos',
        data: facultades.map(f => f.cantidad),
        backgroundColor: '#1a3c6e',
      },
    ],
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Tarjetas KPI */}
      <div className="dashboard-grid-4">
        <div className="dash-stat-card activos">
          <span className="dash-stat-card-title">Total de Activos Aprobados</span>
          <span className="dash-stat-card-value">{total}</span>
          <span style={{ fontSize: '0.65rem', color: '#7a96b8' }}>Solo bienes con estado Aprobado</span>
        </div>

        <div className="dash-stat-card ingresos">
          <span className="dash-stat-card-title">Valor Global del Patrimonio</span>
          <span className="dash-stat-card-value" style={{ fontSize: '1.15rem' }}>
            {formatoBs(r.valorTotal)}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#7a96b8' }}>Suma del costo de adquisición</span>
        </div>

        <div className="dash-stat-card asignaciones">
          <span className="dash-stat-card-title">En Uso vs. Almacén</span>
          <span className="dash-stat-card-value">
            {r.enUso} / {r.enAlmacen}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#7a96b8' }}>
            {pctUso}% en uso · {pctAlmacen}% en almacén
          </span>
        </div>

        <div className="dash-stat-card bajas">
          <span className="dash-stat-card-title">Bajas de la Gestión {r.gestion}</span>
          <span className="dash-stat-card-value">{r.bajasGestion}</span>
          <span style={{ fontSize: '0.65rem', color: '#7a96b8' }}>Bajas registradas este año</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="dashboard-grid-2" style={{ marginTop: '12px' }}>
        <div className="panel">
          <div className="panel-header">Patrimonio por Grupo Contable</div>
          <div className="panel-body" style={{ minHeight: '240px', background: 'var(--bg-white)' }}>
            {grupos.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos aprobados para graficar.</div>
            ) : (
              <div style={{ maxWidth: '340px', margin: '0 auto' }}>
                <Doughnut
                  data={dataDona}
                  options={{ plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">Activos por Facultad / Edificio</div>
          <div className="panel-body" style={{ minHeight: '240px', background: 'var(--bg-white)' }}>
            {facultades.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos asignados a oficinas.</div>
            ) : (
              <Bar
                data={dataBarras}
                options={{
                  indexAxis: 'y',
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="panel" style={{ marginTop: '12px' }}>
        <div className="panel-header">Actividad Reciente</div>
        <div className="panel-body" style={{ background: 'var(--bg-white)' }}>
          {actividad.length === 0 ? (
            <div style={sinDatos}>No hay ingresos ni transferencias recientes.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#1a3c6e', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px' }}>Tipo</th>
                    <th style={{ padding: '6px 8px' }}>Referencia</th>
                    <th style={{ padding: '6px 8px' }}>Detalle</th>
                    <th style={{ padding: '6px 8px' }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {actividad.map((a, i) => (
                    <tr key={`${a.referencia}-${i}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{a.tipo}</td>
                      <td style={{ padding: '6px 8px' }}>{a.referencia}</td>
                      <td style={{ padding: '6px 8px' }}>{a.detalle || '—'}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{a.fecha || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
