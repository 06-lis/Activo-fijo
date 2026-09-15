from django.db import models

class in_responsable(models.Model):
    cod_resp = models.AutoField(primary_key=True)
    cod_estprog = models.CharField(max_length=5)
    cod_emp = models.ForeignKey(
        'in_empleado',
        on_delete=models.PROTECT,
        db_column='cod_emp'
    )
    tipo_per = models.CharField(max_length=1)
    fecha = models.DateField()
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_responsable'
        managed = True

    def __str__(self):
        return f"Responsable {self.cod_resp}"


class in_solicitud(models.Model):
    nro_sol = models.AutoField(primary_key=True)
    gestion = models.SmallIntegerField()
    cod_estprog = models.CharField(max_length=5)
    emp_sol = models.ForeignKey(
        in_responsable,
        on_delete=models.PROTECT,
        db_column='emp_sol',
        related_name='solicitudes_solicitante'
    )
    glosa = models.CharField(max_length=50)
    emp_resp = models.ForeignKey(
        in_responsable,
        on_delete=models.PROTECT,
        db_column='emp_resp',
        related_name='solicitudes_responsable'
    )
    cod_emp = models.ForeignKey(
        'in_empleado',
        on_delete=models.PROTECT,
        db_column='cod_emp'
    )
    fecha = models.DateField()
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_solicitud'
        managed = True

    def __str__(self):
        return f"Solicitud {self.nro_sol}"


class in_det_sol(models.Model):
    nro_sol = models.ForeignKey(
        in_solicitud,
        on_delete=models.PROTECT,
        db_column='nro_sol'
    )
    id_material = models.IntegerField()
    cantidad = models.SmallIntegerField()

    class Meta:
        db_table = 'in_det_sol'
        managed = True
        unique_together = [('nro_sol', 'id_material')]


class in_oferta(models.Model):
    nro_oferta = models.AutoField(primary_key=True)
    nro_sol = models.ForeignKey(
        in_solicitud,
        on_delete=models.PROTECT,
        db_column='nro_sol'
    )
    cod_prov = models.ForeignKey(
        'in_provedor',
        on_delete=models.PROTECT,
        db_column='cod_prov'
    )
    fecha_ofer = models.DateField()
    glosa = models.CharField(max_length=40)
    estado = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_oferta'
        managed = True

    def __str__(self):
        return f"Oferta {self.nro_oferta}"


class in_det_ofer(models.Model):
    nro_oferta = models.ForeignKey(
        in_oferta,
        on_delete=models.PROTECT,
        db_column='nro_oferta'
    )
    id_material = models.IntegerField()
    cantidad = models.SmallIntegerField()
    monto_uni = models.DecimalField(max_digits=16, decimal_places=2)
    id_marca = models.IntegerField()
    id_modelo = models.IntegerField()

    class Meta:
        db_table = 'in_det_ofer'
        managed = True
        unique_together = [('nro_oferta', 'id_material')]


class in_orden_compra(models.Model):
    nro_compra = models.AutoField(primary_key=True)
    nro_oferta = models.ForeignKey(
        in_oferta,
        on_delete=models.PROTECT,
        db_column='nro_oferta'
    )
    emp_resp = models.ForeignKey(
        in_responsable,
        on_delete=models.PROTECT,
        db_column='emp_resp'
    )
    fecha_orden = models.DateField()
    glosa = models.CharField(max_length=40)
    nro_com_egre = models.IntegerField()
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_orden_compra'
        managed = True

    def __str__(self):
        return f"Orden {self.nro_compra}"
