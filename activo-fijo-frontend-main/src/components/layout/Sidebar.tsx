import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ─── Definición de grupos y rutas ─────────────────────────── */
interface NavItem {
  label: string;
  to: string;
  icon: string;
  permission?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'gestion',
    label: 'Gestión de Activos',
    icon: '▣',
    items: [
      { label: 'Ingresos',        to: '/ingresos',       icon: '↓', permission: 'ver_ingresos' },
      { label: 'Activos Fijos',   to: '/activos',        icon: '◈', permission: 'ver_activos' },
      { label: 'Asignaciones',    to: '/asignaciones',   icon: '→', permission: 'ver_asignaciones' },
      { label: 'Transferencias',  to: '/transferencias', icon: '⇄', permission: 'ver_transferencias' },
      { label: 'Bajas',           to: '/bajas',          icon: '↥', permission: 'ver_bajas' },
      { label: 'Vehículos',       to: '/vehiculos',      icon: '◻', permission: 'ver_vehiculos' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: '≡',
    items: [
      { label: 'Depreciaciones',  to: '/depreciaciones', icon: '▽', permission: 'ver_depreciaciones' },
      { label: 'Revalúos',        to: '/revaluos',       icon: '△', permission: 'ver_reevaluos' },
      { label: 'Tasas UFV',       to: '/ufvs',           icon: '$', permission: 'ver_tipo_cambio' },
    ],
  },
  {
    id: 'adquisiciones',
    label: 'Adquisiciones',
    icon: '⊕',
    items: [
      { label: 'Adquisiciones',   to: '/adquisiciones',  icon: '⊕', permission: 'ver_ordenes' },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes y Auditoría',
    icon: '▤',
    items: [
      { label: 'Reportes',        to: '/reportes',       icon: '▤', permission: 'ver_reportes' },
      { label: 'Bitácora',        to: '/logs',           icon: '≣', permission: 'ver_auditoria' },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: '◆',
    items: [
      { label: 'Usuarios',        to: '/usuarios',       icon: '◉', permission: 'ver_usuarios' },
      { label: 'Roles y Permisos',to: '/roles',          icon: '◐', permission: 'gestionar_roles' },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    icon: '▦',
    items: [
      { label: 'Grupos',          to: '/grupos',         icon: '▥', permission: 'ver_grupos' },
      { label: 'Oficinas',        to: '/oficinas',       icon: '▣', permission: 'ver_ubicaciones' },
      { label: 'Proveedores',     to: '/proveedores',    icon: '◫', permission: 'ver_proveedores' },
      { label: 'Marcas',          to: '/marcas',         icon: '™', permission: 'ver_marcas' },
      { label: 'Condiciones',     to: '/condiciones',    icon: '◈', permission: 'ver_condicion_activo' },
      { label: 'Est. de Activo',  to: '/estados',        icon: '●', permission: 'ver_estado_activo' },
      { label: 'Unidades',        to: '/unidades',       icon: '▭', permission: 'ver_unidad_medida' },
      { label: 'Gestiones',       to: '/gestiones',      icon: '◷', permission: 'ver_gestiones' },
      { label: 'Partes',          to: '/partes',         icon: '◧', permission: 'ver_partes' },
      { label: 'Atributos',       to: '/atributos',      icon: '◈', permission: 'ver_atributos' },
      { label: 'Tipos',           to: '/tipos',          icon: '◇', permission: 'ver_tipos' },
      { label: 'Materiales',      to: '/materiales',     icon: '◼', permission: 'ver_materiales' },
      { label: 'Funciones Adm.',  to: '/funciones',      icon: '◑', permission: 'ver_funciones' },
    ],
  },
];

/* ─── Props ─────────────────────────────────────────────────── */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/* ─── Componente ─────────────────────────────────────────────── */
export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    gestion: true,
    contabilidad: false,
    adquisiciones: false,
    reportes: false,
    admin: false,
    catalogos: false,
  });

  /* Filter visible items and groups by permissions */
  const visibleGroups = React.useMemo(() => {
    return NAV_GROUPS.map(group => {
      const visibleItems = group.items.filter(item => {
        if (!item.permission) return true;
        return user?.esAdmin || user?.permisos.includes(item.permission);
      });
      return { ...group, items: visibleItems };
    }).filter(group => group.items.length > 0);
  }, [user]);

  /* Auto-abrir el grupo que contiene la ruta activa */
  React.useEffect(() => {
    visibleGroups.forEach(group => {
      const hasActive = group.items.some(item => location.pathname === item.to);
      if (hasActive) {
        setOpenGroups(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname, visibleGroups]);

  const toggleGroup = (id: string) => {
    if (collapsed) return;
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon" style={{ fontWeight: 900, fontSize: '1rem', color: '#7ab8f5' }}>AF</span>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Activos Fijos</span>
            <span className="sidebar-brand-sub">UAGRM · Adm. de Bienes</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expandir' : 'Colapsar'}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {/* Dashboard Link */}
        <div className="sidebar-items" style={{ marginBottom: '0.5rem' }}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
            title={collapsed ? 'Dashboard' : undefined}
          >
            <span className="sidebar-item-icon">⊞</span>
            {!collapsed && (
              <span className="sidebar-item-label">Dashboard</span>
            )}
          </NavLink>
        </div>

        {visibleGroups.map(group => {
          const groupHasActive = group.items.some(item => location.pathname === item.to);
          const isOpen = openGroups[group.id];

          return (
            <div key={group.id} className="sidebar-group">
              {/* Group Header */}
              <button
                className={`sidebar-group-header ${groupHasActive ? 'has-active' : ''}`}
                onClick={() => toggleGroup(group.id)}
                title={collapsed ? group.label : undefined}
              >
                <span className="sidebar-group-icon">{group.icon}</span>
                {!collapsed && (
                  <>
                    <span className="sidebar-group-label">{group.label}</span>
                    <span className={`sidebar-group-arrow ${isOpen ? 'open' : ''}`}>›</span>
                  </>
                )}
              </button>

              {/* Group Items */}
              {(isOpen || collapsed) && (
                <div className={`sidebar-items ${collapsed ? 'sidebar-items-tooltip' : ''}`}>
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar-item-icon">{item.icon}</span>
                      {!collapsed && (
                        <span className="sidebar-item-label">{item.label}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Mi Cuenta Link */}
        <div className="sidebar-items" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
          <NavLink
            to="/mi-cuenta"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
            title={collapsed ? 'Mi Cuenta' : undefined}
          >
            <span className="sidebar-item-icon">⍥</span>
            {!collapsed && (
              <span className="sidebar-item-label">Mi Cuenta</span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <span className="sidebar-footer-text">SIAEF v2.0 · MEFP</span>
        </div>
      )}
    </aside>
  );
}
