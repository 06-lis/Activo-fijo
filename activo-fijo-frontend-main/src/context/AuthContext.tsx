import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AuthUser {
  email: string;
  token: string;
  permisos: string[];   // e.g. ['activos.ver', 'activos.crear']
  esAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, email: string, permisos?: string[], esAdmin?: boolean) => void;
  logout: () => void;
  updatePermisos: (permisos: string[], esAdmin: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updatePermisos: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const email = localStorage.getItem('userEmail') || '';
    const permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
    const esAdmin = localStorage.getItem('esAdmin') === 'true';
    if (email) return { token: '', email, permisos, esAdmin };
    return null;
  });

  const login = useCallback((token: string, email: string, permisos: string[] = [], esAdmin = false) => {
    localStorage.setItem('userEmail', email);
    localStorage.setItem('permisos', JSON.stringify(permisos));
    localStorage.setItem('esAdmin', String(esAdmin));
    setUser({ token: '', email, permisos, esAdmin });
  }, []);

  const logout = useCallback(() => {
    // Llamar al backend para eliminar la cookie
    fetch('http://localhost:8000/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query: 'mutation { logout { success } }' })
    }).catch(console.error);

    localStorage.removeItem('userEmail');
    localStorage.removeItem('permisos');
    localStorage.removeItem('esAdmin');
    setUser(null);
  }, []);

  const updatePermisos = useCallback((permisos: string[], esAdmin: boolean) => {
    localStorage.setItem('permisos', JSON.stringify(permisos));
    localStorage.setItem('esAdmin', String(esAdmin));
    setUser(prev => prev ? { ...prev, permisos, esAdmin } : null);
  }, []);

  // Al arrancar: verificar con el backend que la cookie de sesión siga siendo válida.
  // Si expiró (o el servidor se reinició), se limpia la sesión local y se muestra el Login.
  const [checking, setChecking] = useState<boolean>(() => !!localStorage.getItem('userEmail'));

  useEffect(() => {
    if (!localStorage.getItem('userEmail')) return;
    const clearLocal = () => {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('permisos');
      localStorage.removeItem('esAdmin');
      setUser(null);
    };
    fetch('http://localhost:8000/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query: '{ usuarioActual { idUsuario } }' })
    })
      .then(r => r.json())
      .then(res => { if (!res?.data?.usuarioActual) clearLocal(); })
      .catch(() => clearLocal())
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updatePermisos }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
