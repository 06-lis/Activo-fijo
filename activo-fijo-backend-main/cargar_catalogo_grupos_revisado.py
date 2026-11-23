"""
Carga en el catalogo de GRUPOS los items del Clasificador Presupuestario UAGRM 2026
(Circular N° 1, Departamento de Activo Fijo), desde la partida 43500 hasta la 49900.
NO incluye 49300 Semovientes (lo hacen otros grupos del equipo).

Cada item queda como un grupo de nivel 2 colgando de su grupo raiz:
    43500 -> grupo 6   (Equipo de Comunicacion)
    43600 -> grupo 7   (Equipo Educacional y Recreativo)
    43700 -> grupo 8   (Otros equipos)
    49100 -> grupo D   (Activos intangibles)
    49400 y 49900 -> grupo 9 (Otros activos)

Ejecutar desde D:\\Activo-fijo\\activo-fijo-backend-main:
    python manage.py shell -c "exec(open('cargar_catalogo_grupos.py', encoding='utf-8').read())"

Se puede correr varias veces: no repite los items que ya existen (compara el nombre).
Con SIMULAR = True solo muestra lo que haria, sin guardar nada.
"""

SIMULAR = False         
RAIZ_INTANGIBLES = 'D'   # En la Circular los intangibles son el grupo E, pero en tu base la raiz de
                         # "Activos intangibles" es la D (la E es "vehiculo"). Cambialo si tu equipo decide otra cosa.

# ---------------------------------------------------------------------------
# DATOS (tal como figuran en la Circular; se corrigio "TEEFONIA" por "TELEFONIA")
# ---------------------------------------------------------------------------

COMUNICACION = """
AMPLIFICADOR DE AUDIO
AMPLIFICADOR DE SEÑAL DE TV
ANTENA
APARATO TELEFONICO
APARATO PARA VIDEO CONFERENCIAS
BLOQUEADOR DE LLAMADAS (Dispositivo)
BOCINA-MEGAFONO
CABLEADO ESTRUCTURADO DE REDES
CENTRAL TELEFONICA
CAMARA DE VIGILANCIA
CAMARA TRAMPA
COLECTOR DE DATOS – LECTOR INFRAROJO
CONMUTADOR (Equipo de Red)
CONSOLA (Audio, Video)
CONVERSOR DE FIBRA OPTICA
CONVERSOR DE SEÑAL DE VIDEO
CORRECTOR DE BASE DE TIEMPO (Video)
DECODIFICADOR SATELITAL
DETECTOR ANTIHURTO
DISPOSITIVO DE FIBRA OPTICA
DISPOSITIVO DE RADIO DEFINIDO POR SOFTWARE
DISTRIBUIDOR DE VIDEO
ECUALIZADOR
ENLACE PTP DE MICROONDAS
ENLACE DE TV AUDIO Y VIDEO
EQUIPO DE RADIO
EQUIPO DE SONIDO
EQUIPO DIMMER DE ILUMINACION
EQUIPO PARA INTERCONEXION DE REDES
ACCESS POINT
HUB
PATCH PANEL
PRINT SERVER
ROUTER
SWITCH DE RED
TERMINALES CLIENTE CERO
TRANSCEIVER
EQUIPO TRANSMISOR DE RADIO FM-AM
EQUIPO TRANSMISOR DE TV.
FORTINET FORTIGATE FIREWALL
GENERADOR DE EFECTOS ESPECIALES
GPS
GRABADORA DE AUDIO
GRABADOR DE CANALES (DVR, PVR, NVR)
INHIBIDOR DE FRECUENCIA
INTERCOMUNICADOR
KIT DE GRABACION DE AUDIO PROFESIONAL
KIT DE ILUMINACION PROFESIONAL
KIT PARA FILMAR
MANGUERA DE SONIDO
MAQUINA REVELADOR DE PELICULAS
MEDIDOR DE FIBRA PORTATIL - OTDR
MEZCLADOR DE SONIDO – VIDEO
MODULADOR DE FRECUENCIA
MODULO PARA TELEFONIA IP
PDA-TABLET- IPAD-CELULARES
PODER DE SONIDO
RADIO GRABADORA
RADIO TELEFONO – HANDY
RECEPTOR TRANSMISOR DE VIDEO
RECEPTOR INALAMBRICO
REPRODUCTOR DIGITAL DE AUDIO
SENSOR DE MOVIMIENTOS
SIMULADOR DE FRECUENCIA
SISTEMA DE ALARMA CONTRA ROBO
SISTEMA DE RED CONMUTADOR MULTICAPA
SISTEMAS DOMÓTICOS CENTRALIZADOS
TELEFAX
TELEVISOR-MONITOR DE TV
TITULADORA
TORRE DE TRANSMISION
TRANSMISOR – RECEPTOR DE ENLACE MICROONDAS
VIDEOFONO
MONITOR DE TV- PANTALLA LED
TRANSCEIVER(TRANSMISOR Y RECEPTOR DE COMUNICACIÓN)
""".strip().splitlines()

