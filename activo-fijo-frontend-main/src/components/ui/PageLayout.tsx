import React from 'react';

/* ─────────────────────────────────────────────────────────────
   PageLayout — Wrapper VSIAF institucional
   Reproduce el estilo: barra de título + contenido + panel acciones
   ───────────────────────────────────────────────────────────── */

export interface ActionButton {
  label: string;
  icon?: string;       // símbolo Unicode (no emoji)
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
  separator?: boolean; // línea separadora antes de este botón
  show?: boolean;      // opcional para ocultar botones dinámicamente
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ActionButton[];
  children: React.ReactNode;
  toolbar?: React.ReactNode;   // barra de herramientas debajo del banner
  footer?: React.ReactNode;    // barra inferior (paginación, nav)
}

export default function PageLayout({
  title,
  subtitle,
  actions = [],
  children,
  toolbar,
  footer,
}: PageLayoutProps) {
  return (
    <div className="page-card">
      {/* ── Banner título ───────────────────────────────── */}
      <div className="page-banner">
        <span>{title}</span>
        {subtitle && (
          <span style={{ fontSize: '0.72rem', fontWeight: 400, opacity: 0.75, marginLeft: '1rem' }}>
            {subtitle}
          </span>
        )}
      </div>

      {/* ── Toolbar opcional (filtros, búsqueda) ────────── */}
      {toolbar && (
        <div className="table-toolbar">
          {toolbar}
        </div>
      )}

      {/* ── Cuerpo: contenido + panel acciones ──────────── */}
      <div className="page-body">
        {/* Contenido principal */}
        <div className="page-content">
          {children}
        </div>

        {/* Panel de acciones lateral (si hay acciones visibles) */}
        {actions.some(a => a.show !== false) && (
          <div className="action-panel">
            {actions.filter(a => a.show !== false).map((btn, idx) => (
              <React.Fragment key={idx}>
                {btn.separator && <div className="action-separator" />}
                <button
                  className={`action-btn${btn.variant === 'primary' ? ' action-btn-primary' : btn.variant === 'danger' ? ' action-btn-danger' : ''}`}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  title={btn.label}
                >
                  {btn.icon && <span className="action-icon">{btn.icon}</span>}
                  <span className="action-label">{btn.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer / Paginación / Nav bar ───────────────── */}
      {footer && (
        <div className="page-nav-bar">
          {footer}
        </div>
      )}
    </div>
  );
}
