import graphene
from ..models import (
    in_estado, in_condicion, in_unidad, in_tipo_asig, in_tipomat, in_tipo,
    in_marca, in_modelo, in_gestion, in_parte, in_revaluo, in_funcion_adm,
    in_grupo, in_oficina,
    in_provedor, in_contacto,
    in_responsable, in_solicitud, in_det_sol, in_oferta, in_det_ofer, in_orden_compra,
    in_ingreso,
    in_activo,
    in_asignado, in_det_asig, in_encargado,
    in_det_reval, in_dep_acumulada,
    in_atributo, in_det_atrib, in_atrib_activo,
    in_parte_grupo, in_mod_grp, in_det_grp, in_det_parte,
    in_transferido, in_det_tranf,
    in_rol, in_permiso, in_rol_permiso, in_empleado, in_usuario, in_rol_permiso_usuario,
    in_motivo, in_baja_act, in_vehic, in_tasa_rev,
    in_log_activo, in_log_ingreso, in_log_asignado, in_log_det_asig,
    in_log_oficina, in_log_det_reval, in_log_baja_act
)
from .types import (
    InEstadoType, InCondicionType, InUnidadType, InTipoAsigType, InTipomatType, InTipoType,
    InMarcaType, InModeloType, InGestionType, InParteType, InRevaluoType, InFuncionAdmType,
    InGrupoType, InOficinaType, InProvedorType, InContactoType, InResponsableType, InSolicitudType,
    InDetSolType, InOfertaType, InDetOferType, InOrdenCompraType, InIngresoType, InActivoType,
    InAsignadoType, InDetAsigType, InEncargadoType, InDetRevalType, InDepAcumuladaType, InAtributoType,
    InDetAtribType, InAtribActivoType, InParteGrupoType, InModGrpType, InDetGrpType, InDetParteType,
    InTransferidoType, InDetTranfType,
    InRolType, InPermisoType, InRolPermisoType, InEmpleadoType, InUsuarioType, InRolPermisoUsuarioType,
    InMotivoType, InBajaActType, InVehicType, InTasaRevType,
    InLogActivoType, InLogIngresoType, InLogAsignadoType, InLogDetAsigType,
    InLogOficinaType, InLogDetRevalType, InLogBajaActType,
    InActivoPaginatedType, InVehicPaginatedType, InAsignadoPaginatedType,
    InLogActivoPaginatedType, InLogIngresoPaginatedType, InLogAsignadoPaginatedType,
    InLogDetAsigPaginatedType, InLogOficinaPaginatedType, InLogDetRevalPaginatedType,
    InLogBajaActPaginatedType
)

# ═══════════════════════════════════════════════════════════════
# QUERIES
# ═══════════════════════════════════════════════════════════════

