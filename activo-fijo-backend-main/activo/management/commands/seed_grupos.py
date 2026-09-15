from django.core.management.base import BaseCommand
from activo.models import in_grupo, in_det_grp, in_gestion, in_tipo


class Command(BaseCommand):
    help = 'Seed de Grupos de Activo (in_grupo + in_det_grp) con 3 niveles'

    def handle(self, *args, **kwargs):
        self.stdout.write('\n📁 Seeding Grupos de Activo...')

        # Asegurar que existe al menos una gestión activa
        gestion, _ = in_gestion.objects.get_or_create(
            gest_ini=2026,
            defaults={'gest_fin': 2026, 'a_b': 'A'}
        )

        # Asegurar que existe al menos un tipo de activo
        tipo_activo, _ = in_tipo.objects.get_or_create(
            cod_tipo=1,
            defaults={'des_tipo': 'Tangible', 'a_b': 'A'}
        )

        defaults_comunes = dict(cod_gest=gestion, cod_tipo=tipo_activo, a_b='A')

        # ==============================================================
        # NIVEL 1 — cod_hijo: 1 carácter  (1-9 | A-Z)
        # ==============================================================
        self.stdout.write('\n📁 Nivel 1 — Grupos principales...')
        #
        # Formato: X
        # Ejemplos: '1', '2', 'E'
        grupos_n1 = [
            {'cod': '1',  'nombre': 'Muebles y Enseres',          'vida': 10, 'cont': 1100},
            {'cod': '2',  'nombre': 'Equipo de Oficina',           'vida': 8,  'cont': 1200},
            {'cod': '3',  'nombre': 'Equipo de Producción',        'vida': 8,  'cont': 1300},
            {'cod': '4',  'nombre': 'Equipo de Transporte',        'vida': 8,  'cont': 1400},
            {'cod': 'E',  'nombre': 'Derecho de Autor / Software', 'vida': 4,  'cont': 1500},
        ]

        creados_n1 = {}
        for data in grupos_n1:
            obj, created = in_grupo.objects.get_or_create(
                cod_hijo=data['cod'],
                cod_padre=None,
                defaults={**defaults_comunes, 'des_grupo': data['nombre'], 'nivel': 1},
            )
            creados_n1[data['cod']] = obj
            in_det_grp.objects.update_or_create(
                cod_grupo=obj,
                defaults={'vida_util_ano': data['vida'], 'vida_util_mes': 0,
                          'cuenta_cont': data['cont'], 'cuenta_presup': 0},
            )
            self.stdout.write(f'  {"✅ Creado" if created else "⏭️  Ya existe"}: [{data["cod"]}] {data["nombre"]}')

        # ==============================================================
        # NIVEL 2 — cod_hijo: 2 caracteres  (01-99 | A-ZZ)
        # ==============================================================
        self.stdout.write('\n📂 Nivel 2 — Subgrupos...')
        #
        # Formato: XX
        # Ejemplos: '01', '02', '0E'
        grupos_n2 = [
            # Muebles y Enseres (padre: '1')
            {'cod': '01', 'nombre': 'Muebles de Oficina',      'padre': '1',  'vida': 10, 'cont': 1101},
            {'cod': '02', 'nombre': 'Sillas y Sillones',       'padre': '1',  'vida': 10, 'cont': 1102},
            {'cod': '03', 'nombre': 'Estantes y Archivadores', 'padre': '1',  'vida': 10, 'cont': 1103},
            # Equipo de Oficina (padre: '2')
            {'cod': '01', 'nombre': 'Computadoras',            'padre': '2',  'vida': 4,  'cont': 1201},
            {'cod': '02', 'nombre': 'Impresoras y Escáneres',  'padre': '2',  'vida': 5,  'cont': 1202},
            {'cod': '03', 'nombre': 'Proyectores',             'padre': '2',  'vida': 5,  'cont': 1203},
            # Equipo de Transporte (padre: '4')
            {'cod': '01', 'nombre': 'Vehículos Livianos',      'padre': '4',  'vida': 5,  'cont': 1401},
            {'cod': '02', 'nombre': 'Motocicletas',            'padre': '4',  'vida': 5,  'cont': 1402},
            # Software (padre: 'E')
            {'cod': '01', 'nombre': 'Software de Gestión',     'padre': 'E',  'vida': 4,  'cont': 1501},
            {'cod': '02', 'nombre': 'Licencias',               'padre': 'E',  'vida': 4,  'cont': 1502},
        ]

        # Clave compuesta (padre_cod, hijo_cod) para recuperar en nivel 3
        creados_n2 = {}
        for data in grupos_n2:
            padre_obj = creados_n1.get(data['padre'])
            if not padre_obj:
                self.stdout.write(f'  ⚠️  Padre [{data["padre"]}] no encontrado para {data["nombre"]}')
                continue
            obj, created = in_grupo.objects.get_or_create(
                cod_hijo=data['cod'],
                cod_padre=padre_obj,
                defaults={**defaults_comunes, 'des_grupo': data['nombre'], 'nivel': 2},
            )
            creados_n2[(data['padre'], data['cod'])] = obj
            in_det_grp.objects.update_or_create(
                cod_grupo=obj,
                defaults={'vida_util_ano': data['vida'], 'vida_util_mes': 0,
                          'cuenta_cont': data['cont'], 'cuenta_presup': 0},
            )
            self.stdout.write(f'  {"✅ Creado" if created else "⏭️  Ya existe"}: [{data["padre"]}-{data["cod"]}] {data["nombre"]}')

        # ==============================================================
        # NIVEL 3 — cod_hijo: 1 carácter  (1-9 | A-Z)
        # ==============================================================
        self.stdout.write('\n📄 Nivel 3 — Materiales...')
        #
        # Formato: X
        # Clave del padre: (n1_cod, n2_cod)
        grupos_n3 = [
            # Computadoras  padre: ('2', '01')
            {'cod': '1', 'nombre': 'Laptops',             'padre': ('2', '01'), 'vida': 4, 'cont': 12011},
            {'cod': '2', 'nombre': 'Computadoras Fijas',  'padre': ('2', '01'), 'vida': 4, 'cont': 12012},
            {'cod': '3', 'nombre': 'Tablets',             'padre': ('2', '01'), 'vida': 4, 'cont': 12013},
            # Impresoras  padre: ('2', '02')
            {'cod': '1', 'nombre': 'Impresoras Láser',    'padre': ('2', '02'), 'vida': 5, 'cont': 12021},
            {'cod': '2', 'nombre': 'Impresoras de Tinta', 'padre': ('2', '02'), 'vida': 5, 'cont': 12022},
            # Muebles de Oficina  padre: ('1', '01')
            {'cod': '1', 'nombre': 'Escritorios',         'padre': ('1', '01'), 'vida': 10, 'cont': 11011},
            {'cod': '2', 'nombre': 'Mesas de Reunión',    'padre': ('1', '01'), 'vida': 10, 'cont': 11012},
            # Vehículos Livianos  padre: ('4', '01')
            {'cod': '1', 'nombre': 'Automóviles',         'padre': ('4', '01'), 'vida': 5, 'cont': 14011},
            {'cod': '2', 'nombre': 'Camionetas',          'padre': ('4', '01'), 'vida': 5, 'cont': 14012},
        ]

        for data in grupos_n3:
            padre_obj = creados_n2.get(data['padre'])
            if not padre_obj:
                self.stdout.write(f'  ⚠️  Padre {data["padre"]} no encontrado para {data["nombre"]}')
                continue
            n1, n2 = data['padre']
            obj, created = in_grupo.objects.get_or_create(
                cod_hijo=data['cod'],
                cod_padre=padre_obj,
                defaults={**defaults_comunes, 'des_grupo': data['nombre'], 'nivel': 3},
            )
            in_det_grp.objects.update_or_create(
                cod_grupo=obj,
                defaults={'vida_util_ano': data['vida'], 'vida_util_mes': 0,
                          'cuenta_cont': data['cont'], 'cuenta_presup': 0},
            )
            self.stdout.write(f'  {"✅ Creado" if created else "⏭️  Ya existe"}: [{n1}-{n2}-{data["cod"]}] {data["nombre"]}')

        self.stdout.write('\n🎉 Seeder de Grupos completado con éxito.\n')
