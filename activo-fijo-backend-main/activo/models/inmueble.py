from django.db import models


class in_inmueble(models.Model):
    """Ficha de inmueble e inspeccion tecnica (I.T.E.), ligada a un activo."""
    nro_activo = models.OneToOneField(
        'in_activo',
        on_delete=models.CASCADE,
        db_column='nro_activo',
        primary_key=True,
        related_name='inmueble'
    )
    uv = models.CharField(max_length=20, null=True, blank=True)
    manzana = models.CharField(max_length=20, null=True, blank=True)
    lote = models.CharField(max_length=20, null=True, blank=True)
    cod_catastral = models.CharField(max_length=30, null=True, blank=True)
    tipologia_constructiva = models.CharField(max_length=100, null=True, blank=True)
    patologias = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'in_inmueble'
        managed = True

    def __str__(self):
        return f"Inmueble del Activo {self.nro_activo_id} - Cat. {self.cod_catastral or 'S/C'}"
