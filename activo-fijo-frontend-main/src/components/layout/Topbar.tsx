import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getQrBaseUrl, setCustomQrBaseUrl, syncQrConfigFromBackend } from '../../utils/qrConfig';

/* Map of route path → page title */
const PAGE_TITLES: Record<string, string> = {
  '/':              'Inicio',
  '/ingresos':      'Ingresos',
  '/activos':       'Activos Fijos',
  '/asignaciones':  'Asignaciones',
  '/transferencias':'Transferencias',
  '/bajas':         'Bajas de Activos',
  '/vehiculos':     'Flota de Vehículos',
  '/depreciaciones':'Depreciaciones',
  '/revaluos':      'Revalúos',
  '/ufvs':          'Tasas UFV',
  '/adquisiciones': 'Adquisiciones',
  '/reportes':      'Reportes',
  '/logs':          'Bitácora de Auditoría',
  '/usuarios':      'Usuarios del Sistema',
  '/roles':         'Roles y Permisos',
  '/grupos':        'Grupos de Activos',
  '/oficinas':      'Oficinas / Dependencias',
  '/proveedores':      'Proveedores',
  '/marcas':           'Marcas y Modelos',
  '/especificaciones': 'Materiales, Partes y Unidades',
  '/catalogos':        'Otros Catálogos y Parámetros',
  '/condiciones':   'Condiciones',
  '/estados':       'Estados de Activo',
  '/unidades':      'Unidades de Medida',
  '/gestiones':     'Gestiones Fiscales',
  '/partes':        'Partes / Componentes',
  '/atributos':     'Atributos Técnicos',
  '/tipos':         'Tipos de Activo',
  '/materiales':    'Tipos de Material',
  '/funciones':     'Funciones Administrativas',
};

interface TopbarProps {
  onLogout: () => void;
}

export default function Topbar({ onLogout }: TopbarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'Sistema de Activos Fijos';

  const [showQrModal, setShowQrModal] = useState(false);
  const [currentQrUrl, setCurrentQrUrl] = useState(getQrBaseUrl());
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    syncQrConfigFromBackend().then(url => {
      setCurrentQrUrl(url || getQrBaseUrl());
    });
  }, []);

  const handleOpenModal = () => {
    const active = getQrBaseUrl();
    setCurrentQrUrl(active);
    setInputUrl(localStorage.getItem('custom_qr_base_url') || active);
    setShowQrModal(true);
  };

  const handleSave = () => {
    setCustomQrBaseUrl(inputUrl);
    setCurrentQrUrl(getQrBaseUrl());
    setShowQrModal(false);
  };

  const handleResetToLan = () => {
    setCustomQrBaseUrl('');
    syncQrConfigFromBackend().then(url => {
      const active = url || getQrBaseUrl();
      setCurrentQrUrl(active);
      setInputUrl(active);
    });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{title}</h2>
      </div>
      <div className="topbar-right">
        {/* Acceso rápido a configuración de dirección QR */}
        <button
          type="button"
          onClick={handleOpenModal}
          title="Ver o cambiar la dirección de enlace de los códigos QR para celulares"
          style={{
            background: 'rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: '6px',
            color: '#2563eb',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📱</span>
          <span>QR: {currentQrUrl.replace(/^https?:\/\//, '').slice(0, 22)}...</span>
        </button>

        <div className="topbar-user">
          <span className="topbar-user-icon">&#9689;</span>
          <span className="topbar-user-email">{user?.email}</span>
        </div>
        <button className="topbar-logout-btn" onClick={onLogout}>
          Cerrar Sesión
        </button>
      </div>

      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)} style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Configuración de Dirección para QR</h3>
              <button className="close-btn" onClick={() => setShowQrModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '16px 0' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '14px', lineHeight: 1.4 }}>
                Esta es la dirección base que se graba en los códigos QR para que los celulares puedan escanearlos.
              </p>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Dirección URL base para escaneo QR:
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="Ej: http://192.168.0.104:3000 o https://tu-tunel.trycloudflare.com"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                <strong style={{ color: '#334155' }}>Consejo:</strong> Si estás en la misma red Wi-Fi con tu celular, la dirección <code>http://192.168.0.104:3000</code> funciona sin necesidad de encender túneles ni consumir megas.
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetToLan}
                title="Restablece la IP Wi-Fi de tu computadora de forma automática"
              >
                Detectar IP Wi-Fi
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQrModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
                  Guardar Dirección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
