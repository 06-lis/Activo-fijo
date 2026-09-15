from django.db import models

class in_parte_grupo(models.Model):
    cod_parte = models.ForeignKey(
        'in_parte',
        on_delete=models.PROTECT,
        db_column='cod_parte'
    )
    cod_grupo = models.ForeignKey(
        'in_grupo',
        on_delete=models.PROTECT,
        db_column='cod_grupo'
    )

    class Meta:
        db_table = 'in_parte_grupo'
        managed = True
        unique_together = [('cod_parte', 'cod_grupo')]


class in_mod_grp(models.Model):
    cod_grupo = models.ForeignKey(
        'in_grupo',
        on_delete=models.PROTECT,
        db_column='cod_grupo'
    )
    cod_modelo = models.ForeignKey(
        'in_modelo',
        on_delete=models.PROTECT,
        db_column='cod_modelo'
    )
    cod_marca = models.ForeignKey(
        'in_marca',
        on_delete=models.PROTECT,
        db_column='cod_marca'
    )
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_mod_grp'
        managed = True
        unique_together = [('cod_modelo', 'cod_marca', 'cod_grupo')]


class in_det_grp(models.Model):
    cod_grupo = models.ForeignKey(
        'in_grupo',
        on_delete=models.PROTECT,
        db_column='cod_grupo'
    )
    vida_util_mes = models.SmallIntegerField()
    vida_util_ano = models.SmallIntegerField()
    cuenta_cont = models.IntegerField()
    cuenta_presup = models.IntegerField()

    class Meta:
        db_table = 'in_det_grp'
        managed = True


class in_det_parte(models.Model):
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo'
    )
    cod_parte = models.ForeignKey(
        'in_parte',
        on_delete=models.PROTECT,
        db_column='cod_parte'
    )
    cod_marca = models.ForeignKey(
        'in_marca',
        on_delete=models.PROTECT,
        db_column='cod_marca'
    )
    cod_modelo = models.ForeignKey(
        'in_modelo',
        on_delete=models.PROTECT,
        db_column='cod_modelo'
    )
    nro_serie = models.CharField(max_length=20, null=True, blank=True)
    cantidad = models.SmallIntegerField()
    cod_estado = models.ForeignKey(
        'in_estado',
        on_delete=models.PROTECT,
        db_column='cod_estado'
    )

    class Meta:
        db_table = 'in_det_parte'
        managed = True