class Query(graphene.ObjectType):

    # ── Catálogos simples ───────────────────────────────────────
    todos_estados       = graphene.List(InEstadoType)
    estado              = graphene.Field(InEstadoType, cod_estado=graphene.Int(required=True))

    todas_condiciones   = graphene.List(InCondicionType)
    condicion           = graphene.Field(InCondicionType, cod_cond=graphene.Int(required=True))

    todas_unidades      = graphene.List(InUnidadType)
    unidad              = graphene.Field(InUnidadType, cod_unidad=graphene.Int(required=True))

    todos_tipos_asig    = graphene.List(InTipoAsigType)
    tipo_asig           = graphene.Field(InTipoAsigType, tipo_asig=graphene.Int(required=True))

    todos_tipomats      = graphene.List(InTipomatType)

    todos_tipos         = graphene.List(InTipoType, solo_activos=graphene.Boolean())
    tipo                = graphene.Field(InTipoType, cod_tipo=graphene.Int(required=True))

    todas_marcas        = graphene.List(InMarcaType)
    marca               = graphene.Field(InMarcaType, cod_marca=graphene.Int(required=True))

    todos_modelos       = graphene.List(InModeloType)
    modelo              = graphene.Field(InModeloType, cod_modelo=graphene.Int(required=True))
    modelos_por_marca   = graphene.List(InModeloType, cod_marca=graphene.Int(required=True))

    todas_gestiones     = graphene.List(InGestionType, solo_activas=graphene.Boolean())
    gestion             = graphene.Field(InGestionType, cod_gest=graphene.Int(required=True))

    todas_partes        = graphene.List(InParteType, solo_activas=graphene.Boolean())
    parte               = graphene.Field(InParteType, cod_parte=graphene.Int(required=True))

    todos_revaluos      = graphene.List(InRevaluoType, estado=graphene.String())
    revaluo             = graphene.Field(InRevaluoType, cod_reval=graphene.Int(required=True))

    todas_funciones_adm = graphene.List(InFuncionAdmType)
    funcion_adm         = graphene.Field(InFuncionAdmType, cod_func=graphene.Int(required=True))

    # ── Jerarquías ──────────────────────────────────────────────
    todos_grupos        = graphene.List(InGrupoType, solo_activos=graphene.Boolean())
    grupo               = graphene.Field(InGrupoType, cod_grupo=graphene.Int(required=True))
    grupos_raiz         = graphene.List(InGrupoType, solo_activos=graphene.Boolean())
    grupos_hijos        = graphene.List(InGrupoType, cod_padre=graphene.Int(required=True))

    todas_oficinas      = graphene.List(InOficinaType, solo_activas=graphene.Boolean())
    oficina             = graphene.Field(InOficinaType, cod_ofic=graphene.Int(required=True))
    oficinas_raiz       = graphene.List(InOficinaType, solo_activas=graphene.Boolean())
    oficinas_hijas      = graphene.List(InOficinaType, cod_padre=graphene.Int(required=True))

    # ── Proveedores y contactos ─────────────────────────────────
    todos_provedores         = graphene.List(InProvedorType)
    provedor                 = graphene.Field(InProvedorType, cod_prov=graphene.Int(required=True))
    contactos_por_proveedor  = graphene.List(InContactoType, cod_prov=graphene.Int(required=True))
    contacto                 = graphene.Field(InContactoType, cod_cont=graphene.Int(required=True))

    # ── Responsables ────────────────────────────────────────────
    todos_responsables  = graphene.List(InResponsableType, solo_activos=graphene.Boolean())
    responsable         = graphene.Field(InResponsableType, cod_resp=graphene.Int(required=True))

    # ── Compras ─────────────────────────────────────────────────
    todas_solicitudes      = graphene.List(InSolicitudType, solo_activas=graphene.Boolean())
    solicitud              = graphene.Field(InSolicitudType, nro_sol=graphene.Int(required=True))
    det_sol_por_solicitud  = graphene.List(InDetSolType, nro_sol=graphene.Int(required=True))

    todas_ofertas          = graphene.List(InOfertaType, estado=graphene.String())
    oferta                 = graphene.Field(InOfertaType, nro_oferta=graphene.Int(required=True))
    ofertas_por_solicitud  = graphene.List(InOfertaType, nro_sol=graphene.Int(required=True))
    det_ofer_por_oferta    = graphene.List(InDetOferType, nro_oferta=graphene.Int(required=True))

    todas_ordenes_compra   = graphene.List(InOrdenCompraType, solo_activas=graphene.Boolean())
    orden_compra           = graphene.Field(InOrdenCompraType, nro_compra=graphene.Int(required=True))

    # ── Ingresos ────────────────────────────────────────────────
    todos_ingresos     = graphene.List(InIngresoType, estado=graphene.String())
    ingreso            = graphene.Field(InIngresoType, nro_ingreso=graphene.Int(required=True))
    ingresos_por_prov  = graphene.List(InIngresoType, cod_prov=graphene.Int(required=True))

    # ── Activos ─────────────────────────────────────────────────
    todos_activos          = graphene.List(InActivoType, solo_activos=graphene.Boolean(), solo_aprobados=graphene.Boolean())
    activo                 = graphene.Field(InActivoType, nro_activo=graphene.Int(required=True))
    activo_por_codigo      = graphene.Field(InActivoType, cod_activo=graphene.String(required=True))
    activos_por_grupo      = graphene.List(InActivoType, cod_grupo=graphene.Int(required=True), solo_activos=graphene.Boolean())
    activos_por_estado     = graphene.List(InActivoType, cod_estado=graphene.Int(required=True))
    activos_por_ingreso    = graphene.List(InActivoType, nro_ingreso=graphene.Int(required=True))
    activos_por_oficina    = graphene.List(InActivoType, cod_ofic=graphene.Int(required=True))

    # ── Asignaciones ────────────────────────────────────────────
    todas_asignaciones        = graphene.List(InAsignadoType, estado=graphene.String())
    asignacion                = graphene.Field(InAsignadoType, cod_asig=graphene.Int(required=True))
    asignaciones_por_oficina  = graphene.List(InAsignadoType, cod_ofic=graphene.Int(required=True))
    det_asig_por_asignacion   = graphene.List(InDetAsigType, cod_asig=graphene.Int(required=True))
    encargados_por_asignacion = graphene.List(InEncargadoType, cod_asig=graphene.Int(required=True))

    # ── Revaluación y depreciación ──────────────────────────────
    det_revals_por_activo      = graphene.List(InDetRevalType, nro_activo=graphene.Int(required=True))
    det_revals_por_revaluo     = graphene.List(InDetRevalType, cod_reval=graphene.Int(required=True))
    dep_acumulada_por_activo   = graphene.List(InDepAcumuladaType, nro_activo=graphene.Int(required=True))
    dep_acumulada_por_periodo  = graphene.List(InDepAcumuladaType, gestion=graphene.Int(required=True), periodo=graphene.Int(required=True))
    ultimas_depreciaciones     = graphene.List(InDepAcumuladaType)

    # ── Atributos ───────────────────────────────────────────────
    atributos_por_grupo    = graphene.List(InAtributoType, cod_grupo=graphene.Int(required=True), solo_activos=graphene.Boolean())
    atributo               = graphene.Field(InAtributoType, cod_atrib=graphene.Int(required=True))
    det_atribs_por_atrib   = graphene.List(InDetAtribType, cod_atrib=graphene.Int(required=True), solo_activos=graphene.Boolean())
    atrib_activos_por_activo = graphene.List(InAtribActivoType, nro_activo=graphene.Int(required=True))

    # ── Partes y grupos ─────────────────────────────────────────
    partes_por_grupo    = graphene.List(InParteGrupoType, cod_grupo=graphene.Int(required=True))
    grupos_por_parte    = graphene.List(InParteGrupoType, cod_parte=graphene.Int(required=True))
    modelos_por_grupo   = graphene.List(InModGrpType, cod_grupo=graphene.Int(required=True))
    det_grp_por_grupo   = graphene.List(InDetGrpType, cod_grupo=graphene.Int(required=True))
    partes_de_activo    = graphene.List(InDetParteType, nro_activo=graphene.Int(required=True))

    # ── Transferencias ──────────────────────────────────────────
    todas_transferencias         = graphene.List(InTransferidoType, estado=graphene.String())
    transferencia                = graphene.Field(InTransferidoType, cod_transf=graphene.Int(required=True))
    transferencias_por_oficina   = graphene.List(InTransferidoType, cod_ofic=graphene.Int(required=True))
    det_tranf_por_transferencia  = graphene.List(InDetTranfType, cod_transf=graphene.Int(required=True))

    # ── Authentication and RBAC ─────────────────────────────────
    usuario_actual      = graphene.Field(InUsuarioType)
    mis_permisos        = graphene.List(graphene.String)
    oficinas_a_cargo             = graphene.List(InOficinaType)
    todos_roles         = graphene.List(InRolType)
    rol                 = graphene.Field(InRolType, id_rol=graphene.Int(required=True))

    todos_permisos      = graphene.List(InPermisoType)
    permiso             = graphene.Field(InPermisoType, id_permiso=graphene.Int(required=True))

    todos_empleados     = graphene.List(InEmpleadoType)
    empleado            = graphene.Field(InEmpleadoType, id_empleado=graphene.Int(required=True))

    todos_usuarios      = graphene.List(InUsuarioType)
    usuario             = graphene.Field(InUsuarioType, id_usuario=graphene.Int(required=True))

    # ── Nuevos modelos y UFV ────────────────────────────────────
    todos_motivos           = graphene.List(InMotivoType)
    todas_bajas_detalladas  = graphene.List(InBajaActType)
    todos_vehiculos         = graphene.List(InVehicType)
    vehiculo_por_activo     = graphene.Field(InVehicType, nro_activo=graphene.Int(required=True))
    todas_tasas_rev         = graphene.List(InTasaRevType)

    # ── Logs de auditoría ───────────────────────────────────────
    todos_logs_activos      = graphene.List(InLogActivoType)
    todos_logs_ingresos     = graphene.List(InLogIngresoType)
    todos_logs_asignados    = graphene.List(InLogAsignadoType)
    todos_logs_det_asig     = graphene.List(InLogDetAsigType)
    todos_logs_oficina      = graphene.List(InLogOficinaType)
    todos_logs_det_reval    = graphene.List(InLogDetRevalType)
    todos_logs_baja_act     = graphene.List(InLogBajaActType)

    # ── Consultas paginadas para grandes volúmenes ──────────────
    todos_activos_paginados = graphene.Field(
        InActivoPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String(),
        solo_activos=graphene.Boolean(default_value=True),
        solo_aprobados=graphene.Boolean(default_value=False),
        solo_pendientes=graphene.Boolean(default_value=False)
    )

    todos_vehiculos_paginados = graphene.Field(
        InVehicPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todas_asignaciones_paginadas = graphene.Field(
        InAsignadoPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String(),
        estado=graphene.String()
    )

    todos_logs_activos_paginados = graphene.Field(
        InLogActivoPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todos_logs_ingresos_paginados = graphene.Field(
        InLogIngresoPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todos_logs_asignados_paginados = graphene.Field(
        InLogAsignadoPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todos_logs_det_asig_paginados = graphene.Field(
        InLogDetAsigPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todos_logs_oficina_paginados = graphene.Field(
        InLogOficinaPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todos_logs_det_reval_paginados = graphene.Field(
        InLogDetRevalPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    todos_logs_baja_act_paginados = graphene.Field(
        InLogBajaActPaginatedType,
        limit=graphene.Int(default_value=15),
        offset=graphene.Int(default_value=0),
        search=graphene.String()
    )

    # ── Resolvers — Catálogos simples ───────────────────────────
    def resolve_todos_estados(root, info):
        return in_estado.objects.all()
    def resolve_estado(root, info, cod_estado):
        return in_estado.objects.get(pk=cod_estado)

    def resolve_todas_condiciones(root, info):
        return in_condicion.objects.all()
    def resolve_condicion(root, info, cod_cond):
        return in_condicion.objects.get(pk=cod_cond)

    def resolve_todas_unidades(root, info):
        return in_unidad.objects.all()
    def resolve_unidad(root, info, cod_unidad):
        return in_unidad.objects.get(pk=cod_unidad)

    def resolve_todos_tipos_asig(root, info):
        return in_tipo_asig.objects.all()
    def resolve_tipo_asig(root, info, tipo_asig):
        return in_tipo_asig.objects.get(pk=tipo_asig)

    def resolve_todos_tipomats(root, info):
        return in_tipomat.objects.all()

    def resolve_todos_tipos(root, info, solo_activos=True):
        qs = in_tipo.objects.all()
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_tipo(root, info, cod_tipo):
        return in_tipo.objects.get(pk=cod_tipo)

    def resolve_todas_marcas(root, info):
        return in_marca.objects.all()
    def resolve_marca(root, info, cod_marca):
        return in_marca.objects.get(pk=cod_marca)

    def resolve_todos_modelos(root, info):
        return in_modelo.objects.select_related('cod_marca').all()
    def resolve_modelo(root, info, cod_modelo):
        return in_modelo.objects.get(pk=cod_modelo)
    def resolve_modelos_por_marca(root, info, cod_marca):
        return in_modelo.objects.filter(cod_marca_id=cod_marca)

    def resolve_todas_gestiones(root, info, solo_activas=True):
        qs = in_gestion.objects.all()
        if solo_activas:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_gestion(root, info, cod_gest):
        return in_gestion.objects.get(pk=cod_gest)

    def resolve_todas_partes(root, info, solo_activas=True):
        qs = in_parte.objects.all()
        if solo_activas:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_parte(root, info, cod_parte):
        return in_parte.objects.get(pk=cod_parte)

    def resolve_todos_revaluos(root, info, estado=None):
        qs = in_revaluo.objects.all()
        if estado:
            qs = qs.filter(estado=estado)
        return qs
    def resolve_revaluo(root, info, cod_reval):
        return in_revaluo.objects.get(pk=cod_reval)

    def resolve_todas_funciones_adm(root, info):
        return in_funcion_adm.objects.all()
    def resolve_funcion_adm(root, info, cod_func):
        return in_funcion_adm.objects.get(pk=cod_func)

    # ── Resolvers — Jerarquías ──────────────────────────────────
    def resolve_todos_grupos(root, info, solo_activos=True):
        qs = in_grupo.objects.select_related('cod_padre', 'cod_gest', 'cod_tipo')
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_grupo(root, info, cod_grupo):
        return in_grupo.objects.get(pk=cod_grupo)
    def resolve_grupos_raiz(root, info, solo_activos=True):
        qs = in_grupo.objects.filter(cod_padre__isnull=True)
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_grupos_hijos(root, info, cod_padre):
        return in_grupo.objects.filter(cod_padre_id=cod_padre).exclude(a_b='B')

    def resolve_todas_oficinas(root, info, solo_activas=True):
        qs = in_oficina.objects.select_related('cod_padre')
        if solo_activas:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_oficina(root, info, cod_ofic):
        return in_oficina.objects.get(pk=cod_ofic)
    def resolve_oficinas_raiz(root, info, solo_activas=True):
        qs = in_oficina.objects.filter(cod_padre__isnull=True)
        if solo_activas:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_oficinas_hijas(root, info, cod_padre):
        return in_oficina.objects.filter(cod_padre_id=cod_padre).exclude(a_b='B')

    # ── Resolvers — Proveedores ─────────────────────────────────
    def resolve_todos_provedores(root, info):
        return in_provedor.objects.all()
    def resolve_provedor(root, info, cod_prov):
        return in_provedor.objects.get(pk=cod_prov)
    def resolve_contactos_por_proveedor(root, info, cod_prov):
        return in_contacto.objects.filter(cod_prov_id=cod_prov)
    def resolve_contacto(root, info, cod_cont):
        return in_contacto.objects.get(pk=cod_cont)

    # ── Resolvers — Responsables ────────────────────────────────
    def resolve_todos_responsables(root, info, solo_activos=True):
        qs = in_responsable.objects.all()
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_responsable(root, info, cod_resp):
        return in_responsable.objects.get(pk=cod_resp)

    # ── Resolvers — Compras ─────────────────────────────────────
    def resolve_todas_solicitudes(root, info, solo_activas=True):
        qs = in_solicitud.objects.select_related('emp_sol', 'emp_resp')
        if solo_activas:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_solicitud(root, info, nro_sol):
        return in_solicitud.objects.get(pk=nro_sol)
    def resolve_det_sol_por_solicitud(root, info, nro_sol):
        return in_det_sol.objects.filter(nro_sol_id=nro_sol)

    def resolve_todas_ofertas(root, info, estado=None):
        qs = in_oferta.objects.select_related('nro_sol', 'cod_prov')
        if estado:
            qs = qs.filter(estado=estado)
        return qs
    def resolve_oferta(root, info, nro_oferta):
        return in_oferta.objects.get(pk=nro_oferta)
    def resolve_ofertas_por_solicitud(root, info, nro_sol):
        return in_oferta.objects.filter(nro_sol_id=nro_sol)
    def resolve_det_ofer_por_oferta(root, info, nro_oferta):
        return in_det_ofer.objects.filter(nro_oferta_id=nro_oferta)

    def resolve_todas_ordenes_compra(root, info, solo_activas=True):
        qs = in_orden_compra.objects.select_related('nro_oferta', 'emp_resp')
        if solo_activas:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_orden_compra(root, info, nro_compra):
        return in_orden_compra.objects.get(pk=nro_compra)

    # ── Resolvers — Ingresos ────────────────────────────────────
    def resolve_todos_ingresos(root, info, estado=None):
        qs = in_ingreso.objects.select_related('cod_prov', 'cod_ofic_dest')
        if estado:
            qs = qs.filter(estado=estado)
        return qs
    def resolve_ingreso(root, info, nro_ingreso):
        return in_ingreso.objects.get(pk=nro_ingreso)
    def resolve_ingresos_por_prov(root, info, cod_prov):
        return in_ingreso.objects.filter(cod_prov_id=cod_prov)

    # ── Resolvers — Activos ─────────────────────────────────────
    def resolve_todos_activos(root, info, solo_activos=True, solo_aprobados=None):
        qs = in_activo.objects.select_related(
            'cod_gest', 'cod_grupo', 'cod_unidad', 'cod_marca',
            'cod_modelo', 'cod_prove', 'cod_cond', 'cod_estado', 'nro_ingreso'
        )
        if solo_activos:
            qs = qs.exclude(a_b='B')
        if solo_aprobados:
            qs = qs.filter(estado_registro='APROBADO')
        return qs
    def resolve_activo(root, info, nro_activo):
        return in_activo.objects.get(pk=nro_activo)
    def resolve_activo_por_codigo(root, info, cod_activo):
        return in_activo.objects.get(cod_activo=cod_activo)
    def resolve_activos_por_grupo(root, info, cod_grupo, solo_activos=True):
        qs = in_activo.objects.filter(cod_grupo_id=cod_grupo)
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_activos_por_estado(root, info, cod_estado):
        return in_activo.objects.filter(cod_estado_id=cod_estado)
    def resolve_activos_por_ingreso(root, info, nro_ingreso):
        return in_activo.objects.filter(nro_ingreso_id=nro_ingreso)
    def resolve_activos_por_oficina(root, info, cod_ofic):
        # Activos asignados a una oficina (via asignaciones activas)
        asigs = in_asignado.objects.filter(cod_ofic_id=cod_ofic, estado='A').values_list('cod_asig', flat=True)
        nros = in_det_asig.objects.filter(cod_asig_id__in=asigs).values_list('nro_activo_id', flat=True)
        return in_activo.objects.filter(nro_activo__in=nros).exclude(a_b='B')

    # ── Resolvers — Asignaciones ────────────────────────────────
    def resolve_todas_asignaciones(root, info, estado=None):
        qs = in_asignado.objects.select_related('tipo_asig', 'cod_ofic')
        if estado:
            qs = qs.filter(estado=estado)
        return qs
    def resolve_asignacion(root, info, cod_asig):
        return in_asignado.objects.get(pk=cod_asig)
    def resolve_asignaciones_por_oficina(root, info, cod_ofic):
        return in_asignado.objects.filter(cod_ofic_id=cod_ofic)

    def resolve_oficinas_a_cargo(root, info):
        user = getattr(info.context, 'user', None)
        if not user or not hasattr(user, 'id_empleado') or not user.id_empleado:
            return []
        id_empleado = user.id_empleado.id_empleado
        asig_oficinas_ids = in_asignado.objects.filter(cod_resp=id_empleado, estado='A').values_list('cod_ofic_id', flat=True)
        encargado_oficinas_ids = in_encargado.objects.filter(cod_resp=id_empleado, cod_asig__estado='A').values_list('cod_asig__cod_ofic_id', flat=True)
        all_ofic_ids = set(list(asig_oficinas_ids) + list(encargado_oficinas_ids))
        return in_oficina.objects.filter(pk__in=all_ofic_ids)
    def resolve_det_asig_por_asignacion(root, info, cod_asig):
        return in_det_asig.objects.filter(cod_asig_id=cod_asig).select_related('nro_activo')
    def resolve_encargados_por_asignacion(root, info, cod_asig):
        return in_encargado.objects.filter(cod_asig_id=cod_asig)

    # ── Resolvers — Revaluación y depreciación ──────────────────
    def resolve_det_revals_por_activo(root, info, nro_activo):
        return in_det_reval.objects.filter(nro_activo_id=nro_activo)
    def resolve_det_revals_por_revaluo(root, info, cod_reval):
        return in_det_reval.objects.filter(cod_reval_id=cod_reval)
    def resolve_dep_acumulada_por_activo(root, info, nro_activo):
        return in_dep_acumulada.objects.filter(nro_activo_id=nro_activo).order_by('nro_serie')
    def resolve_dep_acumulada_por_periodo(root, info, gestion, periodo):
        nro_serie = gestion * 100 + periodo
        return in_dep_acumulada.objects.filter(nro_serie=nro_serie).select_related('nro_activo')
    def resolve_ultimas_depreciaciones(root, info):
        from django.db.models import Max
        # Get the latest nro_serie per activo
        latest = in_dep_acumulada.objects.values('nro_activo').annotate(max_serie=Max('nro_serie'))
        result = []
        for item in latest:
            dep = in_dep_acumulada.objects.get(nro_activo_id=item['nro_activo'], nro_serie=item['max_serie'])
            result.append(dep)
        return result

    # ── Resolvers — Atributos ───────────────────────────────────
    def resolve_atributos_por_grupo(root, info, cod_grupo, solo_activos=True):
        qs = in_atributo.objects.filter(cod_grupo_id=cod_grupo)
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_atributo(root, info, cod_atrib):
        return in_atributo.objects.get(pk=cod_atrib)
    def resolve_det_atribs_por_atrib(root, info, cod_atrib, solo_activos=True):
        qs = in_det_atrib.objects.filter(cod_atrib_id=cod_atrib)
        if solo_activos:
            qs = qs.exclude(a_b='B')
        return qs
    def resolve_atrib_activos_por_activo(root, info, nro_activo):
        return in_atrib_activo.objects.filter(nro_activo_id=nro_activo).select_related('cod_det_atrib')

    # ── Resolvers — Partes y grupos ─────────────────────────────
    def resolve_partes_por_grupo(root, info, cod_grupo):
        return in_parte_grupo.objects.filter(cod_grupo_id=cod_grupo).select_related('cod_parte')
    def resolve_grupos_por_parte(root, info, cod_parte):
        return in_parte_grupo.objects.filter(cod_parte_id=cod_parte).select_related('cod_grupo')
    def resolve_modelos_por_grupo(root, info, cod_grupo):
        return in_mod_grp.objects.filter(cod_grupo_id=cod_grupo).exclude(a_b='B').select_related('cod_modelo', 'cod_marca')
    def resolve_det_grp_por_grupo(root, info, cod_grupo):
        return in_det_grp.objects.filter(cod_grupo_id=cod_grupo)
    def resolve_partes_de_activo(root, info, nro_activo):
        return in_det_parte.objects.filter(nro_activo_id=nro_activo).select_related('cod_parte', 'cod_marca', 'cod_modelo', 'cod_estado')

    # ── Resolvers — Transferencias ──────────────────────────────
    def resolve_todas_transferencias(root, info, estado=None):
        qs = in_transferido.objects.select_related('cod_ofi_rem', 'cod_ofi_dest')
        if estado:
            qs = qs.filter(estado=estado)
        return qs
    def resolve_transferencia(root, info, cod_transf):
        return in_transferido.objects.get(pk=cod_transf)
    def resolve_transferencias_por_oficina(root, info, cod_ofic):
        return in_transferido.objects.filter(
            cod_ofi_rem_id=cod_ofic
        ) | in_transferido.objects.filter(cod_ofi_dest_id=cod_ofic)
    def resolve_det_tranf_por_transferencia(root, info, cod_transf):
        return in_det_tranf.objects.filter(cod_transf_id=cod_transf).select_related('nro_activo')

    # ── Resolvers — Authentication and RBAC ─────────────────────
    def resolve_usuario_actual(root, info):
        from .auth_helper import get_authenticated_user
        return get_authenticated_user(info)

    def resolve_mis_permisos(root, info):
        from .auth_helper import get_authenticated_user
        user = get_authenticated_user(info)
        if not user:
            return []
        from ..models.rbac import in_rol_permiso_usuario
        return list(in_rol_permiso_usuario.objects.filter(
            id_usuario=user,
            estado=True
        ).values_list('id_permiso__nombre', flat=True).distinct())

    def resolve_todos_roles(root, info):
        return in_rol.objects.prefetch_related('permisos__id_permiso').all()

    def resolve_rol(root, info, id_rol):
        return in_rol.objects.get(pk=id_rol)

    def resolve_todos_permisos(root, info):
        return in_permiso.objects.all()

    def resolve_permiso(root, info, id_permiso):
        return in_permiso.objects.get(pk=id_permiso)

    def resolve_todos_empleados(root, info):
        return in_empleado.objects.all()

    def resolve_empleado(root, info, id_empleado):
        return in_empleado.objects.get(pk=id_empleado)

    def resolve_todos_usuarios(root, info):
        return in_usuario.objects.select_related('id_empleado').prefetch_related('roles_permisos__id_rol', 'roles_permisos__id_permiso').all()

    def resolve_usuario(root, info, id_usuario):
        return in_usuario.objects.get(pk=id_usuario)

    # ── Resolvers de nuevos modelos y UFV ────────────────────────
    def resolve_todos_motivos(root, info):
        return in_motivo.objects.all()

    def resolve_todas_bajas_detalladas(root, info):
        return in_baja_act.objects.select_related('nro_activo').all()

    def resolve_todos_vehiculos(root, info):
        return in_vehic.objects.select_related('nro_activo').all()

    def resolve_vehiculo_por_activo(root, info, nro_activo):
        try:
            return in_vehic.objects.get(nro_activo_id=nro_activo)
        except in_vehic.DoesNotExist:
            return None

    def resolve_todas_tasas_rev(root, info):
        return in_tasa_rev.objects.all().order_by('-fecha')

    # ── Resolvers de logs de auditoría ──────────────────────────
    def resolve_todos_logs_activos(root, info):
        return in_log_activo.objects.all().order_by('-id')

    def resolve_todos_logs_ingresos(root, info):
        return in_log_ingreso.objects.all().order_by('-id')

    def resolve_todos_logs_asignados(root, info):
        return in_log_asignado.objects.all().order_by('-id')

    def resolve_todos_logs_det_asig(root, info):
        return in_log_det_asig.objects.all().order_by('-id')

    def resolve_todos_logs_oficina(root, info):
        return in_log_oficina.objects.all().order_by('-id')

    def resolve_todos_logs_det_reval(root, info):
        return in_log_det_reval.objects.all().order_by('-id')

    def resolve_todos_logs_baja_act(root, info):
        return in_log_baja_act.objects.all().order_by('-id')

    # ── Resolvers de consultas paginadas ────────────────────────
    def resolve_todos_activos_paginados(root, info, limit=15, offset=0, search=None, solo_activos=True, solo_aprobados=False, solo_pendientes=False):
        qs = in_activo.objects.select_related(
            'cod_gest', 'cod_grupo', 'cod_unidad', 'cod_marca',
            'cod_modelo', 'cod_prove', 'cod_cond', 'cod_estado', 'nro_ingreso'
        )
        if solo_activos:
            qs = qs.exclude(a_b='B')
        if solo_aprobados:
            qs = qs.filter(estado_registro='APROBADO')
        if solo_pendientes:
            qs = qs.filter(estado_registro='ELABORADO')
        if search:
            from django.db.models import Q
            q_obj = Q(descripcion__icontains=search) | Q(cod_activo__icontains=search) | Q(nro_serie__icontains=search)
            if search.isdigit():
                q_obj |= Q(nro_activo=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-nro_activo')[offset:offset+limit]
        return InActivoPaginatedType(total_count=total_count, results=results)

    def resolve_todos_vehiculos_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_vehic.objects.select_related('nro_activo')
        if search:
            from django.db.models import Q
            q_obj = Q(placa__icontains=search) | Q(motor__icontains=search) | Q(chasis__icontains=search) | Q(nro_activo__descripcion__icontains=search) | Q(nro_activo__cod_activo__icontains=search)
            if search.isdigit():
                q_obj |= Q(nro_activo_id=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-nro_activo_id')[offset:offset+limit]
        return InVehicPaginatedType(total_count=total_count, results=results)

    def resolve_todas_asignaciones_paginadas(root, info, limit=15, offset=0, search=None, estado=None):
        qs = in_asignado.objects.select_related('tipo_asig', 'cod_ofic')
        if estado:
            qs = qs.filter(estado=estado)
        if search:
            from django.db.models import Q
            q_obj = Q(tipo_asig__des__icontains=search) | Q(cod_ofic__des_dpto__icontains=search)
            if search.isdigit():
                q_obj |= Q(cod_asig=int(search)) | Q(cod_resp=int(search)) | Q(cod_ofic=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-cod_asig')[offset:offset+limit]
        return InAsignadoPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_activos_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_activo.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q(cod_activo__icontains=search) | Q(descripcion__icontains=search) | Q(nro_serie__icontains=search)
            if search.isdigit():
                q_obj |= Q(nro_activo=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogActivoPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_ingresos_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_ingreso.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q(glosa__icontains=search)
            if search.isdigit():
                q_obj |= Q(nro_ingreso=int(search)) | Q(gestion=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogIngresoPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_asignados_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_asignado.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q(obs__icontains=search)
            if search.isdigit():
                q_obj |= Q(cod_asig=int(search)) | Q(cod_resp=int(search)) | Q(cod_ofic=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogAsignadoPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_det_asig_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_det_asig.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q()
            if search.isdigit():
                q_obj |= Q(cod_asig=int(search)) | Q(nro_activo=int(search))
                qs = qs.filter(q_obj)
            else:
                pass
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogDetAsigPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_oficina_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_oficina.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q(cod_dpto__icontains=search) | Q(des_dpto__icontains=search)
            if search.isdigit():
                q_obj |= Q(cod_ofic=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogOficinaPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_det_reval_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_det_reval.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q()
            if search.isdigit():
                q_obj |= Q(cod_reval=int(search)) | Q(nro_activo=int(search))
                qs = qs.filter(q_obj)
            else:
                pass
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogDetRevalPaginatedType(total_count=total_count, results=results)

    def resolve_todos_logs_baja_act_paginados(root, info, limit=15, offset=0, search=None):
        qs = in_log_baja_act.objects.all()
        if search:
            from django.db.models import Q
            q_obj = Q(observacion__icontains=search) | Q(documento__icontains=search)
            if search.isdigit():
                q_obj |= Q(nro=int(search)) | Q(cod_asig=int(search)) | Q(nro_activo=int(search))
            qs = qs.filter(q_obj)
        total_count = qs.count()
        results = qs.order_by('-id')[offset:offset+limit]
        return InLogBajaActPaginatedType(total_count=total_count, results=results)



