from django.test import TestCase
from activo.models import in_grupo, in_oficina, in_gestion, in_tipo
from activo.schema import schema

class HierarchyValidationTestCase(TestCase):
    def setUp(self):
        # Create required catalogs
        self.gestion = in_gestion.objects.create(gest_ini=2026, gest_fin=2026, a_b='A')
        self.tipo = in_tipo.objects.create(cod_tipo=1, des_tipo="Tipo Test", a_b='A')

    def test_validar_y_calcular_nivel_helper(self):
        from activo.schema import validar_y_calcular_nivel
        # Level 1 should succeed with None parent
        lvl1 = validar_y_calcular_nivel("01", None, in_grupo)
        self.assertEqual(lvl1, 1)

        # Level 1 with parent should fail
        # Create a parent group manually
        p1 = in_grupo.objects.create(cod_hijo="01", nivel=1, cod_gest=self.gestion, cod_tipo=self.tipo, a_b='A')
        with self.assertRaises(Exception) as ctx:
            validar_y_calcular_nivel("02", p1.cod_grupo, in_grupo)
        self.assertIn("Un elemento de nivel 1 no debe tener un código de padre", str(ctx.exception))

        # Level 2 with parent should succeed
        lvl2 = validar_y_calcular_nivel("01-02", p1.cod_grupo, in_grupo)
        self.assertEqual(lvl2, 2)

        # Level 2 without parent should fail
        with self.assertRaises(Exception) as ctx:
            validar_y_calcular_nivel("01-02", None, in_grupo)
        self.assertIn("requiere especificar un padre", str(ctx.exception))

        # Level 2 parent prefix mismatch should fail
        with self.assertRaises(Exception) as ctx:
            validar_y_calcular_nivel("02-02", p1.cod_grupo, in_grupo)
        self.assertIn("Inconsistencia de jerarquía: el código del padre", str(ctx.exception))

        # Invalid format should fail
        with self.assertRaises(Exception) as ctx:
            validar_y_calcular_nivel("01-02-03-04", None, in_grupo)
        self.assertIn("Formato de código inválido", str(ctx.exception))

    def test_crear_grupo_mutation_valid(self):
        # Create level 1 group
        query_lvl1 = '''
            mutation {
                crearGrupo(codHijo: "10", codGest: %s, desGrupo: "Grupo Nivel 1", codTipo: %s) {
                    grupo {
                        codGrupo
                        codHijo
                        nivel
                    }
                }
            }
        ''' % (self.gestion.cod_gest, self.tipo.cod_tipo)
        result = schema.execute(query_lvl1)
        self.assertIsNone(result.errors)
        cod_grupo_1 = result.data['crearGrupo']['grupo']['codGrupo']
        self.assertEqual(result.data['crearGrupo']['grupo']['nivel'], 1)
        self.assertEqual(result.data['crearGrupo']['grupo']['codHijo'], "10")

        # Create level 2 group (valid parent)
        query_lvl2 = '''
            mutation {
                crearGrupo(codHijo: "10-20", codGest: %s, desGrupo: "Grupo Nivel 2", codPadre: %s) {
                    grupo {
                        codGrupo
                        codHijo
                        nivel
                    }
                }
            }
        ''' % (self.gestion.cod_gest, cod_grupo_1)
        result = schema.execute(query_lvl2)
        self.assertIsNone(result.errors)
        cod_grupo_2 = result.data['crearGrupo']['grupo']['codGrupo']
        self.assertEqual(result.data['crearGrupo']['grupo']['nivel'], 2)

        # Create level 3 group (valid parent)
        query_lvl3 = '''
            mutation {
                crearGrupo(codHijo: "10-20-30", codGest: %s, desGrupo: "Grupo Nivel 3", codPadre: %s) {
                    grupo {
                        codGrupo
                        codHijo
                        nivel
                    }
                }
            }
        ''' % (self.gestion.cod_gest, cod_grupo_2)
        result = schema.execute(query_lvl3)
        self.assertIsNone(result.errors)
        self.assertEqual(result.data['crearGrupo']['grupo']['nivel'], 3)

    def test_crear_grupo_mutation_invalid(self):
        # Invalid format
        query_invalid_format = '''
            mutation {
                crearGrupo(codHijo: "10-2", codGest: %s) {
                    grupo {
                        codGrupo
                    }
                }
            }
        ''' % self.gestion.cod_gest
        result = schema.execute(query_invalid_format)
        self.assertIsNotNone(result.errors)
        self.assertIn("Formato de código inválido", result.errors[0].message)

    def test_crear_grupo_con_detalles(self):
        # Create group with inline details
        query = '''
            mutation {
                crearGrupo(
                    codHijo: "10"
                    codGest: %s
                    desGrupo: "Muebles"
                    vidaUtilDefault: 10
                    codigoContable: "1101"
                ) {
                    grupo {
                        codGrupo
                        codHijo
                        vidaUtilDefault
                        tasaDepreciacion
                        codigoContable
                    }
                }
            }
        ''' % self.gestion.cod_gest
        result = schema.execute(query)
        self.assertIsNone(result.errors)
        group_data = result.data['crearGrupo']['grupo']
        self.assertEqual(group_data['codHijo'], "10")
        self.assertEqual(group_data['vidaUtilDefault'], 10)
        self.assertEqual(group_data['tasaDepreciacion'], 10.0)
        self.assertEqual(group_data['codigoContable'], "1101")

        # Now test editing details
        cod_grupo = group_data['codGrupo']
        query_edit = '''
            mutation {
                editarGrupo(
                    codGrupo: %s
                    vidaUtilDefault: 5
                    codigoContable: "1102"
                ) {
                    grupo {
                        codGrupo
                        vidaUtilDefault
                        tasaDepreciacion
                        codigoContable
                    }
                }
            }
        ''' % cod_grupo
        result_edit = schema.execute(query_edit)
        self.assertIsNone(result_edit.errors)
        edit_data = result_edit.data['editarGrupo']['grupo']
        self.assertEqual(edit_data['vidaUtilDefault'], 5)
        self.assertEqual(edit_data['tasaDepreciacion'], 20.0)
        self.assertEqual(edit_data['codigoContable'], "1102")


    def test_dar_de_baja_blocking(self):
        # Create parent and child
        p1 = in_grupo.objects.create(cod_hijo="01", nivel=1, cod_gest=self.gestion, cod_tipo=self.tipo, a_b='A')
        in_grupo.objects.create(cod_hijo="01-02", cod_padre=p1, nivel=2, cod_gest=self.gestion, cod_tipo=self.tipo, a_b='A')

        # Try to deactivate parent p1
        query_baja = '''
            mutation {
                darDeBajaGrupo(codGrupo: %s) {
                    grupo {
                        codGrupo
                        aB
                    }
                }
            }
        ''' % p1.cod_grupo
        result = schema.execute(query_baja)
        self.assertIsNotNone(result.errors)
        self.assertIn("No se puede dar de baja este grupo porque tiene subgrupos activos dependientes.", result.errors[0].message)

        # Now deactivate the child first
        child = in_grupo.objects.get(cod_hijo="01-02")
        child.a_b = 'B'
        child.save()

        # Try again to deactivate parent
        result = schema.execute(query_baja)
        self.assertIsNone(result.errors)
        self.assertEqual(result.data['darDeBajaGrupo']['grupo']['aB'], "B")


