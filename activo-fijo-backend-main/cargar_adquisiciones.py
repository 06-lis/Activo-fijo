import os
import random
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

import django
django.setup()

from django.db import transaction
from activo.models import (
    in_solicitud,
    in_det_sol,
    in_oferta,
    in_det_ofer,
    in_orden_compra,
    in_responsable,
    in_provedor,
    in_tipomat,
    in_marca,
    in_modelo,
)

# True: simulacion sin guardar datos.
# False: guardar datos en PostgreSQL.
SIMULAR = True

random.seed(2026)

GLOSAS = [
    "Equipamiento de oficinas administrativas",
    "Renovacion de mobiliario universitario",
    "Equipamiento de salas de computo",
    "Materiales para laboratorios",
    "Mobiliario para aulas",
    "Equipamiento de biblioteca",
    "Mejoras de ambientes academicos",
    "Equipamiento para decanatura",
    "Renovacion de escritorios",
    "Equipamiento para salas de reuniones",
    "Materiales para mantenimiento",
    "Mobiliario para secretaria",
    "Equipamiento de centros de investigacion",
    "Renovacion de mobiliario docente",
    "Equipamiento de oficinas de FINOR",
    "Mobiliario para atencion estudiantil",
    "Equipamiento de archivos",
    "Materiales para talleres",
    "Equipamiento de auditorios",
    "Mobiliario para salas de estudio",
    "Equipamiento de unidades academicas",
    "Renovacion de salas administrativas",
    "Materiales para centros universitarios",
    "Equipamiento para kardex",
    "Mobiliario para recepcion",
    "Equipamiento para aulas nuevas",
    "Materiales para oficinas de direccion",
    "Renovacion de ambientes de trabajo",
    "Equipamiento para servicios generales",
    "Mobiliario para departamentos",
]

MODELOS = [
    in_solicitud,
    in_det_sol,
    in_oferta,
    in_det_ofer,
    in_orden_compra,
]


