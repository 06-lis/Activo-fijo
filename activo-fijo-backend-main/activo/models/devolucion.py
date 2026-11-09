from django.db import models
from django.utils import timezone


class in_devolucion(models.Model):
    """Registro de devolución de activos bajo custodia de un funcionario."""
    ESTADO_CHOICES = [
        ('P', 'Pendiente'),
        ('C', 'Completada'),
        ('A', 'Anulada'),
    ]

    nro_devolucion = models.AutoField(primary_key=True)
    cod_asig = models.ForeignKey(
        'in_asignado',
        on_delete=models.PROTECT,
        db_column='cod_asig',
        related_name='devoluciones'
    )
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo',
        related_name='devoluciones'
    )
    id_empleado_recibe = models.ForeignKey(
        'in_empleado',
        on_delete=models.PROTECT,
        db_column='id_empleado_recibe',
        related_name='devoluciones_recibidas',
        verbose_name='Empleado que recibe los bienes'
    )
    fecha_devolucion = models.DateField(default=timezone.now)
    observaciones = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=1, choices=ESTADO_CHOICES, default='C')
    a_b = models.CharField(max_length=1, default='A')

    class Meta:
        db_table = 'in_devolucion'
        managed = True
        ordering = ['-nro_devolucion']

    def __str__(self):
        return f"Devolución {self.nro_devolucion} - Activo {self.nro_activo_id}"


class in_certificado_liberacion(models.Model):
    """Certificado de Liberación de Responsabilidad de Activo Fijo."""
    ESTADO_CHOICES = [
        ('E', 'Emitido'),
        ('V', 'Vigente'),
        ('A', 'Anulado'),
    ]

    nro_certificado = models.AutoField(primary_key=True)
    id_empleado = models.ForeignKey(
        'in_empleado',
        on_delete=models.PROTECT,
        db_column='id_empleado',
        related_name='certificados_liberacion'
    )
    fecha_emision = models.DateField(default=timezone.now)
    id_usuario_genera = models.ForeignKey(
        'in_usuario',
        on_delete=models.PROTECT,
        db_column='id_usuario_genera',
        related_name='certificados_generados',
        null=True, blank=True
    )
    nro_devolucion = models.ForeignKey(
        'in_devolucion',
        on_delete=models.PROTECT,
        db_column='nro_devolucion',
        null=True, blank=True,
        related_name='certificado'
    )
    estado = models.CharField(max_length=1, choices=ESTADO_CHOICES, default='E')
    a_b = models.CharField(max_length=1, default='A')

    class Meta:
        db_table = 'in_certificado_liberacion'
        managed = True
        ordering = ['-nro_certificado']

    def __str__(self):
        return f"Certificado {self.nro_certificado} - {self.id_empleado_id}"
