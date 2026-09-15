from django.db import models

class in_tasa_rev(models.Model):
    nro = models.AutoField(primary_key=True)
    fecha = models.DateField(unique=True)
    ufv = models.DecimalField(max_digits=8, decimal_places=6)

    class Meta:
        db_table = 'in_tasa_rev'
        managed = True

    def __str__(self):
        return f"UFV {self.fecha}: {self.ufv}"
