import graphene
from graphene_django import DjangoObjectType
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


# ═══════════════════════════════════════════════════════════════
# TIPOS GRAPHQL
# ═══════════════════════════════════════════════════════════════

class InEstadoType(DjangoObjectType):
    class Meta:
        model = in_estado
        fields = '__all__'

class InCondicionType(DjangoObjectType):
    class Meta:
        model = in_condicion
        fields = '__all__'

class InUnidadType(DjangoObjectType):
    class Meta:
        model = in_unidad
        fields = '__all__'

class InTipoAsigType(DjangoObjectType):
    class Meta:
        model = in_tipo_asig
        fields = '__all__'

class InTipomatType(DjangoObjectType):
    class Meta:
        model = in_tipomat
        fields = '__all__'

class InTipoType(DjangoObjectType):
    class Meta:
        model = in_tipo
        fields = '__all__'

class InMarcaType(DjangoObjectType):
    class Meta:
        model = in_marca
        fields = '__all__'

class InModeloType(DjangoObjectType):
    class Meta:
        model = in_modelo
        fields = '__all__'

class InGestionType(DjangoObjectType):
    class Meta:
        model = in_gestion
        fields = '__all__'

class InParteType(DjangoObjectType):
    class Meta:
        model = in_parte
        fields = '__all__'

class InRevaluoType(DjangoObjectType):
    class Meta:
        model = in_revaluo
        fields = '__all__'

class InFuncionAdmType(DjangoObjectType):
    class Meta:
        model = in_funcion_adm
        fields = '__all__'

class InGrupoType(DjangoObjectType):
    vida_util_default = graphene.Int()
    tasa_depreciacion = graphene.Float()
    codigo_contable = graphene.String()

    class Meta:
        model = in_grupo
        fields = '__all__'

    def resolve_vida_util_default(self, info):
        det = self.in_det_grp_set.first()
        return det.vida_util_ano if det else None

    def resolve_tasa_depreciacion(self, info):
        det = self.in_det_grp_set.first()
        if det and det.vida_util_ano and det.vida_util_ano > 0:
            return round(100.0 / det.vida_util_ano, 2)
        return None

    def resolve_codigo_contable(self, info):
        det = self.in_det_grp_set.first()
        return str(det.cuenta_cont) if det else None


class InOficinaType(DjangoObjectType):
    class Meta:
        model = in_oficina
        fields = '__all__'

class InProvedorType(DjangoObjectType):
    class Meta:
        model = in_provedor
        fields = '__all__'

class InContactoType(DjangoObjectType):
    class Meta:
        model = in_contacto
        fields = '__all__'

class InResponsableType(DjangoObjectType):
    class Meta:
        model = in_responsable
        fields = '__all__'

class InSolicitudType(DjangoObjectType):
    class Meta:
        model = in_solicitud
        fields = '__all__'

class InDetSolType(DjangoObjectType):
    class Meta:
        model = in_det_sol
        fields = '__all__'

class InOfertaType(DjangoObjectType):
    class Meta:
        model = in_oferta
        fields = '__all__'

class InDetOferType(DjangoObjectType):
    class Meta:
        model = in_det_ofer
        fields = '__all__'

class InOrdenCompraType(DjangoObjectType):
    class Meta:
        model = in_orden_compra
        fields = '__all__'

class InIngresoType(DjangoObjectType):
    class Meta:
        model = in_ingreso
        fields = '__all__'

class InActivoType(DjangoObjectType):
    class Meta:
        model = in_activo
        fields = '__all__'

class InAsignadoType(DjangoObjectType):
    class Meta:
        model = in_asignado
        fields = '__all__'

class InDetAsigType(DjangoObjectType):
    class Meta:
        model = in_det_asig
        fields = '__all__'

class InEncargadoType(DjangoObjectType):
    class Meta:
        model = in_encargado
        fields = '__all__'

class InDetRevalType(DjangoObjectType):
    class Meta:
        model = in_det_reval
        fields = '__all__'

