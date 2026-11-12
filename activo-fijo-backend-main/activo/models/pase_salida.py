from django.db import models


class in_pase_salida(models.Model):
    """Autorizacion temporal para sacar activos del campus."""
    ESTADOS = ('PENDIENTE', 'AUTORIZADO', 'RECHAZADO', 'SALIDO', 'DEVUELTO')

    id_pase = models.AutoField(primary_key=True)
    solicitante = models.ForeignKey(
        'in_empleado', on_delete=models.PROTECT,
        db_column='id_solicitante', related_name='pases_solicitados'
    )
    oficina = models.ForeignKey(
        'in_oficina', on_delete=models.SET_NULL, null=True, blank=True,
        db_column='cod_ofic'
    )
    destino = models.CharField(max_length=150)
    motivo = models.TextField(null=True, blank=True)
    fecha_salida = models.DateField()
    fecha_retorno_est = models.DateField()
    fecha_retorno_real = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=12, default='PENDIENTE')
    vb_seguridad = models.BooleanField(default=False)
    autorizado_por = models.ForeignKey(
        'in_empleado', on_delete=models.SET_NULL, null=True, blank=True,
        db_column='autorizado_por', related_name='pases_autorizados'
    )
    observacion = models.TextField(null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'in_pase_salida'
        managed = True

    def __str__(self):
        return f"Pase #{self.id_pase} - {self.estado}"


class in_det_pase(models.Model):
    pase = models.ForeignKey(in_pase_salida, on_delete=models.CASCADE)
    nro_activo = models.ForeignKey('in_activo', on_delete=models.PROTECT, db_column='nro_activo')

    class Meta:
        db_table = 'in_det_pase'
        managed = True
        unique_together = (('pase', 'nro_activo'),)
