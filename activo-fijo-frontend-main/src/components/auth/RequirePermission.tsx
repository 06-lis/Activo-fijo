import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has the required permission.
 * Shows fallback (or a default "Access Denied" block) otherwise.
 *
 * Usage:
 *   <RequirePermission permission="activos.crear">
 *     <button>Nuevo Activo</button>
 *   </RequirePermission>
 */
export default function RequirePermission({
  permission,
  children,
  fallback,
}: RequirePermissionProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return (
      <>
        {fallback ?? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
            <h3 style={{ color: '#dc3545', fontWeight: 700, marginBottom: '0.4rem' }}>
              Acceso Denegado
            </h3>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              No tienes permisos para acceder a esta sección.<br />
              Contacta al administrador del sistema.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
