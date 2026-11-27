import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()

from django.db import transaction
from activo.models import in_oficina

# True: comprobar sin guardar.
# False: insertar los registros.
SIMULAR = True

CATALOGO = {
    "1": ("Campus Universitario", {
        "01": ("Facultad de Ciencias Económicas", [
            "Decanatura de Ciencias Económicas",
            "Secretaría Académica",
            "Dirección de Administración de Empresas",
            "Laboratorio de Computación",
            "Sala de Docentes",
            "Biblioteca",
            "Centro Interno",
        ]),
        "02": ("Facultad de Ciencias Jurídicas", [
            "Decanatura",
            "Secretaría Académica",
            "Dirección de Derecho",
            "Consultorio Jurídico",
            "Sala de Simulación de Juicios",
            "Biblioteca",
            "Centro Interno",
        ]),
        "03": ("Edificio Administrativo Central", [
            "Kardex Estudiantil",
            "Cajas y Tesorería",
            "Rectorado",
            "Vicerrectorado",
            "Recursos Humanos",
            "Contabilidad",
            "Activos Fijos",
            "Auditoría Interna",
            "Compras y Contrataciones",
            "Archivo Central",
            "Asesoría Legal",
            "Dirección Administrativa",
        ]),
        "04": ("Facultad de Ciencias Contables", [
            "Decanatura",
            "Secretaría Académica",
            "Dirección de Contaduría Pública",
            "Laboratorio Contable",
            "Biblioteca",
            "Centro Interno",
        ]),
    }),

    "2": ("Ciudad Universitaria", {
        "01": ("Módulo 236 - FICCT", [
            "Centro de Cómputo (Planta Baja)",
            "Decanatura FICCT",
            "Dirección de Ingeniería de Sistemas",
            "Dirección de Ingeniería Informática",
            "Laboratorio de Redes",
            "Laboratorio de Robótica",
            "Laboratorio de Software",
            "Secretaría Académica",
            "Centro Interno",
            "Sala de Docentes",
            "Sala de Servidores",
        ]),
        "02": ("Módulo 214 - Facultad de Tecnología", [
            "Decanatura",
            "Secretaría Académica",
            "Sala de Computación",
            "Centro Interno",
            "Laboratorio de Física",
            "Laboratorio de Química",
            "Laboratorio de Electrónica",
            "Laboratorio de Materiales",
            "Sala de Docentes",
            "Almacén de Equipos",
            "Sala de Reuniones",
        ]),
        "03": ("Facultad de Ciencias Agrícolas", [
            "Decanatura",
            "Laboratorio de Suelos",
            "Laboratorio de Biología",
            "Laboratorio de Semillas",
            "Secretaría Académica",
            "Almacén de Herramientas",
            "Centro Interno",
        ]),
        "04": ("Facultad de Ciencias Veterinarias", [
            "Decanatura",
            "Laboratorio de Anatomía Animal",
            "Laboratorio de Microbiología",
            "Consultorio Veterinario",
            "Farmacia Veterinaria",
            "Secretaría Académica",
            "Centro Interno",
        ]),
        "05": ("Facultad de Humanidades", [
            "Decanatura",
            "Secretaría Académica",
            "Consultorio Psicológico",
            "Laboratorio de Comunicación",
            "Sala de Docentes",
            "Biblioteca",
            "Centro Interno",
        ]),
        "06": ("Facultad de Ciencias de la Salud Humana", [
            "Decanatura",
            "Laboratorio de Anatomía",
            "Laboratorio de Simulación Clínica",
            "Laboratorio de Enfermería",
            "Secretaría Académica",
            "Sala de Docentes",
            "Centro Interno",
        ]),
        "07": ("Facultad de Ciencias Farmacéuticas y Bioquímicas", [
            "Decanatura",
            "Laboratorio de Bioquímica",
            "Laboratorio de Farmacología",
            "Laboratorio de Microbiología",
            "Almacén de Reactivos",
            "Secretaría Académica",
        ]),
        "08": ("Facultad de Ciencias del Hábitat, Diseño y Arte", [
            "Decanatura",
            "Taller de Arquitectura",
            "Taller de Diseño",
            "Sala de Artes Plásticas",
            "Laboratorio de Modelado Digital",
            "Secretaría Académica",
            "Centro Interno",
        ]),
        "09": ("Facultad Politécnica", [
            "Decanatura",
            "Taller de Mecánica",
            "Taller de Electricidad",
            "Laboratorio de Electrónica",
            "Taller de Metalurgia",
            "Almacén de Herramientas",
            "Centro Interno",
        ]),
    }),

    "3": ("Facultad Integral del Norte (FINOR)", {
        "01": ("Bloque Administrativo", [
            "Decanatura",
            "Secretaría Académica",
            "Kardex Estudiantil",
            "Contabilidad",
            "Sala de Reuniones",
            "Activos Fijos",
            "Tesorería",
        ]),
        "02": ("Bloque de Ingeniería en Sistemas", [
            "Dirección de Carrera",
            "Laboratorio de Computación",
            "Laboratorio de Redes",
            "Centro Interno",
            "Sala de Docentes",
            "Laboratorio de Software",
        ]),
        "03": ("Bloque de Ingeniería Industrial y Petrolera", [
            "Dirección de Carrera",
            "Laboratorio de Procesos Industriales",
            "Laboratorio de Física",
            "Taller de Mecánica",
            "Laboratorio de Fluidos",
        ]),
        "04": ("Bloque de Ciencias de la Salud", [
            "Dirección de Medicina",
            "Dirección de Enfermería",
            "Laboratorio de Anatomía",
            "Sala de Simulación Clínica",
            "Laboratorio de Enfermería",
        ]),
        "05": ("Bloque de Medicina Veterinaria", [
            "Dirección de Carrera",
            "Consultorio Veterinario",
            "Laboratorio de Anatomía Animal",
            "Almacén de Equipos",
        ]),
        "06": ("Bloque de Ciencias Económicas y Sociales", [
            "Dirección de Ingeniería Comercial",
            "Dirección de Contaduría Pública",
            "Dirección de Derecho",
            "Dirección de Ciencias de la Educación",
            "Sala de Docentes",
        ]),
        "07": ("Servicios Universitarios", [
            "Biblioteca",
            "Centro de Estudiantes",
            "Almacén General",
            "Sala de Conferencias",
            "Oficina de Seguridad",
            "Mantenimiento",
        ]),
    }),

    "4": ("Facultad Integral del Chaco", {
        "01": ("Bloque Administrativo", [
            "Decanatura",
            "Secretaría Académica",
            "Kardex",
            "Contabilidad",
        ]),
        "02": ("Bloque de Ingenierías", [
            "Laboratorio de Computación",
            "Laboratorio de Petróleo y Gas",
            "Taller Industrial",
            "Sala de Docentes",
        ]),
        "03": ("Bloque de Salud", [
            "Laboratorio de Enfermería",
            "Sala de Simulación Clínica",
            "Consultorio de Salud",
        ]),
        "04": ("Bloque de Ciencias Sociales", [
            "Dirección de Derecho",
            "Dirección de Contaduría",
            "Biblioteca",
        ]),
    }),

    "5": ("Facultad Integral de los Valles Cruceños", {
        "01": ("Bloque Administrativo", [
            "Decanatura",
            "Secretaría Académica",
            "Kardex",
            "Contabilidad",
        ]),
        "02": ("Bloque Académico", [
            "Sala de Docentes",
            "Centro de Cómputo",
            "Biblioteca",
            "Centro Interno",
        ]),
        "03": ("Bloque de Servicios", [
            "Almacén General",
            "Mantenimiento",
            "Sala de Reuniones",
        ]),
    }),

    "6": ("Facultad Integral Chiquitana", {
        "01": ("Bloque Administrativo", [
            "Decanatura",
            "Secretaría Académica",
            "Kardex",
        ]),
        "02": ("Bloque Agropecuario", [
            "Laboratorio de Suelos",
            "Laboratorio de Zootecnia",
            "Almacén de Herramientas",
        ]),
        "03": ("Bloque Académico", [
            "Laboratorio de Computación",
            "Biblioteca",
            "Dirección de Contaduría",
        ]),
    }),

    "7": ("Facultad Integral de Ichilo", {
        "01": ("Bloque Administrativo", [
            "Decanatura",
            "Secretaría Académica",
            "Kardex",
        ]),
        "02": ("Bloque Académico", [
            "Centro de Cómputo",
            "Biblioteca",
            "Sala de Docentes",
            "Centro Interno",
        ]),
        "03": ("Bloque de Servicios", [
            "Almacén General",
            "Mantenimiento",
            "Sala de Conferencias",
        ]),
    }),

    "8": ("Facultad Integral del Noreste", {
        "01": ("Bloque Administrativo", [
            "Decanatura",
            "Secretaría Académica",
            "Kardex",
        ]),
        "02": ("Bloque Agroindustrial", [
            "Laboratorio de Suelos",
            "Laboratorio de Agroindustria",
            "Almacén de Equipos",
        ]),
        "03": ("Bloque Académico", [
            "Laboratorio de Computación",
            "Laboratorio de Enfermería",
            "Biblioteca",
            "Sala de Docentes",
        ]),
    }),
}

