import io
with io.open('activo/schema/queries.py', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('\\\'', "'")
with io.open('activo/schema/queries.py', 'w', encoding='utf-8') as f:
    f.write(content)
