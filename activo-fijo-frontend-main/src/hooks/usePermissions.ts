import { useAuth } from '../context/AuthContext';

/**
 * Hook for checking user permissions.
 * Admins (esAdmin=true) always pass every check.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can('activos.crear')) { ... }
 */
export function usePermissions() {
  const { user } = useAuth();

  /** Returns true if the user has the given permission string, or is an admin. */
  const can = (permission: string): boolean => {
    if (!user) return false;
    if (user.esAdmin) return true;
    return user.permisos.includes(permission);
  };

  /** Returns true if the user has ANY of the given permissions. */
  const canAny = (...permissions: string[]): boolean => {
    if (!user) return false;
    if (user.esAdmin) return true;
    return permissions.some(p => user.permisos.includes(p));
  };

  /** Returns true if the user has ALL of the given permissions. */
  const canAll = (...permissions: string[]): boolean => {
    if (!user) return false;
    if (user.esAdmin) return true;
    return permissions.every(p => user.permisos.includes(p));
  };

  return { can, canAny, canAll, isAdmin: user?.esAdmin ?? false };
}

export default usePermissions;
