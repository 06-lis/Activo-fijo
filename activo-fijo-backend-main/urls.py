import json
from django.contrib import admin
from django.urls import path
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static
from activo.views import upload_pdf, upload_image, upload_baja_pdf

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
    path('upload/', csrf_exempt(upload_pdf), name='upload_pdf'),
    path('upload_image/', csrf_exempt(upload_image), name='upload_image'),
    path('upload_baja/', csrf_exempt(upload_baja_pdf), name='upload_baja_pdf'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)