creados = {1: 0, 2: 0, 3: 0}
existentes = {1: 0, 2: 0, 3: 0}


def registrar(codigo, nombre, nivel, padre=None):

    if len(nombre) > 70:
        raise ValueError(
            f"Descripción demasiado larga: {nombre}"
        )

    coincidencias = in_oficina.objects.filter(
        cod_dpto=codigo,
        cod_gest=1
    )

    if coincidencias.count() > 1:
        raise ValueError(
            f"Código duplicado en la BD: {codigo}"
        )

    oficina = coincidencias.first()

    if oficina:
        padre_id = padre.pk if padre else None

        if (
            oficina.nivel != nivel
            or oficina.cod_padre_id != padre_id
            or oficina.des_dpto.strip().casefold()
            != nombre.strip().casefold()
            or oficina.a_b != "A"
        ):
            raise ValueError(
                f"Conflicto con registro existente: {codigo}"
            )

        existentes[nivel] += 1
        print(f"[EXISTE] {codigo} - {nombre}")
        return oficina

    duplicado = in_oficina.objects.filter(
        cod_padre=padre,
        cod_gest=1,
        des_dpto__iexact=nombre
    ).exists()

    if duplicado:
        raise ValueError(
            f"Nombre duplicado bajo el mismo padre: {nombre}"
        )

    oficina = in_oficina.objects.create(
        cod_dpto=codigo,
        des_dpto=nombre,
        cod_padre=padre,
        tipo_act=1,
        cod_activ="",
        nivel=nivel,
        cod_gest=1,
        a_b="A"
    )

    creados[nivel] += 1

    print(f"[NUEVO] Nivel {nivel}: {codigo} - {nombre}")

    return oficina


