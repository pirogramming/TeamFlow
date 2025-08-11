import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import roles.routing # ⬅️ 방금 만든 라우팅 임포트

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teamflow.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            roles.routing.websocket_urlpatterns
        )
    ),
})

