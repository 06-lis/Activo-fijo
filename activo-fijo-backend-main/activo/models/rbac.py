from django.db import models
from django.contrib.auth.models import BaseUserManager
import bcrypt

class in_rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'in_rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class in_permiso(models.Model):
    id_permiso = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'in_permiso'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class in_rol_permiso(models.Model):
    id_rol = models.ForeignKey(
        in_rol,
        on_delete=models.CASCADE,
        related_name='permisos',
        db_column='id_rol'
    )
    id_permiso = models.ForeignKey(
        in_permiso,
        on_delete=models.CASCADE,
        related_name='roles',
        db_column='id_permiso'
    )
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'in_rol_permiso'
        verbose_name = 'Rol Permiso'
        verbose_name_plural = 'Roles Permisos'
        unique_together = [['id_rol', 'id_permiso']]

    def __str__(self):
        return f"{self.id_rol.nombre} - {self.id_permiso.nombre}"


class in_empleado(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ('DNI', 'DNI'),
        ('CE', 'Carné de Extranjería'),
        ('PASAPORTE', 'Pasaporte'),
    ]

    id_empleado = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    numero_documento = models.CharField(max_length=20, unique=True)
    tipo_documento = models.CharField(max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    fecha_ingreso = models.DateField()
    salario = models.DecimalField(max_digits=10, decimal_places=2)
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    cargo = models.CharField(max_length=100, blank=True, null=True, verbose_name='Cargo')
    foto = models.URLField(max_length=500, blank=True, null=True, verbose_name='URL de Foto')
    fecha_nacimiento = models.DateField(blank=True, null=True, verbose_name='Fecha de Nacimiento')
    procedencia = models.CharField(max_length=5, blank=True, null=True, verbose_name='Procedencia')

    id_empleado_jefe = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='subordinados',
        db_column='id_empleado_jefe'
    )

    class Meta:
        db_table = 'in_empleado'
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['apellido', 'nombre']

    def __str__(self):
        return f"{self.apellido} {self.nombre}"

    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"


class in_usuario_manager(BaseUserManager):
    def get_by_natural_key(self, correo):
        return self.get(correo=correo)

    def create_user(self, correo, contrasena=None, **extra_fields):
        if not correo:
            raise ValueError('El correo es obligatorio')
        usuario = self.model(correo=correo, **extra_fields)
        if contrasena:
            usuario.set_password(contrasena)
        usuario.save(using=self._db)
        return usuario


class in_usuario(models.Model):
    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = []

    objects = in_usuario_manager()

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
        ('BLOQUEADO', 'Bloqueado'),
    ]

    id_usuario = models.AutoField(primary_key=True)
    correo = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=255)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO')

    otp_secret = models.CharField(max_length=32, null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)

    id_empleado = models.OneToOneField(
        in_empleado,
        on_delete=models.CASCADE,
        related_name='usuario',
        db_column='id_empleado',
        unique=True
    )

    def set_password(self, raw_password: str):
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(raw_password.encode('utf-8'), salt)
        self.contrasena = hashed.decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        try:
            return bcrypt.checkpw(
                raw_password.encode('utf-8'),
                self.contrasena.encode('utf-8')
            )
        except Exception:
            return False

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return self.estado == 'ACTIVO'

    @property
    def pk(self):
        return self.id_usuario

    class Meta:
        db_table = 'in_usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['correo']

    def __str__(self):
        return self.correo

    def get_username(self):
        return self.correo

    def __eq__(self, other):
        return self.pk == other.pk

    def __hash__(self):
        return hash(self.pk)


class in_rol_permiso_usuario(models.Model):
    id_usuario = models.ForeignKey(
        in_usuario,
        on_delete=models.CASCADE,
        related_name='roles_permisos',
        db_column='id_usuario'
    )
    id_rol = models.ForeignKey(
        in_rol,
        on_delete=models.CASCADE,
        related_name='usuarios_permisos',
        db_column='id_rol'
    )
    id_permiso = models.ForeignKey(
        in_permiso,
        on_delete=models.CASCADE,
        related_name='usuarios_roles',
        db_column='id_permiso'
    )
    estado = models.BooleanField(default=True)
    fecha_asignacion = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'in_rol_permiso_usuario'
        verbose_name = 'Rol Permiso Usuario'
        verbose_name_plural = 'Roles Permisos Usuarios'
        unique_together = [['id_usuario', 'id_rol', 'id_permiso']]

    def __str__(self):
        return f"{self.id_usuario.correo} - {self.id_rol.nombre} - {self.id_permiso.nombre}"
