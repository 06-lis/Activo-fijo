"""
Dashboard Ejecutivo: query de agregacion (Activos Fijos).
Archivo: activo/schema/dashboard.py

Entrega todos los campos que pide DashboardEjecutivo.tsx (v3, con pestanas).
"""
from datetime import date

import graphene
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth

from ..models import (
    in_activo, in_baja_act, in_asignado, in_det_asig,
    in_grupo, in_oficina, in_ingreso, in_transferido,
)


class DashboardItemType(graphene.ObjectType):
    etiqueta = graphene.String()
    cantidad = graphene.Int()
    monto = graphene.Float()


class DashboardActividadType(graphene.ObjectType):
    tipo = graphene.String()
    referencia = graphene.String()
    detalle = graphene.String()
    fecha = graphene.String()


class DashboardMesType(graphene.ObjectType):
    mes = graphene.String()
    ingresos = graphene.Int()
    transferencias = graphene.Int()
    bajas = graphene.Int()


class DashboardResumenType(graphene.ObjectType):
    total_activos = graphene.Int()
    valor_total = graphene.Float()
    en_uso = graphene.Int()
    en_almacen = graphene.Int()
    otros_estados = graphene.Int()
    bajas_gestion = graphene.Int()
    gestion = graphene.Int()
    sin_asignar = graphene.Int()
    pendientes_aprobacion = graphene.Int()
    por_grupo = graphene.List(DashboardItemType)
    por_facultad = graphene.List(DashboardItemType)
    por_estado = graphene.List(DashboardItemType)
    por_condicion = graphene.List(DashboardItemType)
    por_antiguedad = graphene.List(DashboardItemType)
    top_custodios = graphene.List(DashboardItemType)
    por_mes = graphene.List(DashboardMesType)
    actividad_reciente = graphene.List(DashboardActividadType)


def _ancestro(mapa, pk, nivel_objetivo):
    """Sube por cod_padre hasta encontrar el nivel pedido.
    mapa = {pk: (nombre, padre_id, nivel)}. Si no lo encuentra, devuelve el propio pk."""
    actual = pk
    for _ in range(10):  # tope por si hubiera un ciclo en los datos
        if actual not in mapa:
            break
        nombre, padre, nivel = mapa[actual]
        if nivel == nivel_objetivo or padre is None:
            return actual
        actual = padre
    return pk


def _ultimos_meses(n=12):
    """Lista de 'AAAA-MM' de los ultimos n meses, del mas antiguo al actual."""
    hoy = date.today()
    y, m = hoy.year, hoy.month
    salida = []
    for _ in range(n):
        salida.append(f"{y}-{m:02d}")
        m -= 1
        if m == 0:
            y -= 1
            m = 12
    return salida[::-1]


def _conteo_por_mes(queryset, campo, desde):
    """{'AAAA-MM': cantidad} de un queryset agrupado por mes del campo de fecha."""
    filas = (
        queryset.filter(**{f'{campo}__gte': desde})
        .annotate(_mes=TruncMonth(campo))
        .values('_mes')
        .annotate(n=Count('pk'))
    )
    resultado = {}
    for fila in filas:
        if fila['_mes'] is not None:
            resultado[fila['_mes'].strftime('%Y-%m')] = fila['n']
    return resultado


def _nombres_custodios(pks):
    """Intenta resolver el nombre del responsable; si no puede, devuelve {}."""
    nombres = {}
    try:
        from ..models.compras import in_responsable
        from ..models.rbac import in_empleado

        def texto(emp):
            partes = []
            for campo in ('nombre', 'nombres', 'apellido', 'apellidos',
                          'ap_pat', 'ap_paterno', 'ap_mat', 'ap_materno'):
                valor = getattr(emp, campo, None)
                if valor:
                    partes.append(str(valor).strip())
            return ' '.join(partes) or str(emp)

        for r in in_responsable.objects.filter(pk__in=pks):
            emp = getattr(r, 'cod_emp', None)
            if emp is not None and not hasattr(emp, 'pk'):
                emp = in_empleado.objects.filter(pk=emp).first()
            if emp is not None:
                nombres[r.pk] = texto(emp)
        faltan = [p for p in pks if p not in nombres]
        for e in in_empleado.objects.filter(pk__in=faltan):
            nombres[e.pk] = texto(e)
    except Exception:
        pass
    return nombres


