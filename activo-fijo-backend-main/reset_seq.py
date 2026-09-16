import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()
from activo.models import in_provedor
from django.db import connection

in_provedor.objects.filter(pk=3).delete()
with connection.cursor() as cursor:
    cursor.execute("SELECT setval(pg_get_serial_sequence('in_provedor', 'cod_prov'), COALESCE(MAX(cod_prov), 1)) FROM in_provedor;")
print("Proveedor 3 borrado y secuencia reiniciada a 2!")
