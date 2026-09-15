from django.db import models

class in_dep_acumulada(models.Model):
    nro_serie = models.IntegerField()
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo'
    )
    depresiacion = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    acumulada = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_actual = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valor_revaluo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'in_dep_acumulada'
        managed = True
        unique_together = [('nro_serie', 'nro_activo')]

    def __str__(self):
        return f"Dep. serie {self.nro_serie} activo {self.nro_activo_id}"