EDUCACIONAL = """
AFINADOR DE INSTRUMENTOS
ANDADOR
APARATOS PARA PARQUES INFANTILES
ARENERO
BALANCIN
CARRUSEL
CASITA
COLUMPIO
MESA PARA INFANTES
RESBALIN
SILLAS PARA INFANTES
TOBOGAN
ZONA DE ESCALADA
ATRIL PARA GUITARRA
CABALLETE DE PINTURA
CORREPASILLO
EQUIPO MENOR DE GIMNASIA
FUTBOLIN
INSTRUMENTOS MUSICALES
ACORDEON
ARMONIO
ARPA
BAJO
BANDURIA
BATERIA
BOMBO
BONGOS
CAJA DE PERCUSION
CELLO
CHARANGO
CLARIN – CLARINETE
CONGA
CONTRABAJO
CORNETA – CORNETIN
CUATRO VENEZOLANO – VIHUELA
FLAUTA – FLAUTIN
GUITARRA
LAUD
LIRA
MANDOLINA
ORGANO
PIANO - CLAVINOVA
PLATILLOS
SAXOFON
TAMBOR
TIMBAL
TROMBON – TROMBA
VIOLIN - VIOLA- VIOLONCELO
KIT DE ENTRENAMIENTO DIDACTICO
MESA DE AJEDREZ
MESA DE PING PONG
MESA PUPITRE UNIPERSONAL - BIPERSONAL
METRONOMO – DIAPASON
MICROFONO CON CABLE
MICROFONO INALAMBRICO
MODELO ARTICULADO
MOVIL MUSICAL PARA CUNA
MUÑECO ANATOMICO
PANTALLA PARA PROYECCION
PARLANTE
PIZARRA ACRILICA
PIZARRA ELECTRONICA / MULTIMEDIA
PIZARRA
PROYECTOR – RETROPROYECTOR
ROTAFOLIO
SILLA PUPITRE
TELON CON TRIPODE PARA PROYECTOR
TELON MURAL PARA PROYECTOR
""".strip().splitlines()

