from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/roles/<int:team_id>/assignment/", consumers.RoleAssignmentConsumer.as_asgi()),
]