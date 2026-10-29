import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

const GET_ACTIVO_CONSULTA = gql`
  query GetActivoConsulta($codActivo: String!) {
    activoPorCodigo(codActivo: $codActivo) {
      nroActivo
      codActivo
      descripcion
      nroSerie
      fecAdqui
      monto
      estadoRegistro
      codGrupo {
        codGrupo
        desGrupo
        vidaUtilDefault
      }
      codMarca {
        desMarca
      }
      codModelo {
        desModelo
      }
      codCond {
        codCond
        desCond
      }
      codEstado {
        codEstado
        desEstado
      }
      vehiculo {
        placa
        motor
        chasis
        color
        anio
        fechaVencimientoSoat
      }
      inDetAsigSet {
        codAsig {
          codAsig
          estado
          fechaAsig
          empleadoResponsable {
            idEmpleado
            nombre
            apellido
            cargo
          }
          codOfic {
            codOfic
            desDpto
            codPadre {
              desDpto
              codPadre {
                desDpto
              }
            }
          }
        }
      }
    }
    todasCondiciones {
      codCond
      desCond
    }
  }
`;

const ACTUALIZAR_CONDICION = gql`
  mutation ActualizarCondicion($nroActivo: Int!, $codCond: Int!) {
    editarActivo(nroActivo: $nroActivo, codCond: $codCond) {
      activo {
        nroActivo
        codCond {
          codCond
          desCond
        }
      }
    }
  }
`;

