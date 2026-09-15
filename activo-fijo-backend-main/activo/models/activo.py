from django.db import models

class in_activo(models.Model):
    nro_activo = models.AutoField(primary_key=True)
    cod_gest = models.ForeignKey(
        'in_gestion',
        on_delete=models.PROTECT,
        db_column='cod_gest'
    )
    cod_activo = models.CharField(max_length=15, unique=True)
    cod_grupo = models.ForeignKey(
        'in_grupo',
        on_delete=models.PROTECT,
        db_column='cod_grupo'
    )
    cod_unidad = models.ForeignKey(
        'in_unidad',
        on_delete=models.SET_NULL,
        db_column='cod_unidad',
        null=True,
        blank=True
    )
    cod_marca = models.ForeignKey(
        'in_marca',
        on_delete=models.SET_NULL,
        db_column='cod_marca',
        null=True,
        blank=True
    )
    cod_modelo = models.ForeignKey(
        'in_modelo',
        on_delete=models.SET_NULL,
        db_column='cod_modelo',
        null=True,
        blank=True
    )
    cod_prove = models.ForeignKey(
        'in_provedor',
        on_delete=models.SET_NULL,
        db_column='cod_prove',
        null=True,
        blank=True
    )
    cod_cond = models.ForeignKey(
        'in_condicion',
        on_delete=models.SET_NULL,
        db_column='cod_cond',
        null=True,
        blank=True
    )
    cod_estado = models.ForeignKey(
        'in_estado',
        on_delete=models.PROTECT,
        db_column='cod_estado'
    )
    nro_ingreso = models.ForeignKey(
        'in_ingreso',
        on_delete=models.PROTECT,
        db_column='nro_ingreso'
    )
    descripcion = models.TextField()
    monto = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    fec_adqui = models.DateField(null=True, blank=True)
    nro_serie = models.CharField(max_length=36, null=True, blank=True)
    organismo_financiador = models.IntegerField(null=True, blank=True)
    cod_rube = models.CharField(max_length=20, null=True, blank=True)
    nro_convenio = models.CharField(max_length=30, null=True, blank=True)
    estado_registro = models.CharField(max_length=20, default='ELABORADO')
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_activo'
        managed = True

    def __str__(self):
        return f"{self.cod_activo} - {self.descripcion[:50]}"
