import jwt
from django.conf import settings
from datetime import datetime, timedelta

def generate_token(user):
    payload = {
        'user_id': user.id_usuario,
        'email': user.correo,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def get_user_from_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def get_authenticated_user(info):
    request = info.context
    token = None
    
    # 1. Intentar leer desde la cookie HttpOnly
    if request.COOKIES and 'jwt_token' in request.COOKIES:
        token = request.COOKIES.get('jwt_token')
        
    # 2. Si no hay cookie, intentar desde el header Authorization (por si acaso)
    if not token:
        auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
        if auth_header:
            try:
                parts = auth_header.split()
                if len(parts) == 2 and parts[0].upper() == 'JWT':
                    token = parts[1]
            except Exception:
                pass
                
    if not token:
        return None

    try:
        user_id = get_user_from_token(token)
        if user_id:
            from activo.models.rbac import in_usuario
            return in_usuario.objects.get(pk=user_id, estado='ACTIVO')
    except Exception:
        pass
    return None
