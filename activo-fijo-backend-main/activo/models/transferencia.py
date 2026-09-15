from django.db import models

class in_transferido(models.Model):
    cod_transf = models.AutoField(primary_key=True)
    tipo_transf = models.CharField(max_length=1)
    cod_asig_or = models.IntegerField(null=True, blank=True)
    cod_asig_de = models.IntegerField(null=True, blank=True)
    cod_ofi_rem = models.ForeignKey(
        'in_oficina',
        on_delete=models.PROTECT,
        db_column='cod_ofi_rem',
        related_name='transferencias_remitente'
    )
    cod_ofi_dest = models.ForeignKey(
        'in_oficina',
        on_delete=models.PROTECT,
        db_column='cod_ofi_dest',
        related_name='transferencias_destino'
    )
    fecha_transf = models.DateField()
    estado = models.CharField(max_length=1)

    class Meta:
        db_table = 'in_transferido'
        managed = True

    def __str__(self):
        return f"Transferencia {self.cod_transf}"


class in_det_tranf(models.Model):
    cod_transf = models.ForeignKey(
        in_transferido,
        on_delete=models.PROTECT,
        db_column='cod_transf'
    )
    nro_activo = models.ForeignKey(
        'in_activo',
        on_delete=models.PROTECT,
        db_column='nro_activo'
    )
    cantidad = models.IntegerField()
    tipo_trans  = models.IntegerField(default=0)
    cod_trans   = models.IntegerField(default=0)
    fecha_trans = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'in_det_tranf'
        managed = True