def cargar():

    with transaction.atomic():

        # Evitar duplicar datos existentes.
        for modelo in MODELOS:
            if modelo.objects.exists():
                raise Exception(
                    f"La tabla {modelo.__name__} ya contiene datos. "
                    "Carga cancelada."
                )

        responsables = list(
            in_responsable.objects.filter(a_b="A")
        )

        proveedores = list(in_provedor.objects.all())

        materiales = list(
            in_tipomat.objects.exclude(tipo_mat=7)
        )

        marcas = list(in_marca.objects.all())
        modelos = list(in_modelo.objects.all())

        if len(responsables) < 2:
            raise Exception("Faltan responsables activos.")

        if len(proveedores) < 3:
            raise Exception("Faltan proveedores.")

        if len(materiales) < 3:
            raise Exception("Faltan materiales.")

        estados = (
            ["P"] * 20
            + ["A"] * 5
            + ["R"] * 3
            + ["B"] * 2
        )

        random.shuffle(estados)

        aprobadas = []

        fecha_inicio = max(
            date(2026, 9, 16),
            max(r.fecha for r in responsables)
        )

        fecha_fin = date.today() - timedelta(days=15)

        if fecha_fin < fecha_inicio:
            raise Exception("Rango de fechas insuficiente.")

        dias = (fecha_fin - fecha_inicio).days

        # ==========================================
        # 1. SOLICITUDES Y DETALLES
        # ==========================================

        for i in range(30):

            solicitante, responsable = random.sample(
                responsables, 2
            )

            fecha = fecha_inicio + timedelta(
                days=random.randint(0, dias)
            )

            solicitud = in_solicitud.objects.create(
                gestion=fecha.year,
                cod_estprog=solicitante.cod_estprog,
                emp_sol=solicitante,
                emp_resp=responsable,
                cod_emp_id=solicitante.cod_emp_id,
                glosa=GLOSAS[i][:50],
                fecha=fecha,
                a_b=estados[i]
            )

            seleccionados = random.sample(materiales, 3)

            for material in seleccionados:

                in_det_sol.objects.create(
                    nro_sol=solicitud,
                    id_material=material.tipo_mat,
                    cantidad=random.randint(2, 25)
                )

            if solicitud.a_b == "P":
                aprobadas.append(solicitud)

        # ==========================================
        # 2. OFERTAS Y DETALLES
        # ==========================================

        random.shuffle(aprobadas)

        ofertas_por_solicitud = {}

        for i, solicitud in enumerate(aprobadas):

            # 5 solicitudes con 3 ofertas.
            # 15 solicitudes con 2 ofertas.
            cantidad_ofertas = 3 if i < 5 else 2

            proveedores_elegidos = random.sample(
                proveedores, cantidad_ofertas
            )

            detalles = list(
                in_det_sol.objects.filter(
                    nro_sol=solicitud
                )
            )

            precios_base = {
                d.id_material: random.randint(150, 1800)
                for d in detalles
            }

            ofertas_por_solicitud[solicitud.pk] = []

            for proveedor in proveedores_elegidos:

                fecha_oferta = solicitud.fecha + timedelta(
                    days=random.randint(1, 7)
                )

                oferta = in_oferta.objects.create(
                    nro_sol=solicitud,
                    cod_prov=proveedor,
                    fecha_ofer=fecha_oferta,
                    glosa=f"Cotizacion solicitud {solicitud.pk}",
                    estado="P"
                )

                total = Decimal("0.00")

                for detalle in detalles:

                    factor = Decimal(
                        random.randint(90, 115)
                    ) / Decimal("100")

                    precio = (
                        Decimal(
                            precios_base[detalle.id_material]
                        ) * factor
                    ).quantize(Decimal("0.01"))

                    # Sin marca ni modelo especifico.
                    id_marca = 0
                    id_modelo = 0

                    in_det_ofer.objects.create(
                        nro_oferta=oferta,
                        id_material=detalle.id_material,
                        cantidad=detalle.cantidad,
                        monto_uni=precio,
                        id_marca=id_marca,
                        id_modelo=id_modelo
                    )

                    total += precio * detalle.cantidad

                ofertas_por_solicitud[
                    solicitud.pk
                ].append((oferta, total))

        # ==========================================
        # 3. ORDENES DE COMPRA
        # ==========================================

        solicitudes_elegidas = random.sample(
            aprobadas, 15
        )

        for i, solicitud in enumerate(
            solicitudes_elegidas, start=1
        ):

            cotizaciones = ofertas_por_solicitud[
                solicitud.pk
            ]

            # Seleccionar la oferta de menor importe.
            oferta, total = min(
                cotizaciones,
                key=lambda x: x[1]
            )

            fecha_orden = oferta.fecha_ofer + timedelta(
                days=random.randint(1, 7)
            )

            in_orden_compra.objects.create(
                nro_oferta=oferta,
                emp_resp=solicitud.emp_resp,
                fecha_orden=fecha_orden,
                glosa=f"Compra solicitud {solicitud.pk}",
                nro_com_egre=1000 + i,
                a_b="A"
            )

            oferta.estado = "A"
            oferta.save(update_fields=["estado"])

        # ==========================================
        # 4. COMPROBACION DE RESULTADOS
        # ==========================================

        esperados = [30, 90, 45, 135, 15]

        print("\n========== RESULTADOS ==========\n")

        total_registros = 0

        for modelo, esperado in zip(MODELOS, esperados):

            cantidad = modelo.objects.count()

            print(f"{modelo.__name__}: {cantidad}")

            if cantidad != esperado:
                raise Exception(
                    f"Cantidad incorrecta en {modelo.__name__}"
                )

            total_registros += cantidad

        print("\nESTADOS DE SOLICITUDES")

        for estado, nombre in [
            ("A", "Pendientes"),
            ("P", "Aprobadas"),
            ("R", "Rechazadas"),
            ("B", "Anuladas")
        ]:

            cantidad = in_solicitud.objects.filter(
                a_b=estado
            ).count()

            print(f"{nombre}: {cantidad}")

        print("\nESTADOS DE OFERTAS")

        print(
            "Pendientes:",
            in_oferta.objects.filter(estado="P").count()
        )

        print(
            "Aprobadas:",
            in_oferta.objects.filter(estado="A").count()
        )

        print("\nTotal registros:", total_registros)

        if SIMULAR:
            transaction.set_rollback(True)
            print("\nSIMULACION: cambios no guardados.")
        else:
            print("\nCARGA COMPLETADA.")


if __name__ == "__main__":
    cargar()