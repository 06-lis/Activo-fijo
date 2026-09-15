from django.db import models

class in_estado(models.Model):
    cod_estado = models.SmallIntegerField(primary_key=True)
    des_estado = models.CharField(max_length=30)

    class Meta:
        db_table = 'in_estado'
        managed = True

    def __str__(self):
        return self.des_estado


class in_condicion(models.Model):
    cod_cond = models.SmallIntegerField(primary_key=True)
    des_cond = models.CharField(max_length=30)

    class Meta:
        db_table = 'in_condicion'
        managed = True

    def __str__(self):
        return self.des_cond


class in_unidad(models.Model):
    cod_unidad = models.SmallIntegerField(primary_key=True)
    des_unidad = models.CharField(max_length=20)
    abrev = models.CharField(max_length=5, null=True, blank=True)

    class Meta:
        db_table = 'in_unidad'
        managed = True

    def __str__(self):
        return self.des_unidad


class in_tipo_asig(models.Model):
    tipo_asig = models.SmallIntegerField(primary_key=True)
    des = models.CharField(max_length=50)
    abrev = models.CharField(max_length=20)

    class Meta:
        db_table = 'in_tipo_asig'
        managed = True

    def __str__(self):
        return self.des


class in_tipomat(models.Model):
    tipo_mat = models.IntegerField(primary_key=True)
    des_mat = models.CharField(max_length=30)

    class Meta:
        db_table = 'in_tipomat'
        managed = True

    def __str__(self):
        return self.des_mat


class in_tipo(models.Model):
    cod_tipo = models.SmallIntegerField(primary_key=True)
    des_tipo = models.CharField(max_length=30)
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_tipo'
        managed = True

    def __str__(self):
        return self.des_tipo


class in_marca(models.Model):
    cod_marca = models.AutoField(primary_key=True)
    des_marca = models.CharField(max_length=30)

    class Meta:
        db_table = 'in_marca'
        managed = True

    def __str__(self):
        return self.des_marca


class in_modelo(models.Model):
    cod_modelo = models.AutoField(primary_key=True)
    cod_marca = models.ForeignKey(
        in_marca,
        on_delete=models.PROTECT,
        db_column='cod_marca'
    )
    des_modelo = models.CharField(max_length=30)

    class Meta:
        db_table = 'in_modelo'
        managed = True

    def __str__(self):
        return self.des_modelo


class in_gestion(models.Model):
    cod_gest = models.AutoField(primary_key=True)
    gest_ini = models.SmallIntegerField()
    gest_fin = models.SmallIntegerField(null=True, blank=True)
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_gestion'
        managed = True

    def __str__(self):
        return f"{self.gest_ini}-{self.gest_fin}"


class in_parte(models.Model):
    cod_parte = models.AutoField(primary_key=True)
    des_parte = models.CharField(max_length=30)
    a_b = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_parte'
        managed = True

    def __str__(self):
        return self.des_parte


class in_revaluo(models.Model):
    cod_reval = models.AutoField(primary_key=True)
    tipo_reval = models.IntegerField()
    documento = models.CharField(max_length=255, null=True, blank=True)
    fecha_ini = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_revaluo'
        managed = True

    def __str__(self):
        return f"Revalúo {self.cod_reval}"


class in_funcion_adm(models.Model):
    cod_func = models.IntegerField(primary_key=True)
    des = models.CharField(max_length=50)
    estprog = models.CharField(max_length=5, null=True, blank=True)

    class Meta:
        db_table = 'in_funcion_adm'
        managed = True

    def __str__(self):
        return self.des
