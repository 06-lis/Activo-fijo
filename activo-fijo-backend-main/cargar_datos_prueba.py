"""
Carga datos de prueba para el sistema de Activos Fijos.
Todos los activos llevan el codigo PRB-0001, PRB-0002, ... para poder borrarlos despues.

Ejecutar desde D:\\Activo-fijo\\activo-fijo-backend-main:
    python manage.py shell -c "exec(open('cargar_datos_prueba.py', encoding='utf-8').read())"

Se puede correr varias veces: no duplica catalogos ni activos que ya existen.
"""


def _cargar():
    import random
    from datetime import date, timedelta
    from decimal import Decimal
    from django.db.models import Max

    from activo.models.catalogos import (
        in_estado, in_condicion, in_unidad, in_tipo_asig,
        in_marca, in_modelo,
    )
    from activo.models.jerarquias import in_grupo, in_oficina
    from activo.models.rbac import in_empleado
    from activo.models.proveedor import in_provedor
    from activo.models.compras import in_responsable
    from activo.models.ingreso import in_ingreso
    from activo.models.activo import in_activo
    from activo.models.asignacion import in_asignado, in_det_asig, in_encargado
    from activo.models.bajas import in_motivo, in_baja_act
    from activo.models.vehiculo import in_vehic
    from activo.models.inmueble import in_inmueble

    rnd = random.Random(26)
    HOY = date.today()

    # ------------------------------------------------------------------
    # Utilidad: busca un registro de catalogo por nombre; si no existe lo crea
    # (usa el primer numero libre cuando la clave no es autoincremental)
    # ------------------------------------------------------------------
    def cat(model, campo, nombre, **extra):
        obj = model.objects.filter(**{campo: nombre}).first()
        if obj:
            return obj
        pk = model._meta.pk
        datos = {campo: nombre, **extra}
        if pk.get_internal_type() not in ('AutoField', 'BigAutoField'):
            n = 1
            while model.objects.filter(**{pk.name: n}).exists():
                n += 1
            datos[pk.name] = n
        return model.objects.create(**datos)

    # ------------------------------------------------------------------
    # 1. CATALOGOS
    # ------------------------------------------------------------------
    for nombre in ('En Tránsito', 'En Préstamo'):
        cat(in_estado, 'des_estado', nombre)
    for nombre in ('Obsoleto', 'Para reparación'):
        cat(in_condicion, 'des_cond', nombre)
    for nombre, ab in (('Kit', 'KIT'), ('Metro Lineal', 'ML'), ('Vehículo', 'VEH')):
        cat(in_unidad, 'des_unidad', nombre, abrev=ab)

    cat(in_tipo_asig, 'des', 'Asignación a oficina', abrev='OFIC')
    tipo_func = cat(in_tipo_asig, 'des', 'Asignación a funcionario', abrev='FUNC')
    cat(in_tipo_asig, 'des', 'Asignación temporal', abrev='TEMP')

    motivos = [cat(in_motivo, 'descripcion', d) for d in (
        'Obsolescencia', 'Deterioro irreparable', 'Robo o pérdida',
        'Siniestro', 'Donación', 'Transferencia definitiva')]

    MODELOS = {
        'HP': ['ProBook 450', 'LaserJet Pro M404', 'EliteDesk 800'],
        'Dell': ['Latitude 5420', 'OptiPlex 3080', 'Inspiron 15'],
        'Samsung': ['Monitor 24 pulgadas', 'Galaxy Tab A8'],
        'Epson': ['L3150', 'PowerLite X49'],
        'Lenovo': ['ThinkPad E14', 'ThinkCentre M70'],
        'LG': ['Split 18000 BTU', 'Monitor 27 pulgadas'],
        'Toyota': ['Hilux', 'Corolla', 'Land Cruiser'],
        'Nissan': ['Frontier', 'Sentra'],
        'Mitsubishi': ['L200'],
        'Hyundai': ['H1', 'Tucson'],
        'Yamaha': ['XTZ 125', 'YBR 125'],
        'Honda': ['XR 190', 'CG 150'],
    }
    for m, mods in MODELOS.items():
        marca = cat(in_marca, 'des_marca', m)
        for md in mods:
            if not in_modelo.objects.filter(cod_marca=marca, des_modelo=md).exists():
                in_modelo.objects.create(cod_marca=marca, des_modelo=md)

    # Subgrupos nuevos (cuelgan de los grupos raiz que ya existen)
    def G(cod):
        return in_grupo.objects.filter(cod_hijo=cod, a_b='A').first()

    def subgrupo(cod_hijo, des, cod_padre):
        padre = G(cod_padre)
        if padre is None:
            raise Exception(f"No existe el grupo raiz '{cod_padre}'.")
        obj = in_grupo.objects.filter(cod_hijo=cod_hijo, cod_padre=padre).first()
        if obj:
            return obj
        return in_grupo.objects.create(
            cod_hijo=cod_hijo, des_grupo=des, cod_padre=padre,
            nivel=(padre.nivel or 1) + 1, cod_gest=padre.cod_gest, a_b='A')

    for cod_hijo, des, padre in (
        ('1-05', 'Escritorio', '1'),
        ('2-05', 'Aire acondicionado', '2'),
        ('2-06', 'Monitor', '2'),
        ('4-02', 'Camioneta', '4'),
        ('4-03', 'Automovil', '4'),
        ('4-04', 'Minibus', '4'),
        ('A-01', 'Bloque de aulas', 'A'),
        ('A-02', 'Laboratorio', 'A'),
        ('A-03', 'Oficina administrativa', 'A'),
        ('B-02', 'Terreno urbano', 'B'),
    ):
        subgrupo(cod_hijo, des, padre)

    # ------------------------------------------------------------------
    # 2. DATOS BASE QUE YA EXISTEN
    # ------------------------------------------------------------------
    oficinas = list(in_oficina.objects.all())
    resp = (list(in_responsable.objects.values_list('pk', flat=True))
            or list(in_empleado.objects.values_list('pk', flat=True)))
    provs = list(in_provedor.objects.all()) or [None]
    if not oficinas or not resp:
        print("ERROR: faltan oficinas o responsables/empleados en la base.")
        return

    conds = {c.des_cond: c for c in in_condicion.objects.all()}
    estados = {e.des_estado: e for e in in_estado.objects.all()}
    est_activo = estados['Activo']
    est_almacen = estados['En Almacén']
    est_mant = estados['En Mantenimiento']
    est_baja = estados['Dado de Baja']
    cond_lista = [conds[n] for n in ('Nuevo', 'Bueno', 'Regular', 'Malo') if n in conds]
    unid = {u.des_unidad: u for u in in_unidad.objects.all()}
    u_und, u_m2, u_veh = unid['Unidad'], unid['Metro Cuadrado'], unid['Vehículo']

    # ------------------------------------------------------------------
    # 3. INGRESOS (uno por familia de bienes)
    # ------------------------------------------------------------------
    ING_DEF = {
        'muebles': (1, 'Compra de mobiliario de oficina'),
        'equipos': (1, 'Compra de equipos de computacion'),
        'donacion': (2, 'Donacion de equipos'),
        'vehiculos': (1, 'Adquisicion de vehiculos'),
        'inmuebles': (1, 'Construccion y adquisicion de inmuebles'),
    }
    ingresos = {}
    for i, (clave, (tipo, texto)) in enumerate(ING_DEF.items(), start=1):
        glosa = f"PRB {texto}"[:72]
        ing = in_ingreso.objects.filter(glosa=glosa).first()
        if not ing:
            f = HOY - timedelta(days=rnd.randint(60, 700))
            ing = in_ingreso.objects.create(
                gestion=f.year, tipo_ingreso=tipo, cod_prov=rnd.choice(provs),
                cod_ofic_dest=rnd.choice(oficinas), glosa=glosa, estado='A',
                acta_recep=f"AR-PRB-{i:03d}", fecha_recep=f,
                nro_factura=rnd.randint(1000, 9999), fecha_factura=f - timedelta(days=3),
                vo_bo_nombre='Responsable de Activos Fijos',
                vo_bo_cargo='Jefe de Activos Fijos', vo_bo_fecha=f)
        ingresos[clave] = ing

    # ------------------------------------------------------------------
    # 4. ACTIVOS
    # (grupo, marca, modelo, descripcion, monto min, monto max, unidad, cantidad)
    # ------------------------------------------------------------------
    PLAN = [
        ('1-05', None, None, 'Escritorio ejecutivo de madera', 900, 1800, u_und, 6),
        ('1-03', None, None, 'Silla giratoria ergonomica', 250, 700, u_und, 8),
        ('1-02', None, None, 'Mesa de reuniones metalica', 600, 1500, u_und, 3),
        ('1-04', None, None, 'Estante metalico de 5 repisas', 400, 900, u_und, 4),
        ('1-01', None, None, 'Sofa de recepcion de cuerina', 1200, 2500, u_und, 2),
        ('2-01', 'HP', 'ProBook 450', 'Computadora portatil', 5500, 9000, u_und, 5),
        ('2-01', 'Dell', 'OptiPlex 3080', 'Computadora de escritorio', 4500, 7500, u_und, 5),
        ('2-02', 'Epson', 'L3150', 'Impresora multifuncional', 1500, 2800, u_und, 3),
        ('2-02', 'HP', 'LaserJet Pro M404', 'Impresora laser', 2500, 4500, u_und, 2),
        ('2-04', 'Epson', 'PowerLite X49', 'Proyector multimedia', 3500, 6000, u_und, 2),
        ('2-06', 'Samsung', 'Monitor 24 pulgadas', 'Monitor LED', 1100, 1900, u_und, 4),
        ('2-05', 'LG', 'Split 18000 BTU', 'Aire acondicionado', 3800, 6500, u_und, 3),
        ('4-02', 'Toyota', 'Hilux', 'Camioneta 4x4 doble cabina', 230000, 310000, u_veh, 3),
        ('4-03', 'Toyota', 'Corolla', 'Automovil sedan', 130000, 190000, u_veh, 2),
        ('4-04', 'Hyundai', 'H1', 'Minibus de 12 pasajeros', 210000, 280000, u_veh, 2),
        ('4-01', 'Yamaha', 'XTZ 125', 'Motocicleta de trabajo', 16000, 24000, u_veh, 3),
        ('E', 'Nissan', 'Frontier', 'Vehiculo utilitario', 180000, 260000, u_veh, 1),
        ('A-01', None, None, 'Bloque de aulas', 800000, 2500000, u_m2, 2),
        ('A-02', None, None, 'Laboratorio de computacion', 500000, 1200000, u_m2, 1),
        ('A-03', None, None, 'Edificio administrativo', 900000, 2000000, u_m2, 1),
        ('B-01', None, None, 'Terreno del campus universitario', 1500000, 4000000, u_m2, 1),
        ('B-02', None, None, 'Terreno urbano', 300000, 900000, u_m2, 2),
    ]
    VEH = {'4-01': 'MOTOCICLETA', '4-02': 'CAMIONETA', '4-03': 'AUTOMOVIL',
           '4-04': 'MINIBUS', 'E': 'UTILITARIO'}
    INM = {'A-01', 'A-02', 'A-03', 'B-01', 'B-02'}

    def familia(cod, k):
        if cod[0] == '1':
            return 'muebles'
        if cod[0] == '2':
            return 'donacion' if k % 4 == 0 else 'equipos'
        if cod[0] in ('4', 'E'):
            return 'vehiculos'
        return 'inmuebles'

    todos = []          # (activo, codigo de grupo)
    nuevos = set()      # pks de activos creados en esta corrida
    n = 0
    for cod_g, marca_n, modelo_n, desc, mmin, mmax, unidad, cant in PLAN:
        g = G(cod_g)
        if g is None:
            print(f"Aviso: no existe el grupo {cod_g}, se omite.")
            n += cant
            continue
        marca = in_marca.objects.filter(des_marca=marca_n).first() if marca_n else None
        modelo = (in_modelo.objects.filter(cod_marca=marca, des_modelo=modelo_n).first()
                  if marca else None)
        for k in range(cant):
            n += 1
            cod = f"PRB-{n:04d}"
            a = in_activo.objects.filter(cod_activo=cod).first()
            if not a:
                a = in_activo.objects.create(
                    cod_gest=g.cod_gest, cod_activo=cod, cod_grupo=g,
                    cod_unidad=unidad, cod_marca=marca, cod_modelo=modelo,
                    cod_prove=rnd.choice(provs), cod_cond=rnd.choice(cond_lista),
                    cod_estado=est_activo, nro_ingreso=ingresos[familia(cod_g, k)],
                    descripcion=f"{desc} {marca_n} {modelo_n}" if marca else desc,
                    monto=Decimal(rnd.randrange(mmin, mmax, 10)),
                    fec_adqui=HOY - timedelta(days=rnd.randint(30, 1500)),
                    nro_serie=f"SN{rnd.randint(10**8, 10**9)}",
                    estado_registro='APROBADO', a_b='A')
                nuevos.add(a.pk)
            todos.append((a, cod_g))

    cod_de = {a.pk: c for a, c in todos}
    nuevos_a = [a for a, _ in todos if a.pk in nuevos]
    no_inm = [a for a in nuevos_a if cod_de[a.pk] not in INM]

    baja = rnd.sample(no_inm, min(6, len(no_inm)))
    resto = [a for a in no_inm if a not in baja]
    almacen = rnd.sample(resto, min(4, len(resto)))
    resto = [a for a in resto if a not in almacen]
    mant = rnd.sample(resto, min(4, len(resto)))

    # ------------------------------------------------------------------
    # 5. ASIGNACIONES
    # ------------------------------------------------------------------
    asignables = [a for a in nuevos_a if a not in almacen]
    rnd.shuffle(asignables)
    asig_de = {}
    i = 0
    while i < len(asignables):
        tam = rnd.randint(3, 6)
        lote = asignables[i:i + tam]
        i += tam
        fecha = HOY - timedelta(days=rnd.randint(10, 400))
        r = rnd.choice(resp)
        asig = in_asignado.objects.create(
            tipo_asig=tipo_func, tipo_resp=1, cod_resp=r,
            cod_ofic=rnd.choice(oficinas), fecha_asig=fecha, estado='A')
        in_encargado.objects.create(cod_asig=asig, tipo_resp=1, cod_resp=r, fecha_ini=fecha)
        for a in lote:
            in_det_asig.objects.create(cod_asig=asig, nro_activo=a, cantidad=1, fecha_trans=fecha)
            asig_de[a.pk] = (asig, r)

    # ------------------------------------------------------------------
    # 6. ESTADOS Y BAJAS
    # ------------------------------------------------------------------
    if almacen:
        in_activo.objects.filter(pk__in=[a.pk for a in almacen]).update(cod_estado=est_almacen)
    if mant:
        in_activo.objects.filter(pk__in=[a.pk for a in mant]).update(cod_estado=est_mant)

    destinos = ['Almacen de bajas', 'Remate publico', 'Donacion', 'Chatarra']
    for j, a in enumerate(baja, start=1):
        asig, r = asig_de.get(a.pk, (None, rnd.choice(resp)))
        fecha = HOY - timedelta(days=rnd.randint(5, 120))
        mot = motivos[(j - 1) % len(motivos)]
        in_baja_act.objects.create(
            cod_asig=asig.cod_asig if asig else 0, nro_activo=a,
            tipo_per_aut=1, cod_emp_aut=r, documento=f"RR {100 + j}/{HOY.year}",
            fecha_baja_te=fecha, motivo=str(mot.pk)[-1],
            fecha_baja_ef=fecha + timedelta(days=10),
            observacion=f"Baja de prueba: {mot.descripcion}",
            tipo_per_resp=1, cod_emp_resp=r,
            valor_final=(a.monto or Decimal(0)) * Decimal('0.1'),
            unidad_tecnica='Unidad de Activos Fijos',
            nro_informe=f"INF-PRB-{j:03d}", fecha_informe=fecha,
            destino_final=rnd.choice(destinos))
    if baja:
        in_activo.objects.filter(pk__in=[a.pk for a in baja]).update(cod_estado=est_baja, a_b='B')

    # ------------------------------------------------------------------
    # 7. VEHICULOS E INMUEBLES (solo para activos del grupo correcto)
    # ------------------------------------------------------------------
    colores = ['BLANCO', 'NEGRO', 'ROJO', 'PLATA', 'AZUL', 'GRIS']
    choferes = ['Juan Perez Soliz', 'Carlos Vaca Rojas', 'Mario Justiniano', 'Luis Gutierrez Arce']
    aseguradoras = ['Alianza Seguros', 'Nacional Seguros', 'La Boliviana Ciacruz']
    letras = 'ABCDEFGHJKLMNPRSTUVXYZ'
    TIPOLOGIAS = ['Hormigon armado, muros de ladrillo y losa alivianada',
                  'Estructura metalica con cubierta de calamina',
                  'Muros de ladrillo adobito y techo de teja']
    PATOLOGIAS = ['Fisuras en muros, humedad por capilaridad en la base',
                  'Desprendimiento de revoque y corrosion en cubierta',
                  'Sin patologias visibles',
                  'Filtraciones en losa y pintura deteriorada']

    for a, cod_g in todos:
        if cod_g in VEH:
            a.refresh_from_db()
            moto = cod_g == '4-01'
            itv = rnd.choice([HOY.year, HOY.year - 1])
            in_vehic.objects.update_or_create(nro_activo_id=a.pk, defaults=dict(
                tipo=VEH[cod_g],
                marca=(a.cod_marca.des_marca[:20] if a.cod_marca else None),
                modelo=(a.cod_modelo.des_modelo[:20] if a.cod_modelo else None),
                anio=rnd.randint(2012, 2025), color=rnd.choice(colores),
                placa=f"{rnd.randint(1000, 9999)}-{''.join(rnd.choice(letras) for _ in range(3))}",
                motor=f"MTR{rnd.randint(10**6, 10**7 - 1)}",
                chasis=f"CH{rnd.randint(10**14, 10**15 - 1)}",
                cilindrada=rnd.choice([125, 150, 190]) if moto else rnd.choice([1600, 2000, 2500, 3000]),
                industria=rnd.choice(['JAPON', 'COREA', 'TAILANDIA']),
                ruat=str(rnd.randint(10**10, 10**11 - 1)),
                carnet_prop=str(rnd.randint(10**6, 10**7 - 1)),
                poliza=f"POL-{rnd.randint(10000, 99999)}",
                fecha_vencimiento_soat=HOY + timedelta(days=rnd.randint(-40, 300)),
                nombre_chofer=rnd.choice(choferes),
                licencia_conducir=f"LIC-{rnd.randint(100000, 999999)}",
                telefono_chofer=f"7{rnd.randint(1000000, 9999999)}",
                kilometraje_actual=rnd.randint(2000, 180000),
                itv_gestion=itv, itv_estado='VIGENTE' if itv == HOY.year else 'VENCIDO',
                itv_certificado=f"ITV-{rnd.randint(10000, 99999)}",
                soat_nro=f"SOAT-{rnd.randint(100000, 999999)}",
                soat_aseguradora=rnd.choice(aseguradoras),
                codigo_sipap=f"SIPAP-{rnd.randint(1000, 9999)}",
                estado_mecanico=rnd.choice(['OPERATIVO', 'OPERATIVO', 'EN MANTENIMIENTO', 'FUERA DE SERVICIO'])))
        elif cod_g in INM:
            terreno = cod_g.startswith('B')
            manz = f"{rnd.randint(1, 60):03d}"
            lote = f"{rnd.randint(1, 30):02d}"
            in_inmueble.objects.update_or_create(nro_activo_id=a.pk, defaults=dict(
                uv=str(rnd.randint(1, 40)), manzana=manz, lote=lote,
                cod_catastral=f"{rnd.randint(1, 9):02d}-{rnd.randint(1, 99):03d}-{manz}-{int(lote):03d}",
                tipologia_constructiva='Terreno sin construccion' if terreno else rnd.choice(TIPOLOGIAS),
                patologias='Sin patologias visibles' if terreno else rnd.choice(PATOLOGIAS)))

    print("Listo.")
    print(f"  Activos nuevos:        {len(nuevos_a)}")
    print(f"  Asignaciones creadas:  {len({v[0].pk for v in asig_de.values()})}")
    print(f"  Bajas creadas:         {len(baja)}")
    print(f"  Vehiculos en total:    {in_vehic.objects.count()}")
    print(f"  Inmuebles en total:    {in_inmueble.objects.count()}")


from django.db import transaction
with transaction.atomic():
    _cargar()
