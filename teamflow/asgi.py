import os
# ========================================
# === MGP: Django 설정/초기화 순서 수정 ===
# - settings 환경 변수 설정을 가장 먼저 수행
# - django.setup() 후에 routing 임포트
# ========================================
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teamflow.settings')  # === MGP ===

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import django  # === MGP ===
django.setup()  # === MGP ===
import roles.routing  # === MGP ===

# === MGP: get_asgi_application 분리하여 재사용 ===
django_asgi_app = get_asgi_application()
# === /MGP ===

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            roles.routing.websocket_urlpatterns
        )
    ),
})