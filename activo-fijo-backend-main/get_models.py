import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
django.setup()

from django.apps import apps
app_models = apps.get_app_config('activo').get_models()

for model in app_models:
    print(f"Model: {model.__name__}")
