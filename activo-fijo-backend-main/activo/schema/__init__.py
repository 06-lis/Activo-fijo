import graphene
from .queries import Query
from .mutations import Mutation, validar_y_calcular_nivel

schema = graphene.Schema(query=Query, mutation=Mutation)
