import json
import os
import socket
from django.contrib import admin
from django.urls import path
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from activo.views import upload_pdf, upload_image, upload_baja_pdf, upload_ingreso_image

def qr_config_api(request):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
        
    tunnel_url = None
    tunnel_file = os.path.join(settings.BASE_DIR, '..', 'tunnel_url.txt')
    if os.path.exists(tunnel_file):
        try:
            with open(tunnel_file, 'r', encoding='utf-8') as f:
                t = f.read().strip()
                if t.startswith('http'):
                    tunnel_url = t
        except Exception:
            pass

    return JsonResponse({
        'local_ip': local_ip,
        'local_url': f"http://{local_ip}:3000",
        'tunnel_url': tunnel_url,
        'recommended_url': tunnel_url or f"http://{local_ip}:3000"
    })

class CustomGraphQLView(GraphQLView):
    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        
        # Si la ejecución de Graphene dejó un token para setear
        if hasattr(request, 'jwt_cookie_to_set'):
            # En producción, usa secure=True
            secure = not settings.DEBUG
            response.set_cookie(
                'jwt_token',
                request.jwt_cookie_to_set,
                httponly=True,
                samesite='Lax',
                secure=secure,
                max_age=86400  # 1 día
            )
            
        # Si se indicó cerrar sesión
        if hasattr(request, 'jwt_cookie_to_delete'):
            response.delete_cookie('jwt_token')
            
        return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('graphql/', csrf_exempt(CustomGraphQLView.as_view(graphiql=True))),
    path('api/qr-config/', qr_config_api, name='qr_config_api'),
    path('upload/', csrf_exempt(upload_pdf), name='upload_pdf'),
    path('upload_image/', csrf_exempt(upload_image), name='upload_image'),
    path('upload_ingreso_image/', csrf_exempt(upload_ingreso_image), name='upload_ingreso_image'),
    path('upload_baja/', csrf_exempt(upload_baja_pdf), name='upload_baja_pdf'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