class InDepAcumuladaType(DjangoObjectType):
    class Meta:
        model = in_dep_acumulada
        fields = '__all__'

class InAtributoType(DjangoObjectType):
    class Meta:
        model = in_atributo
        fields = '__all__'

class InDetAtribType(DjangoObjectType):
    class Meta:
        model = in_det_atrib
        fields = '__all__'

class InAtribActivoType(DjangoObjectType):
    class Meta:
        model = in_atrib_activo
        fields = '__all__'

class InParteGrupoType(DjangoObjectType):
    class Meta:
        model = in_parte_grupo
        fields = '__all__'

class InModGrpType(DjangoObjectType):
    class Meta:
        model = in_mod_grp
        fields = '__all__'

class InDetGrpType(DjangoObjectType):
    class Meta:
        model = in_det_grp
        fields = '__all__'

class InDetParteType(DjangoObjectType):
    class Meta:
        model = in_det_parte
        fields = '__all__'

class InTransferidoType(DjangoObjectType):
    class Meta:
        model = in_transferido
        fields = '__all__'

class InDetTranfType(DjangoObjectType):
    class Meta:
        model = in_det_tranf
        fields = '__all__'


class InRolType(DjangoObjectType):
    class Meta:
        model = in_rol
        fields = '__all__'


class InPermisoType(DjangoObjectType):
    class Meta:
        model = in_permiso
        fields = '__all__'


class InRolPermisoType(DjangoObjectType):
    class Meta:
        model = in_rol_permiso
        fields = '__all__'


class InEmpleadoType(DjangoObjectType):
    class Meta:
        model = in_empleado
        fields = '__all__'


class InUsuarioType(DjangoObjectType):
    class Meta:
        model = in_usuario
        exclude = ('contrasena',)


class InRolPermisoUsuarioType(DjangoObjectType):
    class Meta:
        model = in_rol_permiso_usuario
        fields = '__all__'


class InMotivoType(DjangoObjectType):
    class Meta:
        model = in_motivo
        fields = '__all__'


class InBajaActType(DjangoObjectType):
    class Meta:
        model = in_baja_act
        fields = '__all__'


class InVehicType(DjangoObjectType):
    class Meta:
        model = in_vehic
        fields = '__all__'


class InTasaRevType(DjangoObjectType):
    class Meta:
        model = in_tasa_rev
        fields = '__all__'


class InLogActivoType(DjangoObjectType):
    class Meta:
        model = in_log_activo
        fields = '__all__'


class InLogIngresoType(DjangoObjectType):
    class Meta:
        model = in_log_ingreso
        fields = '__all__'


class InLogAsignadoType(DjangoObjectType):
    class Meta:
        model = in_log_asignado
        fields = '__all__'


class InLogDetAsigType(DjangoObjectType):
    class Meta:
        model = in_log_det_asig
        fields = '__all__'


class InLogOficinaType(DjangoObjectType):
    class Meta:
        model = in_log_oficina
        fields = '__all__'


class InLogDetRevalType(DjangoObjectType):
    class Meta:
        model = in_log_det_reval
        fields = '__all__'


class InLogBajaActType(DjangoObjectType):
    class Meta:
        model = in_log_baja_act
        fields = '__all__'


# ═══════════════════════════════════════════════════════════════
# TIPOS PAGINADOS PARA GRANDES VOLÚMENES
# ═══════════════════════════════════════════════════════════════

class InActivoPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InActivoType)

class InVehicPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InVehicType)

class InAsignadoPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InAsignadoType)

class InLogActivoPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogActivoType)

class InLogIngresoPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogIngresoType)

class InLogAsignadoPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogAsignadoType)

class InLogDetAsigPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogDetAsigType)

class InLogOficinaPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogOficinaType)

class InLogDetRevalPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogDetRevalType)

class InLogBajaActPaginatedType(graphene.ObjectType):
    total_count = graphene.Int()
    results = graphene.List(InLogBajaActType)




