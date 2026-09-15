from django.db import models

class in_log_activo(models.Model):
    id = models.AutoField(primary_key=True)
    nro_activo = models.IntegerField(null=True, blank=True)
    cod_gest = models.IntegerField(null=True, blank=True)
    cod_activo = models.CharField(max_length=15, null=True, blank=True)
    cod_activo_ax = models.IntegerField(null=True, blank=True)
    cod_grupo = models.IntegerField(null=True, blank=True)
    nro_disp = models.IntegerField(null=True, blank=True)
    descripcion = models.CharField(max_length=250, null=True, blank=True)
    cod_unidad = models.SmallIntegerField(null=True, blank=True)
    monto = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    fec_adqui = models.DateField(null=True, blank=True)
    nro_serie = models.CharField(max_length=36, null=True, blank=True)
    cod_indus = models.IntegerField(null=True, blank=True)
    cod_marca = models.IntegerField(null=True, blank=True)
    cod_modelo = models.IntegerField(null=True, blank=True)
    cod_prove = models.IntegerField(null=True, blank=True)
    tipo_garan = models.SmallIntegerField(null=True, blank=True)
    doc_garan = models.CharField(max_length=30, null=True, blank=True)
    fin_garan = models.DateField(null=True, blank=True)
    cod_cond = models.SmallIntegerField(null=True, blank=True)
    cod_estado = models.SmallIntegerField(null=True, blank=True)
    nro_ingreso = models.IntegerField(null=True, blank=True)
    tipo_trans = models.SmallIntegerField(null=True, blank=True)
    cod_trans = models.IntegerField(null=True, blank=True)
    tipo_transa = models.SmallIntegerField(null=True, blank=True)
    cod_transa = models.IntegerField(null=True, blank=True)
    fecha_trans = models.DateTimeField(null=True, blank=True)
    tipo_actual = models.CharField(max_length=1, null=True, blank=True)
    nro_int = models.CharField(max_length=12, null=True, blank=True)

    class Meta:
        db_table = 'in_log_activo'
        managed = True


class in_log_ingreso(models.Model):
    id = models.AutoField(primary_key=True)
    nro_ingreso = models.IntegerField(null=True, blank=True)
    gestion = models.SmallIntegerField(null=True, blank=True)
    tipo_ingreso = models.IntegerField(null=True, blank=True)
    tipo_recur = models.IntegerField(null=True, blank=True)
    tipo_desc = models.IntegerField(null=True, blank=True)
    acta_recep = models.CharField(max_length=20, null=True, blank=True)
    fecha_recep = models.DateField(null=True, blank=True)
    tipo_emp_recep = models.SmallIntegerField(null=True, blank=True)
    cod_emp_recep = models.IntegerField(null=True, blank=True)
    cod_prov = models.IntegerField(null=True, blank=True)
    cod_cont = models.IntegerField(null=True, blank=True)
    cod_ofic_dest = models.IntegerField(null=True, blank=True)
    tipo_emp_dest = models.SmallIntegerField(null=True, blank=True)
    cod_emp_dest = models.IntegerField(null=True, blank=True)
    tipo_emp_codi = models.SmallIntegerField(null=True, blank=True)
    cod_emp_codi = models.IntegerField(null=True, blank=True)
    tipo_emp_enc = models.SmallIntegerField(null=True, blank=True)
    cod_emp_enc = models.IntegerField(null=True, blank=True)
    glosa = models.CharField(max_length=72, null=True, blank=True)
    nro_compra = models.IntegerField(null=True, blank=True)
    fecha_compra = models.DateField(null=True, blank=True)
    nro_egreso = models.IntegerField(null=True, blank=True)
    fecha_egreso = models.DateField(null=True, blank=True)
    nro_factura = models.IntegerField(null=True, blank=True)
    fecha_factura = models.DateField(null=True, blank=True)
    nro_doc_rpa = models.IntegerField(null=True, blank=True)
    fecha_doc_rpa = models.DateField(null=True, blank=True)
    cod_trans = models.IntegerField(null=True, blank=True)
    tipo_trans = models.SmallIntegerField(null=True, blank=True)
    fecha_trans = models.DateTimeField(null=True, blank=True)
    cod_gest = models.IntegerField(null=True, blank=True)
    estado = models.CharField(max_length=1, null=True, blank=True)
    cod_asig = models.IntegerField(null=True, blank=True)
    fecha_m_e = models.DateTimeField(null=True, blank=True)
    cod_trans_m_e = models.IntegerField(null=True, blank=True)
    tipo_trans_m_e = models.SmallIntegerField(null=True, blank=True)
    tipo_m_e = models.CharField(max_length=1, null=True, blank=True)

    class Meta:
        db_table = 'in_log_ingreso'
        managed = True


