import PageLayout from '../components/ui/PageLayout';
import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { REGISTRAR_EMPLEADO_USUARIO } from '../graphql/mutations';
import { PERMISOS_METADATA } from '../utils/permisosMetadata';
import { useAuth } from '../context/AuthContext';

// ==================== QUERIES & MUTATIONS ====================
const GET_USUARIOS_DATA = gql`
  query GetUsuariosData {
    todosUsuarios {
      idUsuario
      correo
      estado
      twoFactorEnabled
      idEmpleado {
        idEmpleado
        nombre
        apellido
        numeroDocumento
        tipoDocumento
        fechaIngreso
        salario
        telefono
        cargo
        procedencia
      }
      rolesPermisos {
        id
        estado
        idRol {
          idRol
          nombre
          descripcion
        }
        idPermiso {
          idPermiso
          nombre
        }
      }
    }
    todosRoles {
      idRol
      nombre
      descripcion
    }
    todosPermisos {
      idPermiso
      nombre
    }
    todosResponsables {
      codResp
      codEstprog
      codEmp {
        idEmpleado
      }
      aB
    }
  }
`;

const CREAR_RESPONSABLE = gql`
  mutation CrearResponsable($codEstprog: String!, $codEmp: Int!, $tipoPer: String!, $fecha: Date!) {
    crearResponsable(codEstprog: $codEstprog, codEmp: $codEmp, tipoPer: $tipoPer, fecha: $fecha) {
      responsable {
        codResp
      }
    }
  }
`;

const DAR_DE_BAJA_RESPONSABLE = gql`
  mutation DarDeBajaResponsable($codResp: Int!) {
    darDeBajaResponsable(codResp: $codResp) {
      responsable {
        codResp
        aB
      }
    }
  }
`;

const EDITAR_USUARIO = gql`
  mutation EditarUsuario($idUsuario: Int!, $estado: String) {
    editarUsuario(idUsuario: $idUsuario, estado: $estado) {
      usuario {
        idUsuario
        estado
      }
    }
  }
`;

const ASIGNAR_ROL_PERMISO_USUARIO = gql`
  mutation AsignarRolPermisoUsuario($idUsuario: Int!, $idRol: Int!, $idPermiso: Int!, $estado: Boolean) {
    asignarRolPermisoUsuario(idUsuario: $idUsuario, idRol: $idRol, idPermiso: $idPermiso, estado: $estado) {
      rolPermisoUsuario {
        id
        estado
      }
    }
  }
`;

const TIPO_DOCS = [
  { value: 'DNI', label: 'DNI (Cédula de Identidad)' },
  { value: 'CE', label: 'Carné de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' }
];

