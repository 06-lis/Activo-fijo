import graphene
from django.utils import timezone
from decimal import Decimal
import re
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
    in_vehic, in_tasa_rev, in_baja_act, in_motivo, in_log_baja_act,
    in_log_activo, in_log_ingreso, in_log_asignado, in_log_det_asig, in_log_oficina, in_log_det_reval
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
    InVehicType, InTasaRevType, InBajaActType, InMotivoType
)


def validar_y_calcular_nivel(codigo, cod_padre_id, model_class):
    if not re.match(r'^[a-zA-Z0-9]{2}(-[a-zA-Z0-9]{2}){0,2}$', codigo):
        raise Exception("Formato de código inválido. Debe tener la estructura XX, XX-XX o XX-XX-XX (cada nivel con 2 caracteres alfanuméricos separados por guiones).")
    
    partes = codigo.split('-')
    nivel = len(partes)
    
    if nivel == 1:
        if cod_padre_id is not None:
            raise Exception("Un elemento de nivel 1 no debe tener un código de padre (cod_padre).")
    else:
        if cod_padre_id is None:
            raise Exception(f"Un elemento de nivel {nivel} ({codigo}) requiere especificar un padre (cod_padre).")
        
        try:
            padre = model_class.objects.get(pk=cod_padre_id)
        except model_class.DoesNotExist:
            raise Exception("El padre especificado (cod_padre) no existe.")
            
        padre_codigo = padre.cod_hijo if hasattr(padre, 'cod_hijo') else padre.cod_dpto
        prefix_esperado = "-".join(partes[:-1])
        if padre_codigo != prefix_esperado:
            raise Exception(f"Inconsistencia de jerarquía: el código del padre ({padre_codigo}) no coincide con el prefijo esperado ({prefix_esperado}).")
        
        if padre.nivel != nivel - 1:
            raise Exception(f"Inconsistencia de jerarquía: el nivel del padre ({padre.nivel}) debe ser {nivel - 1}.")

    return nivel

# ═══════════════════════════════════════════════════════════════
# MUTATIONS — CATÁLOGOS SIMPLES
# ═══════════════════════════════════════════════════════════════

# ── in_estado ──────────────────────────────────────────────────
class CrearEstado(graphene.Mutation):
    class Arguments:
        cod_estado = graphene.Int(required=True)
        des_estado = graphene.String(required=True)
    estado = graphene.Field(InEstadoType)
    def mutate(root, info, cod_estado, des_estado):
        obj = in_estado.objects.create(cod_estado=cod_estado, des_estado=des_estado)
        return CrearEstado(estado=obj)

class EditarEstado(graphene.Mutation):
    class Arguments:
        cod_estado = graphene.Int(required=True)
        des_estado = graphene.String(required=True)
    estado = graphene.Field(InEstadoType)
    def mutate(root, info, cod_estado, des_estado):
        obj = in_estado.objects.get(pk=cod_estado)
        obj.des_estado = des_estado
        obj.save()
        return EditarEstado(estado=obj)

# ── in_condicion ───────────────────────────────────────────────
class CrearCondicion(graphene.Mutation):
    class Arguments:
        cod_cond   = graphene.Int(required=True)
        des_cond   = graphene.String(required=True)
    condicion = graphene.Field(InCondicionType)
    def mutate(root, info, cod_cond, des_cond):
        obj = in_condicion.objects.create(cod_cond=cod_cond, des_cond=des_cond)
        return CrearCondicion(condicion=obj)

class EditarCondicion(graphene.Mutation):
    class Arguments:
        cod_cond   = graphene.Int(required=True)
        des_cond   = graphene.String(required=True)
    condicion = graphene.Field(InCondicionType)
    def mutate(root, info, cod_cond, des_cond):
        obj = in_condicion.objects.get(pk=cod_cond)
        obj.des_cond = des_cond
        obj.save()
        return EditarCondicion(condicion=obj)

# ── in_unidad ──────────────────────────────────────────────────
class CrearUnidad(graphene.Mutation):
    class Arguments:
        cod_unidad  = graphene.Int(required=True)
        des_unidad  = graphene.String(required=True)
        abrev       = graphene.String()
    unidad = graphene.Field(InUnidadType)
    def mutate(root, info, cod_unidad, des_unidad, abrev=None):
        obj = in_unidad.objects.create(cod_unidad=cod_unidad, des_unidad=des_unidad, abrev=abrev)
        return CrearUnidad(unidad=obj)

class EditarUnidad(graphene.Mutation):
    class Arguments:
        cod_unidad  = graphene.Int(required=True)
        des_unidad  = graphene.String()
        abrev       = graphene.String()
    unidad = graphene.Field(InUnidadType)
    def mutate(root, info, cod_unidad, des_unidad=None, abrev=None):
        obj = in_unidad.objects.get(pk=cod_unidad)
        if des_unidad is not None: obj.des_unidad = des_unidad
        if abrev      is not None: obj.abrev = abrev
        obj.save()
        return EditarUnidad(unidad=obj)

# ── in_tipo_asig ───────────────────────────────────────────────
class CrearTipoAsig(graphene.Mutation):
    class Arguments:
        tipo_asig = graphene.Int(required=True)
        des       = graphene.String(required=True)
        abrev     = graphene.String(required=True)
    tipo_asig_obj = graphene.Field(InTipoAsigType)
    def mutate(root, info, tipo_asig, des, abrev):
        obj = in_tipo_asig.objects.create(tipo_asig=tipo_asig, des=des, abrev=abrev)
        return CrearTipoAsig(tipo_asig_obj=obj)

class EditarTipoAsig(graphene.Mutation):
    class Arguments:
        tipo_asig = graphene.Int(required=True)
        des       = graphene.String()
        abrev     = graphene.String()
    tipo_asig_obj = graphene.Field(InTipoAsigType)
    def mutate(root, info, tipo_asig, des=None, abrev=None):
        obj = in_tipo_asig.objects.get(pk=tipo_asig)
        if des   is not None: obj.des = des
        if abrev is not None: obj.abrev = abrev
        obj.save()
        return EditarTipoAsig(tipo_asig_obj=obj)

# ── in_tipomat ──────────────────────────────────────────────────
class CrearTipomat(graphene.Mutation):
    class Arguments:
        tipo_mat = graphene.Int(required=True)
        des_mat  = graphene.String(required=True)
    tipomat = graphene.Field(InTipomatType)
    def mutate(root, info, tipo_mat, des_mat):
        obj = in_tipomat.objects.create(tipo_mat=tipo_mat, des_mat=des_mat)
        return CrearTipomat(tipomat=obj)

class EditarTipomat(graphene.Mutation):
    class Arguments:
        tipo_mat = graphene.Int(required=True)
        des_mat  = graphene.String()
    tipomat = graphene.Field(InTipomatType)
    def mutate(root, info, tipo_mat, des_mat=None):
        obj = in_tipomat.objects.get(pk=tipo_mat)
        if des_mat is not None: obj.des_mat = des_mat
        obj.save()
        return EditarTipomat(tipomat=obj)

# ── in_tipo ────────────────────────────────────────────────────
class CrearTipo(graphene.Mutation):
    class Arguments:
        cod_tipo = graphene.Int(required=True)
        des_tipo = graphene.String(required=True)
    tipo = graphene.Field(InTipoType)
    def mutate(root, info, cod_tipo, des_tipo):
        obj = in_tipo.objects.create(cod_tipo=cod_tipo, des_tipo=des_tipo, a_b='A')
        return CrearTipo(tipo=obj)

class EditarTipo(graphene.Mutation):
    class Arguments:
        cod_tipo = graphene.Int(required=True)
        des_tipo = graphene.String()
    tipo = graphene.Field(InTipoType)
    def mutate(root, info, cod_tipo, des_tipo=None):
        obj = in_tipo.objects.get(pk=cod_tipo)
        if des_tipo is not None: obj.des_tipo = des_tipo
        obj.save()
        return EditarTipo(tipo=obj)

class DarDeBajaTipo(graphene.Mutation):
    class Arguments:
        cod_tipo = graphene.Int(required=True)
    tipo = graphene.Field(InTipoType)
    def mutate(root, info, cod_tipo):
        obj = in_tipo.objects.get(pk=cod_tipo)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaTipo(tipo=obj)

# ── in_marca ───────────────────────────────────────────────────
class CrearMarca(graphene.Mutation):
    class Arguments:
        des_marca = graphene.String(required=True)
    marca = graphene.Field(InMarcaType)
    def mutate(root, info, des_marca):
        obj = in_marca.objects.create(des_marca=des_marca)
        return CrearMarca(marca=obj)

class EditarMarca(graphene.Mutation):
    class Arguments:
        cod_marca = graphene.Int(required=True)
        des_marca = graphene.String(required=True)
    marca = graphene.Field(InMarcaType)
    def mutate(root, info, cod_marca, des_marca):
        obj = in_marca.objects.get(pk=cod_marca)
        obj.des_marca = des_marca
        obj.save()
        return EditarMarca(marca=obj)

# ── in_modelo ──────────────────────────────────────────────────
class CrearModelo(graphene.Mutation):
    class Arguments:
        cod_marca  = graphene.Int(required=True)
        des_modelo = graphene.String(required=True)
    modelo = graphene.Field(InModeloType)
    def mutate(root, info, cod_marca, des_modelo):
        obj = in_modelo.objects.create(cod_marca_id=cod_marca, des_modelo=des_modelo)
        return CrearModelo(modelo=obj)

class EditarModelo(graphene.Mutation):
    class Arguments:
        cod_modelo = graphene.Int(required=True)
        cod_marca  = graphene.Int()
        des_modelo = graphene.String()
    modelo = graphene.Field(InModeloType)
    def mutate(root, info, cod_modelo, cod_marca=None, des_modelo=None):
        obj = in_modelo.objects.get(pk=cod_modelo)
        if cod_marca  is not None: obj.cod_marca_id = cod_marca
        if des_modelo is not None: obj.des_modelo = des_modelo
        obj.save()
        return EditarModelo(modelo=obj)

# ── in_gestion ─────────────────────────────────────────────────
class CrearGestion(graphene.Mutation):
    class Arguments:
        gest_ini = graphene.Int(required=True)
        gest_fin = graphene.Int()
    gestion = graphene.Field(InGestionType)
    def mutate(root, info, gest_ini, gest_fin=None):
        obj = in_gestion.objects.create(gest_ini=gest_ini, gest_fin=gest_fin, a_b='A')
        return CrearGestion(gestion=obj)

class EditarGestion(graphene.Mutation):
    class Arguments:
        cod_gest = graphene.Int(required=True)
        gest_ini = graphene.Int()
        gest_fin = graphene.Int()
    gestion = graphene.Field(InGestionType)
    def mutate(root, info, cod_gest, gest_ini=None, gest_fin=None):
        obj = in_gestion.objects.get(pk=cod_gest)
        if gest_ini is not None: obj.gest_ini = gest_ini
        if gest_fin is not None: obj.gest_fin = gest_fin
        obj.save()
        return EditarGestion(gestion=obj)

class DarDeBajaGestion(graphene.Mutation):
    class Arguments:
        cod_gest = graphene.Int(required=True)
    gestion = graphene.Field(InGestionType)
    def mutate(root, info, cod_gest):
        obj = in_gestion.objects.get(pk=cod_gest)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaGestion(gestion=obj)

# ── in_parte ───────────────────────────────────────────────────
class CrearParte(graphene.Mutation):
    class Arguments:
        des_parte = graphene.String(required=True)
    parte = graphene.Field(InParteType)
    def mutate(root, info, des_parte):
        obj = in_parte.objects.create(des_parte=des_parte, a_b='A')
        return CrearParte(parte=obj)

class EditarParte(graphene.Mutation):
    class Arguments:
        cod_parte = graphene.Int(required=True)
        des_parte = graphene.String(required=True)
    parte = graphene.Field(InParteType)
    def mutate(root, info, cod_parte, des_parte):
        obj = in_parte.objects.get(pk=cod_parte)
        obj.des_parte = des_parte
        obj.save()
        return EditarParte(parte=obj)

class DarDeBajaParte(graphene.Mutation):
    class Arguments:
        cod_parte = graphene.Int(required=True)
    parte = graphene.Field(InParteType)
    def mutate(root, info, cod_parte):
        obj = in_parte.objects.get(pk=cod_parte)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaParte(parte=obj)

# ── in_revaluo ─────────────────────────────────────────────────
class CrearRevaluo(graphene.Mutation):
    class Arguments:
        tipo_reval = graphene.Int(required=True)
        documento  = graphene.String()
        fecha_ini  = graphene.Date(required=True)
        fecha_fin  = graphene.Date()
    revaluo = graphene.Field(InRevaluoType)
    def mutate(root, info, tipo_reval, fecha_ini, documento=None, fecha_fin=None):
        obj = in_revaluo.objects.create(
            tipo_reval=tipo_reval, documento=documento,
            fecha_ini=fecha_ini, fecha_fin=fecha_fin, estado='A'
        )
        return CrearRevaluo(revaluo=obj)

class EditarRevaluo(graphene.Mutation):
    class Arguments:
        cod_reval = graphene.Int(required=True)
        documento = graphene.String()
        fecha_fin = graphene.Date()
        estado    = graphene.String()
    revaluo = graphene.Field(InRevaluoType)
    def mutate(root, info, cod_reval, documento=None, fecha_fin=None, estado=None):
        obj = in_revaluo.objects.get(pk=cod_reval)
        if documento is not None: obj.documento = documento
        if fecha_fin is not None: obj.fecha_fin = fecha_fin
        if estado is not None: obj.estado = estado
        obj.save()
        return EditarRevaluo(revaluo=obj)


