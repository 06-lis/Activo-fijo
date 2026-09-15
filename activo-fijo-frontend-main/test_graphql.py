import urllib.request
import json
import traceback

query = """
query GetAsignacionesPaginadas {
  todasAsignacionesPaginadas(limit: 1, offset: 0) {
    results {
      inDetAsigSet {
        nroActivo {
          nroActivo
          monto
          codGrupo { desGrupo }
          inDetRevalSet { estado }
          inDepAcumuladaSet { valorActual }
        }
      }
    }
  }
}
"""

req = urllib.request.Request('http://localhost:8000/graphql', 
    data=json.dumps({'query': query}).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'Accept': 'application/json'})

try:
    with urllib.request.urlopen(req) as f:
        res = json.loads(f.read().decode('utf-8'))
        print(json.dumps(res, indent=2))
except urllib.error.HTTPError as e:
    data = e.read().decode('utf-8')
    try:
        print(json.dumps(json.loads(data), indent=2))
    except:
        # If it's HTML, we grep the Exception message.
        import re
        m = re.search(r'Exception Value:.*?<pre>(.*?)</pre>', data, re.DOTALL)
        if m:
            print("Server Exception:", m.group(1).strip())
        else:
            print("Failed to parse error, saving to err.html")
            with open("err.html", "w") as out:
                out.write(data)
except Exception as e:
    print("Error:", e)
