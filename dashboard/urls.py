from django.urls import path
from . import views
from files import views as files_views

urlpatterns = [
    # ========================================
    # MGP: 대시보드 API URL 패턴 추가
    # 백엔드 부분 대신 수정: 대시보드 데이터 API
    path('api/', views.DashboardAPIView.as_view(), name='dashboard_api'),
    # ========================================
    
    # 예: /dashboard/1/ 처럼 팀 ID를 받는 URL
    path('', views.dashboard_router_view, name='dashboard_router'),
    path('<int:team_id>/', views.dashboard_view, name='dashboard'),

    # 파일 페이지
    path('<int:team_id>/files/', files_views.file_list_view, name='file_list'),
]