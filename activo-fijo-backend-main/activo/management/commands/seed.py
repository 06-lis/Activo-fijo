from django.core.management.base import BaseCommand
from activo.models.rbac import (
    in_rol, in_permiso, in_rol_permiso,
    in_empleado, in_usuario, in_rol_permiso_usuario,
)
from datetime import date


class Command(BaseCommand):
    help = 'Crea datos iniciales: permisos, roles, empleados, usuarios y relaciones RBAC'

    def handle(self, *args, **options):
        # ============================================================
        # 1. PERMISOS
        # ============================================================
        permisos_nombres = [
            # DASHBOARD
            'ver_dashboard',

            # AUDITORÍA
            'ver_auditoria',

            # ACTIVOS
            'ver_activos', 'crear_activo', 'editar_activo', 'eliminar_activo',
            'solicitar_baja', 'solicitar_reevaluo', 'solicitar_transferencia',
            'autorizar_baja', 'autorizar_reevaluo', 'autorizar_transferencia',

            # ASIGNACIONES
            'ver_asignaciones', 'crear_asignacion', 'editar_asignacion', 'eliminar_asignacion',

            # BAJAS
            'ver_bajas',
            'ver_motivos_baja', 'crear_motivo_baja', 'editar_motivo_baja', 'eliminar_motivo_baja',

            # REEVALÚOS
            'ver_reevaluos',
            'ver_tipos_reevaluo', 'crear_tipo_reevaluo', 'editar_tipo_reevaluo', 'eliminar_tipo_reevaluo',

            # TRANSFERENCIAS
            'ver_transferencias',

            # VEHÍCULOS
            'ver_vehiculos', 'crear_vehiculo', 'editar_vehiculo', 'eliminar_vehiculo',

            # MANTENIMIENTOS
            'ver_mantenimientos', 'registrar_mantenimiento', 'editar_mantenimiento', 'eliminar_mantenimiento',

            # USUARIOS
            'ver_usuarios', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',

            # EMPLEADOS
            'ver_empleados', 'crear_empleado', 'editar_empleado', 'eliminar_empleado',

            # CATÁLOGOS — Marcas
            'ver_marcas', 'crear_marca', 'editar_marca', 'eliminar_marca',
            # Modelos
            'ver_modelos', 'crear_modelo', 'editar_modelo', 'eliminar_modelo',
            # Categorías
            'ver_categorias', 'crear_categoria', 'editar_categoria', 'eliminar_categoria',
            # Grupos
            'ver_grupos', 'crear_grupo', 'editar_grupo', 'eliminar_grupo',
            # Garantías
            'ver_garantias', 'crear_garantia', 'editar_garantia', 'eliminar_garantia',
            # Tipo de Cambio
            'ver_tipo_cambio', 'crear_tipo_cambio', 'editar_tipo_cambio', 'eliminar_tipo_cambio',
            # Condición de Activo
            'ver_condicion_activo', 'crear_condicion_activo', 'editar_condicion_activo', 'eliminar_condicion_activo',
            # Estado de Activo
            'ver_estado_activo', 'crear_estado_activo', 'editar_estado_activo', 'eliminar_estado_activo',
            # Industrias
            'ver_industrias', 'crear_industria', 'editar_industria', 'eliminar_industria',
            # Unidad de Medida
            'ver_unidad_medida', 'crear_unidad_medida', 'editar_unidad_medida', 'eliminar_unidad_medida',

            # CATÁLOGOS ADICIONALES
            # Gestiones
            'ver_gestiones', 'crear_gestion', 'editar_gestion', 'eliminar_gestion',
            # Partes
            'ver_partes', 'crear_parte', 'editar_parte', 'eliminar_parte',
            # Atributos
            'ver_atributos', 'crear_atributo', 'editar_atributo', 'eliminar_atributo',
            # Tipos
            'ver_tipos', 'crear_tipo', 'editar_tipo', 'eliminar_tipo',
            # Materiales
            'ver_materiales', 'crear_material', 'editar_material', 'eliminar_material',
            # Funciones Adm.
            'ver_funciones', 'crear_funcion', 'editar_funcion', 'eliminar_funcion',

            # PROVEEDORES
            'ver_proveedores', 'crear_proveedor', 'editar_proveedor', 'eliminar_proveedor',

            # ÓRDENES
            'ver_ordenes', 'crear_orden', 'autorizar_orden', 'eliminar_orden',

            # FACTURAS
            'ver_facturas', 'crear_factura', 'editar_factura', 'eliminar_factura',

            # UBICACIONES
            'ver_ubicaciones', 'crear_ubicacion', 'editar_ubicacion', 'eliminar_ubicacion',

            # RESPONSABLES
            'ver_responsables', 'crear_responsable', 'editar_responsable', 'eliminar_responsable',

            # INGRESOS
            'ver_ingresos', 'crear_ingreso', 'editar_ingreso', 'eliminar_ingreso',
            'ver_tipos_ingreso', 'crear_tipo_ingreso', 'editar_tipo_ingreso', 'eliminar_tipo_ingreso',

            # DEPRECIACIONES
            'ver_depreciaciones', 'crear_depreciacion', 'eliminar_depreciacion',

            # REPORTES
            'ver_reportes', 'exportar_reportes',

            # SISTEMA (Roles y Permisos)
            'gestionar_roles', 'gestionar_permisos',
        ]

        # Eliminar duplicados manteniendo orden
        permisos_nombres = list(dict.fromkeys(permisos_nombres))

        permisos = {}
        for nombre in permisos_nombres:
            obj, created = in_permiso.objects.get_or_create(nombre=nombre)
            permisos[nombre] = obj
            if created:
                self.stdout.write(f'  + Permiso: {nombre}')

        self.stdout.write(self.style.SUCCESS(f'  Permisos: {len(permisos)} registrados'))

        # ============================================================
        # 2. ROLES
        # ============================================================
        admin_rol, _ = in_rol.objects.get_or_create(
            nombre='Administrador', defaults={'descripcion': 'Acceso total al sistema'})
        supervisor_rol, _ = in_rol.objects.get_or_create(
            nombre='Supervisor', defaults={'descripcion': 'Supervisa, crea, edita y autoriza'})
        operador_rol, _ = in_rol.objects.get_or_create(
            nombre='Operador', defaults={'descripcion': 'Registra operaciones diarias'})
        auxiliar_rol, _ = in_rol.objects.get_or_create(
            nombre='Auxiliar', defaults={'descripcion': 'Mantenimientos y asignaciones'})
        consulta_rol, _ = in_rol.objects.get_or_create(
            nombre='Consulta', defaults={'descripcion': 'Solo lectura'})
        inventario_rol, _ = in_rol.objects.get_or_create(
            nombre='Inventario', defaults={'descripcion': 'Gestión física de activos'})
        gestor_roles_rol, _ = in_rol.objects.get_or_create(
            nombre='Gestor de Roles', defaults={'descripcion': 'Gestiona roles y permisos'})

        self.stdout.write(self.style.SUCCESS(f'  Roles: {in_rol.objects.count()} registrados'))

        # ============================================================
        # 3. ROLES - PERMISOS
        # ============================================================

        def asignar_permisos(rol, nombres_permisos):
            """Asigna permisos a un rol ignorando los que no existan."""
            count = 0
            for nombre in nombres_permisos:
                if nombre in permisos:
                    _, created = in_rol_permiso.objects.get_or_create(
                        id_rol=rol, id_permiso=permisos[nombre],
                        defaults={'estado': True}
                    )
                    if created:
                        count += 1
            return count

        # ADMIN — Todos los permisos
        c = 0
        for perm in permisos.values():
            _, created = in_rol_permiso.objects.get_or_create(
                id_rol=admin_rol, id_permiso=perm, defaults={'estado': True})
            if created:
                c += 1
        self.stdout.write(f'  Administrador: {c} permisos nuevos asignados')

        # SUPERVISOR — Ver + crear/editar + autorizar + reportes
        c = asignar_permisos(supervisor_rol, [
            'ver_dashboard', 'ver_auditoria',
            'ver_activos', 'crear_activo', 'editar_activo',
            'solicitar_baja', 'solicitar_reevaluo', 'solicitar_transferencia',
            'autorizar_baja', 'autorizar_reevaluo', 'autorizar_transferencia',
            'ver_asignaciones', 'crear_asignacion', 'editar_asignacion',
            'ver_bajas', 'ver_motivos_baja', 'crear_motivo_baja', 'editar_motivo_baja', 'eliminar_motivo_baja',
            'ver_reevaluos', 'ver_tipos_reevaluo', 'crear_tipo_reevaluo', 'editar_tipo_reevaluo', 'eliminar_tipo_reevaluo',
            'ver_transferencias',
            'ver_vehiculos', 'crear_vehiculo', 'editar_vehiculo',
            'ver_mantenimientos', 'registrar_mantenimiento', 'editar_mantenimiento',
            'ver_empleados', 'crear_empleado',
            'ver_usuarios',
            'ver_marcas', 'crear_marca', 'editar_marca',
            'ver_modelos', 'crear_modelo', 'editar_modelo',
            'ver_categorias', 'crear_categoria',
            'ver_grupos', 'crear_grupo', 'editar_grupo',
            'ver_garantias', 'crear_garantia', 'editar_garantia',
            'ver_tipo_cambio', 'crear_tipo_cambio', 'editar_tipo_cambio',
            'ver_condicion_activo', 'crear_condicion_activo', 'editar_condicion_activo',
            'ver_estado_activo', 'crear_estado_activo', 'editar_estado_activo',
            'ver_industrias', 'crear_industria', 'editar_industria',
            'ver_unidad_medida', 'crear_unidad_medida', 'editar_unidad_medida',
            'ver_gestiones', 'crear_gestion', 'editar_gestion',
            'ver_partes', 'crear_parte', 'editar_parte',
            'ver_atributos', 'crear_atributo', 'editar_atributo',
            'ver_tipos', 'crear_tipo', 'editar_tipo',
            'ver_materiales', 'crear_material', 'editar_material',
            'ver_funciones', 'crear_funcion', 'editar_funcion',
            'ver_proveedores', 'crear_proveedor', 'editar_proveedor',
            'ver_ordenes', 'crear_orden', 'autorizar_orden',
            'ver_facturas', 'crear_factura', 'editar_factura',
            'ver_ubicaciones', 'crear_ubicacion', 'editar_ubicacion',
            'ver_responsables', 'crear_responsable', 'editar_responsable',
            'ver_ingresos', 'crear_ingreso', 'editar_ingreso',
            'ver_tipos_ingreso', 'crear_tipo_ingreso', 'editar_tipo_ingreso', 'eliminar_tipo_ingreso',
            'ver_depreciaciones', 'crear_depreciacion',
            'ver_reportes', 'exportar_reportes',
            'gestionar_roles', 'gestionar_permisos',
        ])
        self.stdout.write(f'  Supervisor: {c} permisos nuevos asignados')

        # OPERADOR — Ver + crear/editar (sin eliminar, sin autorizar, sin reportes)
        c = asignar_permisos(operador_rol, [
            'ver_dashboard',
            'ver_activos', 'crear_activo', 'editar_activo',
            'solicitar_baja', 'solicitar_reevaluo', 'solicitar_transferencia',
            'ver_asignaciones', 'crear_asignacion', 'editar_asignacion',
            'ver_bajas',
            'ver_reevaluos',
            'ver_transferencias',
            'ver_vehiculos', 'crear_vehiculo', 'editar_vehiculo',
            'ver_mantenimientos', 'registrar_mantenimiento', 'editar_mantenimiento',
            'ver_empleados',
            'ver_marcas', 'crear_marca', 'editar_marca',
            'ver_modelos', 'crear_modelo', 'editar_modelo',
            'ver_categorias', 'crear_categoria',
            'ver_grupos', 'crear_grupo', 'editar_grupo',
            'ver_garantias', 'crear_garantia', 'editar_garantia',
            'ver_tipo_cambio', 'crear_tipo_cambio', 'editar_tipo_cambio',
            'ver_condicion_activo', 'crear_condicion_activo', 'editar_condicion_activo',
            'ver_estado_activo', 'crear_estado_activo', 'editar_estado_activo',
            'ver_industrias', 'crear_industria', 'editar_industria',
            'ver_unidad_medida', 'crear_unidad_medida', 'editar_unidad_medida',
            'ver_gestiones', 'crear_gestion', 'editar_gestion',
            'ver_partes', 'crear_parte', 'editar_parte',
            'ver_atributos', 'crear_atributo', 'editar_atributo',
            'ver_tipos', 'crear_tipo', 'editar_tipo',
            'ver_materiales', 'crear_material', 'editar_material',
            'ver_funciones', 'crear_funcion', 'editar_funcion',
            'ver_proveedores', 'crear_proveedor', 'editar_proveedor',
            'ver_ordenes', 'crear_orden',
            'ver_facturas', 'crear_factura', 'editar_factura',
            'ver_ubicaciones', 'crear_ubicacion', 'editar_ubicacion',
            'ver_responsables', 'crear_responsable', 'editar_responsable',
            'ver_ingresos', 'crear_ingreso', 'editar_ingreso',
            'ver_tipos_ingreso', 'crear_tipo_ingreso', 'editar_tipo_ingreso',
            'ver_depreciaciones',
        ])
        self.stdout.write(f'  Operador: {c} permisos nuevos asignados')

        # AUXILIAR — Mantenimientos, asignaciones, activos
        c = asignar_permisos(auxiliar_rol, [
            'ver_dashboard',
            'ver_activos', 'editar_activo',
            'ver_asignaciones', 'crear_asignacion', 'editar_asignacion',
            'ver_vehiculos',
            'ver_mantenimientos', 'registrar_mantenimiento', 'editar_mantenimiento',
            'ver_empleados',
            'ver_marcas', 'ver_modelos', 'ver_categorias', 'ver_grupos',
            'ver_garantias', 'ver_tipo_cambio', 'ver_condicion_activo',
            'ver_estado_activo', 'ver_industrias', 'ver_unidad_medida',
            'ver_gestiones', 'ver_partes', 'ver_atributos', 'ver_tipos', 'ver_materiales', 'ver_funciones',
            'ver_ubicaciones', 'ver_responsables', 'ver_depreciaciones',
        ])
        self.stdout.write(f'  Auxiliar: {c} permisos nuevos asignados')

        # CONSULTA — Solo lectura (todos los ver_*)
        c = asignar_permisos(consulta_rol, [
            n for n in permisos_nombres if n.startswith('ver_')
        ])
        self.stdout.write(f'  Consulta: {c} permisos nuevos asignados')

        # INVENTARIO — Activos, ubicaciones, depreciaciones
        c = asignar_permisos(inventario_rol, [
            'ver_dashboard',
            'ver_activos', 'crear_activo', 'editar_activo',
            'ver_vehiculos', 'crear_vehiculo', 'editar_vehiculo',
            'ver_marcas', 'ver_modelos', 'ver_categorias', 'ver_grupos',
            'ver_garantias', 'ver_tipo_cambio', 'ver_condicion_activo',
            'ver_estado_activo', 'ver_industrias', 'ver_unidad_medida',
            'ver_gestiones', 'ver_partes', 'ver_atributos', 'ver_tipos', 'ver_materiales', 'ver_funciones',
            'ver_ubicaciones', 'crear_ubicacion', 'editar_ubicacion',
            'ver_responsables',
            'ver_depreciaciones', 'crear_depreciacion',
        ])
        self.stdout.write(f'  Inventario: {c} permisos nuevos asignados')

        # GESTOR DE ROLES — Solo gestión de roles/permisos + usuarios
        c = asignar_permisos(gestor_roles_rol, [
            'ver_dashboard',
            'gestionar_roles', 'gestionar_permisos',
            'ver_usuarios', 'crear_usuario', 'editar_usuario',
        ])
        self.stdout.write(f'  Gestor de Roles: {c} permisos nuevos asignados')

        # ============================================================
        # 4. EMPLEADOS
        # ============================================================
        emp1, _ = in_empleado.objects.get_or_create(numero_documento='11111111', defaults={
            'nombre': 'Admin', 'apellido': 'Sistema', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 8000.00,
            'cargo': 'Administrador de Sistemas',
        })
        emp2, _ = in_empleado.objects.get_or_create(numero_documento='22222222', defaults={
            'nombre': 'María', 'apellido': 'López', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 5000.00,
            'cargo': 'Supervisora de Activos', 'id_empleado_jefe': emp1,
        })
        emp3, _ = in_empleado.objects.get_or_create(numero_documento='33333333', defaults={
            'nombre': 'Juan', 'apellido': 'Pérez', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 3500.00,
            'cargo': 'Operador', 'id_empleado_jefe': emp2,
        })
        emp4, _ = in_empleado.objects.get_or_create(numero_documento='44444444', defaults={
            'nombre': 'Ana', 'apellido': 'Torres', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 2500.00,
            'cargo': 'Auxiliar de Mantenimiento', 'id_empleado_jefe': emp2,
        })
        emp5, _ = in_empleado.objects.get_or_create(numero_documento='55555555', defaults={
            'nombre': 'Luis', 'apellido': 'Ramírez', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 2000.00,
            'cargo': 'Consultor', 'id_empleado_jefe': emp3,
        })
        emp6, _ = in_empleado.objects.get_or_create(numero_documento='66666666', defaults={
            'nombre': 'Sofía', 'apellido': 'Vargas', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 2200.00,
            'cargo': 'Inventarista', 'id_empleado_jefe': emp3,
        })
        emp7, _ = in_empleado.objects.get_or_create(numero_documento='77777777', defaults={
            'nombre': 'Carlos', 'apellido': 'Mendoza', 'tipo_documento': 'DNI',
            'fecha_ingreso': date.today(), 'salario': 3000.00,
            'cargo': 'Gestor de Roles', 'id_empleado_jefe': emp1,
        })

        self.stdout.write(self.style.SUCCESS(f'  Empleados: {in_empleado.objects.count()} registrados'))

        # ============================================================
        # 5. USUARIOS (contraseña con bcrypt via set_password)
        # ============================================================
        usuarios_config = [
            # (correo,                    contraseña,   empleado, rol)
            ('admin@activo.com',          'admin234',    emp1, admin_rol),
            ('supervisor@activo.com',     'super123',    emp2, supervisor_rol),
            ('operador@activo.com',       'oper123',     emp3, operador_rol),
            ('auxiliar@activo.com',        'aux123',      emp4, auxiliar_rol),
            ('consulta@activo.com',        'cons123',     emp5, consulta_rol),
            ('inventario@activo.com',      'inv123',      emp6, inventario_rol),
            ('gestor@activo.com',          'gestor123',   emp7, gestor_roles_rol),
        ]

        for correo, password, empleado, rol in usuarios_config:
            user, created = in_usuario.objects.get_or_create(
                correo=correo,
                defaults={
                    'estado': 'ACTIVO',
                    'id_empleado': empleado,
                }
            )
            # Siempre forzamos el password del seeder para sincronizar con la BD
            user.set_password(password)  # bcrypt hash
            user.save()
            if created:
                self.stdout.write(f'  + Usuario: {correo} (creado)')
            else:
                self.stdout.write(f'  = Usuario: {correo} (actualizado)')

            # Asignar todos los in_rol_permiso del rol al usuario
            rp_list = in_rol_permiso.objects.filter(id_rol=rol, estado=True)
            rpu_count = 0
            for rp in rp_list:
                _, rpu_created = in_rol_permiso_usuario.objects.get_or_create(
                    id_usuario=user,
                    id_rol=rol,
                    id_permiso=rp.id_permiso,
                    defaults={'estado': True}
                )
                if rpu_created:
                    rpu_count += 1
            self.stdout.write(f'    → {rpu_count} permisos nuevos vinculados')

        # ============================================================
        # 6. RESPONSABLES
        # ============================================================
        from activo.models import in_responsable
        responsConfig = [
            ('1211', emp1, 'A'),
            ('1221', emp2, 'A'),
            ('1311', emp3, 'A'),
            ('1411', emp4, 'A'),
            ('1511', emp5, 'A'),
            ('1611', emp6, 'A'),
            ('1711', emp7, 'A'),
        ]
        resp_count = 0
        for cod_estprog, empleado, tipo_per in responsConfig:
            _, created = in_responsable.objects.get_or_create(
                cod_emp=empleado,
                defaults={
                    'cod_estprog': cod_estprog,
                    'tipo_per': tipo_per,
                    'fecha': date.today(),
                    'a_b': 'A'
                }
            )
            if created:
                resp_count += 1
        self.stdout.write(self.style.SUCCESS(f'  Responsables: {resp_count} creados.'))

        # ============================================================
        # RESUMEN FINAL
        # ============================================================
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Seed completado exitosamente'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'  Permisos:  {in_permiso.objects.count()}')
        self.stdout.write(f'  Roles:     {in_rol.objects.count()}')
        self.stdout.write(f'  Rol↔Perm:  {in_rol_permiso.objects.count()}')
        self.stdout.write(f'  Empleados: {in_empleado.objects.count()}')
        self.stdout.write(f'  Usuarios:  {in_usuario.objects.count()}')
        self.stdout.write(f'  Responsables: {in_responsable.objects.count()}')
        self.stdout.write(f'  RPU:       {in_rol_permiso_usuario.objects.count()}')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('  Credenciales de acceso:'))
        self.stdout.write('  ┌──────────────────────────────┬────────────┬────────────────┐')
        self.stdout.write('  │ Correo                       │ Contraseña │ Rol            │')
        self.stdout.write('  ├──────────────────────────────┼────────────┼────────────────┤')
        self.stdout.write('  │ admin@activo.com              │ admin234   │ Administrador  │')
        self.stdout.write('  │ supervisor@activo.com         │ super123   │ Supervisor     │')
        self.stdout.write('  │ operador@activo.com           │ oper123    │ Operador       │')
        self.stdout.write('  │ auxiliar@activo.com            │ aux123     │ Auxiliar       │')
        self.stdout.write('  │ consulta@activo.com            │ cons123    │ Consulta       │')
        self.stdout.write('  │ inventario@activo.com          │ inv123     │ Inventario     │')
        self.stdout.write('  │ gestor@activo.com              │ gestor123  │ Gestor de Roles│')
        self.stdout.write('  └──────────────────────────────┴────────────┴────────────────┘')
