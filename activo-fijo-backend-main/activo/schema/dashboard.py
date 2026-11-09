"""
HU-LEG-NEW-02 - Dashboard Ejecutivo: query de agregación.
Archivo nuevo: activo/schema/dashboard.py
"""
from datetime import date

import graphene
from django.db.models import Count, Sum

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


class DashboardResumenType(graphene.ObjectType):
    total_activos = graphene.Int()
    valor_total = graphene.Float()
    en_uso = graphene.Int()
    en_almacen = graphene.Int()
    otros_estados = graphene.Int()
    bajas_gestion = graphene.Int()
    gestion = graphene.Int()
    por_grupo = graphene.List(DashboardItemType)
    por_facultad = graphene.List(DashboardItemType)
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


def resolver_dashboard_resumen(root, info):
    # Solo activos aprobados y no dados de baja (regla del PDF)
    activos = in_activo.objects.filter(estado_registro='APROBADO').exclude(a_b='B')

    total = activos.count()
    valor = activos.aggregate(s=Sum('monto'))['s'] or 0

    # ── Estado administrativo: en uso vs. almacén ──
    en_uso = en_almacen = 0
    for fila in activos.values('cod_estado__des_estado').annotate(n=Count('nro_activo')):
        nombre = (fila['cod_estado__des_estado'] or '').lower()
        if 'uso' in nombre:
            en_uso += fila['n']
        elif 'almac' in nombre:
            en_almacen += fila['n']

    # ── Bajas de la gestión actual ──
    anio = date.today().year
    bajas = in_baja_act.objects.filter(fecha_baja_te__year=anio).count()

    # ── Gráfico 1: por grupo contable (nivel 1 de la jerarquía) ──
    grupos = {
        g.cod_grupo: (g.des_grupo or g.cod_hijo, g.cod_padre_id, g.nivel)
        for g in in_grupo.objects.all()
    }
    por_grupo = {}
    for fila in activos.values('cod_grupo').annotate(n=Count('nro_activo'), m=Sum('monto')):
        raiz = _ancestro(grupos, fila['cod_grupo'], 1)
        nombre = grupos.get(raiz, ('Sin grupo',))[0]
        acum = por_grupo.setdefault(nombre, [0, 0.0])
        acum[0] += fila['n']
        acum[1] += float(fila['m'] or 0)
    lista_grupo = [
        DashboardItemType(etiqueta=k, cantidad=v[0], monto=v[1])
        for k, v in sorted(por_grupo.items(), key=lambda x: -x[1][0])
    ]

    # ── Gráfico 2: por facultad (nivel 2 de la jerarquía de oficinas) ──
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
    lista_fac = [
        DashboardItemType(etiqueta=k, cantidad=v, monto=0)
        for k, v in sorted(por_fac.items(), key=lambda x: -x[1])
    ]
    if total - con_oficina > 0:
        lista_fac.append(DashboardItemType(etiqueta='Sin asignar', cantidad=total - con_oficina, monto=0))

    # ── Actividad reciente: últimos 5 ingresos y transferencias ──
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
        por_grupo=lista_grupo,
        por_facultad=lista_fac,
        actividad_reciente=eventos[:5],
    )
