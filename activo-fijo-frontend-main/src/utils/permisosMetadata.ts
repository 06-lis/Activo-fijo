export interface PermissionAction {
  name: string;
  type: 'ver' | 'crear' | 'editar' | 'eliminar' | 'otro';
  label: string;
}

export interface SubmodulePermissions {
  id: string;
  label: string;
  actions: PermissionAction[];
}

export interface ModulePermissions {
  id: string;
  label: string;
  submodules: SubmodulePermissions[];
}

export const PERMISOS_METADATA: ModulePermissions[] = [
  {
    id: 'gestion',
    label: 'Gestión de Activos',
    submodules: [
      {
        id: 'ingresos',
        label: 'Ingresos',
        actions: [
          { name: 'ver_ingresos', type: 'ver', label: 'Ver' },
          { name: 'crear_ingreso', type: 'crear', label: 'Crear' },
          { name: 'editar_ingreso', type: 'editar', label: 'Editar' },
          { name: 'eliminar_ingreso', type: 'eliminar', label: 'Eliminar' },
          { name: 'ver_tipos_ingreso', type: 'otro', label: 'Ver Tipos' },
          { name: 'crear_tipo_ingreso', type: 'otro', label: 'Crear Tipo' },
          { name: 'editar_tipo_ingreso', type: 'otro', label: 'Editar Tipo' },
          { name: 'eliminar_tipo_ingreso', type: 'otro', label: 'Eliminar Tipo' },
        ],
      },
      {
        id: 'activos',
        label: 'Activos Fijos',
        actions: [
          { name: 'ver_activos', type: 'ver', label: 'Ver' },
          { name: 'crear_activo', type: 'crear', label: 'Crear' },
          { name: 'editar_activo', type: 'editar', label: 'Editar' },
          { name: 'eliminar_activo', type: 'eliminar', label: 'Eliminar' },
          { name: 'solicitar_baja', type: 'otro', label: 'Sol. Baja' },
          { name: 'solicitar_reevaluo', type: 'otro', label: 'Sol. Revalúo' },
          { name: 'solicitar_transferencia', type: 'otro', label: 'Sol. Transf.' },
        ],
      },
      {
        id: 'asignaciones',
        label: 'Asignaciones',
        actions: [
          { name: 'ver_asignaciones', type: 'ver', label: 'Ver' },
          { name: 'crear_asignacion', type: 'crear', label: 'Crear' },
          { name: 'editar_asignacion', type: 'editar', label: 'Editar' },
          { name: 'eliminar_asignacion', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'transferencias',
        label: 'Transferencias',
        actions: [
          { name: 'ver_transferencias', type: 'ver', label: 'Ver' },
          { name: 'autorizar_transferencia', type: 'otro', label: 'Aut. Transf.' },
        ],
      },
      {
        id: 'bajas',
        label: 'Bajas',
        actions: [
          { name: 'ver_bajas', type: 'ver', label: 'Ver' },
          { name: 'autorizar_baja', type: 'otro', label: 'Aut. Baja' },
          { name: 'ver_motivos_baja', type: 'otro', label: 'Ver Motivos' },
          { name: 'crear_motivo_baja', type: 'otro', label: 'Crear Motivo' },
          { name: 'editar_motivo_baja', type: 'otro', label: 'Editar Motivo' },
          { name: 'eliminar_motivo_baja', type: 'otro', label: 'Eliminar Motivo' },
        ],
      },
      {
        id: 'vehiculos',
        label: 'Vehículos',
        actions: [
          { name: 'ver_vehiculos', type: 'ver', label: 'Ver' },
          { name: 'crear_vehiculo', type: 'crear', label: 'Crear' },
          { name: 'editar_vehiculo', type: 'editar', label: 'Editar' },
          { name: 'eliminar_vehiculo', type: 'eliminar', label: 'Eliminar' },
        ],
      },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    submodules: [
      {
        id: 'depreciaciones',
        label: 'Depreciaciones',
        actions: [
          { name: 'ver_depreciaciones', type: 'ver', label: 'Ver' },
          { name: 'crear_depreciacion', type: 'crear', label: 'Crear' },
        ],
      },
      {
        id: 'revaluos',
        label: 'Revalúos',
        actions: [
          { name: 'ver_reevaluos', type: 'ver', label: 'Ver' },
          { name: 'autorizar_reevaluo', type: 'otro', label: 'Aut. Revalúo' },
          { name: 'ver_tipos_reevaluo', type: 'otro', label: 'Ver Tipos' },
          { name: 'crear_tipo_reevaluo', type: 'otro', label: 'Crear Tipo' },
          { name: 'editar_tipo_reevaluo', type: 'otro', label: 'Editar Tipo' },
          { name: 'eliminar_tipo_reevaluo', type: 'otro', label: 'Eliminar Tipo' },
        ],
      },
      {
        id: 'ufvs',
        label: 'Tasas UFV',
        actions: [
          { name: 'ver_tipo_cambio', type: 'ver', label: 'Ver' },
          { name: 'crear_tipo_cambio', type: 'crear', label: 'Crear' },
          { name: 'editar_tipo_cambio', type: 'editar', label: 'Editar' },
        ],
      },
    ],
  },
  {
    id: 'adquisiciones',
    label: 'Adquisiciones',
    submodules: [
      {
        id: 'adquisiciones',
        label: 'Adquisiciones',
        actions: [
          { name: 'ver_ordenes', type: 'ver', label: 'Ver Órdenes' },
          { name: 'crear_orden', type: 'crear', label: 'Crear Orden' },
          { name: 'autorizar_orden', type: 'otro', label: 'Aut. Orden' },
          { name: 'eliminar_orden', type: 'eliminar', label: 'Eliminar Orden' },
          { name: 'ver_facturas', type: 'otro', label: 'Ver Facturas' },
          { name: 'crear_factura', type: 'otro', label: 'Crear Factura' },
          { name: 'editar_factura', type: 'otro', label: 'Editar Factura' },
          { name: 'eliminar_factura', type: 'otro', label: 'Eliminar Factura' },
        ],
      },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes y Auditoría',
    submodules: [
      {
        id: 'reportes',
        label: 'Reportes',
        actions: [
          { name: 'ver_reportes', type: 'ver', label: 'Ver' },
          { name: 'exportar_reportes', type: 'otro', label: 'Exportar' },
        ],
      },
      {
        id: 'logs',
        label: 'Bitácora',
        actions: [
          { name: 'ver_auditoria', type: 'ver', label: 'Ver Auditoría' },
        ],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    submodules: [
      {
        id: 'usuarios',
        label: 'Usuarios y Personal',
        actions: [
          { name: 'ver_usuarios', type: 'ver', label: 'Ver' },
          { name: 'crear_usuario', type: 'crear', label: 'Crear' },
          { name: 'editar_usuario', type: 'editar', label: 'Editar' },
          { name: 'eliminar_usuario', type: 'eliminar', label: 'Eliminar' },
          { name: 'ver_empleados', type: 'otro', label: 'Ver Personal' },
          { name: 'crear_empleado', type: 'otro', label: 'Crear Personal' },
          { name: 'editar_empleado', type: 'otro', label: 'Editar Personal' },
          { name: 'eliminar_empleado', type: 'otro', label: 'Eliminar Personal' },
          { name: 'ver_responsables', type: 'otro', label: 'Ver Responsables' },
          { name: 'crear_responsable', type: 'otro', label: 'Crear Responsable' },
          { name: 'editar_responsable', type: 'otro', label: 'Editar Responsable' },
          { name: 'eliminar_responsable', type: 'otro', label: 'Eliminar Responsable' },
        ],
      },
      {
        id: 'roles',
        label: 'Roles y Permisos',
        actions: [
          { name: 'gestionar_roles', type: 'ver', label: 'Gestionar Roles' },
          { name: 'gestionar_permisos', type: 'otro', label: 'Gestionar Permisos' },
        ],
      },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    submodules: [
      {
        id: 'grupos',
        label: 'Grupos',
        actions: [
          { name: 'ver_grupos', type: 'ver', label: 'Ver' },
          { name: 'crear_grupo', type: 'crear', label: 'Crear' },
          { name: 'editar_grupo', type: 'editar', label: 'Editar' },
          { name: 'eliminar_grupo', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'oficinas',
        label: 'Oficinas (Ubicac.)',
        actions: [
          { name: 'ver_ubicaciones', type: 'ver', label: 'Ver' },
          { name: 'crear_ubicacion', type: 'crear', label: 'Crear' },
          { name: 'editar_ubicacion', type: 'editar', label: 'Editar' },
          { name: 'eliminar_ubicacion', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'proveedores',
        label: 'Proveedores',
        actions: [
          { name: 'ver_proveedores', type: 'ver', label: 'Ver' },
          { name: 'crear_proveedor', type: 'crear', label: 'Crear' },
          { name: 'editar_proveedor', type: 'editar', label: 'Editar' },
          { name: 'eliminar_proveedor', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'marcas',
        label: 'Marcas',
        actions: [
          { name: 'ver_marcas', type: 'ver', label: 'Ver' },
          { name: 'crear_marca', type: 'crear', label: 'Crear' },
          { name: 'editar_marca', type: 'editar', label: 'Editar' },
          { name: 'eliminar_marca', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'modelos',
        label: 'Modelos',
        actions: [
          { name: 'ver_modelos', type: 'ver', label: 'Ver' },
          { name: 'crear_modelo', type: 'crear', label: 'Crear' },
        ],
      },
      {
        id: 'condiciones',
        label: 'Condiciones de Act.',
        actions: [
          { name: 'ver_condicion_activo', type: 'ver', label: 'Ver' },
          { name: 'crear_condicion_activo', type: 'crear', label: 'Crear' },
          { name: 'editar_condicion_activo', type: 'editar', label: 'Editar' },
        ],
      },
      {
        id: 'estados',
        label: 'Estados de Activo',
        actions: [
          { name: 'ver_estado_activo', type: 'ver', label: 'Ver' },
          { name: 'crear_estado_activo', type: 'crear', label: 'Crear' },
          { name: 'editar_estado_activo', type: 'editar', label: 'Editar' },
        ],
      },
      {
        id: 'unidades',
        label: 'Unidades de Medida',
        actions: [
          { name: 'ver_unidad_medida', type: 'ver', label: 'Ver' },
          { name: 'crear_unidad_medida', type: 'crear', label: 'Crear' },
          { name: 'editar_unidad_medida', type: 'editar', label: 'Editar' },
        ],
      },
      {
        id: 'gestiones',
        label: 'Gestiones',
        actions: [
          { name: 'ver_gestiones', type: 'ver', label: 'Ver' },
          { name: 'crear_gestion', type: 'crear', label: 'Crear' },
          { name: 'editar_gestion', type: 'editar', label: 'Editar' },
          { name: 'eliminar_gestion', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'partes',
        label: 'Partes de Activos',
        actions: [
          { name: 'ver_partes', type: 'ver', label: 'Ver' },
          { name: 'crear_parte', type: 'crear', label: 'Crear' },
          { name: 'editar_parte', type: 'editar', label: 'Editar' },
          { name: 'eliminar_parte', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'atributos',
        label: 'Atributos Adic.',
        actions: [
          { name: 'ver_atributos', type: 'ver', label: 'Ver' },
          { name: 'crear_atributo', type: 'crear', label: 'Crear' },
          { name: 'editar_atributo', type: 'editar', label: 'Editar' },
          { name: 'eliminar_atributo', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'tipos',
        label: 'Tipos de Activos',
        actions: [
          { name: 'ver_tipos', type: 'ver', label: 'Ver' },
          { name: 'crear_tipo', type: 'crear', label: 'Crear' },
          { name: 'editar_tipo', type: 'editar', label: 'Editar' },
          { name: 'eliminar_tipo', type: 'eliminar', label: 'Eliminar' },
        ],
      },
      {
        id: 'materiales',
        label: 'Materiales',
        actions: [
          { name: 'ver_materiales', type: 'ver', label: 'Ver' },
          { name: 'crear_material', type: 'crear', label: 'Crear' },
          { name: 'editar_material', type: 'editar', label: 'Editar' },
        ],
      },
      {
        id: 'funciones',
        label: 'Funciones Adm.',
        actions: [
          { name: 'ver_funciones', type: 'ver', label: 'Ver' },
          { name: 'crear_funcion', type: 'crear', label: 'Crear' },
          { name: 'editar_funcion', type: 'editar', label: 'Editar' },
        ],
      },
    ],
  },
];
