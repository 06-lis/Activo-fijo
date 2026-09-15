from django.db import models

class in_motivo(models.Model):
    motivo = models.SmallIntegerField(primary_key=True)
    descripcion = models.CharField(max_length=30)

    class Meta:
        db_table = 'in_motivo'
        managed = True

    def __str__(self):
        return f"{self.motivo} - {self.descripcion}"


class in_baja_act(models.Model):
    nro = models.AutoField(primary_key=True)
    cod_asig = models.IntegerField()
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo',
        related_name='bajas_detalladas'
    )
    tipo_per_aut = models.SmallIntegerField()
    cod_emp_aut = models.IntegerField()
    documento = models.CharField(max_length=100, null=True, blank=True)
    fecha_baja_te = models.DateField()
    motivo = models.CharField(max_length=1)
    fecha_baja_ef = models.DateField(null=True, blank=True)
    observacion = models.CharField(max_length=150, null=True, blank=True)
    tipo_trans = models.SmallIntegerField(null=True, blank=True)
    cod_trans = models.IntegerField(null=True, blank=True)
    fecha_trans = models.DateTimeField(null=True, blank=True)
    tipo_per_resp = models.SmallIntegerField(null=True, blank=True)
    cod_emp_resp = models.IntegerField(null=True, blank=True)
    valor_final = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'in_baja_act'
        managed = True

    def __str__(self):
        return f"Baja {self.nro} - Activo {self.nro_activo_id}"
