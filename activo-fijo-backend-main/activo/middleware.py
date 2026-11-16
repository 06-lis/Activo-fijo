from .schema.auth_helper import get_authenticated_user

class GraphQLAuthMiddleware:
    def resolve(self, next, root, info, **args):
        # Siempre intentar adjuntar el usuario autenticado al context si es AnonymousUser o no tiene id_empleado
        user = getattr(info.context, 'user', None)
        if not user or getattr(user, 'is_anonymous', False) or not hasattr(user, 'id_empleado'):
            auth_user = get_authenticated_user(info)
            if auth_user:
                info.context.user = auth_user

        # Protegemos sólo las mutaciones que requieren auth
        if info.parent_type.name == 'Mutation':
            allowed_mutations = ['tokenAuth', 'logout', 'verifyOtp']
            if info.field_name not in allowed_mutations:
                current_user = getattr(info.context, 'user', None)
                if not current_user or getattr(current_user, 'is_anonymous', False):
                    raise Exception("Autenticación requerida para realizar esta acción.")

        return next(root, info, **args)
