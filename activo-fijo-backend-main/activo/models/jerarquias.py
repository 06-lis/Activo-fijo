from django.db import models

class in_grupo(models.Model):
    cod_grupo = models.AutoField(primary_key=True)
    cod_hijo = models.CharField(max_length=20)
    des_grupo = models.CharField(max_length=70, null=True, blank=True)
    cod_padre = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        db_column='cod_padre',
        null=True,
        blank=True,
        related_name='hijos'
    )
    nivel = models.SmallIntegerField(null=True, blank=True)
    cod_gest = models.ForeignKey(
        'in_gestion',
        on_delete=models.PROTECT,
        db_column='cod_gest'
    )
    cod_tipo = models.ForeignKey(
        'in_tipo',
        on_delete=models.SET_NULL,
        db_column='cod_tipo',
        null=True,
        blank=True
    )
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_grupo'
        managed = True

    def __str__(self):
        return self.des_grupo or self.cod_hijo


class in_oficina(models.Model):
    cod_ofic = models.AutoField(primary_key=True)
    cod_dpto = models.CharField(max_length=20)
    des_dpto = models.CharField(max_length=70)
    cod_padre = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        db_column='cod_padre',
        null=True,
        blank=True,
        related_name='hijos'
    )
    tipo_act = models.SmallIntegerField()
    cod_activ = models.CharField(max_length=8)
    nivel = models.SmallIntegerField()
    cod_gest = models.IntegerField()
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_oficina'
        managed = True

    def __str__(self):
        return self.des_dpto
