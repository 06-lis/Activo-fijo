"""
Borra los datos creados por cargar_datos_prueba.py (activos con codigo PRB-).
Ejecutar desde D:\\Activo-fijo\\activo-fijo-backend-main:
    python manage.py shell -c "exec(open('borrar_datos_prueba.py', encoding='utf-8').read())"
Los catalogos nuevos (marcas, motivos, etc.) se dejan: no estorban.
"""


def _borrar():
    from activo.models.activo import in_activo
    from activo.models.ingreso import in_ingreso
    from activo.models.asignacion import in_asignado, in_det_asig, in_encargado
    from activo.models.bajas import in_baja_act
    from activo.models.vehiculo import in_vehic
    from activo.models.inmueble import in_inmueble

    acts = in_activo.objects.filter(cod_activo__startswith='PRB-')
    pks = list(acts.values_list('pk', flat=True))
    if not pks:
        print("No hay activos PRB- para borrar.")
        return
    asigs = list(set(in_det_asig.objects.filter(nro_activo_id__in=pks)
                     .values_list('cod_asig_id', flat=True)))

    in_baja_act.objects.filter(nro_activo_id__in=pks).delete()
    in_vehic.objects.filter(nro_activo_id__in=pks).delete()
    in_inmueble.objects.filter(nro_activo_id__in=pks).delete()
    in_det_asig.objects.filter(nro_activo_id__in=pks).delete()
    in_encargado.objects.filter(cod_asig_id__in=asigs).delete()
    in_asignado.objects.filter(cod_asig__in=asigs).delete()
    acts.delete()
    in_ingreso.objects.filter(glosa__startswith='PRB ').delete()
    print(f"Borrados {len(pks)} activos de prueba y sus datos relacionados.")


from django.db import transaction
with transaction.atomic():
    _borrar()