OTRA_MAQUINARIA = """
ACANALADOR
ACONDICIONADOR DE AIRE
ALTERNADOR
ASPIRADORA – LUSTRADORA
BANCO DE PRUEBA
BOBINADORA
BOMBA MANUAL
CALDERO INDUSTRIAL
CALEFON A GAS
CALENTADOR DE AMBIENTE
CAMARA DE VIDEO
CAMARA FILMADORA
CAMARA FOTOGRAFICA
CAMARA FRIGORIFICA
CARGADOR DE BATERIA
CARRETILLA BURRO
CENTRAL DE AIRE ACONDICIONADO
CIZALLA – GUILLOTINA SEMI INDUSTRIAL
CLAVADORA ELECTRICA
COCINA
COMPRESOR DE AIRE
CONSERVADORA DE ALIMENTOS
CONTENEDOR DE BASURA
DOBLADOR DE TUBOS
ENCUADERNADORA–ANILLADORA–EMPASTADORA
ENGRASADORA INDUSTRIAL
EQUIPO DRONE HELICAM
EQUIPO DE SOLDADURA
EQUIPOS DE ILUMINACION
ESCOPLADORA MECANICA
ESMERILADORA
ESTUFA
EXTRACTOR DE AIRE
FLASH DIGITAL PROFESIONAL
FUMIGADOR – PULVERIZADOR ELECTRICO
GARLOPA DE BANCO
GASOGENO
GATA HIDRAULICA SEMI INDUSTRIAL
GENERADOR DE ELECTRICIDAD
HELADERA – REFRIGERADOR – FRIGOBAR - FREEZER
HERRAMIENTAS PARA MECANICA AUTOMOTRIZ
ANALIZADORES DE GASES
EQUIPO PARA RECTIFICADO
ESCANER DE DIAGNOSTICO
GATO HIDRAULICO
KIT DE PRESION DE RADIADOR
KIT PARA LAVADO DE INYECTORES
LAMPARA DIGITAL DE TIEMPO
LAMPARA ESTROBOSCOPICA
ODOMETRO
PROBADOR DE BATERIA-ALTERNADOR
PROBADOR DE SENSORES
TESTER DE ANALISIS ELECTRONICO
VACUOMETRO-COMPRESOMETRO
HIDROLAVADORA
HORNO
IMPRENTA (OFFSET)
INCINERADOR
LAVADORA-SECADORA
LENTE PROFESIONAL PARA CAMARA
LIJADORA – LIMADORA INDUSTRIAL
MANOMETRO
MAQUINA CORTA PASTO
MAQUINA DE COSTURAR - PRETINAR
MAQUINA DE SOLDAR
SOLDADOR DE ACETILENO
SOLDADOR DE AIRE CALIENTE
SOLDADOR DE ARCO
MAQUINARIA GRAFICA
MAQUINARIA PARA CARPINTERIA
AFILADORA
CEPILLADORA PULIDORA
CORTADORA DE MADERA - FIERRO
ESMERIL -AMOLADORA
FRESADORA
LIJADORA ELECTRICA
MAQUINA TUPI
SIERRA ELECTRICA
TALADRO ELECTRICO / PISTOLA A CALOR
MASCARA PARA SOLDAR
MEZCLADORA DE CONCRETO-HORMIGON
MOTORES
MOTOBOMBA
MOTOSIERRA
PANEL DE CONTROL
PANEL FOTOVOLTAICO
PARCHADOR
PINZA AMPERIMETRICA
PLACAS DE IMPRESIÓN OFFSET
PLASTIFICADORA SEMI INDUSTRIAL
PLEGADORA ELECTRICA
PODADORA TELESCOPICA
PRENSA DE BANCO - MESA
PRENSA HIDRAULICA
PRENSA LITOGRAFICA
PULIDORA
REGULADOR DE ENERGIA SOLAR
REMACHADORA DE BALATAS
ROTOMARTILLO
SATINADORA
SIERRA INGLETADORA
SUJETADOR PARA MOTOR
TAMIZ
TANQUE CONTENEDOR
TANQUE DE AGUA
TECLE
TORNO
TRANSFORMADOR DE POTENCIA
TRIPODE PARA CAMARA
VENTILADOR
MAQUINA PROFESIONAL PARA CORTAR PELO EN PERRO Y GATO
CILINDRO DE ARGON (PARA SOLDADURA)
""".strip().splitlines()

INTANGIBLES = """
APLICACIONES INFORMATICAS
DERECHOS DE PROPIEDAD INTELECTUAL
LICENCIA
SOFTWARE
""".strip().splitlines()

MUSEOLOGICOS = """
ESCULTURAS
OBRAS ARQUITECTONICAS
OBRAS LITERARIAS ORIGINALES
OBRAS MUSICALES ORIGINALES
OBRAS CINEMATOGRAFICAS - VIDEOTECAS
PINTURAS – CUADROS (PINACOTECA)
RESTAURACION DE FOSILES
""".strip().splitlines()

OTROS = """
ARMAMENTO PARA VIGILANCIA
CUADROS TALLADOS EN MADERA
OBJETO VALIOSOS DE BIBLIOTECA
""".strip().splitlines()

