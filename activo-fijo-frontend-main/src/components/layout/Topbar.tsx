import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
  '/proveedores':   'Proveedores',
  '/marcas':        'Marcas',
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

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">{title}</h2>
      </div>
      <div className="topbar-right">
        <div className="topbar-user">
          <span className="topbar-user-icon">&#9689;</span>
          <span className="topbar-user-email">{user?.email}</span>
        </div>
        <button className="topbar-logout-btn" onClick={onLogout}>
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
