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
  embedded?: boolean;          // vista integrada sin banner principal ni panel lateral fijo
}

export default function PageLayout({
  title,
  subtitle,
  actions = [],
  children,
  toolbar,
  footer,
  embedded = false,
}: PageLayoutProps) {
  if (embedded) {
    return (
      <div className="embedded-catalog-view" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Sub-header institucional */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          borderBottom: '2px solid #e2e8f0',
        }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1a3c6e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </span>
            {subtitle && (
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.75rem' }}>
                {subtitle}
              </span>
            )}
          </div>

          {actions.some(a => a.show !== false) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {actions.filter(a => a.show !== false).map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: btn.disabled ? 'not-allowed' : 'pointer',
                    background: btn.variant === 'primary' ? '#1a3c6e' : btn.variant === 'danger' ? '#dc2626' : '#f8fafc',
                    color: btn.variant === 'primary' || btn.variant === 'danger' ? '#ffffff' : '#334155',
                    border: '1px solid',
                    borderColor: btn.variant === 'primary' ? '#1a3c6e' : btn.variant === 'danger' ? '#dc2626' : '#cbd5e1',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  title={btn.label}
                >
                  {btn.icon && <span>{btn.icon}</span>}
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {toolbar && (
          <div className="table-toolbar" style={{ marginBottom: '1rem' }}>
            {toolbar}
          </div>
        )}

        <div className="embedded-body">
          {children}
        </div>

        {footer && (
          <div className="page-nav-bar" style={{ marginTop: '1rem' }}>
            {footer}
          </div>
        )}
      </div>
    );
  }

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