class AuthenticationRBACTestCase(TestCase):
    def test_user_password_hashing(self):
        from activo.models.rbac import in_empleado, in_usuario
        from datetime import date
        emp = in_empleado.objects.create(
            nombre="Juan",
            apellido="Perez",
            numero_documento="12345678",
            tipo_documento="DNI",
            fecha_ingreso=date.today(),
            salario=1500.00
        )
        user = in_usuario.objects.create(
            correo="juan@test.com",
            id_empleado=emp,
            estado="ACTIVO"
        )
        user.set_password("mi_secreto_123")
        user.save()

        # Check password checkpw
        self.assertTrue(user.check_password("mi_secreto_123"))
        self.assertFalse(user.check_password("wrong_password"))

    def test_token_auth_mutation(self):
        from activo.models.rbac import in_empleado, in_usuario
        from datetime import date
        emp = in_empleado.objects.create(
            nombre="Juan",
            apellido="Perez",
            numero_documento="12345678",
            tipo_documento="DNI",
            fecha_ingreso=date.today(),
            salario=1500.00
        )
        user = in_usuario.objects.create(
            correo="juan@test.com",
            id_empleado=emp,
            estado="ACTIVO"
        )
        user.set_password("mi_secreto_123")
        user.save()

        # Execute tokenAuth mutation
        query = '''
            mutation {
                tokenAuth(username: "juan@test.com", password: "mi_secreto_123", captcha: "bypass") {
                    token
                    requires2fa
                    userEmail
                }
            }
        '''
        class DummyContext:
            COOKIES = {}
            META = {}
            def __init__(self):
                self.jwt_cookie_to_set = None

        context = DummyContext()
        result = schema.execute(query, context_value=context)
        self.assertIsNone(result.errors)
        self.assertIsNotNone(result.data['tokenAuth']['token'])
        self.assertFalse(result.data['tokenAuth']['requires2fa'])
        self.assertEqual(result.data['tokenAuth']['userEmail'], "juan@test.com")

        # Wrong password
        query_wrong = '''
            mutation {
                tokenAuth(username: "juan@test.com", password: "wrong_password", captcha: "bypass") {
                    token
                }
            }
        '''
        result_wrong = schema.execute(query_wrong)
        self.assertIsNotNone(result_wrong.errors)
        self.assertIn("Credenciales incorrectas", result_wrong.errors[0].message)

    def test_registrar_empleado_usuario(self):
        query = '''
            mutation {
                registrarEmpleadoUsuario(
                    nombre: "Maria",
                    apellido: "Gomez",
                    numeroDocumento: "87654321",
                    tipoDocumento: "PASAPORTE",
                    fechaIngreso: "2026-06-08",
                    salario: "2500.00",
                    correo: "maria@test.com",
                    contrasena: "pass123"
                ) {
                    usuario {
                        correo
                        estado
                    }
                }
            }
        '''
        result = schema.execute(query)
        self.assertIsNone(result.errors)
        self.assertEqual(result.data['registrarEmpleadoUsuario']['usuario']['correo'], "maria@test.com")
        self.assertEqual(result.data['registrarEmpleadoUsuario']['usuario']['estado'], "ACTIVO")

    def test_mis_permisos_query(self):
        from activo.models.rbac import in_empleado, in_usuario, in_rol, in_permiso, in_rol_permiso_usuario
        from datetime import date
        emp = in_empleado.objects.create(
            nombre="Juan",
            apellido="Perez",
            numero_documento="12345678",
            tipo_documento="DNI",
            fecha_ingreso=date.today(),
            salario=1500.00
        )
        user = in_usuario.objects.create(
            correo="juan@test.com",
            id_empleado=emp,
            estado="ACTIVO"
        )
        user.set_password("mi_secreto_123")
        user.save()

        # Create rol and permiso
        rol_admin = in_rol.objects.create(nombre="Administrador", descripcion="Admin de sistema")
        perm_dashboard = in_permiso.objects.create(nombre="ver_dashboard")
        perm_activos = in_permiso.objects.create(nombre="ver_activos")

        # Assign to user
        in_rol_permiso_usuario.objects.create(id_usuario=user, id_rol=rol_admin, id_permiso=perm_dashboard, estado=True)
        in_rol_permiso_usuario.objects.create(id_usuario=user, id_rol=rol_admin, id_permiso=perm_activos, estado=True)

        # Mock resolve context containing Authorization header
        from activo.schema.auth_helper import generate_token
        token = generate_token(user)

        class MockRequest:
            def __init__(self, headers):
                self.headers = headers
                self.META = {}
                self.COOKIES = {'jwt_token': token}

        class MockInfo:
            def __init__(self, request):
                self.context = request

        info = MockInfo(MockRequest({'Authorization': f'JWT {token}'}))
        
        # Test resolver direct
        from activo.schema.queries import Query
        query_resolver = Query()
        perms = query_resolver.resolve_mis_permisos(info)
        self.assertEqual(len(perms), 2)
        self.assertIn("ver_dashboard", perms)
        self.assertIn("ver_activos", perms)

