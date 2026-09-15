import os
import uuid
from django.utils.text import slugify
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage

@csrf_exempt
def upload_pdf(request):
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'success': False, 'error': 'No se recibió ningún archivo.'}, status=400)
        
        if not file.name.lower().endswith('.pdf'):
            return JsonResponse({'success': False, 'error': 'El archivo debe ser un PDF.'}, status=400)
        
        try:
            # Asegurar que el directorio media/revaluos exista
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'revaluos')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Sanitizar y acortar el nombre del archivo para evitar desbordar campos en la BD
            base, ext = os.path.splitext(file.name)
            if not ext:
                ext = '.pdf'
            
            # Limitar el slug del nombre base a 20 caracteres
            safe_base = slugify(base)[:20]
            if not safe_base:
                safe_base = 'documento'
            
            # Generar un sufijo único para evitar colisiones (longitud total reducida)
            unique_filename = f"{safe_base}_{uuid.uuid4().hex[:10]}{ext}"
            
            fs = FileSystemStorage(location=upload_dir, base_url='/media/revaluos/')
            filename = fs.save(unique_filename, file)
            
            # Retornar la ruta del archivo para almacenar en la base de datos
            return JsonResponse({
                'success': True,
                'filePath': f"/media/revaluos/{filename}"
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
            
    return JsonResponse({'success': False, 'error': 'Método no permitido.'}, status=405)


@csrf_exempt
def upload_image(request):
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'success': False, 'error': 'No se recibió ningún archivo.'}, status=400)
        
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in valid_extensions:
            return JsonResponse({'success': False, 'error': 'El archivo debe ser una imagen (jpg, jpeg, png, webp, gif).'}, status=400)
        
        try:
            # Asegurar que el directorio media/vehiculos exista
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'vehiculos')
            os.makedirs(upload_dir, exist_ok=True)
            
            base, _ = os.path.splitext(file.name)
            safe_base = slugify(base)[:20]
            if not safe_base:
                safe_base = 'vehiculo'
            
            unique_filename = f"{safe_base}_{uuid.uuid4().hex[:10]}{ext}"
            
            fs = FileSystemStorage(location=upload_dir, base_url='/media/vehiculos/')
            filename = fs.save(unique_filename, file)
            
            return JsonResponse({
                'success': True,
                'filePath': f"/media/vehiculos/{filename}"
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
            
    return JsonResponse({'success': False, 'error': 'Método no permitido.'}, status=405)


@csrf_exempt
def upload_baja_pdf(request):
    if request.method == 'POST':
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({'success': False, 'error': 'No se recibió ningún archivo.'}, status=400)
        
        if not file.name.lower().endswith('.pdf'):
            return JsonResponse({'success': False, 'error': 'El archivo debe ser un PDF.'}, status=400)
        
        try:
            # Asegurar que el directorio media/bajas exista
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'bajas')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Sanitizar y acortar el nombre del archivo para evitar desbordar campos en la BD
            base, ext = os.path.splitext(file.name)
            if not ext:
                ext = '.pdf'
            
            safe_base = slugify(base)[:20]
            if not safe_base:
                safe_base = 'baja'
            
            # Generar un sufijo único para evitar colisiones
            unique_filename = f"{safe_base}_{uuid.uuid4().hex[:10]}{ext}"
            
            fs = FileSystemStorage(location=upload_dir, base_url='/media/bajas/')
            filename = fs.save(unique_filename, file)
            
            return JsonResponse({
                'success': True,
                'filePath': f"/media/bajas/{filename}"
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
            
    return JsonResponse({'success': False, 'error': 'Método no permitido.'}, status=405)


