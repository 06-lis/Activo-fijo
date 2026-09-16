# Instrucciones para el Equipo (Carga de Datos)

Para que todos tengan la base de datos idéntica, con todos los catálogos (Grupos, Oficinas, Marcas, etc.) y el usuario Administrador configurado por Lizet, sigan estos pasos después de clonar el repositorio:

### 1. Aplicar Migraciones
Asegúrense de que su base de datos PostgreSQL local esté creada y vacía.
Entren a la carpeta del backend y corran:
```bash
cd activo-fijo-backend
python manage.py migrate
```

### 2. Cargar los Datos Iniciales (Catálogos y Usuarios)
Para inyectar toda la configuración y catálogos, corran este comando:
```bash
python manage.py loaddata activo/fixtures/initial_data.json
```

### 3. ¡Listo! Acceso al Sistema
Una vez cargados los datos, levanten su servidor React y Django, y loguéense con:
* **Usuario:** `admin` (y en correo, para la UI: `admin@activo.com`)
* **Contraseña:** `123456`

Este usuario tiene el rol de Administrador General y todos los permisos globales del sistema.
