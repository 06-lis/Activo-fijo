from django.db import models

class in_atributo(models.Model):
    cod_atrib = models.AutoField(primary_key=True)
    cod_grupo = models.ForeignKey(
        'in_grupo',
        on_delete=models.PROTECT,
        db_column='cod_grupo'
    )
    des = models.CharField(max_length=30)
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_atributo'
        managed = True

    def __str__(self):
        return self.des


class in_det_atrib(models.Model):
    cod_det_atrib = models.AutoField(primary_key=True)
    cod_atrib = models.ForeignKey(
        in_atributo,
        on_delete=models.PROTECT,
        db_column='cod_atrib'
    )
    nro_atrib = models.CharField(max_length=2)
    des = models.CharField(max_length=30)
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_det_atrib'
        managed = True
        unique_together = [('cod_atrib', 'nro_atrib')]

    def __str__(self):
        return self.des


class in_atrib_activo(models.Model):
    cod_det_atrib = models.ForeignKey(
        in_det_atrib,
        on_delete=models.PROTECT,
        db_column='cod_det_atrib'
    )
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo'
    )
    ok = models.CharField(max_length=1)
    valor = models.CharField(max_length=25)
    unidad = models.SmallIntegerField()

    class Meta:
        db_table = 'in_atrib_activo'
        managed = True
        unique_together = [('cod_det_atrib', 'nro_activo')]
