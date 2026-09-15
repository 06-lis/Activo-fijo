import json
import time
from django.core.cache import cache
from django.http import JsonResponse
from graphql import parse
from graphql.language.ast import FieldNode, OperationDefinitionNode

from django.conf import settings

def get_depth_and_check_introspection(node, has_introspection):
    if not hasattr(node, 'selection_set') or not node.selection_set:
        return 0, has_introspection
    
    max_depth = 0
    for selection in node.selection_set.selections:
        if isinstance(selection, FieldNode):
            # 3. Disable Introspection checks
            if selection.name.value in ['__schema', '__type']:
                has_introspection = True
                
            depth, has_introspection = get_depth_and_check_introspection(selection, has_introspection)
            max_depth = max(max_depth, depth)
            
    return max_depth + 1, has_introspection

class GraphQLSecurityDjangoMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == '/graphql/':
            # 1. Rate Limiting
            ip = request.META.get('REMOTE_ADDR')
            key = f"rate_limit_{ip}"
            
            request_data = cache.get(key, [])
            now = time.time()
            request_data = [t for t in request_data if now - t < 60]
            
            if len(request_data) >= 100:
                return JsonResponse({"errors": [{"message": "Rate limit exceeded. Too many requests."}]}, status=429)
            
            request_data.append(now)
            cache.set(key, request_data, 60)

            # 2 & 3. Query Depth Limiting and Introspection
            if request.method == 'POST':
                try:
                    body = json.loads(request.body)
                    query = body.get('query', '')
                    if query:
                        document = parse(query)
                        for definition in document.definitions:
                            if isinstance(definition, OperationDefinitionNode):
                                depth, has_introspection = get_depth_and_check_introspection(definition, False)
                                
                                # Check Introspection
                                if has_introspection and not settings.DEBUG:
                                    return JsonResponse({"errors": [{"message": "Introspection is disabled in production."}]}, status=400)
                                
                                # Check Depth limit
                                if depth > 10:
                                    return JsonResponse({"errors": [{"message": f"Query depth limit exceeded. Max is 10, got {depth}."}]}, status=400)
                except Exception:
                    pass

        return self.get_response(request)