export default function ConsultaActivo() {
  const { codActivo } = useParams<{ codActivo: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [nuevaCondicion, setNuevaCondicion] = useState<number | null>(null);
  const [mensajeAudit, setMensajeAudit] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_ACTIVO_CONSULTA, {
    variables: { codActivo: codActivo || '' },
    skip: !codActivo,
    fetchPolicy: 'network-only'
  });

  const [actualizarCond, { loading: guardandoCond }] = useMutation(ACTUALIZAR_CONDICION);

  const activo = data?.activoPorCodigo;
  const condiciones = data?.todasCondiciones || [];

  const esAuditorOAdmin = isAuthenticated && (
    user?.esAdmin ||
    user?.permisos.includes('ver_auditoria') ||
    user?.permisos.includes('editar_activo') ||
    user?.permisos.includes('crear_activo')
  );

  const asignacionActiva = activo?.inDetAsigSet?.find((a: any) => a.codAsig?.estado === 'A');
  const oficina = asignacionActiva?.codAsig?.codOfic;
  const responsable = asignacionActiva?.codAsig?.empleadoResponsable;
  const vehiculo = activo?.vehiculo;

  const buildUbicacion = () => {
    if (!oficina) return 'No asignado actualmente (En almacén/custodia general)';
    const partes: string[] = [];
    if (oficina.codPadre?.codPadre?.desDpto) partes.push(oficina.codPadre.codPadre.desDpto);
    if (oficina.codPadre?.desDpto) partes.push(oficina.codPadre.desDpto);
    if (oficina.desDpto) partes.push(oficina.desDpto);
    return partes.join(' > ') || oficina.desDpto;
  };

  const handleAuditarConfirmar = async () => {
    if (!activo) return;
    try {
      if (nuevaCondicion && nuevaCondicion !== activo.codCond?.codCond) {
        await actualizarCond({
          variables: {
            nroActivo: parseInt(activo.nroActivo),
            codCond: nuevaCondicion
          }
        });
      }
      setMensajeAudit('Activo verificado y registrado en auditoría correctamente.');
      refetch();
      setTimeout(() => setMensajeAudit(null), 4000);
    } catch (e: any) {
      alert('Error al registrar verificación: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: '20px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#1a3c6e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.95rem' }}>Consultando activo en el sistema UAGRM...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !activo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', marginBottom: '16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '1.25rem' }}>Activo No Encontrado</h2>
        <p style={{ color: '#64748b', maxWidth: '320px', margin: '0 0 24px 0', fontSize: '0.9rem' }}>
          El código <strong>{codActivo}</strong> no coincide con ningún bien registrado o fue dado de baja.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#1a3c6e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: '10px', marginBottom: '30px' }}>
        
        {/* Cabecera Institucional */}
        <div style={{ background: 'linear-gradient(135deg, #0d2347 0%, #1a3c6e 100%)', color: 'white', padding: '20px 16px', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#93c5fd' }}>
              U.A.G.R.M.
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '0.3px' }}>
            Dirección Universitaria de Activos Fijos
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#cbd5e1' }}>
            Ficha de Consulta y Verificación Oficial
          </p>
        </div>

        {/* Banner de Modo */}
        <div style={{
          padding: '8px 16px',
          background: esAuditorOAdmin ? '#ecfdf5' : '#eff6ff',
          borderBottom: `1px solid ${esAuditorOAdmin ? '#a7f3d0' : '#bfdbfe'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: esAuditorOAdmin ? '#065f46' : '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: esAuditorOAdmin ? '#10b981' : '#2563eb'
            }}></span>
            {esAuditorOAdmin ? 'MODO AUDITORÍA ACTIVO' : 'CONSULTA PÚBLICA INSTITUCIONAL'}
          </span>
          {!isAuthenticated ? (
            <button
              onClick={() => {
                sessionStorage.setItem('returnUrl', `/consulta/${codActivo}`);
                navigate('/login', { replace: true });
              }}
              style={{ background: '#1a3c6e', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Soy Auditor (Iniciar Sesión)
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#1e293b', fontWeight: 600 }}>
                {user?.email}
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                title="Ir al panel principal"
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Panel ➔
              </button>
              <button
                onClick={logout}
                title="Cerrar sesión y ver como público"
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Salir
              </button>
            </div>
          )}
        </div>

        {/* Tarjeta de Identificación Principal */}
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                CÓDIGO DE ACTIVO
              </span>
              <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#1a3c6e', letterSpacing: '0.5px' }}>
                {activo.codActivo}
              </div>
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              background: activo.codEstado?.desEstado?.toLowerCase().includes('activo') ? '#dcfce7' : '#fee2e2',
              color: activo.codEstado?.desEstado?.toLowerCase().includes('activo') ? '#15803d' : '#b91c1c',
              border: `1px solid ${activo.codEstado?.desEstado?.toLowerCase().includes('activo') ? '#86efac' : '#fca5a5'}`
            }}>
              {activo.codEstado?.desEstado || 'REGISTRADO'}
            </span>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              DESCRIPCIÓN DEL BIEN
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', lineHeight: '1.4' }}>
              {activo.descripcion}
            </div>
          </div>

          {/* Tabla de Datos de Consulta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Categoría / Grupo:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{activo.codGrupo?.desGrupo || '-'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Marca / Modelo:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>
                {activo.codMarca?.desMarca || 'S/M'} {activo.codModelo?.desModelo ? `(${activo.codModelo.desModelo})` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Número de Serie:</span>
              <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{activo.nroSerie || 'S/N'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Condición Física:</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>
                {activo.codCond?.desCond || 'No especificada'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Ubicación Asignada:</span>
              <span style={{ color: '#1a3c6e', fontWeight: 700, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', lineHeight: '1.3' }}>
                {buildUbicacion()}
              </span>
            </div>

            {/* Custodio / Encargado Legal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Custodio / Responsable:</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#0f172a', fontWeight: 700, display: 'block' }}>
                  {responsable ? `${responsable.nombre} ${responsable.apellido}` : 'Sin custodio individual'}
                </span>
                {responsable?.cargo && (
                  <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>
                    {responsable.cargo}
                  </span>
                )}
              </div>
            </div>

            {/* DATOS EXCLUSIVOS DE VEHÍCULO (Solo si el activo es un vehículo) */}
            {vehiculo && (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', marginTop: '4px', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  ESPECIFICACIONES TÉCNICAS DEL VEHÍCULO
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>PLACA:</span>
                    <strong style={{ color: '#1e293b', fontFamily: 'monospace', fontSize: '12px' }}>{vehiculo.placa || 'S/P'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>AÑO / COLOR:</span>
                    <strong style={{ color: '#1e293b' }}>{vehiculo.anio || '-'} {vehiculo.color ? `(${vehiculo.color})` : ''}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>N° MOTOR:</span>
                    <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{vehiculo.motor || 'S/N'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>N° CHASIS:</span>
                    <strong style={{ color: '#1e293b', fontFamily: 'monospace' }}>{vehiculo.chasis || 'S/N'}</strong>
                  </div>
                </div>
                {vehiculo.fechaVencimientoSoat && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Seguro SOAT:</span>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: new Date(vehiculo.fechaVencimientoSoat) >= new Date() ? '#dcfce7' : '#fee2e2',
                      color: new Date(vehiculo.fechaVencimientoSoat) >= new Date() ? '#166534' : '#991b1b'
                    }}>
                      {new Date(vehiculo.fechaVencimientoSoat) >= new Date() ? `Vigente (${vehiculo.fechaVencimientoSoat})` : `Vencido (${vehiculo.fechaVencimientoSoat})`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN EXCLUSIVA MODO AUDITOR / ADMINISTRADOR */}
            {esAuditorOAdmin && (
              <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#166534', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  PANEL DE CONTROL DE AUDITORÍA
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Valor de Adquisición:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {activo.monto ? `Bs. ${parseFloat(activo.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : 'S/M'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Fecha de Adquisición:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{activo.fecAdqui || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4b5563' }}>Vida Útil del Grupo:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {activo.codGrupo?.vidaUtilDefault ? `${activo.codGrupo.vidaUtilDefault} años` : '-'}
                    </span>
                  </div>
                </div>

                {/* Actualizar Condición en Campo */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#374151', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Verificar Estado Físico:
                  </label>
                  <select
                    value={nuevaCondicion !== null ? nuevaCondicion : (activo.codCond?.codCond || '')}
                    onChange={(e) => setNuevaCondicion(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', background: 'white', fontWeight: 600 }}
                  >
                    {condiciones.map((c: any) => (
                      <option key={c.codCond} value={c.codCond}>{c.desCond}</option>
                    ))}
                  </select>
                </div>

                {mensajeAudit && (
                  <div style={{ background: '#bbf7d0', color: '#166534', padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textAlign: 'center', marginBottom: '10px' }}>
                    {mensajeAudit}
                  </div>
                )}

                <button
                  onClick={handleAuditarConfirmar}
                  disabled={guardandoCond}
                  style={{
                    width: '100%',
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {guardandoCond ? 'Registrando...' : 'Confirmar Verificación de Auditoría'}
                </button>
              </div>
            )}

          </div>

          {/* Pie de página con sello oficial */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              SISTEMA DE ADMINISTRACIÓN DE ACTIVOS FIJOS — UAGRM
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
