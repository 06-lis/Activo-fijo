import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_FICHA_TECNICA_ACTIVO } from '../graphql/queries';

/**
 * Detalle de un activo dentro del portal Mis Activos.
 * Solo accesible si el activo está bajo custodia del funcionario autenticado.
 * El backend valida esta restricción en el resolver mis_activos.
 */
export default function MisActivosDetalle() {
  const { nroActivo } = useParams<{ nroActivo: string }>();
  const nroActivoNum = nroActivo ? parseInt(nroActivo, 10) : 0;

  const [codGrupo] = useState<number | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_FICHA_TECNICA_ACTIVO, {
    variables: { nroActivo: nroActivoNum, codGrupo: codGrupo || 0 },
    skip: !nroActivoNum,
    fetchPolicy: 'cache-and-network',
  });

  const activo = data?.activo;
  if (loading) {
    return (
      <PageLayout title="Detalle del Activo" subtitle="Cargando información...">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando…</div>
      </PageLayout>
    );
  }
  if (error || !activo) {
    return (
      <PageLayout title="Detalle del Activo" subtitle="No se encontró el activo">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
          {error ? error.message : 'No se encontró información del activo o no tienes acceso a él.'}
        </div>
      </PageLayout>
    );
  }

  // Extraer oficina y fecha de asignación de la asignación vigente
  const detAsig = activo.inDetAsigSet?.[0];
  const asig = detAsig?.codAsig || {};
  const oficina = asig.codOfic || {};
  const oficinaPath = [oficina.desDpto, oficina.codPadre?.desDpto, oficina.codPadre?.codPadre?.desDpto].filter(Boolean).join(' / ') || 'Sin oficina';
  const fechaAsig = asig.fechaAsig || '-';

  // Datos del vehículo si aplica
  const vehiculo = activo.vehiculo;

  const dinero = (v: any) => {
    if (v === null || v === undefined || v === '') return 'S/M';
    const n = Number(v);
    return Number.isNaN(n) ? 'S/M' : `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const dateFmt = (v?: string | null) => {
    if (!v) return '-';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  };

  const ingreso = activo.nroIngreso || {};
  const fotoBien = ingreso.fotoBien;
  const fotoPlaca = ingreso.fotoPlaca;

  return (
    <PageLayout
      title={`Activo ${activo.codActivo}`}
      subtitle="Detalle bajo tu custodia — Portal Mis Activos"
      actions={[
        { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
      ]}
    >
      {/* Fotografía del bien */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {fotoBien && (
          <div style={{ flex: '0 0 auto', maxWidth: '200px' }}>
            <img src={fotoBien} alt="Bien" style={{ width: '100%', height: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'block' }} />
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>Fotografía del bien</div>
          </div>
        )}
        {fotoPlaca && (
          <div style={{ flex: '0 0 auto', maxWidth: '200px' }}>
            <img src={fotoPlaca} alt="Placa" style={{ width: '100%', height: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'block' }} />
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>Placa / Nro. Serie</div>
          </div>
        )}
        {!fotoBien && !fotoPlaca && (
          <div style={{ flex: '0 0 auto', maxWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', border: '2px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
            Sin fotografías
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px', marginBottom: '0.4rem' }}>Código Patrimonial</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a3c6e', fontFamily: 'monospace' }}>{activo.codActivo}</div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px', marginBottom: '0.4rem' }}>N° Registro</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{activo.nroActivo}</div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px', marginBottom: '0.4rem' }}>Estado del Activo</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>{activo.codEstado?.desEstado || 'Sin estado'}</div>
        </div>
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.3px', marginBottom: '0.4rem' }}>Estado de Registro</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>{activo.estadoRegistro || '-'}</div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>Datos del Activo</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', width: '35%', fontWeight: 700, color: '#475569' }}>Descripción</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{activo.descripcion || 'Sin descripción'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Marca</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{activo.codMarca?.desMarca || 'S/M'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Modelo</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{activo.codModelo?.desModelo || 'S/Mod'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Número de Serie</td>
              <td style={{ padding: '8px 0', fontFamily: 'monospace', color: '#334155' }}>{activo.nroSerie || 'S/N'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Condición Física</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{activo.codCond?.desCond || 'No registrada'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Grupo Contable</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{activo.codGrupo?.desGrupo || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Unidad de Medida</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{activo.codUnidad?.desUnidad || '-'}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Fecha de Adquisición</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{dateFmt(activo.fecAdqui)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Valor de Adquisición</td>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#1a3c6e' }}>{dinero(activo.monto)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>Asignación y Custodia</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', width: '35%', fontWeight: 700, color: '#475569' }}>Oficina / Ubicación</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{oficinaPath}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Fecha de Asignación</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>{dateFmt(fechaAsig)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Estado de la Asignación</td>
              <td style={{ padding: '8px 0', color: '#334155' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, background: asig.estado === 'A' ? '#ecfdf5' : '#fef2f2', color: asig.estado === 'A' ? '#166534' : '#991b1b' }}>
                  {asig.estado === 'A' ? 'Vigente' : 'Cerrada'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {vehiculo && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '0.75rem', borderBottom: '2px solid #0d2347', display: 'inline-block' }}>Datos del Vehículo</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 0', width: '35%', fontWeight: 700, color: '#475569' }}>Placa</td>
                <td style={{ padding: '8px 0', fontFamily: 'monospace', color: '#334155' }}>{vehiculo.placa || 'S/P'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Color</td>
                <td style={{ padding: '8px 0', color: '#334155' }}>{vehiculo.color || '-'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 0', fontWeight: 700, color: '#475569' }}>Año</td>
                <td style={{ padding: '8px 0', color: '#334155' }}>{vehiculo.anio || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
        Esta información corresponde al activo bajo tu custodia. Para reportar una incidencia sobre este activo, usa la opción «Reportar Incidencia».
      </p>
    </PageLayout>
  );
}
