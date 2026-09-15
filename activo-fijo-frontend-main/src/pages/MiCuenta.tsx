import PageLayout from '../components/ui/PageLayout';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { PERMISOS_METADATA } from '../utils/permisosMetadata';
import {
  OBTENER_PRECONFIGURACION_2FA,
  ACTIVAR_2FA,
  DESACTIVAR_2FA
} from '../graphql/mutations';

const GET_MI_CUENTA_DATA = gql`
  query GetMiCuentaData {
    usuarioActual {
      correo
      twoFactorEnabled
      idEmpleado {
        nombre
        apellido
        cargo
        numeroDocumento
        tipoDocumento
      }
    }
    misPermisos
    oficinasACargo {
      codOfic
      desDpto
    }
  }
`;

export default function MiCuenta() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_MI_CUENTA_DATA, {
    fetchPolicy: 'cache-and-network'
  });

  const [preConfig, setPreConfig] = useState<{ secret: string; qrUri: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [activating, setActivating] = useState(false);

  const [obtener2FA] = useMutation(OBTENER_PRECONFIGURACION_2FA);
  const [activar2FA] = useMutation(ACTIVAR_2FA);
  const [desactivar2FA] = useMutation(DESACTIVAR_2FA);

  const handleStart2FA = async () => {
    try {
      const res = await obtener2FA();
      if (res.data?.obtenerPreconfiguracion2fa) {
        setPreConfig({
          secret: res.data.obtenerPreconfiguracion2fa.secret,
          qrUri: res.data.obtenerPreconfiguracion2fa.qrUri
        });
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode) {
      alert('Por favor ingrese el código de verificación.');
      return;
    }
    setActivating(true);
    try {
      await activar2FA({
        variables: { code: verificationCode }
      });
      alert('✅ Autenticación en Dos Pasos (2FA) activada correctamente.');
      setPreConfig(null);
      setVerificationCode('');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setActivating(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('¿Está seguro de desactivar la autenticación de dos pasos? Esto disminuirá la seguridad de su cuenta.')) {
      return;
    }
    try {
      await desactivar2FA();
      alert('✅ Autenticación en Dos Pasos (2FA) desactivada correctamente.');
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Compressed permissions categorization
  const permsCategorized = useMemo(() => {
    const activePermsSet = new Set(data?.misPermisos || []);
    return PERMISOS_METADATA.map(mod => {
      const activeSubmodules = mod.submodules.map(sub => {
        const activeActions = sub.actions.filter(act => activePermsSet.has(act.name));
        return { ...sub, activeActions };
      }).filter(sub => sub.activeActions.length > 0);

      if (activeSubmodules.length === 0) return null;
      return { ...mod, submodules: activeSubmodules };
    }).filter(m => m !== null);
  }, [data]);

  if (loading && !data) return <div className="loading">Cargando datos de la cuenta...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const infoUser = data?.usuarioActual;
  const emp = infoUser?.idEmpleado;

  return (
    <PageLayout
      title="Mi Cuenta"
      subtitle="Gestión del perfil del usuario y seguridad"
    >
      <div className="micuenta-grid">
        
        {/* Panel Izquierdo: Información Personal y 2FA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Panel Datos de Perfil */}
          <div className="panel">
            <div className="panel-header">Información Personal</div>
            <div className="panel-body">
              <div className="profile-avatar">
                {emp ? `${emp.nombre[0]}${emp.apellido[0]}` : infoUser?.correo[0].toUpperCase()}
              </div>
              <h2 className="profile-name">
                {emp ? `${emp.nombre} ${emp.apellido}` : 'Usuario Registrado'}
              </h2>
              <p className="profile-role">
                {emp?.cargo || (user?.esAdmin ? 'Administrador del Sistema' : 'Personal Autorizado')}
              </p>

              <div className="profile-details">
                <div className="profile-row">
                  <span className="profile-label">Correo</span>
                  <span className="profile-val">{infoUser?.correo}</span>
                </div>
                {emp && (
                  <>
                    <div className="profile-row">
                      <span className="profile-label">{emp.tipoDocumento}</span>
                      <span className="profile-val" style={{ fontFamily: 'monospace' }}>{emp.numeroDocumento}</span>
                    </div>
                    <div className="profile-row">
                      <span className="profile-label">Rol Sistema</span>
                      <span className="profile-val">
                        {user?.esAdmin ? 'Administrador' : 'Personal'}
                      </span>
                    </div>
                    {data?.oficinasACargo && data.oficinasACargo.length > 0 && (
                      <div className="profile-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                        <span className="profile-label">Encargado de las Oficinas/Unidades:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {data.oficinasACargo.map((o: any) => (
                            <span key={o.codOfic} style={{ background: 'var(--blue-pale)', color: 'var(--blue)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                              🏢 {o.desDpto}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Panel de Doble Factor 2FA */}
          <div className="panel">
            <div className="panel-header">Seguridad de la Cuenta</div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="security-alert">
                La autenticación en dos pasos (2FA) añade una capa adicional de protección. Necesitará un código temporal de Google Authenticator para iniciar sesión.
              </p>

              {infoUser?.twoFactorEnabled ? (
                <div className="security-active">
                  <div className="security-active-title">Protección Activa</div>
                  <p style={{ marginBottom: '10px', fontSize: '0.7rem', color: '#2e7d32' }}>
                    Su cuenta está configurada y protegida con la autenticación de dos factores.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', borderColor: '#cc0000', color: '#cc0000', background: 'none' }}
                    onClick={handleDisable2FA}
                  >
                    Desactivar Doble Factor
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!preConfig ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={handleStart2FA}
                    >
                      Configurar Autenticación en 2 Pasos
                    </button>
                  ) : (
                    <div className="qr-container">
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 'bold' }}>
                        Escanee el código QR con Google Authenticator o ingrese la clave manualmente.
                      </p>
                      
                      <div className="qr-image">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(preConfig.qrUri)}`}
                          alt="Código QR 2FA"
                          style={{ width: '150px', height: '150px', display: 'block' }}
                        />
                      </div>

                      <div className="manual-key-box">
                        <div className="key-label">CLAVE SECRETA (INGRESO MANUAL)</div>
                        <div style={{ fontWeight: 'bold', userSelect: 'all' }}>{preConfig.secret}</div>
                      </div>

                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Código de 6 dígitos"
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            letterSpacing: '4px',
                            background: 'var(--blue-pale)',
                            border: '1px solid var(--border)'
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%' }}
                          disabled={activating || verificationCode.length !== 6}
                          onClick={handleVerifyAndEnable}
                        >
                          {activating ? 'Verificando...' : 'Verificar y Activar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Permisos Activos Comprimidos */}
        <div className="panel">
          <div className="panel-header">Mis Permisos en el Sistema</div>
          <div className="panel-body">
            <p className="security-alert" style={{ marginBottom: '12px' }}>
              A continuación se detalla el listado comprimido de operaciones y accesos que su usuario tiene autorizados en la plataforma.
            </p>

            {permsCategorized.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                No tiene ningún permiso asociado en el sistema
              </div>
            ) : (
              <div className="perm-modules-grid">
                {permsCategorized.map((mod: any) => (
                  <div key={mod.id} className="perm-module-card">
                    <div className="perm-module-title">
                      {mod.label}
                    </div>
                    <div className="perm-module-body">
                      {mod.submodules.map((sub: any) => (
                        <div key={sub.id} className="perm-submodule-item">
                          <span className="perm-submodule-label">{sub.label}</span>
                          <div className="perm-badges-container">
                            {sub.activeActions.map((act: any) => {
                              let badgeClass = 'perm-badge-other';
                              if (act.type === 'ver') badgeClass = 'perm-badge-ver';
                              else if (act.type === 'crear') badgeClass = 'perm-badge-crear';
                              else if (act.type === 'editar') badgeClass = 'perm-badge-editar';
                              else if (act.type === 'eliminar') badgeClass = 'perm-badge-eliminar';

                              return (
                                <span
                                  key={act.name}
                                  className={`perm-badge ${badgeClass}`}
                                >
                                  {act.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
