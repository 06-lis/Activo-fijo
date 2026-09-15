import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()

from activo.models import in_grupo

grupos = in_grupo.objects.all()
for g in grupos[:20]:
    print(f"ID: {g.cod_grupo}, Nivel: {g.nivel}, Cod: '{g.cod_hijo}', PadreID: {g.cod_padre_id}, Desc: {g.des_grupo}")
