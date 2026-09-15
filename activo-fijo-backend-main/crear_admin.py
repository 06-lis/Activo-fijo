"""
Script para crear el rol 'Administrador' con TODOS los permisos del sistema
y asignarlo a un usuario existente.

USO:
1. Copia este archivo a la carpeta D:\\activos_fijos\\activo-fijo-backend-main
2. En cmd, con el venv activado y DB_PASSWORD seteado, ejecuta:
   python manage.py shell -c "exec(open('crear_admin.py', encoding='utf-8').read())"
"""

from activo.models import in_rol, in_permiso, in_rol_permiso_usuario, in_usuario

# --- CONFIGURA AQUI el correo del usuario a convertir en administrador ---
CORREO_USUARIO = "abel@bulo.com"
# ---------------------------------------------------------------------

TODOS_LOS_PERMISOS = [
    "ver_ingresos", "crear_ingreso", "editar_ingreso", "eliminar_ingreso",
    "ver_tipos_ingreso", "crear_tipo_ingreso", "editar_tipo_ingreso", "eliminar_tipo_ingreso",
    "ver_activos", "crear_activo", "editar_activo", "eliminar_activo",
    "solicitar_baja", "solicitar_reevaluo", "solicitar_transferencia",
    "ver_asignaciones", "crear_asignacion", "editar_asignacion", "eliminar_asignacion",
    "ver_transferencias", "autorizar_transferencia",
    "ver_bajas", "autorizar_baja", "ver_motivos_baja", "crear_motivo_baja",
    "editar_motivo_baja", "eliminar_motivo_baja",
    "ver_vehiculos", "crear_vehiculo", "editar_vehiculo", "eliminar_vehiculo",
    "ver_depreciaciones", "crear_depreciacion",
    "ver_reevaluos", "autorizar_reevaluo", "ver_tipos_reevaluo", "crear_tipo_reevaluo",
    "editar_tipo_reevaluo", "eliminar_tipo_reevaluo",
    "ver_tipo_cambio", "crear_tipo_cambio", "editar_tipo_cambio",
    "ver_ordenes", "crear_orden", "autorizar_orden", "eliminar_orden",
    "ver_facturas", "crear_factura", "editar_factura", "eliminar_factura",
    "ver_reportes", "exportar_reportes",
    "ver_auditoria",
    "ver_usuarios", "crear_usuario", "editar_usuario", "eliminar_usuario",
    "ver_empleados", "crear_empleado", "editar_empleado", "eliminar_empleado",
    "ver_responsables", "crear_responsable", "editar_responsable", "eliminar_responsable",
    "gestionar_roles", "gestionar_permisos",
    "ver_grupos", "crear_grupo", "editar_grupo", "eliminar_grupo",
    "ver_ubicaciones", "crear_ubicacion", "editar_ubicacion", "eliminar_ubicacion",
    "ver_proveedores", "crear_proveedor", "editar_proveedor", "eliminar_proveedor",
    "ver_marcas", "crear_marca", "editar_marca", "eliminar_marca",
    "ver_modelos", "crear_modelo",
    "ver_condicion_activo", "crear_condicion_activo", "editar_condicion_activo",
    "ver_estado_activo", "crear_estado_activo", "editar_estado_activo",
    "ver_unidad_medida", "crear_unidad_medida", "editar_unidad_medida",
    "ver_gestiones", "crear_gestion", "editar_gestion", "eliminar_gestion",
    "ver_partes", "crear_parte", "editar_parte", "eliminar_parte",
    "ver_atributos", "crear_atributo", "editar_atributo", "eliminar_atributo",
    "ver_tipos", "crear_tipo", "editar_tipo", "eliminar_tipo",
    "ver_materiales", "crear_material", "editar_material",
    "ver_funciones", "crear_funcion", "editar_funcion",
]

# 1. Crear o recuperar el rol Administrador
rol, creado = in_rol.objects.get_or_create(
    nombre="Administrador",
    defaults={"descripcion": "Rol con todos los permisos del sistema"}
)
print(f"Rol '{rol.nombre}' {'creado' if creado else 'ya existia'}.")

# 2. Crear todos los permisos que no existan aun
permisos_objs = []
for nombre_permiso in TODOS_LOS_PERMISOS:
    permiso, _ = in_permiso.objects.get_or_create(nombre=nombre_permiso)
    permisos_objs.append(permiso)
print(f"Total de permisos disponibles: {len(permisos_objs)}")

# 3. Buscar el usuario por correo
usuario = in_usuario.objects.get(correo=CORREO_USUARIO)
print(f"Usuario encontrado: {usuario.correo}")

# 4. Asignar todos los permisos al usuario bajo el rol Administrador
creados = 0
for permiso in permisos_objs:
    _, fue_creado = in_rol_permiso_usuario.objects.get_or_create(
        id_usuario=usuario,
        id_rol=rol,
        id_permiso=permiso,
        defaults={"estado": True}
    )
    if fue_creado:
        creados += 1

print(f"Listo. Se asignaron {creados} permisos nuevos al usuario {usuario.correo}.")
print("Cierra sesion y vuelve a entrar en el frontend para ver el menu completo.")