class in_log_asignado(models.Model):
    id = models.AutoField(primary_key=True)
    cod_asig = models.IntegerField(null=True, blank=True)
    tipo_asig = models.SmallIntegerField(null=True, blank=True)
    tipo_resp = models.SmallIntegerField(null=True, blank=True)
    cod_resp = models.IntegerField(null=True, blank=True)
    cod_ofic = models.IntegerField(null=True, blank=True)
    fecha_asig = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    obs = models.CharField(max_length=170, null=True, blank=True)
    tipo_trans_ant = models.SmallIntegerField(null=True, blank=True)
    cod_trans_ant = models.IntegerField(null=True, blank=True)
    tipo_trans_act = models.SmallIntegerField(null=True, blank=True)
    cod_trans_act = models.IntegerField(null=True, blank=True)
    fecha_act = models.DateTimeField(null=True, blank=True)
    tipo_log = models.CharField(max_length=1, null=True, blank=True)
    tipo_inv = models.SmallIntegerField(null=True, blank=True)
    cod_inv = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'in_log_asignado'
        managed = True


class in_log_det_asig(models.Model):
    id = models.AutoField(primary_key=True)
    cod_asig = models.IntegerField()
    nro_activo = models.IntegerField()
    cantidad = models.SmallIntegerField()
    fecha_trans = models.DateField()
    tipo_trans = models.SmallIntegerField()
    cod_trans = models.IntegerField()
    tipo_trans_act = models.SmallIntegerField()
    cod_trans_act = models.IntegerField()
    fecha_trans_act = models.DateTimeField(null=True, blank=True)
    tipo_actual = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_log_det_asig'
        managed = True


class in_log_oficina(models.Model):
    id = models.AutoField(primary_key=True)
    cod_ofic = models.IntegerField()
    cod_dpto = models.CharField(max_length=5)
    des_dpto = models.CharField(max_length=60)
    cod_padre = models.IntegerField()
    tipo_act = models.SmallIntegerField()
    cod_activ = models.CharField(max_length=8)
    nivel = models.SmallIntegerField()
    cod_gest = models.IntegerField()
    a_b = models.CharField(max_length=1)
    tipo_per_me = models.SmallIntegerField(null=True, blank=True)
    cod_emp_me = models.IntegerField(null=True, blank=True)
    fecha_me = models.DateTimeField(null=True, blank=True)
    tipo_me = models.CharField(max_length=1, null=True, blank=True)

    class Meta:
        db_table = 'in_log_oficina'
        managed = True


class in_log_det_reval(models.Model):
    id = models.AutoField(primary_key=True)
    cod_reval = models.IntegerField()
    nro_activo = models.IntegerField()
    vida_util_mes = models.SmallIntegerField()
    vida_util_ano = models.SmallIntegerField()
    tipo_moneda = models.CharField(max_length=1, null=True, blank=True)
    costo = models.DecimalField(max_digits=16, decimal_places=2)
    fecha_reval = models.DateField()
    serie_ant = models.IntegerField(null=True, blank=True)
    tipo_trans_ant = models.SmallIntegerField()
    cod_trans_ant = models.IntegerField()
    fecha_trans_ant = models.DateField()
    serie = models.IntegerField()
    estado = models.CharField(max_length=1)
    tipo = models.SmallIntegerField(null=True, blank=True)
    tipo_trans_act = models.SmallIntegerField(null=True, blank=True)
    cod_trans_act = models.IntegerField(null=True, blank=True)
    fecha_actual = models.DateTimeField(null=True, blank=True)
    tipo_actual = models.CharField(max_length=1, null=True, blank=True)

    class Meta:
        db_table = 'in_log_det_reval'
        managed = True


class in_log_baja_act(models.Model):
    id = models.AutoField(primary_key=True)
    nro = models.IntegerField()
    cod_asig = models.IntegerField()
    nro_activo = models.IntegerField()
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
    fecha_proc = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'in_log_baja_act'
        managed = True
