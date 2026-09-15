import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from activo.models import in_transferido
from activo.schema.mutations import EditarTransferencia, AnularTransferencia

print("Models and mutations imported successfully!")

from activo.models import in_transferido
from activo.schema import schema

print("Running test mutation...")
from activo.schema import schema

query = '''
query {
  todosActivos {
    nroActivo
    codActivo
    inDetAsigSet {
      codAsig {
        codAsig
        estado
        codOfic {
          codOfic
          desDpto
        }
      }
    }
  }
}
'''
res = schema.execute(query)
print("Errors:", res.errors)
if res.data and 'todosActivos' in res.data and len(res.data['todosActivos']) > 0:
    print("Data:", res.data['todosActivos'][0])
else:
    print("Data:", res.data)


