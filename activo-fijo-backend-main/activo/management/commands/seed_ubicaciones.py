from django.core.management.base import BaseCommand
from activo.models import in_oficina, in_gestion


class Command(BaseCommand):
    help = 'Seed de Ubicaciones (in_oficina) con 3 niveles'

    def handle(self, *args, **kwargs):
        self.stdout.write('\n📍 Seeding Ubicaciones (in_oficina)...')

        # Asegurar que existe al menos una gestión activa
        gestion, created_g = in_gestion.objects.get_or_create(
            gest_ini=2026,
            defaults={'gest_fin': 2026, 'a_b': 'A'}
        )
        if created_g:
            self.stdout.write('  + Gestión 2026 creada.')
        cod_gest_val = gestion.pk

        defaults_comunes = dict(tipo_act=1, cod_activ='ACT', cod_gest=cod_gest_val, a_b='A')

        # ==============================================================
        # NIVEL 1 — cod_dpto: 1 carácter  (1-9 | A-Z)
        # ==============================================================
        self.stdout.write('\n🏛️  Nivel 1 — Campus...')
        #
        # Formato: X
        # Ejemplos: '1', '2', '3'
        sedes_n1 = [
            {'cod': '1', 'nombre': 'Campus Universitario'},
            {'cod': '2', 'nombre': 'Ciudad Universitaria'},
            {'cod': '3', 'nombre': 'Campus Radial 27'},
        ]

        creados_n1 = {}
        for data in sedes_n1:
            obj, created = in_oficina.objects.get_or_create(
                cod_dpto=data['cod'],
                cod_padre=None,
                defaults={**defaults_comunes, 'des_dpto': data['nombre'], 'nivel': 1},
            )
            creados_n1[data['cod']] = obj
            self.stdout.write(f'  {"✅ Creado" if created else "⏭️  Ya existe"}: [{data["cod"]}] {data["nombre"]}')

        # ==============================================================
        # NIVEL 2 — cod_dpto: 2 caracteres  (01-99 | A-ZZ)
        # ==============================================================
        self.stdout.write('\n🏢  Nivel 2 — Edificios...')
        #
        # Formato: XX
        # Clave del padre: n1_cod
        edificios_n2 = [
            # Campus Universitario (padre: '1')
            {'cod': '01', 'nombre': 'Edificio Central',                   'padre': '1'},
            {'cod': '02', 'nombre': 'Edificio Archivo',                   'padre': '1'},
            {'cod': '03', 'nombre': 'Edificio Bolivar',                   'padre': '1'},
            {'cod': '04', 'nombre': 'Edificio Colon',                     'padre': '1'},
            {'cod': '05', 'nombre': 'Edificio Ex-ENFE',                   'padre': '1'},
            {'cod': '06', 'nombre': 'Edif. Carr. Idiomas Fac. Humanidad', 'padre': '1'},
            # Ciudad Universitaria (padre: '2')
            {'cod': '01', 'nombre': 'Pabellon 12',                        'padre': '2'},
            {'cod': '02', 'nombre': 'Pabellon 18',                        'padre': '2'},
            {'cod': '03', 'nombre': 'Pabellon 31',                        'padre': '2'},
            {'cod': '04', 'nombre': 'Edif. Fac. Politecnica',             'padre': '2'},
        ]

        # Clave compuesta (padre_cod, hijo_cod) para recuperar en nivel 3
        creados_n2 = {}
        for data in edificios_n2:
            padre_obj = creados_n1.get(data['padre'])
            if not padre_obj:
                self.stdout.write(f'  ⚠️  Padre [{data["padre"]}] no encontrado para {data["nombre"]}')
                continue
            obj, created = in_oficina.objects.get_or_create(
                cod_dpto=data['cod'],
                cod_padre=padre_obj,
                defaults={**defaults_comunes, 'des_dpto': data['nombre'], 'nivel': 2},
            )
            creados_n2[(data['padre'], data['cod'])] = obj
            self.stdout.write(f'  {"✅ Creado" if created else "⏭️  Ya existe"}: [{data["padre"]}-{data["cod"]}] {data["nombre"]}')

        # ==============================================================
        # NIVEL 3 — cod_dpto: 1 carácter  (1-9 | A-Z)
        # ==============================================================
        self.stdout.write('\n🚪  Nivel 3 — Oficinas y Salones...')
        #
        # Formato: X
        # Clave del padre: (n1_cod, n2_cod)
        oficinas_n3 = [
            # Edificio Central  padre: ('1', '01')
            {'cod': '1', 'nombre': 'Rectorado',                   'padre': ('1', '01')},
            {'cod': '2', 'nombre': 'Vicerrectorado',              'padre': ('1', '01')},
            {'cod': '3', 'nombre': 'Secretaria General',          'padre': ('1', '01')},
            {'cod': '4', 'nombre': 'Auditoria Interna',           'padre': ('1', '01')},
            {'cod': '5', 'nombre': 'Asesoria Legal',              'padre': ('1', '01')},
            {'cod': '6', 'nombre': 'Direccion Adm. y Financiera', 'padre': ('1', '01')},
            {'cod': '7', 'nombre': 'Central Telefonica',          'padre': ('1', '01')},
            {'cod': '8', 'nombre': 'Control de Asistencia',       'padre': ('1', '01')},
            {'cod': '9', 'nombre': 'Contabilidad',                'padre': ('1', '01')},
            {'cod': 'A', 'nombre': 'Biblioteca Central',          'padre': ('1', '01')},
            # Pabellon 12  padre: ('2', '01')
            {'cod': '1', 'nombre': 'Oficina Rector',              'padre': ('2', '01')},
            {'cod': '2', 'nombre': 'Sala de Reuniones',           'padre': ('2', '01')},
            {'cod': '3', 'nombre': 'Secretaria',                  'padre': ('2', '01')},
            # Pabellon 31  padre: ('2', '03')
            {'cod': '1', 'nombre': 'Salon 13',                    'padre': ('2', '03')},
            {'cod': '2', 'nombre': 'Salon 14',                    'padre': ('2', '03')},
            {'cod': '3', 'nombre': 'Laboratorio Informatica',     'padre': ('2', '03')},
            # Fac. Politecnica  padre: ('2', '04')
            {'cod': '1', 'nombre': 'Decanato',                    'padre': ('2', '04')},
            {'cod': '2', 'nombre': 'Aula Magna',                  'padre': ('2', '04')},
            {'cod': '3', 'nombre': 'Laboratorio Electronica',     'padre': ('2', '04')},
        ]

        for data in oficinas_n3:
            padre_obj = creados_n2.get(data['padre'])
            if not padre_obj:
                self.stdout.write(f'  ⚠️  Padre {data["padre"]} no encontrado para {data["nombre"]}')
                continue
            n1, n2 = data['padre']
            obj, created = in_oficina.objects.get_or_create(
                cod_dpto=data['cod'],
                cod_padre=padre_obj,
                defaults={**defaults_comunes, 'des_dpto': data['nombre'], 'nivel': 3},
            )
            self.stdout.write(f'  {"✅ Creado" if created else "⏭️  Ya existe"}: [{n1}-{n2}-{data["cod"]}] {data["nombre"]}')

        self.stdout.write('\n🎉 Seeder de Ubicaciones completado con éxito.\n')
