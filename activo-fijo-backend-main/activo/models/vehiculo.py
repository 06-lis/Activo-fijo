from django.db import models

class in_vehic(models.Model):
    nro_activo = models.OneToOneField(
        'in_activo',
        on_delete=models.CASCADE,
        db_column='nro_activo',
        primary_key=True,
        related_name='vehiculo'
    )
    tipo = models.CharField(max_length=20, null=True, blank=True)
    marca = models.CharField(max_length=20, null=True, blank=True)
    modelo = models.CharField(max_length=20, null=True, blank=True)
    anio = models.SmallIntegerField(null=True, blank=True)
    color = models.CharField(max_length=20, null=True, blank=True)
    placa = models.CharField(max_length=10, null=True, blank=True)
    motor = models.CharField(max_length=20, null=True, blank=True)
    chasis = models.CharField(max_length=20, null=True, blank=True)
    cilindrada = models.SmallIntegerField(null=True, blank=True)
    industria = models.CharField(max_length=20, null=True, blank=True)
    ruat = models.CharField(max_length=11, null=True, blank=True)
    carnet_prop = models.CharField(max_length=11, null=True, blank=True)
    poliza = models.CharField(max_length=20, null=True, blank=True)
    factura = models.IntegerField(null=True, blank=True)
    res_min = models.CharField(max_length=20, null=True, blank=True)
    res_adm = models.CharField(max_length=20, null=True, blank=True)
    inf_tec = models.CharField(max_length=20, null=True, blank=True)
    ley_estado = models.CharField(max_length=20, null=True, blank=True)
    ds = models.CharField(max_length=20, null=True, blank=True)
    doc_transf = models.CharField(max_length=20, null=True, blank=True)
    doc_comp_ven = models.CharField(max_length=20, null=True, blank=True)
    minuta = models.CharField(max_length=20, null=True, blank=True)
    acta_co_ve = models.CharField(max_length=20, null=True, blank=True)
    imagen = models.FileField(upload_to='vehiculos/', null=True, blank=True)

    class Meta:
        db_table = 'in_vehic'
        managed = True

    def __str__(self):
        return f"Vehículo del Activo {self.nro_activo_id} - Placa {self.placa or 'S/P'}"
