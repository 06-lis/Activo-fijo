from django.db import models

class in_asignado(models.Model):
    cod_asig = models.AutoField(primary_key=True)
    tipo_asig = models.ForeignKey(
        'in_tipo_asig',
        on_delete=models.PROTECT,
        db_column='tipo_asig'
    )
    tipo_resp = models.SmallIntegerField()
    cod_resp = models.IntegerField()
    cod_ofic = models.ForeignKey(
        'in_oficina',
        on_delete=models.PROTECT,
        db_column='cod_ofic'
    )
    fecha_asig = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_asignado'
        managed = True

    def __str__(self):
        return f"Asignación {self.cod_asig}"


class in_det_asig(models.Model):
    cod_asig = models.ForeignKey(
        in_asignado,
        on_delete=models.PROTECT,
        db_column='cod_asig'
    )
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo'
    )
    cantidad = models.SmallIntegerField()
    fecha_trans = models.DateField()

    class Meta:
        db_table = 'in_det_asig'
        managed = True
        unique_together = [('cod_asig', 'nro_activo')]


class in_encargado(models.Model):
    cod_asig = models.ForeignKey(
        in_asignado,
        on_delete=models.PROTECT,
        db_column='cod_asig'
    )
    tipo_resp = models.SmallIntegerField()
    cod_resp = models.IntegerField()
    fecha_ini = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'in_encargado'
        managed = True