export default function Usuarios() {
  const { user } = useAuth();
  const puedeCrear = user?.esAdmin || user?.permisos.includes('crear_usuario');
  const puedeEditar = user?.esAdmin || user?.permisos.includes('editar_usuario');
  const puedeCrearResp = user?.esAdmin || user?.permisos.includes('crear_responsable');
  const puedeEliminarResp = user?.esAdmin || user?.permisos.includes('eliminar_responsable');
  const puedeGestionarPermisos = user?.esAdmin || user?.permisos.includes('gestionar_permisos');

  const currentUserEmail = localStorage.getItem('userEmail') || '';

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showRespModal, setShowRespModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [empleadoParaResponsable, setEmpleadoParaResponsable] = useState<any>(null);

  // Form states
  const [formUsr, setFormUsr] = useState({
    nombre: '',
    apellido: '',
    numeroDocumento: '',
    tipoDocumento: 'DNI',
    fechaIngreso: '',
    salario: '',
    correo: '',
    contrasena: '',
    hacerResponsable: false,
    codEstprog: '',
    procedencia: ''
  });

  const [formResp, setFormResp] = useState({
    codEstprog: '',
    tipoPer: '2', // 2 = Responsable
    fecha: new Date().toISOString().split('T')[0]
  });

  // User matrix states
  const [selectedRolId, setSelectedRolId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'edit'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    gestion: true,
    contabilidad: true,
    adquisiciones: true,
    reportes: true,
    admin: true,
    catalogos: false,
  });

  // Apollo queries and mutations
  const { data, loading, error, refetch } = useQuery(GET_USUARIOS_DATA);

  const [registrarEmpleadoUsuario] = useMutation(REGISTRAR_EMPLEADO_USUARIO);
  const [crearResponsable] = useMutation(CREAR_RESPONSABLE);
  const [darDeBajaResponsable] = useMutation(DAR_DE_BAJA_RESPONSABLE);
  const [editarUsuario] = useMutation(EDITAR_USUARIO);
  const [asignarRolPermisoUsuario] = useMutation(ASIGNAR_ROL_PERMISO_USUARIO);

  // Memoized lookups for User permissions matrix
  const permissionLookup = React.useMemo(() => {
    const map = new Map<string, number>();
    if (data?.todosPermisos) {
      data.todosPermisos.forEach((p: any) => {
        map.set(p.nombre, parseInt(p.idPermiso));
      });
    }
    return map;
  }, [data?.todosPermisos]);

  const activeUserPermNames = React.useMemo(() => {
    const set = new Set<string>();
    if (usuarioSeleccionado?.rolesPermisos && selectedRolId) {
      usuarioSeleccionado.rolesPermisos.forEach((rp: any) => {
        if (rp.estado && String(rp.idRol?.idRol) === String(selectedRolId)) {
          set.add(rp.idPermiso.nombre);
        }
      });
    }
    return set;
  }, [usuarioSeleccionado, selectedRolId]);

  const allActiveUserPerms = React.useMemo(() => {
    const set = new Set<string>();
    if (usuarioSeleccionado?.rolesPermisos) {
      usuarioSeleccionado.rolesPermisos.forEach((rp: any) => {
        if (rp.estado && rp.idPermiso?.nombre) {
          set.add(rp.idPermiso.nombre);
        }
      });
    }
    return set;
  }, [usuarioSeleccionado]);


  const filteredMetadata = React.useMemo(() => {
    if (!searchQuery.trim()) return PERMISOS_METADATA;
    const q = searchQuery.toLowerCase();
    return PERMISOS_METADATA.map(mod => {
      const submodules = mod.submodules.filter(sub =>
        sub.label.toLowerCase().includes(q) ||
        mod.label.toLowerCase().includes(q) ||
        sub.actions.some(a => a.label.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      );
      return { ...mod, submodules };
    }).filter(mod => mod.submodules.length > 0);
  }, [searchQuery]);

  // Submit new employee + user creation
  const handleRegistrar = async () => {
    const { nombre, apellido, numeroDocumento, tipoDocumento, fechaIngreso, salario, correo, contrasena, hacerResponsable, codEstprog, procedencia } = formUsr;
    
    if (!nombre || !apellido || !numeroDocumento || !tipoDocumento || !fechaIngreso || !salario || !correo || !contrasena) {
      alert('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    if (hacerResponsable && !codEstprog) {
      alert('Por favor especifique el código de programa para el responsable.');
      return;
    }

    try {
      const res = await registrarEmpleadoUsuario({
        variables: {
          nombre,
          apellido,
          numeroDocumento,
          tipoDocumento,
          fechaIngreso,
          salario: parseFloat(salario),
          correo,
          contrasena,
          procedencia: procedencia || null
        }
      });

      const nuevoUsrObj = res.data?.registrarEmpleadoUsuario?.usuario;
      const nuevoEmpId = nuevoUsrObj?.idEmpleado?.idEmpleado;

      // Si se activó "Hacer Responsable", crear el responsable inmediatamente
      if (hacerResponsable && nuevoEmpId) {
        await crearResponsable({
          variables: {
            codEstprog,
            codEmp: parseInt(String(nuevoEmpId)),
            tipoPer: '2',
            fecha: fechaIngreso
          }
        });
      }

      setShowModal(false);
      setFormUsr({
        nombre: '',
        apellido: '',
        numeroDocumento: '',
        tipoDocumento: 'DNI',
        fechaIngreso: '',
        salario: '',
        correo: '',
        contrasena: '',
        hacerResponsable: false,
        codEstprog: '',
        procedencia: ''
      });
      refetch();
      alert('✅ Empleado y usuario registrados exitosamente.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Convert employee to responsible
  const handleAsignarResponsable = async () => {
    if (!formResp.codEstprog) {
      alert('Ingrese el código de programa.');
      return;
    }

    try {
      await crearResponsable({
        variables: {
          codEstprog: formResp.codEstprog,
          codEmp: parseInt(String(empleadoParaResponsable.idEmpleado)),
          tipoPer: formResp.tipoPer,
          fecha: formResp.fecha
        }
      });

      setShowRespModal(false);
      setEmpleadoParaResponsable(null);
      setFormResp({
        codEstprog: '',
        tipoPer: '2',
        fecha: new Date().toISOString().split('T')[0]
      });
      refetch();
      alert('✅ El empleado ahora es responsable de programa.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Decommission responsible (Dar de baja)
  const handleBajaResponsable = async (codResp: number) => {
    if (!window.confirm('¿Está seguro de dar de baja a este responsable de programa?')) return;
    try {
      await darDeBajaResponsable({
        variables: {
          codResp: parseInt(String(codResp))
        }
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // Edit User account status
  const handleCambiarEstado = async (idUsuario: number, nuevoEstado: string, correo: string) => {
    if (correo === currentUserEmail) {
      alert('No puedes desactivar o bloquear tu propia cuenta de usuario.');
      return;
    }

    try {
      await editarUsuario({
        variables: {
          idUsuario: parseInt(String(idUsuario)),
          estado: nuevoEstado
        }
      });
      refetch();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // ==================== MAPPING HANDLERS ====================
  interface PermUpdate {
    name: string;
    targetState: boolean;
  }

  const handleTogglePermission = async (permName: string) => {
    if (!usuarioSeleccionado || !selectedRolId) return;
    setIsSaving(true);
    try {
      const permId = permissionLookup.get(permName);
      if (!permId) {
        alert(`El permiso ${permName} no existe en la base de datos local.`);
        setIsSaving(false);
        return;
      }
      const existingRp = usuarioSeleccionado.rolesPermisos?.find(
        (rp: any) => rp.idPermiso?.nombre === permName && String(rp.idRol?.idRol) === String(selectedRolId)
      );
      const newStatus = existingRp ? !existingRp.estado : true;

      // Medida de seguridad: impedir que el usuario actual se quite su permiso de gestionar roles
      if (usuarioSeleccionado.correo === currentUserEmail && permName === 'gestionar_roles' && !newStatus) {
        if (!window.confirm('⚠️ Está a punto de revocar su propio permiso de Administrador/Gestionar Roles. Esto podría dejarlo sin acceso a esta sección. ¿Desea continuar?')) {
          setIsSaving(false);
          return;
        }
      }

      await asignarRolPermisoUsuario({
        variables: {
          idUsuario: parseInt(usuarioSeleccionado.idUsuario),
          idRol: parseInt(selectedRolId),
          idPermiso: permId,
          estado: newStatus
        }
      });

      const prevSelId = usuarioSeleccionado.idUsuario;
      const { data: newData } = await refetch();
      const updatedUsr = newData?.todosUsuarios?.find((u: any) => u.idUsuario === prevSelId);
      if (updatedUsr) setUsuarioSeleccionado(updatedUsr);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkToggleUser = async (updates: PermUpdate[]) => {
    if (!usuarioSeleccionado || !selectedRolId || updates.length === 0) return;
    setIsSaving(true);
    try {
      const promises = [];
      for (const update of updates) {
        const permId = permissionLookup.get(update.name);
        if (!permId) continue;

        const existingRp = usuarioSeleccionado.rolesPermisos?.find(
          (rp: any) => rp.idPermiso?.nombre === update.name && String(rp.idRol?.idRol) === String(selectedRolId)
        );
        const currentStatus = existingRp ? existingRp.estado : false;

        if (currentStatus !== update.targetState) {
          promises.push(
            asignarRolPermisoUsuario({
              variables: {
                idUsuario: parseInt(usuarioSeleccionado.idUsuario),
                idRol: parseInt(selectedRolId),
                idPermiso: permId,
                estado: update.targetState
              }
            })
          );
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        const prevSelId = usuarioSeleccionado.idUsuario;
        const { data: newData } = await refetch();
        const updatedUsr = newData?.todosUsuarios?.find((u: any) => u.idUsuario === prevSelId);
        if (updatedUsr) setUsuarioSeleccionado(updatedUsr);
      }
    } catch (e: any) {
      alert('Error al actualizar permisos del usuario: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModule = (moduleObj: any, targetState: boolean) => {
    const updates: PermUpdate[] = [];
    moduleObj.submodules.forEach((sub: any) => {
      sub.actions.forEach((act: any) => {
        updates.push({ name: act.name, targetState });
      });
    });
    handleBulkToggleUser(updates);
  };

  const handleToggleModuleColumn = (moduleObj: any, type: string, targetState: boolean) => {
    const updates: PermUpdate[] = [];
    moduleObj.submodules.forEach((sub: any) => {
      sub.actions.forEach((act: any) => {
        if (act.type === type) {
          updates.push({ name: act.name, targetState });
        }
      });
    });
    handleBulkToggleUser(updates);
  };

  const handleToggleSubmodule = (subObj: any, targetState: boolean) => {
    const updates: PermUpdate[] = [];
    subObj.actions.forEach((act: any) => {
      updates.push({ name: act.name, targetState });
    });
    handleBulkToggleUser(updates);
  };

  const handleToggleRoleAll = (targetState: boolean) => {
    const updates: PermUpdate[] = [];
    PERMISOS_METADATA.forEach(mod => {
      mod.submodules.forEach(sub => {
        sub.actions.forEach(act => {
          updates.push({ name: act.name, targetState });
        });
      });
    });
    handleBulkToggleUser(updates);
  };

  const handleToggleRoleReadOnly = () => {
    const updates: PermUpdate[] = [];
    PERMISOS_METADATA.forEach(mod => {
      mod.submodules.forEach(sub => {
        sub.actions.forEach(act => {
          updates.push({ name: act.name, targetState: act.type === 'ver' });
        });
      });
    });
    handleBulkToggleUser(updates);
  };

  const toggleExpandModule = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };
  // Helpers to check if user's employee is active responsible
  const getResponsableStatus = (idEmpleado: number) => {
    if (!data?.todosResponsables) return null;
    return data.todosResponsables.find(
      (r: any) => r.codEmp?.idEmpleado === idEmpleado && r.aB === 'A'
    );
  };

  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <PageLayout
      title="Personal, Usuarios y Permisos"
      actions={
        puedeCrear ? [
          { label: 'Nuevo', icon: '+', variant: 'primary' as const, onClick: () => setShowModal(true) },
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ] : [
          { label: 'Actualizar', icon: '↺', onClick: () => refetch() },
        ]
      }
    >


      <div style={{ display: 'grid', gridTemplateColumns: usuarioSeleccionado ? '1fr 1.6fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Tabla principal de usuarios */}
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Correo Usuario</th>
                <th>Empleado Asociado</th>
                <th>Cargo</th>
                <th>Responsable Programa</th>
                <th>Estado Cuenta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-36"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td><div className="h-8 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : data?.todosUsuarios?.map((u: any) => {
                const isMe = u.correo === currentUserEmail;
                const respObj = getResponsableStatus(u.idEmpleado?.idEmpleado);
                const isSelected = usuarioSeleccionado?.idUsuario === u.idUsuario;

                return (
                  <tr
                    key={u.idUsuario}
                    onClick={() => {
                      setUsuarioSeleccionado(u);
                      setActiveTab('summary');
                      setSelectedRolId('');
                    }}
                    style={{ cursor: 'pointer', background: isSelected ? '#e8f4fd' : 'white' }}
                  >
                    <td><strong>#{u.idUsuario}</strong></td>
                    <td>
                      {u.correo} {isMe && <strong style={{ color: '#3b82f6', fontSize: '0.8rem' }}>(Tú)</strong>}
                    </td>
                    <td>
                      {u.idEmpleado ? `${u.idEmpleado.nombre} ${u.idEmpleado.apellido}` : '-'}
                    </td>
                    <td>{u.idEmpleado?.cargo || 'Sin definir'}</td>
                    <td>
                      {respObj ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            Prog. {respObj.codEstprog}
                          </span>
                          {puedeEliminarResp && (
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '1px 5px', fontSize: '0.7rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBajaResponsable(respObj.codResp);
                              }}
                            >
                              Dar de Baja
                            </button>
                          )}
                        </div>
                      ) : u.idEmpleado ? (
                        puedeCrearResp ? (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmpleadoParaResponsable(u.idEmpleado);
                              setFormResp(prev => ({ ...prev, codEstprog: '' }));
                              setShowRespModal(true);
                            }}
                          >
                            Hacer Responsable
                          </button>
                        ) : (
                          '-'
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={u.estado}
                        className="badge"
                        style={{
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          background: u.estado === 'ACTIVO' ? '#d4edda' : u.estado === 'INACTIVO' ? '#e2e8f0' : '#f8d7da',
                          color: u.estado === 'ACTIVO' ? '#155724' : u.estado === 'INACTIVO' ? '#383d41' : '#721c24',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isMe ? 'not-allowed' : 'pointer'
                        }}
                        disabled={isMe || !puedeEditar}
                        onChange={(e) => handleCambiarEstado(u.idUsuario, e.target.value, u.correo)}
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="BLOQUEADO">Bloqueado</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUsuarioSeleccionado(u);
                          setActiveTab('summary');
                          setSelectedRolId('');
                        }}
                      >
                        Permisos
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panel lateral derecho de permisos */}
        {usuarioSeleccionado && (
          <div style={{
            background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: '1.5rem',
            maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto'
          }}>
            {/* Saving Loading Spinner Overlay */}
            {isSaving && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.75)', zIndex: 100,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                borderRadius: '12px'
              }}>
                <div className="loading-spinner" style={{
                  border: '4px solid #f3f3f3', borderTop: '4px solid #1a3c6e',
                  borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite',
                  marginBottom: '1rem'
                }}></div>
                <strong style={{ color: '#1a3c6e', fontSize: '0.9rem' }}>Actualizando permisos del usuario...</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a3c6e', margin: 0 }}>
                  Permisos de {usuarioSeleccionado.idEmpleado?.nombre} {usuarioSeleccionado.idEmpleado?.apellido}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Correo: <strong>{usuarioSeleccionado.correo}</strong>
                </span>
              </div>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', padding: '0 5px' }}
                onClick={() => { setUsuarioSeleccionado(null); setSelectedRolId(''); setActiveTab('summary'); }}
              >
                ×
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.25rem', gap: '1rem' }}>
              <button
                onClick={() => setActiveTab('summary')}
                style={{
                  padding: '0.6rem 1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'summary' ? '3px solid #1a3c6e' : '3px solid transparent',
                  color: activeTab === 'summary' ? '#1a3c6e' : '#64748b',
                  fontWeight: activeTab === 'summary' ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  transition: 'all 0.2s'
                }}
              >
                Permisos Activos
              </button>
              {puedeGestionarPermisos && (
                <button
                  onClick={() => setActiveTab('edit')}
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'edit' ? '3px solid #1a3c6e' : '3px solid transparent',
                    color: activeTab === 'edit' ? '#1a3c6e' : '#64748b',
                    fontWeight: activeTab === 'edit' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    transition: 'all 0.2s'
                  }}
                >
                  Modificar Permisos
                </button>
              )}
            </div>

            {/* Tab 1: Permisos Activos */}
            {activeTab === 'summary' && (
              <div>
                {/* Resumen de Roles Activos para el Usuario */}
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    Roles con Permisos Activos:
                  </span>
                  {(() => {
                    const map = new Map<number, string>();
                    if (usuarioSeleccionado.rolesPermisos) {
                      usuarioSeleccionado.rolesPermisos.forEach((rp: any) => {
                        if (rp.estado && rp.idRol) {
                          map.set(rp.idRol.idRol, rp.idRol.nombre);
                        }
                      });
                    }
                    const activeRoles = Array.from(map.entries());
                    if (activeRoles.length === 0) {
                      return <em style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sin roles o permisos asignados.</em>;
                    }
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {activeRoles.map(([idRol, name]) => (
                          <span key={idRol} className="badge" style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 600 }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Listado de Permisos Categorizados */}
                <div style={{ paddingRight: '0.25rem' }}>
                  {(() => {
                    let hasAnyActive = false;
                    const renderedModules = PERMISOS_METADATA.map(mod => {
                      const activeSubmodules = mod.submodules.map(sub => {
                        const activeActions = sub.actions.filter(act => allActiveUserPerms.has(act.name));
                        return { ...sub, activeActions };
                      }).filter(sub => sub.activeActions.length > 0);

                      if (activeSubmodules.length === 0) return null;
                      hasAnyActive = true;

                      return (
                        <div key={mod.id} style={{ marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ background: '#f1f5f9', color: '#1a3c6e', padding: '0.5rem 0.8rem', fontWeight: 700, fontSize: '0.82rem', borderBottom: '1px solid #cbd5e1' }}>
                            <span style={{ marginRight: '6px', color: '#1a3c6e' }}>■</span>
                            {mod.label}
                          </div>
                          <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {activeSubmodules.map(sub => (
                              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                                  {sub.label}
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'flex-end', maxWidth: '65%' }}>
                                  {sub.activeActions.map(act => {
                                    let badgeStyle = {
                                      fontSize: '0.65rem',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                      textTransform: 'uppercase' as const,
                                      border: '1px solid'
                                    };
                                    let badgeColor = { background: '#e2e8f0', color: '#475569', borderColor: '#cbd5e1' };
                                    if (act.type === 'ver') {
                                      badgeColor = { background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' };
                                    } else if (act.type === 'crear') {
                                      badgeColor = { background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' };
                                    } else if (act.type === 'editar') {
                                      badgeColor = { background: '#fef9c3', color: '#a16207', borderColor: '#fef08a' };
                                    } else if (act.type === 'eliminar') {
                                      badgeColor = { background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' };
                                    } else if (act.type === 'otro') {
                                      badgeColor = { background: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' };
                                    }
                                    return (
                                      <span key={act.name} style={{ ...badgeStyle, ...badgeColor }} title={act.name}>
                                        {act.label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });

                    if (!hasAnyActive) {
                      return (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                          <p style={{ fontSize: '0.82rem', margin: 0 }}>
                            El usuario no tiene ningún permiso activo en este momento. Vaya a la pestaña <strong>Modificar Permisos</strong> para configurar sus accesos.
                          </p>
                        </div>
                      );
                    }
                    return renderedModules;
                  })()}
                </div>
              </div>
            )}

            {/* Tab 2: Modificar Permisos */}
            {activeTab === 'edit' && (
              <div>
                {/* Roles Activos del Usuario (Guía Visual) */}
                {(() => {
                  const map = new Map<number, string>();
                  if (usuarioSeleccionado.rolesPermisos) {
                    usuarioSeleccionado.rolesPermisos.forEach((rp: any) => {
                      if (rp.estado && rp.idRol) {
                        map.set(rp.idRol.idRol, rp.idRol.nombre);
                      }
                    });
                  }
                  const activeRoles = Array.from(map.entries());
                  if (activeRoles.length > 0) {
                    return (
                      <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                          Roles Activos del Usuario (Haga clic para editar o quitar permisos):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {activeRoles.map(([idRol, name]) => {
                            const isCurrentlySelected = String(selectedRolId) === String(idRol);
                            return (
                              <button
                                key={idRol}
                                onClick={() => setSelectedRolId(String(idRol))}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  background: isCurrentlySelected ? '#15803d' : '#dcfce7',
                                  color: isCurrentlySelected ? '#ffffff' : '#15803d',
                                  border: '1px solid',
                                  borderColor: isCurrentlySelected ? '#15803d' : '#bbf7d0',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {name} {isCurrentlySelected ? '✓' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Selector de Rol para editar */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'block' }}>
                    Seleccionar Rol para Personalizar Permisos *
                  </label>
                  <select
                    value={selectedRolId}
                    disabled={!puedeGestionarPermisos}
                    onChange={e => {
                      setSelectedRolId(e.target.value);
                      setSearchQuery('');
                    }}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Seleccione un Rol para gestionar --</option>
                    {data?.todosRoles?.map((r: any) => {
                      const hasRoleActive = usuarioSeleccionado.rolesPermisos?.some(
                        (rp: any) => rp.estado && String(rp.idRol?.idRol) === String(r.idRol)
                      );
                      return (
                        <option key={r.idRol} value={r.idRol}>
                          {r.nombre} {hasRoleActive ? ' (Activo)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedRolId ? (
                  <>
                    {/* Toolbar de Matriz */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        placeholder="Buscar página..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ flex: 1, minWidth: '150px', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      />
                      
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button className="btn btn-secondary btn-sm" disabled={!puedeGestionarPermisos} onClick={() => handleToggleRoleReadOnly()} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                          Lectura
                        </button>
                        <button className="btn btn-primary btn-sm" disabled={!puedeGestionarPermisos} onClick={() => handleToggleRoleAll(true)} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                          Todos
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={!puedeGestionarPermisos} onClick={() => handleToggleRoleAll(false)} style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#ef4444' }}>
                          Ninguno
                        </button>
                      </div>
                    </div>

                    {/* Listado de Módulos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {filteredMetadata.map(moduleObj => {
                        const isExpanded = expandedModules[moduleObj.id];
                        
                        let activeCount = 0;
                        let totalCount = 0;
                        moduleObj.submodules.forEach(sub => {
                          sub.actions.forEach(act => {
                            totalCount++;
                            if (activeUserPermNames.has(act.name)) activeCount++;
                          });
                        });

                        return (
                          <div key={moduleObj.id} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                            
                            {/* Banner del Módulo */}
                            <div style={{
                              background: '#1a3c6e', color: 'white', padding: '0.5rem 0.8rem',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              cursor: 'pointer', userSelect: 'none'
                            }} onClick={() => toggleExpandModule(moduleObj.id)}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block', fontSize: '0.75rem' }}>▶</span>
                                <strong style={{ fontSize: '0.85rem' }}>{moduleObj.label}</strong>
                                <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px' }}>
                                  {activeCount}/{totalCount}
                                </span>
                              </div>

                              {/* Controles de Lote */}
                              <div style={{ display: 'flex', gap: '0.3rem' }} onClick={e => e.stopPropagation()}>
                                <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: '0.65rem', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none' }}
                                        onClick={() => handleToggleModule(moduleObj, true)}>
                                  Todo
                                </button>
                                <button className="btn btn-sm" style={{ padding: '1px 5px', fontSize: '0.65rem', color: '#ffb3b3', background: 'rgba(255,255,255,0.1)', border: 'none' }}
                                        onClick={() => handleToggleModule(moduleObj, false)}>
                                  Quitar
                                </button>
                              </div>
                            </div>

                            {/* Tabla de Submódulos */}
                            {isExpanded && (
                              <div style={{ background: '#ffffff', padding: '0.35rem', overflowX: 'auto' }}>
                                <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                  <thead>
                                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Submódulo / Página</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                        Ver
                                        <button title="Toggle columna Ver" style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 3px', fontSize: '0.58rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                                onClick={() => {
                                                  const allVerChecked = moduleObj.submodules.every(sub => {
                                                    const act = sub.actions.find(a => a.type === 'ver');
                                                    return !act || activeUserPermNames.has(act.name);
                                                  });
                                                  handleToggleModuleColumn(moduleObj, 'ver', !allVerChecked);
                                                }}>⇅</button>
                                      </th>
                                      <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                        Crear
                                        <button title="Toggle columna Crear" style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 3px', fontSize: '0.58rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                                onClick={() => {
                                                  const allCrearChecked = moduleObj.submodules.every(sub => {
                                                    const act = sub.actions.find(a => a.type === 'crear');
                                                    return !act || activeUserPermNames.has(act.name);
                                                  });
                                                  handleToggleModuleColumn(moduleObj, 'crear', !allCrearChecked);
                                                }}>⇅</button>
                                      </th>
                                      <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                        Editar
                                        <button title="Toggle columna Editar" style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 3px', fontSize: '0.58rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                                onClick={() => {
                                                  const allEditarChecked = moduleObj.submodules.every(sub => {
                                                    const act = sub.actions.find(a => a.type === 'editar');
                                                    return !act || activeUserPermNames.has(act.name);
                                                  });
                                                  handleToggleModuleColumn(moduleObj, 'editar', !allEditarChecked);
                                                }}>⇅</button>
                                      </th>
                                      <th style={{ padding: '0.5rem', textAlign: 'center', width: '70px' }}>
                                        Anul/Elim
                                        <button title="Toggle columna Eliminar" style={{ display: 'block', margin: '2px auto 0 auto', padding: '0px 3px', fontSize: '0.58rem', cursor: 'pointer', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                                onClick={() => {
                                                  const allElimChecked = moduleObj.submodules.every(sub => {
                                                    const act = sub.actions.find(a => a.type === 'eliminar');
                                                    return !act || activeUserPermNames.has(act.name);
                                                  });
                                                  handleToggleModuleColumn(moduleObj, 'eliminar', !allElimChecked);
                                                }}>⇅</button>
                                      </th>
                                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Acciones Especiales</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {moduleObj.submodules.map((sub, idx) => {
                                      const verAction = sub.actions.find(a => a.type === 'ver');
                                      const crearAction = sub.actions.find(a => a.type === 'crear');
                                      const editarAction = sub.actions.find(a => a.type === 'editar');
                                      const eliminarAction = sub.actions.find(a => a.type === 'eliminar');
                                      const otrasActions = sub.actions.filter(a => a.type === 'otro');

                                      const isPageAllChecked = sub.actions.every(a => activeUserPermNames.has(a.name));

                                      return (
                                        <tr key={sub.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                                          
                                          {/* Submódulo label & check row */}
                                          <td style={{ padding: '0.5rem', fontWeight: 600, color: '#334155' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                              <input
                                                type="checkbox"
                                                title="Toda la fila"
                                                checked={isPageAllChecked}
                                                disabled={!puedeGestionarPermisos}
                                                onChange={e => handleToggleSubmodule(sub, e.target.checked)}
                                                style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                                              />
                                              <span>{sub.label}</span>
                                            </div>
                                          </td>

                                          {/* Ver */}
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            {verAction && (
                                              <input
                                                type="checkbox"
                                                checked={activeUserPermNames.has(verAction.name)}
                                                disabled={!puedeGestionarPermisos}
                                                onChange={() => handleTogglePermission(verAction.name)}
                                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                                              />
                                            )}
                                          </td>

                                          {/* Crear */}
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            {crearAction && (
                                              <input
                                                type="checkbox"
                                                checked={activeUserPermNames.has(crearAction.name)}
                                                disabled={!puedeGestionarPermisos}
                                                onChange={() => handleTogglePermission(crearAction.name)}
                                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                                              />
                                            )}
                                          </td>

                                          {/* Editar */}
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            {editarAction && (
                                              <input
                                                type="checkbox"
                                                checked={activeUserPermNames.has(editarAction.name)}
                                                disabled={!puedeGestionarPermisos}
                                                onChange={() => handleTogglePermission(editarAction.name)}
                                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                                              />
                                            )}
                                          </td>

                                          {/* Eliminar */}
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            {eliminarAction && (
                                              <input
                                                type="checkbox"
                                                checked={activeUserPermNames.has(eliminarAction.name)}
                                                disabled={!puedeGestionarPermisos}
                                                onChange={() => handleTogglePermission(eliminarAction.name)}
                                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                                              />
                                            )}
                                          </td>

                                          {/* Otros */}
                                          <td style={{ padding: '0.5rem' }}>
                                            {otrasActions.length > 0 ? (
                                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                {otrasActions.map(act => (
                                                  <label key={act.name} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '2px',
                                                    background: activeUserPermNames.has(act.name) ? '#e0f2fe' : '#f1f5f9',
                                                    border: '1px solid',
                                                    borderColor: activeUserPermNames.has(act.name) ? '#bae6fd' : '#cbd5e1',
                                                    padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem',
                                                    color: activeUserPermNames.has(act.name) ? '#0369a1' : '#475569',
                                                    cursor: 'pointer', userSelect: 'none'
                                                  }}>
                                                    <input
                                                      type="checkbox"
                                                      checked={activeUserPermNames.has(act.name)}
                                                      disabled={!puedeGestionarPermisos}
                                                      onChange={() => handleTogglePermission(act.name)}
                                                      style={{ width: '10px', height: '10px', cursor: 'pointer' }}
                                                    />
                                                    {act.label}
                                                  </label>
                                                ))}
                                              </div>
                                            ) : (
                                              <span style={{ color: '#ccc', fontSize: '0.7rem', fontStyle: 'italic' }}>-</span>
                                            )}
                                          </td>

                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#1a3c6e', marginBottom: '0.25rem' }}>
                      Matriz de Permisos Personalizados
                    </strong>
                    <p style={{ fontSize: '0.78rem', margin: 0, maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Seleccione un Rol en el menú superior para ver y personalizar los permisos específicos de este usuario en dicho perfil.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODAL: NUEVO EMPLEADO Y USUARIO ==================== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ width: '650px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Registrar Nuevo Empleado y Cuenta</h2>
            
            <div className="form-grid">
              <div className="section-label" style={{ gridColumn: '1 / -1', margin: '0.25rem 0' }}>Datos Personales del Empleado</div>
              
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej. Juan"
                  value={formUsr.nombre}
                  onChange={e => setFormUsr({ ...formUsr, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Apellido *</label>
                <input
                  type="text"
                  placeholder="Ej. Pérez"
                  value={formUsr.apellido}
                  onChange={e => setFormUsr({ ...formUsr, apellido: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo Documento *</label>
                <select
                  value={formUsr.tipoDocumento}
                  onChange={e => setFormUsr({ ...formUsr, tipoDocumento: e.target.value })}
                >
                  {TIPO_DOCS.map(td => (
                    <option key={td.value} value={td.value}>{td.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nro. de Documento *</label>
                <input
                  type="text"
                  placeholder="Ej. 1234567"
                  value={formUsr.numeroDocumento}
                  onChange={e => setFormUsr({ ...formUsr, numeroDocumento: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  Procedencia (CI)
                  <span className="text-blue-500 cursor-help ml-1" title="Lugar de emisión de la Cédula de Identidad (ej. LP para La Paz).">🛈</span>
                </label>
                <select
                  value={formUsr.procedencia}
                  onChange={e => setFormUsr({ ...formUsr, procedencia: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  <option value="LP">LP - La Paz</option>
                  <option value="SC">SC - Santa Cruz</option>
                  <option value="CB">CB - Cochabamba</option>
                  <option value="OR">OR - Oruro</option>
                  <option value="PT">PT - Potosí</option>
                  <option value="TJ">TJ - Tarija</option>
                  <option value="CH">CH - Chuquisaca</option>
                  <option value="BE">BE - Beni</option>
                  <option value="PD">PD - Pando</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha de Ingreso *</label>
                <input
                  type="date"
                  value={formUsr.fechaIngreso}
                  onChange={e => setFormUsr({ ...formUsr, fechaIngreso: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Salario Mensual (Bs.) *</label>
                <input
                  type="number"
                  placeholder="Ej. 6500"
                  value={formUsr.salario}
                  onChange={e => setFormUsr({ ...formUsr, salario: e.target.value })}
                />
              </div>

              <div className="section-label" style={{ gridColumn: '1 / -1', margin: '0.5rem 0 0.25rem 0' }}>Datos de la Cuenta de Acceso</div>

              <div className="form-group">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  placeholder="juan@activo.com"
                  value={formUsr.correo}
                  onChange={e => setFormUsr({ ...formUsr, correo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="password"
                  placeholder="Escriba contraseña temporal"
                  value={formUsr.contrasena}
                  onChange={e => setFormUsr({ ...formUsr, contrasena: e.target.value })}
                />
              </div>

              {/* Opción Responsable */}
              <div className="form-group form-group-full" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="chkResp"
                  style={{ width: 'auto', cursor: 'pointer' }}
                  checked={formUsr.hacerResponsable}
                  onChange={e => setFormUsr({ ...formUsr, hacerResponsable: e.target.checked })}
                />
                <label htmlFor="chkResp" style={{ cursor: 'pointer', margin: 0 }}>
                  <strong>¿Asignar inmediatamente como Responsable de Programa?</strong>
                  <span className="text-blue-500 cursor-help ml-1" title="Si se marca, el empleado se registrará automáticamente como responsable de un programa presupuestario para recibir activos.">🛈</span>
                </label>
              </div>

              {formUsr.hacerResponsable && (
                <div className="form-group form-group-full" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label>
                    Código de Programa (Estudio Programático) *
                    <span className="text-blue-500 cursor-help ml-1" title="Código numérico del programa presupuestario al que se asocia el responsable (ej. 1221).">🛈</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1221"
                    value={formUsr.codEstprog}
                    onChange={e => setFormUsr({ ...formUsr, codEstprog: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Esto creará el registro del responsable de programa para que el empleado pueda recibir asignaciones.
                  </span>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleRegistrar}>
                Registrar Empleado y Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ASIGNAR RESPONSABLE POST-CREACIÓN ==================== */}
      {showRespModal && empleadoParaResponsable && (
        <div className="modal-overlay" onClick={() => setShowRespModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Asignar como Responsable</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Convertir al empleado: <strong>{empleadoParaResponsable.nombre} {empleadoParaResponsable.apellido}</strong> en responsable.
            </p>

            <div className="form-group">
              <label>
                Código de Programa (Estudio Programático) *
                <span className="text-blue-500 cursor-help ml-1" title="Código numérico del programa presupuestario al que se asocia el responsable (ej. 1221).">🛈</span>
              </label>
              <input
                type="text"
                placeholder="Ej. 1221"
                value={formResp.codEstprog}
                onChange={e => setFormResp({ ...formResp, codEstprog: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Fecha de Asignación *</label>
              <input
                type="date"
                value={formResp.fecha}
                onChange={e => setFormResp({ ...formResp, fecha: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRespModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAsignarResponsable}>
                Asignar Responsable
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
