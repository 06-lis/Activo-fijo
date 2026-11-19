import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  ChartOptions,
  Plugin,
} from 'chart.js';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler
);

/* Dashboard ejecutivo (v3, con pestañas).
   Usa `dashboardResumen` (activo/schema/dashboard.py) y `ultimasDepreciaciones` para el valor en libros. */

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
      sinAsignar
      pendientesAprobacion
      porGrupo { etiqueta cantidad monto }
      porFacultad { etiqueta cantidad monto }
      porEstado { etiqueta cantidad }
      porCondicion { etiqueta cantidad }
      porAntiguedad { etiqueta cantidad }
      topCustodios { etiqueta cantidad monto }
      porMes { mes ingresos transferencias bajas }
      actividadReciente { tipo referencia detalle fecha }
    }
    ultimasDepreciaciones { acumulada valorActual }
  }
`;

const PALETA = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#dc2626', '#ca8a04', '#64748b'];
const AZUL = '#1d4ed8';

const formatoBs = (n: number) =>
  `${(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;

const sinDatos: React.CSSProperties = {
  color: '#7a96b8',
  fontStyle: 'italic',
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: '24px 0',
};

/* ─── Pestañas ───────────────────────────────────────────── */
const PESTANAS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'patrimonio', label: 'Patrimonio' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'reportes', label: 'Reportes' },
];

