from django.db import models

class in_det_reval(models.Model):
    cod_reval = models.ForeignKey(
        'in_revaluo',
        on_delete=models.PROTECT,
        db_column='cod_reval'
    )
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo'
    )
    vida_util_mes = models.SmallIntegerField()
    vida_util_ano = models.SmallIntegerField()
    costo = models.DecimalField(max_digits=16, decimal_places=2)
    fecha_reval = models.DateField()
    estado = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_det_reval'
        managed = True
        unique_together = [('cod_reval', 'nro_activo')]

    def __str__(self):
        return f"Revalúo det. activo {self.nro_activo_id}"