class AnularRevaluo(graphene.Mutation):
    class Arguments:
        cod_reval = graphene.Int(required=True)
    revaluo = graphene.Field(InRevaluoType)
    def mutate(root, info, cod_reval):
        obj = in_revaluo.objects.get(pk=cod_reval)
        obj.estado = 'B'
        obj.save()
        return AnularRevaluo(revaluo=obj)

# ── in_funcion_adm ─────────────────────────────────────────────
class CrearFuncionAdm(graphene.Mutation):
    class Arguments:
        cod_func = graphene.Int(required=True)
        des      = graphene.String(required=True)
        estprog  = graphene.String()
    funcion_adm = graphene.Field(InFuncionAdmType)
    def mutate(root, info, cod_func, des, estprog=None):
        obj = in_funcion_adm.objects.create(cod_func=cod_func, des=des, estprog=estprog)
        return CrearFuncionAdm(funcion_adm=obj)

class EditarFuncionAdm(graphene.Mutation):
    class Arguments:
        cod_func = graphene.Int(required=True)
        des      = graphene.String()
        estprog  = graphene.String()
    funcion_adm = graphene.Field(InFuncionAdmType)
    def mutate(root, info, cod_func, des=None, estprog=None):
        obj = in_funcion_adm.objects.get(pk=cod_func)
        if des     is not None: obj.des = des
        if estprog is not None: obj.estprog = estprog
        obj.save()
        return EditarFuncionAdm(funcion_adm=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — JERARQUÍAS
# ═══════════════════════════════════════════════════════════════

# ── in_grupo ───────────────────────────────────────────────────
class CrearGrupo(graphene.Mutation):
    class Arguments:
        cod_hijo          = graphene.String(required=True)
        des_grupo         = graphene.String()
        cod_padre         = graphene.Int()
        cod_gest          = graphene.Int(required=True)
        cod_tipo          = graphene.Int()
        vida_util_default = graphene.Int()
        codigo_contable   = graphene.String()
    grupo = graphene.Field(InGrupoType)
    def mutate(root, info, cod_hijo, cod_gest, des_grupo=None, cod_padre=None, cod_tipo=None, vida_util_default=None, codigo_contable=None):
        nivel_calculado = validar_y_calcular_nivel(cod_hijo, cod_padre, in_grupo)
        obj = in_grupo.objects.create(
            cod_hijo=cod_hijo, des_grupo=des_grupo, cod_padre_id=cod_padre,
            nivel=nivel_calculado, cod_gest_id=cod_gest, cod_tipo_id=cod_tipo, a_b='A'
        )
        if vida_util_default is not None or codigo_contable is not None:
            v_util = vida_util_default if vida_util_default is not None else 0
            c_cont = int(codigo_contable) if codigo_contable else 0
            in_det_grp.objects.create(
                cod_grupo=obj,
                vida_util_mes=0,
                vida_util_ano=v_util,
                cuenta_cont=c_cont,
                cuenta_presup=0
            )
        return CrearGrupo(grupo=obj)

class EditarGrupo(graphene.Mutation):
    class Arguments:
        cod_grupo         = graphene.Int(required=True)
        cod_hijo          = graphene.String()
        des_grupo         = graphene.String()
        cod_padre         = graphene.Int()
        cod_tipo          = graphene.Int()
        vida_util_default = graphene.Int()
        codigo_contable   = graphene.String()
    grupo = graphene.Field(InGrupoType)
    def mutate(root, info, cod_grupo, cod_hijo=None, des_grupo=None, cod_padre=None, cod_tipo=None, vida_util_default=None, codigo_contable=None):
        obj = in_grupo.objects.get(pk=cod_grupo)
        
        if cod_hijo is not None or cod_padre is not None:
            final_codigo = cod_hijo if cod_hijo is not None else obj.cod_hijo
            final_padre_id = cod_padre if cod_padre is not None else obj.cod_padre_id
            
            if cod_hijo is not None and cod_hijo != obj.cod_hijo:
                if obj.hijos.filter(a_b='A').exists():
                    raise Exception("No se puede modificar el código de un grupo que tiene subgrupos activos dependientes.")
            
            nivel_calculado = validar_y_calcular_nivel(final_codigo, final_padre_id, in_grupo)
            obj.cod_hijo = final_codigo
            obj.cod_padre_id = final_padre_id
            obj.nivel = nivel_calculado
        
        if des_grupo is not None: obj.des_grupo = des_grupo
        if cod_tipo  is not None: obj.cod_tipo_id = cod_tipo
        obj.save()

        if vida_util_default is not None or codigo_contable is not None:
            det, _ = in_det_grp.objects.get_or_create(
                cod_grupo=obj,
                defaults={'vida_util_mes': 0, 'vida_util_ano': 0, 'cuenta_cont': 0, 'cuenta_presup': 0}
            )
            if vida_util_default is not None:
                det.vida_util_ano = vida_util_default
            if codigo_contable is not None:
                det.cuenta_cont = int(codigo_contable) if codigo_contable else 0
            det.save()

        return EditarGrupo(grupo=obj)


class DarDeBajaGrupo(graphene.Mutation):
    class Arguments:
        cod_grupo = graphene.Int(required=True)
    grupo = graphene.Field(InGrupoType)
    def mutate(root, info, cod_grupo):
        obj = in_grupo.objects.get(pk=cod_grupo)
        if obj.hijos.filter(a_b='A').exists():
            raise Exception("No se puede dar de baja este grupo porque tiene subgrupos activos dependientes.")
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaGrupo(grupo=obj)

# ── in_oficina ─────────────────────────────────────────────────
def registrar_log_oficina(obj, tipo_me, info=None):
    from django.utils import timezone
    from .auth_helper import get_authenticated_user
    cod_emp_me = None
    tipo_per_me = None
    if info:
        try:
            user = get_authenticated_user(info)
            if user and user.cod_emp:
                cod_emp_me = user.cod_emp.id_empleado
                tipo_per_me = 1
        except Exception:
            pass
    in_log_oficina.objects.create(
        cod_ofic=obj.cod_ofic,
        cod_dpto=obj.cod_dpto[:5] if obj.cod_dpto else '',
        des_dpto=obj.des_dpto[:60] if obj.des_dpto else '',
        cod_padre=obj.cod_padre_id if obj.cod_padre_id is not None else 0,
        tipo_act=obj.tipo_act if obj.tipo_act is not None else 1,
        cod_activ=obj.cod_activ[:8] if obj.cod_activ else '',
        nivel=obj.nivel if obj.nivel is not None else 1,
        cod_gest=obj.cod_gest if obj.cod_gest is not None else 1,
        a_b=obj.a_b,
        tipo_per_me=tipo_per_me,
        cod_emp_me=cod_emp_me,
        fecha_me=timezone.now(),
        tipo_me=tipo_me
    )

class CrearOficina(graphene.Mutation):
    class Arguments:
        cod_dpto  = graphene.String(required=True)
        des_dpto  = graphene.String(required=True)
        cod_padre = graphene.Int()
        tipo_act  = graphene.Int()
        cod_activ = graphene.String()
        cod_gest  = graphene.Int(required=True)
    oficina = graphene.Field(InOficinaType)
    def mutate(root, info, cod_dpto, des_dpto, cod_gest, cod_padre=None, tipo_act=1, cod_activ=''):
        nivel_calculado = validar_y_calcular_nivel(cod_dpto, cod_padre, in_oficina)
        obj = in_oficina.objects.create(
            cod_dpto=cod_dpto, des_dpto=des_dpto, cod_padre_id=cod_padre,
            tipo_act=tipo_act, cod_activ=cod_activ, nivel=nivel_calculado, cod_gest=cod_gest, a_b='A'
        )
        registrar_log_oficina(obj, 'I', info)
        return CrearOficina(oficina=obj)

class EditarOficina(graphene.Mutation):
    class Arguments:
        cod_ofic  = graphene.Int(required=True)
        cod_dpto  = graphene.String()
        des_dpto  = graphene.String()
        cod_padre = graphene.Int()
        tipo_act  = graphene.Int()
        cod_activ = graphene.String()
    oficina = graphene.Field(InOficinaType)
    def mutate(root, info, cod_ofic, cod_dpto=None, des_dpto=None, cod_padre=None,
               tipo_act=None, cod_activ=None):
        obj = in_oficina.objects.get(pk=cod_ofic)
        
        if cod_dpto is not None or cod_padre is not None:
            final_codigo = cod_dpto if cod_dpto is not None else obj.cod_dpto
            final_padre_id = cod_padre if cod_padre is not None else obj.cod_padre_id
            
            if cod_dpto is not None and cod_dpto != obj.cod_dpto:
                if obj.hijos.filter(a_b='A').exists():
                    raise Exception("No se puede modificar el código de una oficina que tiene suboficinas activas dependientes.")
            
            nivel_calculado = validar_y_calcular_nivel(final_codigo, final_padre_id, in_oficina)
            obj.cod_dpto = final_codigo
            obj.cod_padre_id = final_padre_id
            obj.nivel = nivel_calculado
            
        if des_dpto  is not None: obj.des_dpto = des_dpto
        if tipo_act  is not None: obj.tipo_act = tipo_act
        if cod_activ is not None: obj.cod_activ = cod_activ
        obj.save()
        registrar_log_oficina(obj, 'U', info)
        return EditarOficina(oficina=obj)

class DarDeBajaOficina(graphene.Mutation):
    class Arguments:
        cod_ofic = graphene.Int(required=True)
    oficina = graphene.Field(InOficinaType)
    def mutate(root, info, cod_ofic):
        obj = in_oficina.objects.get(pk=cod_ofic)
        if obj.hijos.filter(a_b='A').exists():
            raise Exception("No se puede dar de baja esta oficina porque tiene suboficinas activas dependientes.")
        obj.a_b = 'B'
        obj.save()
        registrar_log_oficina(obj, 'D', info)
        return DarDeBajaOficina(oficina=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — PROVEEDOR Y CONTACTO
# ═══════════════════════════════════════════════════════════════

class CrearProvedor(graphene.Mutation):
    class Arguments:
        nombre    = graphene.String(required=True)
        direccion = graphene.String()
        telefono  = graphene.String()
        ruc       = graphene.String()
        ciudad    = graphene.String()
    provedor = graphene.Field(InProvedorType)
    def mutate(root, info, nombre, direccion=None, telefono=None, ruc=None, ciudad=None):
        obj = in_provedor.objects.create(
            nombre=nombre, direccion=direccion, telefono=telefono, ruc=ruc, ciudad=ciudad
        )
        return CrearProvedor(provedor=obj)

class EditarProvedor(graphene.Mutation):
    class Arguments:
        cod_prov  = graphene.Int(required=True)
        nombre    = graphene.String()
        direccion = graphene.String()
        telefono  = graphene.String()
        ruc       = graphene.String()
        ciudad    = graphene.String()
    provedor = graphene.Field(InProvedorType)
    def mutate(root, info, cod_prov, nombre=None, direccion=None, telefono=None, ruc=None, ciudad=None):
        obj = in_provedor.objects.get(pk=cod_prov)
        if nombre    is not None: obj.nombre = nombre
        if direccion is not None: obj.direccion = direccion
        if telefono  is not None: obj.telefono = telefono
        if ruc       is not None: obj.ruc = ruc
        if ciudad    is not None: obj.ciudad = ciudad
        obj.save()
        return EditarProvedor(provedor=obj)

class CrearContacto(graphene.Mutation):
    class Arguments:
        cod_prov   = graphene.Int(required=True)
        nombre     = graphene.String(required=True)
        tipo_docid = graphene.String(required=True)
        docto_idn  = graphene.String(required=True)
        docto_idl  = graphene.String(required=True)
        telefono   = graphene.String()
    contacto = graphene.Field(InContactoType)
    def mutate(root, info, cod_prov, nombre, tipo_docid, docto_idn, docto_idl, telefono=''):
        obj = in_contacto.objects.create(
            cod_prov_id=cod_prov, nombre=nombre, tipo_docid=tipo_docid,
            docto_idn=docto_idn, docto_idl=docto_idl, telefono=telefono
        )
        return CrearContacto(contacto=obj)

class EditarContacto(graphene.Mutation):
    class Arguments:
        cod_cont   = graphene.Int(required=True)
        nombre     = graphene.String()
        tipo_docid = graphene.String()
        docto_idn  = graphene.String()
        docto_idl  = graphene.String()
        telefono   = graphene.String()
    contacto = graphene.Field(InContactoType)
    def mutate(root, info, cod_cont, nombre=None, tipo_docid=None, docto_idn=None, docto_idl=None, telefono=None):
        obj = in_contacto.objects.get(pk=cod_cont)
        if nombre     is not None: obj.nombre = nombre
        if tipo_docid is not None: obj.tipo_docid = tipo_docid
        if docto_idn  is not None: obj.docto_idn = docto_idn
        if docto_idl  is not None: obj.docto_idl = docto_idl
        if telefono   is not None: obj.telefono = telefono
        obj.save()
        return EditarContacto(contacto=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — PROCESO DE COMPRAS
# ═══════════════════════════════════════════════════════════════

# ── in_responsable ─────────────────────────────────────────────
class CrearResponsable(graphene.Mutation):
    class Arguments:
        cod_estprog = graphene.String(required=True)
        cod_emp     = graphene.Int(required=True)
        tipo_per    = graphene.String(required=True)
        fecha       = graphene.Date(required=True)
    responsable = graphene.Field(InResponsableType)
    def mutate(root, info, cod_estprog, cod_emp, tipo_per, fecha):
        obj = in_responsable.objects.create(
            cod_estprog=cod_estprog, cod_emp=cod_emp,
            tipo_per=tipo_per, fecha=fecha, a_b='A'
        )
        return CrearResponsable(responsable=obj)

class EditarResponsable(graphene.Mutation):
    class Arguments:
        cod_resp    = graphene.Int(required=True)
        cod_estprog = graphene.String()
        cod_emp     = graphene.Int()
        tipo_per    = graphene.String()
        fecha       = graphene.Date()
    responsable = graphene.Field(InResponsableType)
    def mutate(root, info, cod_resp, cod_estprog=None, cod_emp=None, tipo_per=None, fecha=None):
        obj = in_responsable.objects.get(pk=cod_resp)
        if cod_estprog is not None: obj.cod_estprog = cod_estprog
        if cod_emp     is not None: obj.cod_emp = cod_emp
        if tipo_per    is not None: obj.tipo_per = tipo_per
        if fecha       is not None: obj.fecha = fecha
        obj.save()
        return EditarResponsable(responsable=obj)

class DarDeBajaResponsable(graphene.Mutation):
    class Arguments:
        cod_resp = graphene.Int(required=True)
    responsable = graphene.Field(InResponsableType)
    def mutate(root, info, cod_resp):
        obj = in_responsable.objects.get(pk=cod_resp)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaResponsable(responsable=obj)

# ── in_solicitud ───────────────────────────────────────────────
class CrearSolicitud(graphene.Mutation):
    class Arguments:
        gestion     = graphene.Int(required=True)
        cod_estprog = graphene.String(required=True)
        emp_sol     = graphene.Int(required=True)
        glosa       = graphene.String(required=True)
        emp_resp    = graphene.Int(required=True)
        cod_emp     = graphene.Int(required=True)
        fecha       = graphene.Date(required=True)
    solicitud = graphene.Field(InSolicitudType)
    def mutate(root, info, gestion, cod_estprog, emp_sol, glosa, emp_resp, cod_emp, fecha):
        obj = in_solicitud.objects.create(
            gestion=gestion, cod_estprog=cod_estprog, emp_sol_id=emp_sol,
            glosa=glosa, emp_resp_id=emp_resp, cod_emp_id=cod_emp, fecha=fecha, a_b='A'
        )
        return CrearSolicitud(solicitud=obj)

class EditarSolicitud(graphene.Mutation):
    class Arguments:
        nro_sol     = graphene.Int(required=True)
        glosa       = graphene.String()
        emp_resp    = graphene.Int()
        cod_estprog = graphene.String()
    solicitud = graphene.Field(InSolicitudType)
    def mutate(root, info, nro_sol, glosa=None, emp_resp=None, cod_estprog=None):
        obj = in_solicitud.objects.get(pk=nro_sol)
        if glosa       is not None: obj.glosa = glosa
        if emp_resp    is not None: obj.emp_resp_id = emp_resp
        if cod_estprog is not None: obj.cod_estprog = cod_estprog
        obj.save()
        return EditarSolicitud(solicitud=obj)

class AnularSolicitud(graphene.Mutation):
    class Arguments:
        nro_sol = graphene.Int(required=True)
    solicitud = graphene.Field(InSolicitudType)
    def mutate(root, info, nro_sol):
        obj = in_solicitud.objects.get(pk=nro_sol)
        obj.a_b = 'B'
        obj.save()
        return AnularSolicitud(solicitud=obj)

class AprobarSolicitud(graphene.Mutation):
    """Aprueba una solicitud de compra pendiente. Cambia a_b a 'P' (Aprobada)."""
    class Arguments:
        nro_sol = graphene.Int(required=True)
    solicitud = graphene.Field(InSolicitudType)
    def mutate(root, info, nro_sol):
        obj = in_solicitud.objects.get(pk=nro_sol)
        if obj.a_b not in ('A',):
            raise Exception("Solo se pueden aprobar solicitudes en estado Pendiente.")
        obj.a_b = 'P'
        obj.save()
        return AprobarSolicitud(solicitud=obj)

class RechazarSolicitud(graphene.Mutation):
    """Rechaza una solicitud de compra pendiente. Cambia a_b a 'R' (Rechazada)."""
    class Arguments:
        nro_sol = graphene.Int(required=True)
        motivo  = graphene.String()
    solicitud = graphene.Field(InSolicitudType)
    def mutate(root, info, nro_sol, motivo=None):
        obj = in_solicitud.objects.get(pk=nro_sol)
        if obj.a_b not in ('A',):
            raise Exception("Solo se pueden rechazar solicitudes en estado Pendiente.")
        obj.a_b = 'R'
        # Store rejection reason in glosa field (append)
        if motivo:
            obj.glosa = f"{obj.glosa} | RECHAZADO: {motivo}"
        obj.save()
        return RechazarSolicitud(solicitud=obj)

# ── in_det_sol ─────────────────────────────────────────────────
class AgregarDetSol(graphene.Mutation):
    class Arguments:
        nro_sol     = graphene.Int(required=True)
        id_material = graphene.Int(required=True)
        cantidad    = graphene.Int(required=True)
    det_sol = graphene.Field(InDetSolType)
    def mutate(root, info, nro_sol, id_material, cantidad):
        obj = in_det_sol.objects.create(
            nro_sol_id=nro_sol, id_material=id_material, cantidad=cantidad
        )
        return AgregarDetSol(det_sol=obj)

class EditarDetSol(graphene.Mutation):
    class Arguments:
        nro_sol     = graphene.Int(required=True)
        id_material = graphene.Int(required=True)
        cantidad    = graphene.Int(required=True)
    det_sol = graphene.Field(InDetSolType)
    def mutate(root, info, nro_sol, id_material, cantidad):
        obj = in_det_sol.objects.get(nro_sol_id=nro_sol, id_material=id_material)
        obj.cantidad = cantidad
        obj.save()
        return EditarDetSol(det_sol=obj)

# ── in_oferta ──────────────────────────────────────────────────
class CrearOferta(graphene.Mutation):
    class Arguments:
        nro_sol    = graphene.Int(required=True)
        cod_prov   = graphene.Int(required=True)
        fecha_ofer = graphene.Date(required=True)
        glosa      = graphene.String()
    oferta = graphene.Field(InOfertaType)
    def mutate(root, info, nro_sol, cod_prov, fecha_ofer, glosa=''):
        obj = in_oferta.objects.create(
            nro_sol_id=nro_sol, cod_prov_id=cod_prov,
            fecha_ofer=fecha_ofer, glosa=glosa, estado='P'
        )
        return CrearOferta(oferta=obj)

class EditarOferta(graphene.Mutation):
    class Arguments:
        nro_oferta = graphene.Int(required=True)
        glosa      = graphene.String()
        estado     = graphene.String()
    oferta = graphene.Field(InOfertaType)
    def mutate(root, info, nro_oferta, glosa=None, estado=None):
        obj = in_oferta.objects.get(pk=nro_oferta)
        if glosa  is not None: obj.glosa = glosa
        if estado is not None: obj.estado = estado
        obj.save()
        return EditarOferta(oferta=obj)

class AnularOferta(graphene.Mutation):
    class Arguments:
        nro_oferta = graphene.Int(required=True)
    oferta = graphene.Field(InOfertaType)
    def mutate(root, info, nro_oferta):
        obj = in_oferta.objects.get(pk=nro_oferta)
        obj.estado = 'B'
        obj.save()
        return AnularOferta(oferta=obj)

# ── in_det_ofer ────────────────────────────────────────────────
class AgregarDetOfer(graphene.Mutation):
    class Arguments:
        nro_oferta  = graphene.Int(required=True)
        id_material = graphene.Int(required=True)
        cantidad    = graphene.Int(required=True)
        monto_uni   = graphene.Float(required=True)
        id_marca    = graphene.Int()
        id_modelo   = graphene.Int()
    det_ofer = graphene.Field(InDetOferType)
    def mutate(root, info, nro_oferta, id_material, cantidad, monto_uni, id_marca=0, id_modelo=0):
        obj = in_det_ofer.objects.create(
            nro_oferta_id=nro_oferta, id_material=id_material,
            cantidad=cantidad, monto_uni=monto_uni,
            id_marca=id_marca, id_modelo=id_modelo
        )
        return AgregarDetOfer(det_ofer=obj)

class EditarDetOfer(graphene.Mutation):
    class Arguments:
        nro_oferta  = graphene.Int(required=True)
        id_material = graphene.Int(required=True)
        cantidad    = graphene.Int()
        monto_uni   = graphene.Float()
        id_marca    = graphene.Int()
        id_modelo   = graphene.Int()
    det_ofer = graphene.Field(InDetOferType)
    def mutate(root, info, nro_oferta, id_material, cantidad=None, monto_uni=None, id_marca=None, id_modelo=None):
        obj = in_det_ofer.objects.get(nro_oferta_id=nro_oferta, id_material=id_material)
        if cantidad  is not None: obj.cantidad = cantidad
        if monto_uni is not None: obj.monto_uni = monto_uni
        if id_marca  is not None: obj.id_marca = id_marca
        if id_modelo is not None: obj.id_modelo = id_modelo
        obj.save()
        return EditarDetOfer(det_ofer=obj)

# ── in_orden_compra ────────────────────────────────────────────
class CrearOrdenCompra(graphene.Mutation):
    class Arguments:
        nro_oferta   = graphene.Int(required=True)
        emp_resp     = graphene.Int(required=True)
        fecha_orden  = graphene.Date(required=True)
        glosa        = graphene.String()
        nro_com_egre = graphene.Int()
    orden_compra = graphene.Field(InOrdenCompraType)
    def mutate(root, info, nro_oferta, emp_resp, fecha_orden, glosa='', nro_com_egre=0):
        obj = in_orden_compra.objects.create(
            nro_oferta_id=nro_oferta, emp_resp_id=emp_resp,
            fecha_orden=fecha_orden, glosa=glosa,
            nro_com_egre=nro_com_egre, a_b='A'
        )
        return CrearOrdenCompra(orden_compra=obj)

class EditarOrdenCompra(graphene.Mutation):
    class Arguments:
        nro_compra   = graphene.Int(required=True)
        glosa        = graphene.String()
        nro_com_egre = graphene.Int()
        emp_resp     = graphene.Int()
    orden_compra = graphene.Field(InOrdenCompraType)
    def mutate(root, info, nro_compra, glosa=None, nro_com_egre=None, emp_resp=None):
        obj = in_orden_compra.objects.get(pk=nro_compra)
        if glosa        is not None: obj.glosa = glosa
        if nro_com_egre is not None: obj.nro_com_egre = nro_com_egre
        if emp_resp     is not None: obj.emp_resp_id = emp_resp
        obj.save()
        return EditarOrdenCompra(orden_compra=obj)

class AnularOrdenCompra(graphene.Mutation):
    class Arguments:
        nro_compra = graphene.Int(required=True)
    orden_compra = graphene.Field(InOrdenCompraType)
    def mutate(root, info, nro_compra):
        obj = in_orden_compra.objects.get(pk=nro_compra)
        obj.a_b = 'B'
        obj.save()
        return AnularOrdenCompra(orden_compra=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — INGRESO DE BIENES
# ═══════════════════════════════════════════════════════════════

def registrar_log_ingreso(obj, tipo_log_str, tipo_trans_int):
    in_log_ingreso.objects.create(
        nro_ingreso=obj.nro_ingreso,
        gestion=obj.gestion,
        tipo_ingreso=obj.tipo_ingreso,
        tipo_recur=obj.tipo_recur,
        tipo_desc=obj.tipo_desc,
        acta_recep=obj.acta_recep,
        fecha_recep=obj.fecha_recep,
        tipo_emp_recep=obj.tipo_emp_recep,
        cod_emp_recep=obj.cod_emp_recep,
        cod_prov=obj.cod_prov_id,
        cod_cont=obj.cod_cont_id if hasattr(obj, 'cod_cont') else None,
        cod_ofic_dest=obj.cod_ofic_dest_id,
        tipo_emp_dest=obj.tipo_emp_dest,
        cod_emp_dest=obj.cod_emp_dest,
        tipo_emp_codi=obj.tipo_emp_codi if hasattr(obj, 'tipo_emp_codi') else None,
        cod_emp_codi=obj.cod_emp_codi if hasattr(obj, 'cod_emp_codi') else None,
        tipo_emp_enc=obj.tipo_emp_enc if hasattr(obj, 'tipo_emp_enc') else None,
        cod_emp_enc=obj.cod_emp_enc if hasattr(obj, 'cod_emp_enc') else None,
        glosa=obj.glosa,
        nro_compra=obj.nro_compra,
        fecha_compra=obj.fecha_compra if hasattr(obj, 'fecha_compra') else None,
        nro_egreso=obj.nro_egreso,
        fecha_egreso=obj.fecha_egreso,
        nro_factura=obj.nro_factura,
        fecha_factura=obj.fecha_factura,
        nro_doc_rpa=obj.nro_doc_rpa if hasattr(obj, 'nro_doc_rpa') else None,
        fecha_doc_rpa=obj.fecha_doc_rpa if hasattr(obj, 'fecha_doc_rpa') else None,
        cod_trans=obj.nro_ingreso,
        tipo_trans=tipo_trans_int,
        fecha_trans=timezone.now(),
        cod_gest=obj.gestion if obj.gestion else 1,
        estado=obj.estado,
        cod_asig=None,
        fecha_m_e=timezone.now(),
        cod_trans_m_e=obj.nro_ingreso,
        tipo_trans_m_e=tipo_trans_int,
        tipo_m_e=tipo_log_str
    )

class CrearIngreso(graphene.Mutation):
    class Arguments:
        gestion        = graphene.Int()
        tipo_ingreso   = graphene.Int()
        cod_prov       = graphene.Int()
        cod_ofic_dest  = graphene.Int()
        nro_compra     = graphene.Int()
        glosa          = graphene.String()
        acta_recep     = graphene.String()
        fecha_recep    = graphene.Date()
        nro_factura    = graphene.Int()
        fecha_factura  = graphene.Date()
        nro_egreso     = graphene.Int()
        fecha_egreso   = graphene.Date()
        tipo_emp_recep = graphene.Int()
        cod_emp_recep  = graphene.Int()
        tipo_emp_dest  = graphene.Int()
        cod_emp_dest   = graphene.Int()
        estado         = graphene.String()
    ingreso = graphene.Field(InIngresoType)
    def mutate(root, info, estado='E', cod_prov=None, cod_ofic_dest=None, **kwargs):
        obj = in_ingreso.objects.create(
            estado=estado,
            cod_prov_id=cod_prov,
            cod_ofic_dest_id=cod_ofic_dest,
            **kwargs
        )
        registrar_log_ingreso(obj, 'I', 1)
        return CrearIngreso(ingreso=obj)

class EditarIngreso(graphene.Mutation):
    class Arguments:
        nro_ingreso   = graphene.Int(required=True)
        glosa         = graphene.String()
        cod_ofic_dest = graphene.Int()
        cod_prov      = graphene.Int()
    ingreso = graphene.Field(InIngresoType)
    def mutate(root, info, nro_ingreso, glosa=None, cod_ofic_dest=None, cod_prov=None):
        obj = in_ingreso.objects.get(pk=nro_ingreso)
        if glosa         is not None: obj.glosa = glosa
        if cod_ofic_dest is not None: obj.cod_ofic_dest_id = cod_ofic_dest
        if cod_prov      is not None: obj.cod_prov_id = cod_prov
        obj.save()
        registrar_log_ingreso(obj, 'U', 2)
        return EditarIngreso(ingreso=obj)

class AnularIngreso(graphene.Mutation):
    class Arguments:
        nro_ingreso = graphene.Int(required=True)
    ingreso = graphene.Field(InIngresoType)
    def mutate(root, info, nro_ingreso):
        obj = in_ingreso.objects.get(pk=nro_ingreso)
        obj.estado = 'B'
        obj.save()
        registrar_log_ingreso(obj, 'D', 3)
        return AnularIngreso(ingreso=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — ACTIVO FIJO
# ═══════════════════════════════════════════════════════════════

def registrar_log_activo(obj, tipo_log_str, tipo_trans_int):
    in_log_activo.objects.create(
        nro_activo=obj.nro_activo,
        cod_gest=obj.cod_gest_id,
        cod_activo=obj.cod_activo,
        cod_activo_ax=0,
        cod_grupo=obj.cod_grupo_id,
        nro_disp=0,
        descripcion=obj.descripcion,
        cod_unidad=obj.cod_unidad_id,
        monto=Decimal(str(obj.monto)) if obj.monto is not None else None,
        fec_adqui=obj.fec_adqui,
        nro_serie=obj.nro_serie,
        cod_marca=obj.cod_marca_id,
        cod_modelo=obj.cod_modelo_id,
        cod_prove=obj.cod_prove_id,
        cod_cond=obj.cod_cond_id,
        cod_estado=obj.cod_estado_id,
        nro_ingreso=obj.nro_ingreso_id,
        tipo_trans=tipo_trans_int,
        cod_trans=obj.nro_activo,
        tipo_transa=tipo_trans_int,
        cod_transa=obj.nro_activo,
        fecha_trans=timezone.now(),
        tipo_actual=tipo_log_str,
        nro_int=''
    )

class CrearActivo(graphene.Mutation):
    class Arguments:
        cod_gest              = graphene.Int(required=True)
        cod_activo            = graphene.String(required=True)
        cod_grupo             = graphene.Int(required=True)
        descripcion           = graphene.String(required=True)
        cod_estado            = graphene.Int(required=True)
        nro_ingreso           = graphene.Int(required=True)
        cod_unidad            = graphene.Int()
        monto                 = graphene.Float()
        fec_adqui             = graphene.Date()
        nro_serie             = graphene.String()
        cod_marca             = graphene.Int()
        cod_modelo            = graphene.Int()
        cod_prove             = graphene.Int()
        cod_cond              = graphene.Int()
        organismo_financiador = graphene.Int()
        cod_rube              = graphene.String()
        nro_convenio          = graphene.String()
    activo = graphene.Field(InActivoType)
    def mutate(root, info, cod_gest, cod_activo, cod_grupo, descripcion,
               cod_estado, nro_ingreso, cod_unidad=None, monto=None,
               fec_adqui=None, nro_serie=None, cod_marca=None,
               cod_modelo=None, cod_prove=None, cod_cond=None,
               organismo_financiador=None, cod_rube=None, nro_convenio=None):
        obj = in_activo.objects.create(
            cod_gest_id=cod_gest, cod_activo=cod_activo, cod_grupo_id=cod_grupo,
            descripcion=descripcion, cod_estado_id=cod_estado, nro_ingreso_id=nro_ingreso,
            cod_unidad_id=cod_unidad, monto=monto, fec_adqui=fec_adqui,
            nro_serie=nro_serie, cod_marca_id=cod_marca, cod_modelo_id=cod_modelo,
            cod_prove_id=cod_prove, cod_cond_id=cod_cond,
            organismo_financiador=organismo_financiador, cod_rube=cod_rube, nro_convenio=nro_convenio,
            estado_registro='ELABORADO', a_b='A'
        )
        registrar_log_activo(obj, 'I', 1)

        # --- LÓGICA DE ASIGNACIÓN AUTOMÁTICA ---
        try:
            ingreso = in_ingreso.objects.get(pk=nro_ingreso)
            if ingreso.cod_ofic_dest_id and ingreso.cod_emp_dest:
                fecha_actual = timezone.now().date()
                
                # Buscar asignación abierta para esa oficina y empleado hoy
                asignacion = in_asignado.objects.filter(
                    cod_ofic_id=ingreso.cod_ofic_dest_id,
                    cod_resp=ingreso.cod_emp_dest,
                    fecha_asig=fecha_actual,
                    estado='A'
                ).first()
                
                if not asignacion:
                    # Crear nueva asignación inicial
                    asignacion = in_asignado.objects.create(
                        tipo_asig_id=1,  # 1 = Comprado / Inicial
                        tipo_resp=ingreso.tipo_emp_dest if ingreso.tipo_emp_dest else 1,
                        cod_resp=ingreso.cod_emp_dest,
                        cod_ofic_id=ingreso.cod_ofic_dest_id,
                        fecha_asig=fecha_actual,
                        estado='A'
                    )
                    in_log_asignado.objects.create(
                        cod_asig=asignacion.cod_asig,
                        tipo_asig=asignacion.tipo_asig_id,
                        tipo_resp=asignacion.tipo_resp,
                        cod_resp=asignacion.cod_resp,
                        cod_ofic=asignacion.cod_ofic_id,
                        fecha_asig=asignacion.fecha_asig,
                        fecha_fin=asignacion.fecha_fin,
                        obs='Asignación automática por creación de activo',
                        tipo_trans_ant=0, cod_trans_ant=0,
                        tipo_trans_act=1, cod_trans_act=asignacion.cod_asig,
                        fecha_act=timezone.now(),
                        tipo_log='I', tipo_inv=0, cod_inv=0
                    )
                
                # Crear el detalle de asignación vinculando este activo
                det = in_det_asig.objects.create(
                    cod_asig_id=asignacion.cod_asig,
                    nro_activo_id=obj.nro_activo,
                    cantidad=1,
                    fecha_trans=fecha_actual
                )
                in_log_det_asig.objects.create(
                    cod_asig=det.cod_asig_id,
                    nro_activo=det.nro_activo_id,
                    cantidad=det.cantidad,
                    fecha_trans=det.fecha_trans,
                    tipo_trans=1, cod_trans=det.cod_asig_id,
                    tipo_trans_act=1, cod_trans_act=det.cod_asig_id,
                    fecha_trans_act=timezone.now(),
                    tipo_actual='I'
                )
        except Exception as e:
            # Si hay error en la asignación, no evitamos la creación del activo
            pass
        # ---------------------------------------

        return CrearActivo(activo=obj)

class EditarActivo(graphene.Mutation):
    class Arguments:
        nro_activo            = graphene.Int(required=True)
        descripcion           = graphene.String()
        cod_estado            = graphene.Int()
        cod_grupo             = graphene.Int()
        cod_marca             = graphene.Int()
        cod_modelo            = graphene.Int()
        cod_cond              = graphene.Int()
        cod_unidad            = graphene.Int()
        monto                 = graphene.Float()
        nro_serie             = graphene.String()
        fec_adqui             = graphene.Date()
        organismo_financiador = graphene.Int()
        cod_rube              = graphene.String()
        nro_convenio          = graphene.String()
    activo = graphene.Field(InActivoType)
    def mutate(root, info, nro_activo, descripcion=None, cod_estado=None,
               cod_grupo=None, cod_marca=None, cod_modelo=None, cod_cond=None,
               cod_unidad=None, monto=None, nro_serie=None, fec_adqui=None,
               organismo_financiador=None, cod_rube=None, nro_convenio=None):
        obj = in_activo.objects.get(pk=nro_activo)
        
        if obj.estado_registro == 'APROBADO':
            if (cod_grupo is not None and cod_grupo != obj.cod_grupo_id) or \
               (cod_marca is not None and cod_marca != obj.cod_marca_id) or \
               (cod_modelo is not None and cod_modelo != obj.cod_modelo_id) or \
               (cod_cond is not None and cod_cond != obj.cod_cond_id) or \
               (cod_unidad is not None and cod_unidad != obj.cod_unidad_id) or \
               (monto is not None and float(monto) != float(obj.monto)) or \
               (fec_adqui is not None and fec_adqui != obj.fec_adqui):
                raise Exception("No se pueden modificar campos contables o estructurales de un activo en estado APROBADO.")

        if descripcion is not None: obj.descripcion = descripcion
        if cod_estado  is not None: obj.cod_estado_id = cod_estado
        if cod_grupo   is not None: obj.cod_grupo_id = cod_grupo
        if cod_marca   is not None: obj.cod_marca_id = cod_marca
        if cod_modelo  is not None: obj.cod_modelo_id = cod_modelo
        if cod_cond    is not None: obj.cod_cond_id = cod_cond
        if cod_unidad  is not None: obj.cod_unidad_id = cod_unidad
        if monto       is not None: obj.monto = monto
        if nro_serie   is not None: obj.nro_serie = nro_serie
        if fec_adqui   is not None: obj.fec_adqui = fec_adqui
        if organismo_financiador is not None: obj.organismo_financiador = organismo_financiador
        if cod_rube is not None: obj.cod_rube = cod_rube
        if nro_convenio is not None: obj.nro_convenio = nro_convenio
        obj.save()
        registrar_log_activo(obj, 'U', 2)
        return EditarActivo(activo=obj)

class DarDeBajaActivo(graphene.Mutation):
    """Baja lógica o eliminación física del activo fijo."""
    class Arguments:
        nro_activo = graphene.Int(required=True)
    activo = graphene.Field(InActivoType)
    def mutate(root, info, nro_activo):
        obj = in_activo.objects.get(pk=nro_activo)
        if obj.estado_registro == 'APROBADO':
            raise Exception("Un activo APROBADO no puede eliminarse ni darse de baja directamente. Debe registrar un acta de baja formal.")
        registrar_log_activo(obj, 'D', 3)
        obj.delete()
        return DarDeBajaActivo(activo=obj)

class AprobarActivo(graphene.Mutation):
    class Arguments:
        nro_activo = graphene.Int(required=True)
    activo = graphene.Field(InActivoType)
    def mutate(root, info, nro_activo):
        obj = in_activo.objects.get(pk=nro_activo)
        obj.estado_registro = 'APROBADO'
        obj.save()
        registrar_log_activo(obj, 'U', 2)
        return AprobarActivo(activo=obj)


class CrearBajaAct(graphene.Mutation):
    class Arguments:
        nro_activo     = graphene.Int(required=True)
        cod_asig       = graphene.Int()
        tipo_per_aut   = graphene.Int(required=True)
        cod_emp_aut    = graphene.Int(required=True)
        documento      = graphene.String()
        fecha_baja_te  = graphene.Date(required=True)
        fecha_baja_ef  = graphene.Date()
        motivo         = graphene.String(required=True)
        observacion    = graphene.String()
        tipo_per_resp  = graphene.Int()
        cod_emp_resp   = graphene.Int()
        valor_final    = graphene.Float()

    baja = graphene.Field(InBajaActType)

    def mutate(root, info, nro_activo, tipo_per_aut, cod_emp_aut, fecha_baja_te, motivo,
               cod_asig=None, documento=None, fecha_baja_ef=None, observacion=None,
               tipo_per_resp=None, cod_emp_resp=None, valor_final=None):
        
        activo_obj = in_activo.objects.get(pk=nro_activo)
        
        if not cod_asig:
            det_asig = in_det_asig.objects.filter(nro_activo=activo_obj).order_by('-cod_asig_id').first()
            cod_asig_val = det_asig.cod_asig_id if det_asig else 0
        else:
            cod_asig_val = cod_asig

        valor_final_dec = None
        if valor_final is not None:
            valor_final_dec = Decimal(str(valor_final))
        else:
            dep_acum = in_dep_acumulada.objects.filter(nro_activo=activo_obj).order_by('-nro_serie').first()
            if dep_acum:
                valor_final_dec = dep_acum.valor_actual
            else:
                valor_final_dec = activo_obj.monto if activo_obj.monto else Decimal('0')

        baja_obj = in_baja_act.objects.create(
            nro_activo=activo_obj,
            cod_asig=cod_asig_val,
            tipo_per_aut=tipo_per_aut,
            cod_emp_aut=cod_emp_aut,
            documento=documento,
            fecha_baja_te=fecha_baja_te,
            fecha_baja_ef=fecha_baja_ef,
            motivo=motivo[:1],
            observacion=observacion,
            tipo_per_resp=tipo_per_resp,
            cod_emp_resp=cod_emp_resp,
            valor_final=valor_final_dec,
            fecha_trans=timezone.now()
        )

        activo_obj.a_b = 'B'
        activo_obj.save()

        # Auditoría log
        in_log_baja_act.objects.create(
            nro=baja_obj.nro,
            cod_asig=baja_obj.cod_asig,
            nro_activo=activo_obj.pk,
            tipo_per_aut=baja_obj.tipo_per_aut,
            cod_emp_aut=baja_obj.cod_emp_aut,
            documento=baja_obj.documento,
            fecha_baja_te=baja_obj.fecha_baja_te,
            motivo=baja_obj.motivo,
            fecha_baja_ef=baja_obj.fecha_baja_ef,
            observacion=baja_obj.observacion,
            tipo_per_resp=baja_obj.tipo_per_resp,
            cod_emp_resp=baja_obj.cod_emp_resp,
            valor_final=baja_obj.valor_final,
            fecha_trans=baja_obj.fecha_trans,
            fecha_proc=timezone.now()
        )

        return CrearBajaAct(baja=baja_obj)


class CrearMotivoBaja(graphene.Mutation):
    class Arguments:
        motivo = graphene.Int(required=True)
        descripcion = graphene.String(required=True)
    
    motivo_obj = graphene.Field(InMotivoType)
    
    def mutate(root, info, motivo, descripcion):
        obj = in_motivo.objects.create(motivo=motivo, descripcion=descripcion)
        return CrearMotivoBaja(motivo_obj=obj)


class EditarMotivoBaja(graphene.Mutation):
    class Arguments:
        motivo = graphene.Int(required=True)
        descripcion = graphene.String(required=True)
    
    motivo_obj = graphene.Field(InMotivoType)
    
    def mutate(root, info, motivo, descripcion):
        obj = in_motivo.objects.get(pk=motivo)
        obj.descripcion = descripcion
        obj.save()
        return EditarMotivoBaja(motivo_obj=obj)


class EliminarMotivoBaja(graphene.Mutation):
    class Arguments:
        motivo = graphene.Int(required=True)
    
    success = graphene.Boolean()
    
    def mutate(root, info, motivo):
        obj = in_motivo.objects.get(pk=motivo)
        obj.delete()
        return EliminarMotivoBaja(success=True)



# ═══════════════════════════════════════════════════════════════
# MUTATIONS — ASIGNACIÓN
# ═══════════════════════════════════════════════════════════════

class CrearAsignacion(graphene.Mutation):
    class Arguments:
        tipo_asig  = graphene.Int(required=True)
        tipo_resp  = graphene.Int(required=True)
        cod_resp   = graphene.Int(required=True)
        cod_ofic   = graphene.Int(required=True)
        fecha_asig = graphene.Date(required=True)
    asignado = graphene.Field(InAsignadoType)
    def mutate(root, info, tipo_asig, tipo_resp, cod_resp, cod_ofic, fecha_asig):
        obj = in_asignado.objects.create(
            tipo_asig_id=tipo_asig, tipo_resp=tipo_resp, cod_resp=cod_resp,
            cod_ofic_id=cod_ofic, fecha_asig=fecha_asig, estado='A'
        )
        in_log_asignado.objects.create(
            cod_asig=obj.cod_asig,
            tipo_asig=obj.tipo_asig_id,
            tipo_resp=obj.tipo_resp,
            cod_resp=obj.cod_resp,
            cod_ofic=obj.cod_ofic_id,
            fecha_asig=obj.fecha_asig,
            fecha_fin=obj.fecha_fin,
            obs='Creación de asignación',
            tipo_trans_ant=0,
            cod_trans_ant=0,
            tipo_trans_act=1,
            cod_trans_act=obj.cod_asig,
            fecha_act=timezone.now(),
            tipo_log='I',
            tipo_inv=0,
            cod_inv=0
        )
        return CrearAsignacion(asignado=obj)

class EditarAsignacion(graphene.Mutation):
    class Arguments:
        cod_asig   = graphene.Int(required=True)
        cod_ofic   = graphene.Int()
        tipo_resp  = graphene.Int()
        cod_resp   = graphene.Int()
        fecha_fin  = graphene.Date()
    asignado = graphene.Field(InAsignadoType)
    def mutate(root, info, cod_asig, cod_ofic=None, tipo_resp=None, cod_resp=None, fecha_fin=None):
        obj = in_asignado.objects.get(pk=cod_asig)
        if cod_ofic  is not None: obj.cod_ofic_id = cod_ofic
        if tipo_resp is not None: obj.tipo_resp = tipo_resp
        if cod_resp  is not None: obj.cod_resp = cod_resp
        if fecha_fin is not None: obj.fecha_fin = fecha_fin
        obj.save()
        in_log_asignado.objects.create(
            cod_asig=obj.cod_asig,
            tipo_asig=obj.tipo_asig_id,
            tipo_resp=obj.tipo_resp,
            cod_resp=obj.cod_resp,
            cod_ofic=obj.cod_ofic_id,
            fecha_asig=obj.fecha_asig,
            fecha_fin=obj.fecha_fin,
            obs='Edición de asignación',
            tipo_trans_ant=1,
            cod_trans_ant=obj.cod_asig,
            tipo_trans_act=2,
            cod_trans_act=obj.cod_asig,
            fecha_act=timezone.now(),
            tipo_log='U',
            tipo_inv=0,
            cod_inv=0
        )
        return EditarAsignacion(asignado=obj)

class AnularAsignacion(graphene.Mutation):
    class Arguments:
        cod_asig  = graphene.Int(required=True)
        fecha_fin = graphene.Date()
    asignado = graphene.Field(InAsignadoType)
    def mutate(root, info, cod_asig, fecha_fin=None):
        obj = in_asignado.objects.get(pk=cod_asig)
        obj.estado = 'B'
        if fecha_fin is not None:
            obj.fecha_fin = fecha_fin
        else:
            obj.fecha_fin = timezone.now().date()
        obj.save()
        in_log_asignado.objects.create(
            cod_asig=obj.cod_asig,
            tipo_asig=obj.tipo_asig_id,
            tipo_resp=obj.tipo_resp,
            cod_resp=obj.cod_resp,
            cod_ofic=obj.cod_ofic_id,
            fecha_asig=obj.fecha_asig,
            fecha_fin=obj.fecha_fin,
            obs='Anulación de asignación',
            tipo_trans_ant=1,
            cod_trans_ant=obj.cod_asig,
            tipo_trans_act=3,
            cod_trans_act=obj.cod_asig,
            fecha_act=timezone.now(),
            tipo_log='D',
            tipo_inv=0,
            cod_inv=0
        )
        return AnularAsignacion(asignado=obj)

class AsignarActivo(graphene.Mutation):
    class Arguments:
        cod_asig   = graphene.Int(required=True)
        nro_activo = graphene.Int(required=True)
        cantidad   = graphene.Int()
    det_asig = graphene.Field(InDetAsigType)
    def mutate(root, info, cod_asig, nro_activo, cantidad=1):
        obj = in_det_asig.objects.create(
            cod_asig_id=cod_asig, nro_activo_id=nro_activo,
            cantidad=cantidad, fecha_trans=timezone.now().date()
        )
        in_log_det_asig.objects.create(
            cod_asig=obj.cod_asig_id,
            nro_activo=obj.nro_activo_id,
            cantidad=obj.cantidad,
            fecha_trans=obj.fecha_trans,
            tipo_trans=1,
            cod_trans=obj.cod_asig_id,
            tipo_trans_act=1,
            cod_trans_act=obj.cod_asig_id,
            fecha_trans_act=timezone.now(),
            tipo_actual='I'
        )
        return AsignarActivo(det_asig=obj)

class EditarDetAsig(graphene.Mutation):
    class Arguments:
        cod_asig   = graphene.Int(required=True)
        nro_activo = graphene.Int(required=True)
        cantidad   = graphene.Int()
        fecha_trans = graphene.Date()
    det_asig = graphene.Field(InDetAsigType)
    def mutate(root, info, cod_asig, nro_activo, cantidad=None, fecha_trans=None):
        obj = in_det_asig.objects.get(cod_asig_id=cod_asig, nro_activo_id=nro_activo)
        if cantidad    is not None: obj.cantidad = cantidad
        if fecha_trans is not None: obj.fecha_trans = fecha_trans
        obj.save()
        in_log_det_asig.objects.create(
            cod_asig=obj.cod_asig_id,
            nro_activo=obj.nro_activo_id,
            cantidad=obj.cantidad,
            fecha_trans=obj.fecha_trans,
            tipo_trans=2,
            cod_trans=obj.cod_asig_id,
            tipo_trans_act=2,
            cod_trans_act=obj.cod_asig_id,
            fecha_trans_act=timezone.now(),
            tipo_actual='U'
        )
        return EditarDetAsig(det_asig=obj)

class AgregarEncargado(graphene.Mutation):
    class Arguments:
        cod_asig  = graphene.Int(required=True)
        tipo_resp = graphene.Int(required=True)
        cod_resp  = graphene.Int(required=True)
        fecha_ini = graphene.Date(required=True)
        fecha_fin = graphene.Date()
    encargado = graphene.Field(InEncargadoType)
    def mutate(root, info, cod_asig, tipo_resp, cod_resp, fecha_ini, fecha_fin=None):
        obj = in_encargado.objects.create(
            cod_asig_id=cod_asig, tipo_resp=tipo_resp,
            cod_resp=cod_resp, fecha_ini=fecha_ini, fecha_fin=fecha_fin
        )
        return AgregarEncargado(encargado=obj)

class CerrarEncargado(graphene.Mutation):
    class Arguments:
        id        = graphene.Int(required=True)
        fecha_fin = graphene.Date(required=True)
    encargado = graphene.Field(InEncargadoType)
    def mutate(root, info, id, fecha_fin):
        obj = in_encargado.objects.get(pk=id)
        obj.fecha_fin = fecha_fin
        obj.save()
        return CerrarEncargado(encargado=obj)
# ═══════════════════════════════════════════════════════════════
# MUTATIONS — REVALUACIÓN Y DEPRECIACIÓN
# ═══════════════════════════════════════════════════════════════

def registrar_log_det_reval(det, tipo_actual, nro_serie_param=None):
    from django.utils import timezone
    serie_val = nro_serie_param if nro_serie_param is not None else 0
    in_log_det_reval.objects.create(
        cod_reval=det.cod_reval_id,
        nro_activo=det.nro_activo_id,
        vida_util_mes=det.vida_util_mes,
        vida_util_ano=det.vida_util_ano,
        tipo_moneda='B',
        costo=det.costo,
        fecha_reval=det.fecha_reval,
        serie_ant=0,
        tipo_trans_ant=0,
        cod_trans_ant=0,
        fecha_trans_ant=det.fecha_reval,
        serie=serie_val,
        estado=det.estado,
        tipo=0,
        tipo_trans_act=0,
        cod_trans_act=det.cod_reval_id,
        fecha_actual=timezone.now(),
        tipo_actual=tipo_actual
    )

class AgregarDetRevalConDepreciacion(graphene.Mutation):
    """
    Registra el detalle de revaluación de un activo y calcula
    automáticamente su depreciación acumulada.
    """
    class Arguments:
        cod_reval     = graphene.Int(required=True)
        nro_activo    = graphene.Int(required=True)
        vida_util_mes = graphene.Int(required=True)
        vida_util_ano = graphene.Int(required=True)
        costo         = graphene.Decimal(required=True)
        fecha_reval   = graphene.Date(required=True)
        nro_serie     = graphene.Int(required=True)

    det_reval    = graphene.Field(InDetRevalType)
    dep_acumulada = graphene.Field(InDepAcumuladaType)

    def mutate(root, info, cod_reval, nro_activo, vida_util_mes,
               vida_util_ano, costo, fecha_reval, nro_serie):
        det = in_det_reval.objects.create(
            cod_reval_id=cod_reval, nro_activo_id=nro_activo,
            vida_util_mes=vida_util_mes, vida_util_ano=vida_util_ano,
            costo=costo, fecha_reval=fecha_reval, estado='A'
        )
        costo_dec = Decimal(str(costo))
        vida_total = (vida_util_ano * 12) + vida_util_mes
        dep_mensual = (costo_dec / Decimal(str(vida_total))) if vida_total > 0 else Decimal('0')

        anterior = in_dep_acumulada.objects.filter(
            nro_activo_id=nro_activo
        ).order_by('-nro_serie').first()
        acum_ant = anterior.acumulada if anterior else Decimal('0')
        nueva_acum = acum_ant + dep_mensual
        valor_actual = costo_dec - nueva_acum

        dep = in_dep_acumulada.objects.create(
            nro_serie=nro_serie, nro_activo_id=nro_activo,
            depresiacion=dep_mensual,
            acumulada=nueva_acum,
            valor_actual=max(valor_actual, Decimal('0')),
            valor_revaluo=costo_dec
        )
        registrar_log_det_reval(det, 'I', nro_serie_param=nro_serie)
        return AgregarDetRevalConDepreciacion(det_reval=det, dep_acumulada=dep)

class EditarDetReval(graphene.Mutation):
    class Arguments:
        cod_reval  = graphene.Int(required=True)
        nro_activo = graphene.Int(required=True)
        estado     = graphene.String()
    det_reval = graphene.Field(InDetRevalType)
    def mutate(root, info, cod_reval, nro_activo, estado=None):
        obj = in_det_reval.objects.get(cod_reval_id=cod_reval, nro_activo_id=nro_activo)
        if estado is not None: obj.estado = estado
        obj.save()
        registrar_log_det_reval(obj, 'U', nro_serie_param=0)
        return EditarDetReval(det_reval=obj)

class AnularDetReval(graphene.Mutation):
    class Arguments:
        cod_reval  = graphene.Int(required=True)
        nro_activo = graphene.Int(required=True)
    det_reval = graphene.Field(InDetRevalType)
    def mutate(root, info, cod_reval, nro_activo):
        obj = in_det_reval.objects.get(cod_reval_id=cod_reval, nro_activo_id=nro_activo)
        obj.estado = 'B'
        obj.save()
        registrar_log_det_reval(obj, 'D', nro_serie_param=0)
        return AnularDetReval(det_reval=obj)

class CalcularDepreciacionMasiva(graphene.Mutation):
    """
    Calcula y registra la depreciación mensual de TODOS los activos activos
    que tienen grupo con vida útil definida.
    Devuelve la cantidad de activos procesados y una lista de errores.
    """
    class Arguments:
        gestion     = graphene.Int(required=True)   # año de la gestión
        periodo     = graphene.Int(required=True)   # mes (1-12)

    procesados  = graphene.Int()
    omitidos    = graphene.Int()
    errores     = graphene.List(graphene.String)

    def mutate(root, info, gestion, periodo):
        import datetime
        import calendar

        if periodo < 1 or periodo > 12:
            raise Exception("El periodo debe estar entre 1 y 12")

        # Fecha de fin de período
        final_day = calendar.monthrange(gestion, periodo)[1]
        fecha_fin = datetime.date(gestion, periodo, final_day)

        # UFV al fin del período
        tasa_f = in_tasa_rev.objects.filter(fecha__lte=fecha_fin).order_by('-fecha').first()
        ufv_f = Decimal(str(tasa_f.ufv)) if tasa_f else None

        activos = in_activo.objects.filter(a_b='A', estado_registro='APROBADO').select_related('cod_grupo')
        procesados = 0
        omitidos   = 0
        errores    = []

        nro_serie = gestion * 100 + periodo

        for activo in activos:
            try:
                det_grp = activo.cod_grupo.in_det_grp_set.first()
                if not det_grp or not det_grp.vida_util_ano or det_grp.vida_util_ano <= 0:
                    omitidos += 1
                    continue

                costo_orig = activo.monto
                if costo_orig is None or costo_orig <= 0:
                    omitidos += 1
                    continue

                # Verificar si ya existe depreciación para este período
                ya_existe = in_dep_acumulada.objects.filter(
                    nro_activo_id=activo.pk,
                    nro_serie=nro_serie
                ).exists()
                if ya_existe:
                    omitidos += 1
                    continue

                # Obtener la última depreciación
                anterior = in_dep_acumulada.objects.filter(
                    nro_activo_id=activo.pk
                ).order_by('-nro_serie').first()

                # Determinar fecha inicial y tasa UFV inicial
                ufv_i = None
                if anterior:
                    prev_y = anterior.nro_serie // 100
                    prev_m = anterior.nro_serie % 100
                    prev_final_day = calendar.monthrange(prev_y, prev_m)[1]
                    fecha_ini = datetime.date(prev_y, prev_m, prev_final_day)
                else:
                    fecha_ini = activo.fec_adqui

                if fecha_ini:
                    tasa_i = in_tasa_rev.objects.filter(fecha__lte=fecha_ini).order_by('-fecha').first()
                    ufv_i = Decimal(str(tasa_i.ufv)) if tasa_i else None

                # Factor de actualización
                factor = Decimal('1.0')
                if ufv_f and ufv_i:
                    factor = ufv_f / ufv_i

                # Costo y depreciación acumulada anteriores actualizados
                costo_ant = Decimal(str(anterior.valor_revaluo if anterior else costo_orig))
                costo_act = costo_ant * factor

                acum_ant = Decimal(str(anterior.acumulada if anterior else '0'))
                acum_ant_act = acum_ant * factor

                # Calcular depreciación de este mes
                vida_total_meses = (det_grp.vida_util_ano * 12) + (det_grp.vida_util_mes or 0)
                dep_mensual = costo_act / Decimal(str(vida_total_meses))

                # Ajustar depreciación mensual para no sobrepasar el costo actualizado
                limite_dep = costo_act - acum_ant_act
                dep_mensual = max(Decimal('0'), min(dep_mensual, limite_dep))

                nueva_acum = acum_ant_act + dep_mensual
                valor_actual = max(costo_act - nueva_acum, Decimal('0'))

                in_dep_acumulada.objects.create(
                    nro_serie=nro_serie,
                    nro_activo_id=activo.pk,
                    depresiacion=round(dep_mensual, 2),
                    acumulada=round(nueva_acum, 2),
                    valor_actual=round(valor_actual, 2),
                    valor_revaluo=round(costo_act, 2)
                )
                procesados += 1

            except Exception as e:
                errores.append(f"Activo {activo.cod_activo}: {str(e)}")

        return CalcularDepreciacionMasiva(
            procesados=procesados,
            omitidos=omitidos,
            errores=errores
        )


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — ATRIBUTOS
# ═══════════════════════════════════════════════════════════════

class CrearAtributo(graphene.Mutation):
    class Arguments:
        cod_grupo = graphene.Int(required=True)
        des       = graphene.String(required=True)
    atributo = graphene.Field(InAtributoType)
    def mutate(root, info, cod_grupo, des):
        obj = in_atributo.objects.create(cod_grupo_id=cod_grupo, des=des, a_b='A')
        return CrearAtributo(atributo=obj)

class EditarAtributo(graphene.Mutation):
    class Arguments:
        cod_atrib = graphene.Int(required=True)
        des       = graphene.String()
    atributo = graphene.Field(InAtributoType)
    def mutate(root, info, cod_atrib, des=None):
        obj = in_atributo.objects.get(pk=cod_atrib)
        if des is not None: obj.des = des
        obj.save()
        return EditarAtributo(atributo=obj)

class DarDeBajaAtributo(graphene.Mutation):
    class Arguments:
        cod_atrib = graphene.Int(required=True)
    atributo = graphene.Field(InAtributoType)
    def mutate(root, info, cod_atrib):
        obj = in_atributo.objects.get(pk=cod_atrib)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaAtributo(atributo=obj)

class CrearDetAtrib(graphene.Mutation):
    class Arguments:
        cod_atrib  = graphene.Int(required=True)
        nro_atrib  = graphene.String(required=True)
        des        = graphene.String(required=True)
    det_atrib = graphene.Field(InDetAtribType)
    def mutate(root, info, cod_atrib, nro_atrib, des):
        obj = in_det_atrib.objects.create(
            cod_atrib_id=cod_atrib, nro_atrib=nro_atrib, des=des, a_b='A'
        )
        return CrearDetAtrib(det_atrib=obj)

class EditarDetAtrib(graphene.Mutation):
    class Arguments:
        cod_det_atrib = graphene.Int(required=True)
        des           = graphene.String()
        nro_atrib     = graphene.String()
    det_atrib = graphene.Field(InDetAtribType)
    def mutate(root, info, cod_det_atrib, des=None, nro_atrib=None):
        obj = in_det_atrib.objects.get(pk=cod_det_atrib)
        if des       is not None: obj.des = des
        if nro_atrib is not None: obj.nro_atrib = nro_atrib
        obj.save()
        return EditarDetAtrib(det_atrib=obj)

class DarDeBajaDetAtrib(graphene.Mutation):
    class Arguments:
        cod_det_atrib = graphene.Int(required=True)
    det_atrib = graphene.Field(InDetAtribType)
    def mutate(root, info, cod_det_atrib):
        obj = in_det_atrib.objects.get(pk=cod_det_atrib)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaDetAtrib(det_atrib=obj)

class AsignarAtribActivo(graphene.Mutation):
    class Arguments:
        cod_det_atrib = graphene.Int(required=True)
        nro_activo    = graphene.Int(required=True)
        ok            = graphene.String()
        valor         = graphene.String()
        unidad        = graphene.Int()
    atrib_activo = graphene.Field(InAtribActivoType)
    def mutate(root, info, cod_det_atrib, nro_activo, ok='S', valor='', unidad=0):
        obj, _ = in_atrib_activo.objects.get_or_create(
            cod_det_atrib_id=cod_det_atrib,
            nro_activo_id=nro_activo,
            defaults={'ok': ok, 'valor': valor, 'unidad': unidad}
        )
        return AsignarAtribActivo(atrib_activo=obj)

class EditarAtribActivo(graphene.Mutation):
    class Arguments:
        cod_det_atrib = graphene.Int(required=True)
        nro_activo    = graphene.Int(required=True)
        ok            = graphene.String()
        valor         = graphene.String()
        unidad        = graphene.Int()
    atrib_activo = graphene.Field(InAtribActivoType)
    def mutate(root, info, cod_det_atrib, nro_activo, ok=None, valor=None, unidad=None):
        obj = in_atrib_activo.objects.get(cod_det_atrib_id=cod_det_atrib, nro_activo_id=nro_activo)
        if ok     is not None: obj.ok = ok
        if valor  is not None: obj.valor = valor
        if unidad is not None: obj.unidad = unidad
        obj.save()
        return EditarAtribActivo(atrib_activo=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — PARTES Y GRUPOS
# ═══════════════════════════════════════════════════════════════

class AsignarParteAGrupo(graphene.Mutation):
    class Arguments:
        cod_parte = graphene.Int(required=True)
        cod_grupo = graphene.Int(required=True)
    parte_grupo = graphene.Field(InParteGrupoType)
    def mutate(root, info, cod_parte, cod_grupo):
        obj, _ = in_parte_grupo.objects.get_or_create(
            cod_parte_id=cod_parte, cod_grupo_id=cod_grupo
        )
        return AsignarParteAGrupo(parte_grupo=obj)

class AgregarModGrp(graphene.Mutation):
    class Arguments:
        cod_grupo  = graphene.Int(required=True)
        cod_modelo = graphene.Int(required=True)
        cod_marca  = graphene.Int(required=True)
    mod_grp = graphene.Field(InModGrpType)
    def mutate(root, info, cod_grupo, cod_modelo, cod_marca):
        obj, _ = in_mod_grp.objects.get_or_create(
            cod_grupo_id=cod_grupo, cod_modelo_id=cod_modelo,
            cod_marca_id=cod_marca, defaults={'a_b': 'A'}
        )
        return AgregarModGrp(mod_grp=obj)

class DarDeBajaModGrp(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    mod_grp = graphene.Field(InModGrpType)
    def mutate(root, info, id):
        obj = in_mod_grp.objects.get(pk=id)
        obj.a_b = 'B'
        obj.save()
        return DarDeBajaModGrp(mod_grp=obj)

class CrearDetGrp(graphene.Mutation):
    class Arguments:
        cod_grupo      = graphene.Int(required=True)
        vida_util_mes  = graphene.Int(required=True)
        vida_util_ano  = graphene.Int(required=True)
        cuenta_cont    = graphene.Int()
        cuenta_presup  = graphene.Int()
    det_grp = graphene.Field(InDetGrpType)
    def mutate(root, info, cod_grupo, vida_util_mes, vida_util_ano, cuenta_cont=0, cuenta_presup=0):
        obj = in_det_grp.objects.create(
            cod_grupo_id=cod_grupo, vida_util_mes=vida_util_mes,
            vida_util_ano=vida_util_ano, cuenta_cont=cuenta_cont, cuenta_presup=cuenta_presup
        )
        return CrearDetGrp(det_grp=obj)

class EditarDetGrp(graphene.Mutation):
    class Arguments:
        id             = graphene.Int(required=True)
        vida_util_mes  = graphene.Int()
        vida_util_ano  = graphene.Int()
        cuenta_cont    = graphene.Int()
        cuenta_presup  = graphene.Int()
    det_grp = graphene.Field(InDetGrpType)
    def mutate(root, info, id, vida_util_mes=None, vida_util_ano=None, cuenta_cont=None, cuenta_presup=None):
        obj = in_det_grp.objects.get(pk=id)
        if vida_util_mes  is not None: obj.vida_util_mes = vida_util_mes
        if vida_util_ano  is not None: obj.vida_util_ano = vida_util_ano
        if cuenta_cont    is not None: obj.cuenta_cont = cuenta_cont
        if cuenta_presup  is not None: obj.cuenta_presup = cuenta_presup
        obj.save()
        return EditarDetGrp(det_grp=obj)

class AgregarDetParte(graphene.Mutation):
    class Arguments:
        nro_activo = graphene.Int(required=True)
        cod_parte  = graphene.Int(required=True)
        cod_marca  = graphene.Int(required=True)
        cod_modelo = graphene.Int(required=True)
        nro_serie  = graphene.String()
        cantidad   = graphene.Int()
        cod_estado = graphene.Int(required=True)
    det_parte = graphene.Field(InDetParteType)
    def mutate(root, info, nro_activo, cod_parte, cod_marca, cod_modelo,
               cod_estado, nro_serie=None, cantidad=1):
        obj = in_det_parte.objects.create(
            nro_activo_id=nro_activo, cod_parte_id=cod_parte,
            cod_marca_id=cod_marca, cod_modelo_id=cod_modelo,
            nro_serie=nro_serie, cantidad=cantidad, cod_estado_id=cod_estado
        )
        return AgregarDetParte(det_parte=obj)

class EditarDetParte(graphene.Mutation):
    class Arguments:
        id         = graphene.Int(required=True)
        cod_estado = graphene.Int()
        nro_serie  = graphene.String()
        cantidad   = graphene.Int()
    det_parte = graphene.Field(InDetParteType)
    def mutate(root, info, id, cod_estado=None, nro_serie=None, cantidad=None):
        obj = in_det_parte.objects.get(pk=id)
        if cod_estado is not None: obj.cod_estado_id = cod_estado
        if nro_serie  is not None: obj.nro_serie = nro_serie
        if cantidad   is not None: obj.cantidad = cantidad
        obj.save()
        return EditarDetParte(det_parte=obj)


# ═══════════════════════════════════════════════════════════════
# MUTATIONS — TRANSFERENCIAS
# ═══════════════════════════════════════════════════════════════

class CrearTransferencia(graphene.Mutation):
    class Arguments:
        tipo_transf  = graphene.String(required=True)
        cod_asig_or  = graphene.Int()
        cod_asig_de  = graphene.Int()
        cod_ofi_rem  = graphene.Int(required=True)
        cod_ofi_dest = graphene.Int(required=True)
        fecha_transf = graphene.Date(required=True)
    transferido = graphene.Field(InTransferidoType)
    def mutate(root, info, tipo_transf, cod_ofi_rem, cod_ofi_dest, fecha_transf,
               cod_asig_or=None, cod_asig_de=None):
        obj = in_transferido.objects.create(
            tipo_transf=tipo_transf, cod_asig_or=cod_asig_or, cod_asig_de=cod_asig_de,
            cod_ofi_rem_id=cod_ofi_rem, cod_ofi_dest_id=cod_ofi_dest,
            fecha_transf=fecha_transf, estado='P'
        )
        return CrearTransferencia(transferido=obj)

class EditarTransferencia(graphene.Mutation):
    class Arguments:
        cod_transf   = graphene.Int(required=True)
        estado       = graphene.String()
        cod_ofi_dest = graphene.Int()
    transferido = graphene.Field(InTransferidoType)
    def mutate(root, info, cod_transf, estado=None, cod_ofi_dest=None):
        obj = in_transferido.objects.get(pk=cod_transf)
        if estado       is not None: obj.estado = estado
        if cod_ofi_dest is not None: obj.cod_ofi_dest_id = cod_ofi_dest
        obj.save()
        return EditarTransferencia(transferido=obj)

class AnularTransferencia(graphene.Mutation):
    class Arguments:
        cod_transf = graphene.Int(required=True)
    transferido = graphene.Field(InTransferidoType)
    def mutate(root, info, cod_transf):
        obj = in_transferido.objects.get(pk=cod_transf)
        obj.estado = 'B'
        obj.save()
        return AnularTransferencia(transferido=obj)

class AgregarActivoTransferencia(graphene.Mutation):
    class Arguments:
        cod_transf = graphene.Int(required=True)
        nro_activo = graphene.Int(required=True)
        cantidad   = graphene.Int()
    det_tranf = graphene.Field(InDetTranfType)
    def mutate(root, info, cod_transf, nro_activo, cantidad=1):
        obj = in_det_tranf.objects.create(
            cod_transf_id=cod_transf,
            nro_activo_id=nro_activo,
            cantidad=cantidad,
            tipo_trans=0,
            cod_trans=0,
            fecha_trans=timezone.now().date()
        )
        return AgregarActivoTransferencia(det_tranf=obj)

class EditarDetTranf(graphene.Mutation):
    class Arguments:
        id       = graphene.Int(required=True)
        cantidad = graphene.Int(required=True)
    det_tranf = graphene.Field(InDetTranfType)
    def mutate(root, info, id, cantidad):
        obj = in_det_tranf.objects.get(pk=id)
        obj.cantidad = cantidad
        obj.save()
        return EditarDetTranf(det_tranf=obj)


# ── Authentication and RBAC Mutations ───────────────────────────

class ObtenerPreconfiguracion2FA(graphene.Mutation):
    """Genera o recupera la clave secreta y la URL del código QR para configurar 2FA."""
    secret = graphene.String()
    qr_uri = graphene.String(name="qrUri")
    
    def mutate(self, info):
        from .auth_helper import get_authenticated_user
        user = get_authenticated_user(info)
        if not user:
            raise Exception("Usuario no autenticado")
        
        import pyotp
        if not user.otp_secret:
            user.otp_secret = pyotp.random_base32()
            user.save()
        
        totp = pyotp.TOTP(user.otp_secret)
        qr_uri = totp.provisioning_uri(name=user.correo, issuer_name="ActivoFijo")
        
        return ObtenerPreconfiguracion2FA(secret=user.otp_secret, qr_uri=qr_uri)


class Activar2FA(graphene.Mutation):
    """Verifica el código de prueba y activa formalmente el doble factor."""
    class Arguments:
        code = graphene.String(required=True)
        
    success = graphene.Boolean()
    
    def mutate(self, info, code):
        from .auth_helper import get_authenticated_user
        user = get_authenticated_user(info)
        if not user:
            raise Exception("Usuario no autenticado")
        
        if not user.otp_secret:
            raise Exception("Debe solicitar preconfiguración de 2FA primero")
        
        import pyotp
        totp = pyotp.TOTP(user.otp_secret)
        if not totp.verify(code):
            raise Exception("Código de verificación incorrecto")
        
        user.two_factor_enabled = True
        user.save()
        return Activar2FA(success=True)


class Desactivar2FA(graphene.Mutation):
    """Desactiva el doble factor de autenticación."""
    success = graphene.Boolean()
    
    def mutate(self, info):
        from .auth_helper import get_authenticated_user
        user = get_authenticated_user(info)
        if not user:
            raise Exception("Usuario no autenticado")
        
        user.two_factor_enabled = False
        user.otp_secret = None
        user.save()
        return Desactivar2FA(success=True)


class TokenAuth(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        captcha = graphene.String(required=True)

    token = graphene.String()
    payload = graphene.String()
    refresh_expires_in = graphene.Int(name="refreshExpiresIn")
    requires2fa = graphene.Boolean(name="requires2fa")
    temp_token = graphene.String(name="tempToken")
    user_email = graphene.String(name="userEmail")

    def mutate(self, info, username, password, captcha):
        try:
            user = in_usuario.objects.get(correo=username, estado='ACTIVO')
        except in_usuario.DoesNotExist:
            raise Exception("Credenciales incorrectas o usuario inactivo")

        if not user.check_password(password):
            raise Exception("Credenciales incorrectas")

        from .auth_helper import generate_token

        if user.two_factor_enabled:
            # Si no tiene secret, lo generamos para la prueba
            if not user.otp_secret:
                import pyotp
                user.otp_secret = pyotp.random_base32()
                user.save()
            
            temp_token_str = generate_token(user)
            return TokenAuth(
                token=None,
                payload="{}",
                refresh_expires_in=3600,
                requires2fa=True,
                temp_token=temp_token_str,
                user_email=user.correo
            )

        token_str = generate_token(user)
        info.context.jwt_cookie_to_set = token_str
        return TokenAuth(
            token=token_str,
            payload="{}",
            refresh_expires_in=3600,
            requires2fa=False,
            temp_token=None,
            user_email=user.correo
        )
class Logout(graphene.Mutation):
    success = graphene.Boolean()

    def mutate(self, info):
        info.context.jwt_cookie_to_delete = True
        return Logout(success=True)

class VerifyOtp(graphene.Mutation):
    class Arguments:
        temp_token = graphene.String(required=True, name="tempToken")
        code = graphene.String(required=True)

    token = graphene.String()
    user_email = graphene.String(name="userEmail")

    def mutate(self, info, temp_token, code):
        from .auth_helper import get_user_from_token, generate_token
        user_id = get_user_from_token(temp_token)
        if not user_id:
            raise Exception("Token temporal inválido o expirado")

        try:
            user = in_usuario.objects.get(pk=user_id, estado='ACTIVO')
        except in_usuario.DoesNotExist:
            raise Exception("Usuario no encontrado o inactivo")

        if not user.otp_secret:
            raise Exception("El doble factor no está configurado para este usuario")

        import pyotp
        totp = pyotp.TOTP(user.otp_secret)
        if not totp.verify(code):
            raise Exception("Código de verificación incorrecto")

        token_str = generate_token(user)
        info.context.jwt_cookie_to_set = token_str
        return VerifyOtp(
            token=token_str,
            user_email=user.correo
        )



class RegistrarEmpleadoUsuario(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        numero_documento = graphene.String(required=True, name="numeroDocumento")
        tipo_documento = graphene.String(required=True, name="tipoDocumento")
        fecha_ingreso = graphene.Date(required=True, name="fechaIngreso")
        salario = graphene.Decimal(required=True)
        correo = graphene.String(required=True)
        contrasena = graphene.String(required=True)
        procedencia = graphene.String()

    usuario = graphene.Field(InUsuarioType)

    def mutate(self, info, nombre, apellido, numero_documento, tipo_documento, fecha_ingreso, salario, correo, contrasena, procedencia=None):
        if in_usuario.objects.filter(correo=correo).exists():
            raise Exception("El correo ya se encuentra registrado")
        if in_empleado.objects.filter(numero_documento=numero_documento).exists():
            raise Exception("El número de documento ya está registrado")

        emp = in_empleado.objects.create(
            nombre=nombre,
            apellido=apellido,
            numero_documento=numero_documento,
            tipo_documento=tipo_documento,
            fecha_ingreso=fecha_ingreso,
            salario=salario,
            procedencia=procedencia
        )

        usr = in_usuario.objects.create(
            correo=correo,
            id_empleado=emp,
            estado='ACTIVO'
        )
        usr.set_password(contrasena)
        usr.save()
        return RegistrarEmpleadoUsuario(usuario=usr)


class CrearRol(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()

    rol = graphene.Field(InRolType)

    def mutate(self, info, nombre, descripcion=None):
        obj = in_rol.objects.create(nombre=nombre, descripcion=descripcion)
        return CrearRol(rol=obj)


class EditarRol(graphene.Mutation):
    class Arguments:
        id_rol = graphene.Int(required=True, name="idRol")
        nombre = graphene.String()
        descripcion = graphene.String()

    rol = graphene.Field(InRolType)

    def mutate(self, info, id_rol, nombre=None, descripcion=None):
        obj = in_rol.objects.get(pk=id_rol)
        if nombre is not None:
            obj.nombre = nombre
        if descripcion is not None:
            obj.descripcion = descripcion
        obj.save()
        return EditarRol(rol=obj)


class CrearPermiso(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    permiso = graphene.Field(InPermisoType)

    def mutate(self, info, nombre):
        obj = in_permiso.objects.create(nombre=nombre)
        return CrearPermiso(permiso=obj)


class EditarPermiso(graphene.Mutation):
    class Arguments:
        id_permiso = graphene.Int(required=True, name="idPermiso")
        nombre = graphene.String()

    permiso = graphene.Field(InPermisoType)

    def mutate(self, info, id_permiso, nombre=None):
        obj = in_permiso.objects.get(pk=id_permiso)
        if nombre is not None:
            obj.nombre = nombre
        obj.save()
        return EditarPermiso(permiso=obj)


class AsignarRolPermiso(graphene.Mutation):
    class Arguments:
        id_rol = graphene.Int(required=True, name="idRol")
        id_permiso = graphene.Int(required=True, name="idPermiso")
        descripcion = graphene.String()
        estado = graphene.Boolean()

    rol_permiso = graphene.Field(InRolPermisoType)

    def mutate(self, info, id_rol, id_permiso, descripcion=None, estado=True):
        obj, created = in_rol_permiso.objects.update_or_create(
            id_rol_id=id_rol,
            id_permiso_id=id_permiso,
            defaults={'descripcion': descripcion, 'estado': estado}
        )
        return AsignarRolPermiso(rol_permiso=obj)


class CrearEmpleado(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        numero_documento = graphene.String(required=True, name="numeroDocumento")
        tipo_documento = graphene.String(required=True, name="tipoDocumento")
        fecha_ingreso = graphene.Date(required=True, name="fechaIngreso")
        salario = graphene.Decimal(required=True)
        telefono = graphene.String()
        cargo = graphene.String()
        foto = graphene.String()
        fecha_nacimiento = graphene.Date(name="fechaNacimiento")
        id_empleado_jefe = graphene.Int(name="idEmpleadoJefe")

    empleado = graphene.Field(InEmpleadoType)

    def mutate(self, info, nombre, apellido, numero_documento, tipo_documento, fecha_ingreso, salario,
               telefono=None, cargo=None, foto=None, fecha_nacimiento=None, id_empleado_jefe=None):
        obj = in_empleado.objects.create(
            nombre=nombre,
            apellido=apellido,
            numero_documento=numero_documento,
            tipo_documento=tipo_documento,
            fecha_ingreso=fecha_ingreso,
            salario=salario,
            telefono=telefono,
            cargo=cargo,
            foto=foto,
            fecha_nacimiento=fecha_nacimiento,
            id_empleado_jefe_id=id_empleado_jefe
        )
        return CrearEmpleado(empleado=obj)


class EditarEmpleado(graphene.Mutation):
    class Arguments:
        id_empleado = graphene.Int(required=True, name="idEmpleado")
        nombre = graphene.String()
        apellido = graphene.String()
        numero_documento = graphene.String(name="numeroDocumento")
        tipo_documento = graphene.String(name="tipoDocumento")
        fecha_ingreso = graphene.Date(name="fechaIngreso")
        salario = graphene.Decimal()
        telefono = graphene.String()
        cargo = graphene.String()
        foto = graphene.String()
        fecha_nacimiento = graphene.Date(name="fechaNacimiento")
        id_empleado_jefe = graphene.Int(name="idEmpleadoJefe")

    empleado = graphene.Field(InEmpleadoType)

    def mutate(self, info, id_empleado, nombre=None, apellido=None, numero_documento=None, tipo_documento=None,
               fecha_ingreso=None, salario=None, telefono=None, cargo=None, foto=None, fecha_nacimiento=None, id_empleado_jefe=None):
        obj = in_empleado.objects.get(pk=id_empleado)
        if nombre is not None: obj.nombre = nombre
        if apellido is not None: obj.apellido = apellido
        if numero_documento is not None: obj.numero_documento = numero_documento
        if tipo_documento is not None: obj.tipo_documento = tipo_documento
        if fecha_ingreso is not None: obj.fecha_ingreso = fecha_ingreso
        if salario is not None: obj.salario = salario
        if telefono is not None: obj.telefono = telefono
        if cargo is not None: obj.cargo = cargo
        if foto is not None: obj.foto = foto
        if fecha_nacimiento is not None: obj.fecha_nacimiento = fecha_nacimiento
        if id_empleado_jefe is not None: obj.id_empleado_jefe_id = id_empleado_jefe
        obj.save()
        return EditarEmpleado(empleado=obj)


class CrearUsuario(graphene.Mutation):
    class Arguments:
        correo = graphene.String(required=True)
        contrasena = graphene.String(required=True)
        id_empleado = graphene.Int(required=True, name="idEmpleado")
        estado = graphene.String()

    usuario = graphene.Field(InUsuarioType)

    def mutate(self, info, correo, contrasena, id_empleado, estado='ACTIVO'):
        obj = in_usuario.objects.create(
            correo=correo,
            id_empleado_id=id_empleado,
            estado=estado
        )
        obj.set_password(contrasena)
        obj.save()
        return CrearUsuario(usuario=obj)


class EditarUsuario(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.Int(required=True, name="idUsuario")
        correo = graphene.String()
        contrasena = graphene.String()
        estado = graphene.String()

    usuario = graphene.Field(InUsuarioType)

    def mutate(self, info, id_usuario, correo=None, contrasena=None, estado=None):
        obj = in_usuario.objects.get(pk=id_usuario)
        if correo is not None: obj.correo = correo
        if contrasena is not None: obj.set_password(contrasena)
        if estado is not None: obj.estado = estado
        obj.save()
        return EditarUsuario(usuario=obj)


class AsignarRolPermisoUsuario(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.Int(required=True, name="idUsuario")
        id_rol = graphene.Int(required=True, name="idRol")
        id_permiso = graphene.Int(required=True, name="idPermiso")
        estado = graphene.Boolean()

    rol_permiso_usuario = graphene.Field(InRolPermisoUsuarioType)

    def mutate(self, info, id_usuario, id_rol, id_permiso, estado=True):
        obj, created = in_rol_permiso_usuario.objects.update_or_create(
            id_usuario_id=id_usuario,
            id_rol_id=id_rol,
            id_permiso_id=id_permiso,
            defaults={'estado': estado}
        )
        return AsignarRolPermisoUsuario(rol_permiso_usuario=obj)


class GuardarVehiculo(graphene.Mutation):
    class Arguments:
        nro_activo = graphene.Int(required=True)
        tipo = graphene.String()
        marca = graphene.String()
        modelo = graphene.String()
        anio = graphene.Int()
        color = graphene.String()
        placa = graphene.String()
        motor = graphene.String()
        chasis = graphene.String()
        cilindrada = graphene.Int()
        industria = graphene.String()
        ruat = graphene.String()
        carnet_prop = graphene.String()
        poliza = graphene.String()
        factura = graphene.Int()
        res_min = graphene.String()
        res_adm = graphene.String()
        inf_tec = graphene.String()
        ley_estado = graphene.String()
        ds = graphene.String()
        doc_transf = graphene.String()
        doc_comp_ven = graphene.String()
        minuta = graphene.String()
        acta_co_ve = graphene.String()
        imagen = graphene.String()

    vehiculo = graphene.Field(InVehicType)

    def mutate(root, info, nro_activo, **kwargs):
        obj, created = in_vehic.objects.update_or_create(
            nro_activo_id=nro_activo,
            defaults=kwargs
        )
        return GuardarVehiculo(vehiculo=obj)


class GuardarTasaRev(graphene.Mutation):
    class Arguments:
        nro = graphene.Int()
        fecha = graphene.Date(required=True)
        ufv = graphene.Float(required=True)

    tasa_rev = graphene.Field(InTasaRevType)

    def mutate(root, info, fecha, ufv, nro=None):
        if nro:
            obj = in_tasa_rev.objects.get(pk=nro)
            obj.fecha = fecha
            obj.ufv = Decimal(str(ufv))
            obj.save()
        else:
            obj, created = in_tasa_rev.objects.update_or_create(
                fecha=fecha,
                defaults={'ufv': Decimal(str(ufv))}
            )
        return GuardarTasaRev(tasa_rev=obj)



# ═══════════════════════════════════════════════════════════════
# MUTATION ROOT
# ═══════════════════════════════════════════════════════════════

class Mutation(graphene.ObjectType):

    # ── Catálogos ───────────────────────────────────────────────
    crear_estado         = CrearEstado.Field()
    editar_estado        = EditarEstado.Field()
    crear_condicion      = CrearCondicion.Field()
    editar_condicion     = EditarCondicion.Field()
    crear_unidad         = CrearUnidad.Field()
    editar_unidad        = EditarUnidad.Field()
    crear_tipo_asig      = CrearTipoAsig.Field()
    editar_tipo_asig     = EditarTipoAsig.Field()
    crear_tipomat        = CrearTipomat.Field()
    editar_tipomat       = EditarTipomat.Field()
    crear_tipo           = CrearTipo.Field()
    editar_tipo          = EditarTipo.Field()
    dar_de_baja_tipo     = DarDeBajaTipo.Field()
    crear_marca          = CrearMarca.Field()
    editar_marca         = EditarMarca.Field()
    crear_modelo         = CrearModelo.Field()
    editar_modelo        = EditarModelo.Field()
    crear_gestion        = CrearGestion.Field()
    editar_gestion       = EditarGestion.Field()
    dar_de_baja_gestion  = DarDeBajaGestion.Field()
    crear_parte          = CrearParte.Field()
    editar_parte         = EditarParte.Field()
    dar_de_baja_parte    = DarDeBajaParte.Field()
    crear_revaluo        = CrearRevaluo.Field()
    editar_revaluo       = EditarRevaluo.Field()
    anular_revaluo       = AnularRevaluo.Field()
    crear_funcion_adm    = CrearFuncionAdm.Field()
    editar_funcion_adm   = EditarFuncionAdm.Field()

    # ── Jerarquías ──────────────────────────────────────────────
    crear_grupo          = CrearGrupo.Field()
    editar_grupo         = EditarGrupo.Field()
    dar_de_baja_grupo    = DarDeBajaGrupo.Field()
    crear_oficina        = CrearOficina.Field()
    editar_oficina       = EditarOficina.Field()
    dar_de_baja_oficina  = DarDeBajaOficina.Field()

    # ── Proveedor y contacto ────────────────────────────────────
    crear_provedor       = CrearProvedor.Field()
    editar_provedor      = EditarProvedor.Field()
    crear_contacto       = CrearContacto.Field()
    editar_contacto      = EditarContacto.Field()

    # ── Responsables ────────────────────────────────────────────
    crear_responsable        = CrearResponsable.Field()
    editar_responsable       = EditarResponsable.Field()
    dar_de_baja_responsable  = DarDeBajaResponsable.Field()

    # ── Compras ─────────────────────────────────────────────────
    crear_solicitud      = CrearSolicitud.Field()
    editar_solicitud     = EditarSolicitud.Field()
    anular_solicitud     = AnularSolicitud.Field()
    aprobar_solicitud    = AprobarSolicitud.Field()
    rechazar_solicitud   = RechazarSolicitud.Field()
    agregar_det_sol      = AgregarDetSol.Field()
    editar_det_sol       = EditarDetSol.Field()
    crear_oferta         = CrearOferta.Field()
    editar_oferta        = EditarOferta.Field()
    anular_oferta        = AnularOferta.Field()
    agregar_det_ofer     = AgregarDetOfer.Field()
    editar_det_ofer      = EditarDetOfer.Field()
    crear_orden_compra   = CrearOrdenCompra.Field()
    editar_orden_compra  = EditarOrdenCompra.Field()
    anular_orden_compra  = AnularOrdenCompra.Field()

    # ── Ingreso ─────────────────────────────────────────────────
    crear_ingreso        = CrearIngreso.Field()
    editar_ingreso       = EditarIngreso.Field()
    anular_ingreso       = AnularIngreso.Field()

    # ── Activo Fijo ─────────────────────────────────────────────
    crear_activo         = CrearActivo.Field()
    editar_activo        = EditarActivo.Field()
    dar_de_baja_activo   = DarDeBajaActivo.Field()
    aprobar_activo       = AprobarActivo.Field()
    crear_baja_act       = CrearBajaAct.Field()
    crear_motivo_baja    = CrearMotivoBaja.Field()
    editar_motivo_baja   = EditarMotivoBaja.Field()
    eliminar_motivo_baja = EliminarMotivoBaja.Field()
    guardar_vehiculo     = GuardarVehiculo.Field()
    guardar_tasa_rev     = GuardarTasaRev.Field()

    # ── Asignación ──────────────────────────────────────────────
    crear_asignacion     = CrearAsignacion.Field()
    editar_asignacion    = EditarAsignacion.Field()
    anular_asignacion    = AnularAsignacion.Field()
    asignar_activo       = AsignarActivo.Field()
    editar_det_asig      = EditarDetAsig.Field()
    agregar_encargado    = AgregarEncargado.Field()
    cerrar_encargado     = CerrarEncargado.Field()

    # ── Revaluación y depreciación ──────────────────────────────
    agregar_det_reval_con_depreciacion = AgregarDetRevalConDepreciacion.Field()
    editar_det_reval                   = EditarDetReval.Field()
    anular_det_reval                   = AnularDetReval.Field()
    calcular_depreciacion_masiva       = CalcularDepreciacionMasiva.Field()

    # ── Atributos ───────────────────────────────────────────────
    crear_atributo           = CrearAtributo.Field()
    editar_atributo          = EditarAtributo.Field()
    dar_de_baja_atributo     = DarDeBajaAtributo.Field()
    crear_det_atrib          = CrearDetAtrib.Field()
    editar_det_atrib         = EditarDetAtrib.Field()
    dar_de_baja_det_atrib    = DarDeBajaDetAtrib.Field()
    asignar_atrib_activo     = AsignarAtribActivo.Field()
    editar_atrib_activo      = EditarAtribActivo.Field()

    # ── Partes y grupos ─────────────────────────────────────────
    asignar_parte_a_grupo    = AsignarParteAGrupo.Field()
    agregar_mod_grp          = AgregarModGrp.Field()
    dar_de_baja_mod_grp      = DarDeBajaModGrp.Field()
    crear_det_grp            = CrearDetGrp.Field()
    editar_det_grp           = EditarDetGrp.Field()
    agregar_det_parte        = AgregarDetParte.Field()
    editar_det_parte         = EditarDetParte.Field()

    # ── Transferencias ──────────────────────────────────────────
    crear_transferencia          = CrearTransferencia.Field()
    editar_transferencia         = EditarTransferencia.Field()
    anular_transferencia         = AnularTransferencia.Field()
    agregar_activo_transferencia = AgregarActivoTransferencia.Field()
    editar_det_tranf             = EditarDetTranf.Field()

    # ── Authentication and RBAC ─────────────────────────────────
    token_auth                   = TokenAuth.Field()
    verify_otp                   = VerifyOtp.Field()
    logout                       = Logout.Field()
    obtener_preconfiguracion_2fa = ObtenerPreconfiguracion2FA.Field()
    # 2FA

    activar_2fa                  = Activar2FA.Field()
    desactivar_2fa               = Desactivar2FA.Field()
    registrar_empleado_usuario   = RegistrarEmpleadoUsuario.Field()
    crear_rol                    = CrearRol.Field()
    editar_rol                   = EditarRol.Field()
    crear_permiso                = CrearPermiso.Field()
    editar_permiso               = EditarPermiso.Field()
    asignar_rol_permiso          = AsignarRolPermiso.Field()
    crear_empleado               = CrearEmpleado.Field()
    editar_empleado              = EditarEmpleado.Field()
    crear_usuario                = CrearUsuario.Field()
    editar_usuario               = EditarUsuario.Field()
    asignar_rol_permiso_usuario  = AsignarRolPermisoUsuario.Field()