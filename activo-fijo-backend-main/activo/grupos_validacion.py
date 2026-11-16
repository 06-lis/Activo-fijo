from django.db.models import Q
from .models import in_activo

GRUPOS_VEHICULO = {'4', 'E'}
GRUPOS_INMUEBLE = {'A', 'B'}   # agrega 'C' si Infraestructura también cuenta


def grupo_raiz(grupo):
    while grupo.cod_padre_id is not None:
        grupo = grupo.cod_padre
    return grupo


def validar_activo(nro_activo, codigos, nombre):
    try:
        activo = in_activo.objects.select_related('cod_grupo').get(pk=nro_activo)
    except in_activo.DoesNotExist:
        raise Exception("El activo no existe.")
    raiz = grupo_raiz(activo.cod_grupo)
    if raiz.cod_hijo not in codigos:
        raise Exception(
            f"El activo {activo.cod_activo} pertenece al grupo "
            f"'{(raiz.des_grupo or '').strip()}' y no puede registrarse como {nombre}."
        )


def filtro_por_raiz(codigos, campo='nro_activo__cod_grupo'):
    """Q para filtrar por la raiz del grupo (hasta 3 niveles)."""
    n2 = campo + '__cod_padre'
    n3 = n2 + '__cod_padre'
    return (
        Q(**{campo + '__cod_padre__isnull': True, campo + '__cod_hijo__in': codigos}) |
        Q(**{n2 + '__cod_padre__isnull': True, n2 + '__cod_hijo__in': codigos}) |
        Q(**{n3 + '__cod_padre__isnull': True, n3 + '__cod_hijo__in': codigos})
    )