def cargar():

    with transaction.atomic():

        for codigo1, (nombre1, edificios) in CATALOGO.items():

            campus = registrar(codigo1, nombre1, 1)

            for sufijo2, (nombre2, unidades) in edificios.items():

                codigo2 = f"{codigo1}-{sufijo2}"

                edificio = registrar(
                    codigo2,
                    nombre2,
                    2,
                    campus
                )

                for numero, nombre3 in enumerate(unidades, 1):

                    codigo3 = f"{codigo2}-{numero:02d}"

                    registrar(
                        codigo3,
                        nombre3,
                        3,
                        edificio
                    )

        print("\n" + "=" * 50)
        print("RESUMEN DE CARGA")
        print("=" * 50)

        for nivel in (1, 2, 3):
            print(
                f"Nivel {nivel}: "
                f"{creados[nivel]} nuevos, "
                f"{existentes[nivel]} existentes"
            )

        print(f"\nTotal nuevos: {sum(creados.values())}")
        print(f"Total existentes: {sum(existentes.values())}")

        print(
            "Total oficinas:",
            in_oficina.objects.count()
        )

        if SIMULAR:
            transaction.set_rollback(True)
            print("\nSIMULACION: cambios no guardados.")
        else:
            print("\nCARGA COMPLETADA CORRECTAMENTE.")


if __name__ == "__main__":
    cargar()