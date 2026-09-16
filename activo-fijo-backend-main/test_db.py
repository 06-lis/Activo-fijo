import psycopg2
try:
    psycopg2.connect(dbname='activo_fijo', user='postgres', password='Aforo255#2019', host='127.0.0.1', port=5432)
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