# (codigo del grupo raiz, partida, lista)   -- 49300 Semovientes NO va
SECCIONES = [
    ('6', '43500 Equipo de Comunicación', COMUNICACION),
    ('7', '43600 Equipo Educacional y Recreativo', EDUCACIONAL),
    ('8', '43700 Otra Maquinaria y Equipo', OTRA_MAQUINARIA),
    (RAIZ_INTANGIBLES, '49100 Activos Intangibles', INTANGIBLES),
    ('9', '49400 Activos Museológicos y Culturales', MUSEOLOGICOS),
    ('9', '49900 Otros', OTROS),
]

# ---- FIN DE DATOS ----


def _cargar():
    import re
    from activo.models.jerarquias import in_grupo

    def normal(texto):
        return re.sub(r'\s+', ' ', texto).strip().lower()

    # Estado por grupo raiz: nombres que ya existen y ultimo numero usado
    # Se comprueban las raices antes de empezar para no realizar cargas parciales.
    raices = {}
    for codigo, _, _ in SECCIONES:
        if codigo in raices:
            continue
        coincidencias = list(in_grupo.objects.filter(
            cod_hijo=codigo, cod_padre__isnull=True, a_b='A'
        )[:2])
        if len(coincidencias) != 1:
            raise ValueError(
                f"Grupo raiz {codigo!r}: se esperaba exactamente uno activo; "
                f"se encontraron {len(coincidencias)}. No se insertaron datos."
            )
        raices[codigo] = coincidencias[0]

    # No recortar nombres silenciosamente; validar antes de insertar.
    for _, titulo, items in SECCIONES:
        for nombre in items:
            if len(nombre.strip()) > 70:
                raise ValueError(
                    f"Descripcion de mas de 70 caracteres en {titulo}: {nombre!r}. "
                    "Revisar la longitud permitida en el modelo."
                )

    estado = {}

    def preparar(cod):
        if cod in estado:
            return estado[cod]
        raiz = raices[cod]
        hijos = in_grupo.objects.filter(cod_padre=raiz)
        nombres = {normal(h.des_grupo or '') for h in hijos}
        codigos = {h.cod_hijo for h in hijos}
        patron = re.compile(r'^' + re.escape(cod) + r'-(\d+)$')
        mayor = 0
        for h in hijos:
            m = patron.match(h.cod_hijo or '')
            if m:
                mayor = max(mayor, int(m.group(1)))
        estado[cod] = {'raiz': raiz, 'nombres': nombres, 'codigos': codigos, 'mayor': mayor}
        return estado[cod]

    total_nuevos = total_omitidos = 0
    for cod, titulo, items in SECCIONES:
        info = preparar(cod)
        raiz = info['raiz']
        nuevos = omitidos = 0
        for nombre in items:
            nombre = nombre.strip()
            if normal(nombre) in info['nombres']:
                omitidos += 1
                continue
            info['mayor'] += 1
            nuevo_codigo = f"{cod}-{info['mayor']:02d}"
            if nuevo_codigo in info['codigos']:
                raise ValueError(f"Codigo duplicado: {nuevo_codigo}")
            info['codigos'].add(nuevo_codigo)
            info['nombres'].add(normal(nombre))
            if not SIMULAR:
                in_grupo.objects.create(
                    cod_hijo=nuevo_codigo,
                    des_grupo=nombre,
                    cod_padre=raiz,
                    nivel=(raiz.nivel or 1) + 1,
                    cod_gest=raiz.cod_gest,
                    a_b='A',
                )
            nuevos += 1
        total_nuevos += nuevos
        total_omitidos += omitidos
        print(f"  {titulo}: {nuevos} nuevos, {omitidos} ya existian  (grupo {cod}: {(raiz.des_grupo or '').strip()})")

    print("SIMULACION (no se guardo nada)." if SIMULAR else "Listo.")
    if not SIMULAR:
        print("ATENCION: 49400 y 49900 se cargaron bajo la misma raiz 9; "
              "el grupo no conserva la partida presupuestaria como subnivel.")
    print(f"  Total nuevos: {total_nuevos}   ya existentes: {total_omitidos}")


from django.db import transaction
with transaction.atomic():
    _cargar()
