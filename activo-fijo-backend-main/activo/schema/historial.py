"""
Historial de movimientos de un activo: ingreso, asignaciones y transferencias.
Archivo nuevo: activo/schema/historial.py

Responde: quién tiene el activo ahora, quién lo tenía antes y todo lo que le pasó.
"""
import graphene
from graphql import GraphQLError

from ..models.activo import in_activo
from ..models.asignacion import in_asignado, in_det_asig
from ..models.compras import in_responsable
from ..models.rbac import in_empleado
from ..models.transferencia import in_det_tranf


class HistorialMovimientoType(graphene.ObjectType):
    fecha = graphene.String()
    tipo = graphene.String()
    responsable = graphene.String()
    oficina = graphene.String()
    detalle = graphene.String()


class HistorialActivoType(graphene.ObjectType):
    custodio_actual = graphene.String()
    oficina_actual = graphene.String()
    desde_actual = graphene.String()
    custodio_anterior = graphene.String()
    oficina_anterior = graphene.String()
    movimientos = graphene.List(HistorialMovimientoType)


def _fecha(f):
    return str(f) if f else ''


def _nombres_responsables(ids):
    """{cod_resp: '[programa] Nombre Apellido'} para los responsables pedidos.
    Busca solo la relación con in_empleado, así no depende del nombre exacto del campo."""
    ids = {i for i in ids if i is not None}
    if not ids:
        return {}
    campo_emp = next(
        (f for f in in_responsable._meta.get_fields()
         if getattr(f, 'many_to_one', False) and f.related_model is in_empleado),
        None,
    )
    consulta = in_responsable.objects.filter(pk__in=ids)
    if campo_emp:
        consulta = consulta.select_related(campo_emp.name)
    nombres = {}
    for r in consulta:
        emp = getattr(r, campo_emp.name) if campo_emp else None
        texto = f'{emp.nombre} {emp.apellido}' if emp else f'Responsable #{r.pk}'
        programa = getattr(r, 'cod_estprog', None)
        nombres[r.pk] = f'[{programa}] {texto}' if programa else texto
    return nombres


def resolver_historial_activo(root, info, nro_activo):
    try:
        activo = in_activo.objects.select_related('nro_ingreso').get(pk=nro_activo)
    except in_activo.DoesNotExist:
        raise GraphQLError('No existe el activo pedido.')

    # Asignaciones del activo, de la más vieja a la más nueva
    detalles = in_det_asig.objects.filter(nro_activo=nro_activo).select_related('cod_asig__cod_ofic')
    asignaciones = sorted(
        (d.cod_asig for d in detalles),
        key=lambda a: (a.fecha_asig, a.cod_asig),
    )

    transferencias = list(
        in_det_tranf.objects
        .filter(nro_activo=nro_activo)
        .select_related('cod_transf__cod_ofi_rem', 'cod_transf__cod_ofi_dest')
    )

    # Asignaciones de origen y destino de cada transferencia (vienen como números sueltos)
    ids_extra = set()
    for t in transferencias:
        ids_extra.update(i for i in (t.cod_transf.cod_asig_or, t.cod_transf.cod_asig_de) if i)
    por_id = {a.cod_asig: a for a in asignaciones}
    faltan = ids_extra - set(por_id)
    if faltan:
        por_id.update({a.cod_asig: a for a in in_asignado.objects.filter(pk__in=faltan)})

    nombres = _nombres_responsables({a.cod_resp for a in por_id.values()})

    def quien(asig):
        if asig is None:
            return ''
        return nombres.get(asig.cod_resp, f'Responsable #{asig.cod_resp}')

    # ── Línea de tiempo ──
    eventos = []
    ingreso = activo.nro_ingreso
    eventos.append({
        'fecha': _fecha(getattr(ingreso, 'fecha_recep', None)),
        'tipo': 'Ingreso',
        'responsable': '',
        'oficina': '',
        'detalle': f'Ingreso #{ingreso.nro_ingreso}' + (
            f' · {ingreso.glosa}' if getattr(ingreso, 'glosa', None) else ''
        ),
    })

    for a in asignaciones:
        oficina = a.cod_ofic.des_dpto if a.cod_ofic else ''
        eventos.append({
            'fecha': _fecha(a.fecha_asig),
            'tipo': 'Asignación',
            'responsable': quien(a),
            'oficina': oficina,
            'detalle': f'Asignación #{a.cod_asig}' + (' · vigente' if a.estado == 'A' else ''),
        })
        if a.fecha_fin:
            eventos.append({
                'fecha': _fecha(a.fecha_fin),
                'tipo': 'Fin de asignación',
                'responsable': quien(a),
                'oficina': oficina,
                'detalle': f'Asignación #{a.cod_asig} cerrada',
            })

    for t in transferencias:
        tr = t.cod_transf
        de = quien(por_id.get(tr.cod_asig_or))
        para = quien(por_id.get(tr.cod_asig_de))
        origen = tr.cod_ofi_rem.des_dpto
        destino = tr.cod_ofi_dest.des_dpto
        eventos.append({
            'fecha': _fecha(tr.fecha_transf),
            'tipo': 'Transferencia',
            'responsable': f'{de} → {para}' if (de and para) else (de or para),
            'oficina': f'{origen} → {destino}',
            'detalle': f'Transferencia #{tr.cod_transf}',
        })

    # Lo más reciente primero
    eventos.sort(key=lambda e: e['fecha'], reverse=True)

    # ── Quién lo tiene ahora y quién lo tenía antes ──
    vigentes = [a for a in asignaciones if a.estado == 'A']
    actual = vigentes[-1] if vigentes else None
    if actual is not None:
        posicion = asignaciones.index(actual)
        anterior = asignaciones[posicion - 1] if posicion > 0 else None
    else:
        anterior = asignaciones[-1] if asignaciones else None

    def oficina_de(asig):
        return asig.cod_ofic.des_dpto if asig and asig.cod_ofic else ''

    return HistorialActivoType(
        custodio_actual=quien(actual) if actual else 'Sin custodio asignado',
        oficina_actual=oficina_de(actual),
        desde_actual=_fecha(actual.fecha_asig) if actual else '',
        custodio_anterior=quien(anterior),
        oficina_anterior=oficina_de(anterior),
        movimientos=[HistorialMovimientoType(**e) for e in eventos],
    )
