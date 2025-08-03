from django.urls import path
from . import views

urlpatterns = [
    # 예: /dashboard/1/ 처럼 팀 ID를 받는 URL
    path('', views.dashboard_router_view, name='dashboard_router'),
    path('<int:team_id>/', views.dashboard_view, name='dashboard'),
]