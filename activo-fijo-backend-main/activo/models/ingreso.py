from django.db import models

class in_ingreso(models.Model):
    nro_ingreso = models.AutoField(primary_key=True)
    gestion = models.SmallIntegerField(null=True, blank=True)
    tipo_ingreso = models.IntegerField(null=True, blank=True)
    cod_prov = models.ForeignKey(
        'in_provedor',
        on_delete=models.SET_NULL,
        db_column='cod_prov',
        null=True,
        blank=True
    )
    cod_ofic_dest = models.ForeignKey(
        'in_oficina',
        on_delete=models.SET_NULL,
        db_column='cod_ofic_dest',
        null=True,
        blank=True
    )
    nro_compra = models.IntegerField(null=True, blank=True)
    glosa = models.CharField(max_length=72, null=True, blank=True)
    estado = models.CharField(max_length=1, null=True, blank=True)


    acta_recep = models.CharField(max_length=20, null=True, blank=True)
    fecha_recep = models.DateField(null=True, blank=True)
    nro_factura = models.IntegerField(null=True, blank=True)
    fecha_factura = models.DateField(null=True, blank=True)
    nro_egreso = models.IntegerField(null=True, blank=True)
    fecha_egreso = models.DateField(null=True, blank=True)
    tipo_emp_recep = models.IntegerField(null=True, blank=True)
    cod_emp_recep = models.IntegerField(null=True, blank=True)
    tipo_emp_dest = models.IntegerField(null=True, blank=True)
    cod_emp_dest = models.IntegerField(null=True, blank=True)

    # ── Mejoras UAGRM: fotografías y visto bueno de autoridad ──────────
    foto_bien = models.URLField(max_length=500, null=True, blank=True, verbose_name='Fotografía del bien físico')
    foto_placa = models.URLField(max_length=500, null=True, blank=True, verbose_name='Fotografía de placa / número de serie')
    vo_bo_nombre = models.CharField(max_length=200, null=True, blank=True, verbose_name='Nombre autoridad Vo.Bo.')
    vo_bo_cargo = models.CharField(max_length=150, null=True, blank=True, verbose_name='Cargo autoridad Vo.Bo.')
    vo_bo_fecha = models.DateField(null=True, blank=True, verbose_name='Fecha visto bueno')
    vo_bo_aprobado_por = models.IntegerField(null=True, blank=True, verbose_name='ID empleado que aprueba')
    # ───────────────────────────────────────────────────────────────────

    class Meta:
        db_table = 'in_ingreso'
        managed = True

    def __str__(self):
        return f"Ingreso {self.nro_ingreso}"
