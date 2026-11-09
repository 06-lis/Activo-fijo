"""
Genera datos de PRUEBA para ver el Dashboard con información.
Todo lo que crea lleva la marca DEMO y se puede borrar después.

Crear:   python manage.py shell -c "exec(open(r'D:\\activos fijos\\generar_datos_dashboard.py', encoding='utf-8').read())"
Borrar:  set DEMO=borrar
         (y el mismo comando de arriba)
"""
import os
import random
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction

from activo.models.activo import in_activo
from activo.models.asignacion import in_asignado, in_det_asig
from activo.models.bajas import in_baja_act
from activo.models.catalogos import in_estado, in_gestion, in_tipo_asig
from activo.models.ingreso import in_ingreso
from activo.models.jerarquias import in_grupo, in_oficina

MARCA_ASIG = 999999   # cod_resp que identifica las asignaciones DEMO
PREFIJO = 'DEMO-'
TIPO_DEMO = 99        # tipo de asignación que se crea si el catálogo está vacío
random.seed(7)

# Grupos nivel 1 que se usan en la prueba: (palabra clave, peso, rango de monto en Bs.)
PERFIL = [
    ('mueble',       4, (300, 6000)),
    ('equipos de of', 5, (1500, 15000)),
    ('maquinar',     1, (20000, 90000)),
    ('transporte',   2, (60000, 180000)),
    ('medico',       1, (8000, 60000)),
    ('médico',       1, (8000, 60000)),
    ('comunic',      2, (500, 9000)),
    ('educac',       1, (400, 8000)),
    ('otros equipos', 1, (500, 12000)),
]


def borrar():
    demo = in_activo.objects.filter(cod_activo__startswith=PREFIJO)
    in_baja_act.objects.filter(nro_activo__in=demo).delete()
    in_det_asig.objects.filter(nro_activo__in=demo).delete()
    n = demo.count()
    demo.delete()
    usadas = set(in_det_asig.objects.values_list('cod_asig_id', flat=True))
    in_asignado.objects.filter(cod_resp=MARCA_ASIG).exclude(cod_asig__in=usadas).delete()
    for t in in_tipo_asig.objects.filter(tipo_asig=TIPO_DEMO, des__startswith='DEMO'):
        if not in_asignado.objects.filter(tipo_asig=t).exists():
            t.delete()
    print(f'Datos DEMO borrados: {n} activos (y sus asignaciones y bajas).')


def hojas_oficina():
    todos = list(in_oficina.objects.all())
    niveles = [x.nivel for x in todos if x.nivel is not None]
    if not niveles:
        return todos
    mx = max(niveles)
    return [x for x in todos if x.nivel == mx]


def grupos_de_prueba():
    """Devuelve [(grupo_hoja, peso, rango_monto)] usando hojas de los grupos de nivel 1 elegidos."""
    todos = {g.cod_grupo: g for g in in_grupo.objects.all()}
    con_hijos = {g.cod_padre_id for g in todos.values() if g.cod_padre_id}

    def raiz(g):
        for _ in range(10):
            if g.cod_padre_id is None or g.cod_padre_id not in todos:
                return g
            g = todos[g.cod_padre_id]
        return g

    elegidos = []
    for g in todos.values():
        if g.cod_grupo in con_hijos:
            continue  # solo hojas (sin subgrupos)
        nombre = (raiz(g).des_grupo or '').lower()
        for clave, peso, rango in PERFIL:
            if clave in nombre:
                elegidos.append((g, peso, rango))
                break
    if not elegidos:  # plan B: cualquier hoja
        elegidos = [(g, 1, (500, 10000)) for g in todos.values() if g.cod_grupo not in con_hijos]
    return elegidos


def crear():
    borrar()  # así se puede ejecutar varias veces sin duplicar

    gestion = in_gestion.objects.order_by('-cod_gest').first()
    ingreso = in_ingreso.objects.order_by('nro_ingreso').first()
    tipo_asig = in_tipo_asig.objects.first() or in_tipo_asig.objects.create(
        tipo_asig=TIPO_DEMO, des='DEMO - Asignación a oficina', abrev='DEMO')
    estados = list(in_estado.objects.all())
    grupos = grupos_de_prueba()
    oficinas = hojas_oficina()
    plantilla = in_activo.objects.exclude(cod_activo__startswith=PREFIJO).first()

    faltan = [n for n, v in [('gestión', gestion), ('ingreso', ingreso), ('tipo de asignación', tipo_asig),
                             ('estados', estados), ('grupos', grupos), ('oficinas', oficinas)] if not v]
    if faltan:
        print('No se puede generar: faltan datos base de ' + ', '.join(faltan))
        return

    en_uso = [e for e in estados if 'uso' in e.des_estado.lower()]
    en_alm = [e for e in estados if 'almac' in e.des_estado.lower()]
    pool = (en_uso * 3 + en_alm * 2) or estados

    TOTAL, BAJAS = 24, 2
    pesos = [p for _, p, _ in grupos]
    por_oficina = {}
    creados = []
    hoy = date.today()

    with transaction.atomic():
        for i in range(1, TOTAL + 1):
            es_baja = i > TOTAL - BAJAS
            grupo, _, (lo, hi) = random.choices(grupos, weights=pesos, k=1)[0]
            a = in_activo.objects.create(
                cod_gest=gestion,
                cod_activo=f'{PREFIJO}{i:03d}',
                cod_grupo=grupo,
                cod_unidad=getattr(plantilla, 'cod_unidad', None),
                cod_marca=getattr(plantilla, 'cod_marca', None),
                cod_modelo=getattr(plantilla, 'cod_modelo', None),
                cod_prove=getattr(plantilla, 'cod_prove', None),
                cod_cond=getattr(plantilla, 'cod_cond', None),
                cod_estado=random.choice(pool),
                nro_ingreso=ingreso,
                descripcion=f'[DEMO] {grupo.des_grupo or "Bien"}',
                monto=Decimal(random.randrange(lo, hi, 50)),
                fec_adqui=hoy - timedelta(days=random.randint(30, 1000)),
                nro_serie=f'DEMO{i:05d}',
                estado_registro='APROBADO',
                a_b='B' if es_baja else 'A',
            )
            creados.append(a)
            por_oficina.setdefault(random.choice(oficinas).cod_ofic, []).append(a)

        asig_de = {}
        for cod_ofic, lista in por_oficina.items():
            asig = in_asignado.objects.create(
                tipo_asig=tipo_asig, tipo_resp=1, cod_resp=MARCA_ASIG,
                cod_ofic_id=cod_ofic, fecha_asig=hoy, estado='A',
            )
            for a in lista:
                in_det_asig.objects.create(cod_asig=asig, nro_activo=a, cantidad=1, fecha_trans=hoy)
                asig_de[a.nro_activo] = asig.cod_asig

        for a in creados:
            if a.a_b == 'B':
                in_baja_act.objects.create(
                    cod_asig=asig_de[a.nro_activo], nro_activo=a,
                    tipo_per_aut=1, cod_emp_aut=1, documento='DEMO',
                    fecha_baja_te=hoy, motivo='1', valor_final=a.monto,
                    observacion='Baja de prueba (DEMO)',
                )

    print(f'Listo: {TOTAL - BAJAS} activos aprobados + {BAJAS} bajas de prueba, '
          f'repartidos en {len(por_oficina)} oficinas y {len(set(a.cod_grupo_id for a in creados))} grupos.')
    print('Recarga el Dashboard (botón ACTUALIZAR).')


if os.environ.get('DEMO', '').lower() == 'borrar':
    borrar()
else:
    crear()