export function BarraPestanas({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  return (
    <div className="no-print" role="tablist" style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
      {PESTANAS.map(p => {
        const activa = p.id === tab;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => setTab(p.id)}
            style={{
              padding: '7px 20px',
              borderRadius: '999px',
              border: activa ? '1px solid transparent' : '1px solid #cbd5e1',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: activa ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#ffffff',
              color: activa ? '#ffffff' : '#1e3a8a',
              boxShadow: activa ? '0 3px 8px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Piezas visuales ────────────────────────────────────── */

// Número que sube de 0 al valor final
function useContador(meta: number, ms = 900) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let raf = 0;
    const ini = performance.now();
    const paso = (t: number) => {
      const p = Math.min((t - ini) / ms, 1);
      setV(meta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [meta, ms]);
  return v;
}

interface KpiProps {
  titulo: string;
  valor: number;
  formato?: (n: number) => string;
  sub: string;
 icono?: string;
  colores: [string, string];
  progreso?: number; // 0 a 100
}

function Kpi({ titulo, valor, formato, sub, colores, progreso }: KpiProps) {
  const animado = useContador(valor);
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colores[0]}, ${colores[1]})`,
        color: '#fff',
        borderRadius: '12px',
        padding: '16px 18px',
        boxShadow: `0 6px 16px ${colores[0]}55`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>
        {titulo}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 2px' }}>
        {formato ? formato(animado) : Math.round(animado)}
      </div>
      <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>{sub}</div>
      {progreso !== undefined && (
        <div style={{ marginTop: '10px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.28)' }}>
          <div
            style={{
              width: `${Math.max(0, Math.min(100, progreso))}%`, height: '100%',
              borderRadius: '3px', background: '#fff', transition: 'width 0.9s ease-out',
            }}
          />
        </div>
      )}
    </div>
  );
}

function Tarjeta({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(30, 58, 138, 0.10)', overflow: 'hidden' }}>
      <div
        style={{
          padding: '10px 16px', borderBottom: '1px solid #e8eef7', display: 'flex',
          justifyContent: 'space-between', alignItems: 'baseline', gap: '8px',
        }}
      >
        <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.86rem' }}>{titulo}</span>
        {subtitulo && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{subtitulo}</span>}
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

// Alto fijo para que los gráficos no estiren la página
function Caja({ alto, children }: { alto: number; children: React.ReactNode }) {
  return <div style={{ position: 'relative', height: `${alto}px` }}>{children}</div>;
}

const rejilla = (cols: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${cols}px, 1fr))`,
  gap: '14px',
});

// Texto en el centro de una dona
const textoCentro = (texto: string, sub: string): Plugin<'doughnut'> => ({
  id: 'textoCentro',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 26px Segoe UI, Arial, sans-serif';
    ctx.fillText(texto, x, y - 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Segoe UI, Arial, sans-serif';
    ctx.fillText(sub, x, y + 14);
    ctx.restore();
  },
});

function opcionesDona(): ChartOptions<'doughnut'> {
  return {
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
  };
}

function opcionesBarraH(dinero: boolean): ChartOptions<'bar'> {
  return {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => (dinero ? formatoBs(Number(ctx.parsed.x)) : `${ctx.parsed.x} activos`),
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#eef2f7' },
        ticks: dinero ? { callback: v => Number(v).toLocaleString('es-BO') } : { precision: 0 },
      },
      y: { grid: { display: false } },
    },
  };
}

function opcionesColumnas(): ChartOptions<'bar'> {
  return {
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} activos` } } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#eef2f7' }, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };
}

// Verde, ámbar o rojo según la palabra de la condición
const colorCondicion = (nombre: string) => {
  const t = (nombre || '').toUpperCase();
  if (t.includes('BUEN')) return '#16a34a';
  if (t.includes('REGUL')) return '#f59e0b';
  if (t.includes('MAL')) return '#dc2626';
  return '#94a3b8';
};

function Alerta({ valor, texto, to, color }: { valor: number; texto: string; to: string; color: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px',
        background: valor > 0 ? `${color}14` : '#f1f5f9', border: `1px solid ${valor > 0 ? `${color}55` : '#e2e8f0'}`,
        textDecoration: 'none', color: '#1e3a8a',
      }}
    >
      <span style={{ fontSize: '1.5rem', fontWeight: 800, minWidth: '44px', color: valor > 0 ? color : '#94a3b8' }}>
        {valor}
      </span>
      <span style={{ fontSize: '0.8rem' }}>{texto}</span>
    </Link>
  );
}

/* ─── Componente principal ───────────────────────────────── */
export default function DashboardEjecutivo({ vista = 'resumen' }: { vista?: string }) {
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
  const conResponsable = Math.max(total - r.sinAsignar, 0);
  const pctCobertura = total > 0 ? Math.round((conResponsable * 100) / total) : 0;
  const atencion = r.sinAsignar + r.pendientesAprobacion;

  // Depreciación (viene de la query que ya usa el sistema)
  const deps: any[] = data?.ultimasDepreciaciones || [];
  const acumulada = deps.reduce((s, d) => s + (parseFloat(d.acumulada) || 0), 0);
  const valorLibros = deps.reduce((s, d) => s + (parseFloat(d.valorActual) || 0), 0);
  const hayDeps = deps.length > 0 && acumulada + valorLibros > 0;
  const pctDep = hayDeps ? Math.round((acumulada * 100) / (acumulada + valorLibros)) : 0;

  const grupos: any[] = r.porGrupo || [];
  const facultades: any[] = r.porFacultad || [];
  const estados: any[] = r.porEstado || [];
  const condiciones: any[] = r.porCondicion || [];
  const antiguedad: any[] = r.porAntiguedad || [];
  const custodios: any[] = r.topCustodios || [];
  const meses: any[] = r.porMes || [];
  const actividad: any[] = r.actividadReciente || [];

  const barraCantidad = (lista: any[], color: string) => ({
    labels: lista.map(x => x.etiqueta),
    datasets: [{ label: 'Activos', data: lista.map(x => x.cantidad), backgroundColor: color, borderRadius: 6 }],
  });
  const barraMonto = (lista: any[], color: string) => ({
    labels: lista.map(x => x.etiqueta),
    datasets: [{ label: 'Valor (Bs.)', data: lista.map(x => x.monto), backgroundColor: color, borderRadius: 6 }],
  });
  const altoBarras = (n: number) => Math.min(Math.max(n * 36 + 50, 170), 300);
  const hayMovimientos = meses.some(m => m.ingresos + m.transferencias + m.bajas > 0);

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* ── Resumen ── */}
      {vista === 'resumen' && (
        <>
          <div style={rejilla(230)}>
            <Kpi
              titulo="Activos aprobados"
              valor={total}
              sub={`${r.enUso} en uso · ${r.enAlmacen} en almacén`}
              colores={['#1d4ed8', '#3b82f6']}
              progreso={pctUso}
            />
            <Kpi
              titulo="Valor patrimonial"
              valor={r.valorTotal}
              formato={formatoBs}
              sub={hayDeps ? `Valor en libros: ${formatoBs(valorLibros)}` : 'Suma del costo de adquisición'}
              colores={['#15803d', '#22c55e']}
              progreso={hayDeps ? 100 - pctDep : undefined}
            />
            <Kpi
              titulo="Con responsable"
              valor={pctCobertura}
              formato={n => `${Math.round(n)}%`}
              sub={`${conResponsable} de ${total} bienes con custodio`}
              colores={['#7e22ce', '#a855f7']}
              progreso={pctCobertura}
            />
            <Kpi
              titulo="Requieren atención"
              valor={atencion}
              sub={`${r.sinAsignar} sin asignar · ${r.pendientesAprobacion} sin aprobar`}

              colores={atencion > 0 ? ['#c2410c', '#f97316'] : ['#475569', '#94a3b8']}
            />
          </div>

          <div style={{ ...rejilla(340), marginTop: '14px' }}>
            <Tarjeta titulo="Estado de los activos" subtitulo={`Gestión ${r.gestion}`}>
              {estados.length === 0 ? (
                <div style={sinDatos}>Aún no hay activos aprobados para graficar.</div>
              ) : (
                <Caja alto={230}>
                  <Doughnut
                    data={{
                      labels: estados.map(e => e.etiqueta),
                      datasets: [{
                        data: estados.map(e => e.cantidad),
                        backgroundColor: estados.map((_, i) => PALETA[i % PALETA.length]),
                        borderWidth: 2,
                        borderColor: '#fff',
                      }],
                    }}
                    options={opcionesDona()}
                    plugins={[textoCentro(String(total), 'activos')]}
                  />
                </Caja>
              )}
            </Tarjeta>

            <Tarjeta titulo="Condición de los bienes" subtitulo="Estado físico">
              {condiciones.length === 0 ? (
                <div style={sinDatos}>No hay condiciones registradas.</div>
              ) : (
                <Caja alto={230}>
                  <Bar
                    data={{
                      labels: condiciones.map(c => c.etiqueta),
                      datasets: [{
                        label: 'Activos',
                        data: condiciones.map(c => c.cantidad),
                        backgroundColor: condiciones.map(c => colorCondicion(c.etiqueta)),
                        borderRadius: 8,
                      }],
                    }}
                    options={opcionesColumnas()}
                  />
                </Caja>
              )}
            </Tarjeta>
          </div>

          <div style={{ ...rejilla(260), marginTop: '14px' }}>
            <Alerta valor={r.sinAsignar} texto="activos sin oficina ni custodio asignado" to="/asignaciones" color="#ea580c" />
            <Alerta valor={r.pendientesAprobacion} texto="activos registrados que aún no están aprobados" to="/activos" color="#dc2626" />
            <Alerta valor={r.otrosEstados} texto="activos que no están ni en uso ni en almacén" to="/activos" color="#7e22ce" />
          </div>
        </>
      )}

      {/* ── Inventario ── */}
      {vista === 'inventario' && (
        <div style={rejilla(420)}>
          <Tarjeta titulo="Activos por facultad / edificio">
            {facultades.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos asignados a oficinas.</div>
            ) : (
              <Caja alto={altoBarras(facultades.length)}>
                <Bar data={barraCantidad(facultades, '#2563eb')} options={opcionesBarraH(false)} />
              </Caja>
            )}
          </Tarjeta>

          <Tarjeta titulo="Activos por grupo contable">
            {grupos.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos aprobados para graficar.</div>
            ) : (
              <Caja alto={altoBarras(grupos.length)}>
                <Bar data={barraCantidad(grupos, '#0891b2')} options={opcionesBarraH(false)} />
              </Caja>
            )}
          </Tarjeta>

          <Tarjeta titulo="Antigüedad de los bienes" subtitulo="Desde la fecha de adquisición">
            {antiguedad.every(a => a.cantidad === 0) ? (
              <div style={sinDatos}>Los activos no tienen fecha de adquisición.</div>
            ) : (
              <Caja alto={230}>
                <Bar
                  data={{
                    labels: antiguedad.map(a => a.etiqueta),
                    datasets: [{
                      label: 'Activos',
                      data: antiguedad.map(a => a.cantidad),
                      backgroundColor: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#dc2626', '#94a3b8'],
                      borderRadius: 8,
                    }],
                  }}
                  options={opcionesColumnas()}
                />
              </Caja>
            )}
          </Tarjeta>

          <Tarjeta titulo="Custodios con más bienes a cargo" subtitulo="Asignaciones vigentes">
            {custodios.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos asignados a un responsable.</div>
            ) : (
              <Caja alto={altoBarras(custodios.length)}>
                <Bar data={barraCantidad(custodios, '#9333ea')} options={opcionesBarraH(false)} />
              </Caja>
            )}
          </Tarjeta>
        </div>
      )}

      {/* ── Patrimonio ── */}
      {vista === 'patrimonio' && (
        <div style={rejilla(340)}>
          <Tarjeta titulo="Valor en libros vs. depreciación" subtitulo="Bs.">
            {!hayDeps ? (
              <div style={sinDatos}>Todavía no hay depreciaciones calculadas.</div>
            ) : (
              <Caja alto={250}>
                <Doughnut
                  data={{
                    labels: ['Valor en libros', 'Depreciación acumulada'],
                    datasets: [{
                      data: [valorLibros, acumulada],
                      backgroundColor: ['#16a34a', '#f97316'],
                      borderWidth: 2,
                      borderColor: '#fff',
                    }],
                  }}
                  options={{
                    ...opcionesDona(),
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatoBs(Number(ctx.parsed))}` } },
                    },
                  }}
                  plugins={[textoCentro(`${pctDep}%`, 'depreciado')]}
                />
              </Caja>
            )}
          </Tarjeta>

          <Tarjeta titulo="Valor por grupo contable" subtitulo="Bs.">
            {grupos.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos aprobados para graficar.</div>
            ) : (
              <Caja alto={250}>
                <Bar data={barraMonto(grupos, '#16a34a')} options={opcionesBarraH(true)} />
              </Caja>
            )}
          </Tarjeta>

          <Tarjeta titulo="Valor por facultad / edificio" subtitulo="Bs.">
            {facultades.length === 0 ? (
              <div style={sinDatos}>Aún no hay activos asignados a oficinas.</div>
            ) : (
              <Caja alto={250}>
                <Bar data={barraMonto(facultades, '#9333ea')} options={opcionesBarraH(true)} />
              </Caja>
            )}
          </Tarjeta>
        </div>
      )}

      {/* ── Movimientos ── */}
      {vista === 'movimientos' && (
        <>
          <Tarjeta titulo="Movimientos de los últimos 6 meses" subtitulo="Ingresos, transferencias y bajas">
            {!hayMovimientos ? (
              <div style={sinDatos}>No hay ingresos, transferencias ni bajas en los últimos 6 meses.</div>
            ) : (
              <Caja alto={260}>
                <Line
                  data={{
                    labels: meses.map(m => m.mes),
                    datasets: [
                      { label: 'Ingresos', data: meses.map(m => m.ingresos), borderColor: '#16a34a', backgroundColor: '#16a34a22', fill: true, tension: 0.35, pointRadius: 4 },
                      { label: 'Transferencias', data: meses.map(m => m.transferencias), borderColor: AZUL, backgroundColor: `${AZUL}22`, fill: true, tension: 0.35, pointRadius: 4 },
                      { label: 'Bajas', data: meses.map(m => m.bajas), borderColor: '#dc2626', backgroundColor: '#dc262622', fill: true, tension: 0.35, pointRadius: 4 },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'bottom' } },
                    scales: { y: { beginAtZero: true, grid: { color: '#eef2f7' }, ticks: { precision: 0 } }, x: { grid: { display: false } } },
                  }}
                />
              </Caja>
            )}
          </Tarjeta>

          <div style={{ marginTop: '14px' }}>
            <Tarjeta titulo="Actividad reciente">
              {actividad.length === 0 ? (
                <div style={sinDatos}>No hay ingresos ni transferencias recientes.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#1e3a8a', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '6px 8px' }}>Tipo</th>
                        <th style={{ padding: '6px 8px' }}>Referencia</th>
                        <th style={{ padding: '6px 8px' }}>Detalle</th>
                        <th style={{ padding: '6px 8px' }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividad.map((a, i) => (
                        <tr key={`${a.referencia}-${i}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: a.tipo === 'Ingreso' ? '#16a34a' : AZUL }}>{a.tipo}</td>
                          <td style={{ padding: '6px 8px' }}>{a.referencia}</td>
                          <td style={{ padding: '6px 8px' }}>{a.detalle || '—'}</td>
                          <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{a.fecha || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Tarjeta>
          </div>
        </>
      )}
    </div>
  );
}
