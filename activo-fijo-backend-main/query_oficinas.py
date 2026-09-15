import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()

from activo.models import in_oficina

oficinas = in_oficina.objects.all()
for o in oficinas:
    print(f"ID: {o.cod_ofic}, Nivel: {o.nivel}, Cod: '{o.cod_dpto}', PadreID: {o.cod_padre_id}")
