import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import ToastContainer from './components/ui/ToastContainer';
import './utils/toast';

// Pages
import Ingresos from './pages/Ingresos';
import Activos from './pages/Activos';
import Vehiculos from './pages/Vehiculos';
import Asignaciones from './pages/Asignaciones';
import Transferencias from './pages/Transferencias';
import Revaluos from './pages/Revaluos';
import Bajas from './pages/Bajas';
import Proveedores from './pages/Proveedores';
import Oficinas from './pages/Oficinas';
import Grupos from './pages/Grupos';
import Marcas from './pages/Marcas';
import Condiciones from './pages/Condiciones';
import Unidades from './pages/Unidades';
import Gestiones from './pages/Gestiones';
import Partes from './pages/Partes';
import Usuarios from './pages/Usuarios';
import Roles from './pages/Roles';
import Tipos from './pages/Tipos';
import Materiales from './pages/Materiales';
import Funciones from './pages/Funciones';
import Estados from './pages/Estados';
import Adquisiciones from './pages/Adquisiciones';
import Atributos from './pages/Atributos';
import Depreciaciones from './pages/Depreciaciones';
import Reportes from './pages/Reportes';
import Logs from './pages/Logs';
import Ufvs from './pages/Ufvs';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MiCuenta from './pages/MiCuenta';
import { useQuery, gql } from '@apollo/client';
import './App.css';

const GET_MI_USUARIO_INFO = gql`
  query GetMiUsuarioInfo {
    misPermisos
    usuarioActual {
      correo
    }
  }
`;

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredPermission?: string;
}

function ProtectedRoute({ element, requiredPermission }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando sesión...</div>;
  }

  // Bypass if user is Super Admin
  if (user.esAdmin) {
    return element;
  }

  if (requiredPermission && !user.permisos.includes(requiredPermission)) {
    return (
      <div style={{
        padding: '3rem 2rem', textAlign: 'center', background: 'white',
        borderRadius: '12px', border: '1px solid #cbd5e1', margin: '2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#dc2626' }}>■</div>
        <h2 style={{ color: '#1a3c6e', marginBottom: '0.5rem', fontWeight: 800 }}>Acceso Denegado</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          No cuenta con el permiso requerido (<code>{requiredPermission}</code>) para acceder a esta sección.
        </p>
      </div>
    );
  }

  return element;
}

/* ─── Inner App (requires auth context) ─────────────────────── */
function AppInner() {
  const { isAuthenticated, login, logout, updatePermisos } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch real permissions dynamically on load/login
  const { data: authData, loading: authLoading } = useQuery(GET_MI_USUARIO_INFO, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  React.useEffect(() => {
    if (authData?.misPermisos) {
      const perms = authData.misPermisos;
      const email = authData.usuarioActual?.correo;
      const isAdmin = email === 'admin@activo.com' || (
        perms.includes('gestionar_roles') &&
        perms.includes('gestionar_permisos') &&
        perms.includes('eliminar_usuario')
      );
      updatePermisos(perms, isAdmin);
    }
  }, [authData, updatePermisos]);

  const handleLoginSuccess = (token: string, email: string) => {
    const isSuperAdmin = email === 'admin@activo.com';
    login(token, email, [], isSuperAdmin);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (authLoading && !authData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc',
        color: '#1a3c6e',
        fontFamily: 'sans-serif',
        fontWeight: 600
      }}>
        Cargando permisos...
      </div>
    );
  }

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <div className="app-main">
        <Topbar onLogout={logout} />
        <main className="main-content">
          <Routes>
             <Route path="/"              element={<ProtectedRoute element={<Dashboard />} />} />
             <Route path="/dashboard"     element={<ProtectedRoute element={<Dashboard />} />} />
             <Route path="/mi-cuenta"     element={<ProtectedRoute element={<MiCuenta />} />} />
             <Route path="/ingresos"      element={<ProtectedRoute element={<Ingresos />} requiredPermission="ver_ingresos" />} />
            <Route path="/activos"       element={<ProtectedRoute element={<Activos />} requiredPermission="ver_activos" />} />
            <Route path="/vehiculos"     element={<ProtectedRoute element={<Vehiculos />} requiredPermission="ver_vehiculos" />} />
            <Route path="/asignaciones"  element={<ProtectedRoute element={<Asignaciones />} requiredPermission="ver_asignaciones" />} />
            <Route path="/transferencias"element={<ProtectedRoute element={<Transferencias />} requiredPermission="ver_transferencias" />} />
            <Route path="/bajas"         element={<ProtectedRoute element={<Bajas />} requiredPermission="ver_bajas" />} />

            {/* Other System Modules (Protected) */}
            <Route path="/revaluos"      element={<ProtectedRoute element={<Revaluos />} requiredPermission="ver_reevaluos" />} />
            <Route path="/proveedores"   element={<ProtectedRoute element={<Proveedores />} requiredPermission="ver_proveedores" />} />
            <Route path="/oficinas"      element={<ProtectedRoute element={<Oficinas />} requiredPermission="ver_ubicaciones" />} />
            <Route path="/grupos"        element={<ProtectedRoute element={<Grupos />} requiredPermission="ver_grupos" />} />
            <Route path="/marcas"        element={<ProtectedRoute element={<Marcas />} requiredPermission="ver_marcas" />} />
            <Route path="/condiciones"   element={<ProtectedRoute element={<Condiciones />} requiredPermission="ver_condicion_activo" />} />
            <Route path="/unidades"      element={<ProtectedRoute element={<Unidades />} requiredPermission="ver_unidad_medida" />} />
            <Route path="/gestiones"     element={<ProtectedRoute element={<Gestiones />} requiredPermission="ver_gestiones" />} />
            <Route path="/partes"        element={<ProtectedRoute element={<Partes />} requiredPermission="ver_partes" />} />
            <Route path="/usuarios"      element={<ProtectedRoute element={<Usuarios />} requiredPermission="ver_usuarios" />} />
            <Route path="/roles"         element={<ProtectedRoute element={<Roles />} requiredPermission="gestionar_roles" />} />
            <Route path="/tipos"         element={<ProtectedRoute element={<Tipos />} requiredPermission="ver_tipos" />} />
            <Route path="/materiales"    element={<ProtectedRoute element={<Materiales />} requiredPermission="ver_materiales" />} />
            <Route path="/funciones"     element={<ProtectedRoute element={<Funciones />} requiredPermission="ver_funciones" />} />
            <Route path="/estados"       element={<ProtectedRoute element={<Estados />} requiredPermission="ver_estado_activo" />} />
            <Route path="/adquisiciones" element={<ProtectedRoute element={<Adquisiciones />} requiredPermission="ver_ordenes" />} />
            <Route path="/depreciaciones"element={<ProtectedRoute element={<Depreciaciones />} requiredPermission="ver_depreciaciones" />} />
            <Route path="/reportes"      element={<ProtectedRoute element={<Reportes />} requiredPermission="ver_reportes" />} />
            <Route path="/logs"          element={<ProtectedRoute element={<Logs />} requiredPermission="ver_auditoria" />} />
            <Route path="/atributos"     element={<ProtectedRoute element={<Atributos />} requiredPermission="ver_atributos" />} />
            <Route path="/ufvs"          element={<ProtectedRoute element={<Ufvs />} requiredPermission="ver_tipo_cambio" />} />
            
            {/* Fallback route for unknown paths or successful logins originating from /login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ─── Root (provides context + router) ──────────────────────── */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;