from django.db import models

class in_provedor(models.Model):
    cod_prov = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    direccion = models.CharField(max_length=40, null=True, blank=True)
    telefono = models.CharField(max_length=12, null=True, blank=True)
    ruc = models.CharField(max_length=12, null=True, blank=True)
    ciudad = models.CharField(max_length=25, null=True, blank=True)

    class Meta:
        db_table = 'in_provedor'
        managed = True

    def __str__(self):
        return self.nombre


class in_contacto(models.Model):
    cod_cont = models.AutoField(primary_key=True)
    cod_prov = models.ForeignKey(
        in_provedor,
        on_delete=models.PROTECT,
        db_column='cod_prov'
    )
    nombre = models.CharField(max_length=45)
    tipo_docid = models.CharField(max_length=1)
    docto_idn = models.CharField(max_length=12)
    docto_idl = models.CharField(max_length=3)
    telefono = models.CharField(max_length=12)

    class Meta:
        db_table = 'in_contacto'
        managed = True

    def __str__(self):
        return self.nombre