def resolver_dashboard_resumen(root, info):
    hoy = date.today()
    anio = hoy.year

    # Solo activos aprobados y no dados de baja
    activos = in_activo.objects.filter(estado_registro='APROBADO').exclude(a_b='B')

    total = activos.count()
    valor = activos.aggregate(s=Sum('monto'))['s'] or 0

    # Registros que esperan aprobacion
    pendientes = (
        in_activo.objects.exclude(estado_registro='APROBADO').exclude(a_b='B').count()
    )

    # -- Estados: en uso / almacen / otros, y grafico por estado --
    en_uso = en_almacen = 0
    lista_estado = []
    for fila in (
        activos.values('cod_estado__des_estado')
        .annotate(n=Count('nro_activo'))
        .order_by('-n')
    ):
        etiqueta = fila['cod_estado__des_estado'] or 'Sin estado'
        nombre = etiqueta.lower()
        if 'uso' in nombre or 'activo' in nombre:
            en_uso += fila['n']
        elif 'almac' in nombre:
            en_almacen += fila['n']
        lista_estado.append(DashboardItemType(etiqueta=etiqueta, cantidad=fila['n'], monto=0))

    # -- Condicion fisica --
    lista_cond = [
        DashboardItemType(
            etiqueta=fila['cod_cond__des_cond'] or 'Sin condición',
            cantidad=fila['n'], monto=0,
        )
        for fila in (
            activos.values('cod_cond__des_cond')
            .annotate(n=Count('nro_activo'))
            .order_by('-n')
        )
    ]

    # -- Antiguedad (segun fecha de adquisicion) --
    cubos = {
        'Menos de 1 año': 0, '1 a 3 años': 0, '3 a 5 años': 0,
        'Más de 5 años': 0, 'Sin fecha': 0,
    }
    for f in activos.values_list('fec_adqui', flat=True):
        if f is None:
            cubos['Sin fecha'] += 1
            continue
        años = (hoy - f).days / 365.25
        if años < 1:
            cubos['Menos de 1 año'] += 1
        elif años < 3:
            cubos['1 a 3 años'] += 1
        elif años < 5:
            cubos['3 a 5 años'] += 1
        else:
            cubos['Más de 5 años'] += 1
    lista_antig = [
        DashboardItemType(etiqueta=k, cantidad=v, monto=0) for k, v in cubos.items()
    ]

    # -- Bajas de la gestion actual --
    bajas = in_baja_act.objects.filter(fecha_baja_te__year=anio).count()

    # -- Por grupo contable (nivel 1) --
    grupos = {
        g.cod_grupo: (g.des_grupo or g.cod_hijo, g.cod_padre_id, g.nivel)
        for g in in_grupo.objects.all()
    }
    por_grupo = {}
    for fila in activos.values('cod_grupo').annotate(n=Count('nro_activo'), m=Sum('monto')):
        raiz = _ancestro(grupos, fila['cod_grupo'], 1)
        nombre = grupos.get(raiz, ('Sin grupo',))[0].strip()
        acum = por_grupo.setdefault(nombre, [0, 0.0])
        acum[0] += fila['n']
        acum[1] += float(fila['m'] or 0)
    lista_grupo = [
        DashboardItemType(etiqueta=k, cantidad=v[0], monto=v[1])
        for k, v in sorted(por_grupo.items(), key=lambda x: -x[1][0])
    ]

    # -- Por facultad (nivel 2 de oficinas) y sin asignar --
    oficinas = {
        o.cod_ofic: (o.des_dpto, o.cod_padre_id, o.nivel)
        for o in in_oficina.objects.all()
    }
    asignados = (
        in_det_asig.objects
        .filter(cod_asig__estado='A', nro_activo__in=activos)
        .values('cod_asig__cod_ofic')
        .annotate(n=Count('nro_activo', distinct=True))
    )
    por_fac = {}
    con_oficina = 0
    for fila in asignados:
        fac = _ancestro(oficinas, fila['cod_asig__cod_ofic'], 2)
        nombre = oficinas.get(fac, ('Sin oficina',))[0]
        por_fac[nombre] = por_fac.get(nombre, 0) + fila['n']
        con_oficina += fila['n']
    sin_asignar = max(total - con_oficina, 0)
    lista_fac = [
        DashboardItemType(etiqueta=k, cantidad=v, monto=0)
        for k, v in sorted(por_fac.items(), key=lambda x: -x[1])
    ]
    if sin_asignar > 0:
        lista_fac.append(DashboardItemType(etiqueta='Sin asignar', cantidad=sin_asignar, monto=0))

    # -- Top 5 custodios (responsables con mas activos asignados) --
    filas_cust = list(
        in_det_asig.objects
        .filter(cod_asig__estado='A', nro_activo__in=activos)
        .values('cod_asig__cod_resp')
        .annotate(n=Count('nro_activo', distinct=True), m=Sum('nro_activo__monto'))
        .order_by('-n')[:5]
    )
    nombres = _nombres_custodios([f['cod_asig__cod_resp'] for f in filas_cust])
    lista_cust = [
        DashboardItemType(
            etiqueta=nombres.get(f['cod_asig__cod_resp'], f"Responsable {f['cod_asig__cod_resp']}"),
            cantidad=f['n'], monto=float(f['m'] or 0),
        )
        for f in filas_cust
    ]

    # -- Movimientos por mes (ultimos 12 meses) --
    meses = _ultimos_meses(12)
    y0, m0 = meses[0].split('-')
    desde = date(int(y0), int(m0), 1)
    ing = _conteo_por_mes(in_ingreso.objects.all(), 'fecha_recep', desde)
    tra = _conteo_por_mes(in_transferido.objects.all(), 'fecha_transf', desde)
    baj = _conteo_por_mes(in_baja_act.objects.all(), 'fecha_baja_te', desde)
    lista_mes = [
        DashboardMesType(
            mes=m, ingresos=ing.get(m, 0),
            transferencias=tra.get(m, 0), bajas=baj.get(m, 0),
        )
        for m in meses
    ]

    # -- Actividad reciente: ultimos 5 ingresos y transferencias --
    eventos = []
    for i in in_ingreso.objects.order_by('-nro_ingreso')[:5]:
        eventos.append(DashboardActividadType(
            tipo='Ingreso',
            referencia=f'Ingreso #{i.nro_ingreso}',
            detalle=i.glosa or i.acta_recep or '',
            fecha=str(i.fecha_recep) if i.fecha_recep else '',
        ))
    for t in in_transferido.objects.select_related('cod_ofi_rem', 'cod_ofi_dest').order_by('-cod_transf')[:5]:
        eventos.append(DashboardActividadType(
            tipo='Transferencia',
            referencia=f'Transferencia #{t.cod_transf}',
            detalle=f'{t.cod_ofi_rem.des_dpto} → {t.cod_ofi_dest.des_dpto}',
            fecha=str(t.fecha_transf) if t.fecha_transf else '',
        ))
    eventos.sort(key=lambda e: e.fecha, reverse=True)

    return DashboardResumenType(
        total_activos=total,
        valor_total=float(valor),
        en_uso=en_uso,
        en_almacen=en_almacen,
        otros_estados=total - en_uso - en_almacen,
        bajas_gestion=bajas,
        gestion=anio,
        sin_asignar=sin_asignar,
        pendientes_aprobacion=pendientes,
        por_grupo=lista_grupo,
        por_facultad=lista_fac,
        por_estado=lista_estado,
        por_condicion=lista_cond,
        por_antiguedad=lista_antig,
        top_custodios=lista_cust,
        por_mes=lista_mes,
        actividad_reciente=eventos[:5],
    )
