from django.db import models


class in_semoviente(models.Model):
    """Ficha de semoviente (ganado/animales) ligada a un activo, con su baja zoosanitaria."""
    CAUSALES = ('MUERTE', 'VEJEZ', 'SACRIFICIO_SANITARIO')

    nro_activo = models.OneToOneField(
        'in_activo',
        on_delete=models.CASCADE,
        db_column='nro_activo',
        primary_key=True,
        related_name='semoviente'
    )
    especie = models.CharField(max_length=30, null=True, blank=True)
    raza = models.CharField(max_length=30, null=True, blank=True)
    sexo = models.CharField(max_length=10, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    peso_kg = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    marca_hierro = models.CharField(max_length=30, null=True, blank=True)
    reg_zoosanitario = models.CharField(max_length=30, null=True, blank=True)

    # Baja zoosanitaria
    causal_baja = models.CharField(max_length=25, null=True, blank=True)
    fecha_baja_zoo = models.DateField(null=True, blank=True)
    medico_veterinario = models.CharField(max_length=100, null=True, blank=True)
    nro_informe_vet = models.CharField(max_length=30, null=True, blank=True)
    nro_acta_necropsia = models.CharField(max_length=30, null=True, blank=True)
    obs_zoo = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'in_semoviente'
        managed = True

    def __str__(self):
        return f"Semoviente del Activo {self.nro_activo_id} - {self.especie or 'S/E'}"
