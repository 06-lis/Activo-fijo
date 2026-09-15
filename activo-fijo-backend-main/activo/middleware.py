from .schema.auth_helper import get_authenticated_user

class GraphQLAuthMiddleware:
    def resolve(self, next, root, info, **args):
        # Protegemos sólo las mutaciones
        if info.parent_type.name == 'Mutation':
            # Nombres de mutaciones permitidas sin autenticación
            allowed_mutations = ['tokenAuth', 'logout', 'verifyOtp']
            
            if info.field_name not in allowed_mutations:
                user = get_authenticated_user(info)
                if not user:
                    raise Exception("Autenticación requerida para realizar esta acción.")
                
                # Adjuntamos el usuario al context para que esté disponible en la mutación si se necesita
                info.context.user = user

        return next(root, info, **args)
