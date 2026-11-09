from django.db import models


class in_incidencia(models.Model):
    """Reporte de incidencias de activos por funcionarios (Portal Mis Activos)."""
    ESTADO_CHOICES = [
        ('P', 'Pendiente'),
        ('E', 'En proceso'),
        ('A', 'Atendida'),
        ('C', 'Cerrada'),
    ]

    nro_incidencia = models.AutoField(primary_key=True)
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo',
        related_name='incidencias'
    )
    id_empleado = models.ForeignKey(
        'in_empleado',
        on_delete=models.PROTECT,
        db_column='id_empleado',
        related_name='incidencias_reportadas'
    )
    descripcion = models.TextField()
    fecha_reporte = models.DateField(auto_now_add=True)
    evidencia_foto = models.URLField(max_length=500, null=True, blank=True)
    estado = models.CharField(max_length=1, choices=ESTADO_CHOICES, default='P')
    fecha_resolucion = models.DateField(null=True, blank=True)
    observacion_atencion = models.TextField(null=True, blank=True)
    a_b = models.CharField(max_length=1, default='A')

    class Meta:
        db_table = 'in_incidencia'
        managed = True
        ordering = ['-nro_incidencia']

    def __str__(self):
        return f"Incidencia {self.nro_incidencia} - Activo {self.nro_activo_id}"
