from django.urls import path
from . import views

urlpatterns = [
    # ========================================
    # MGP: REST API 엔드포인트 URL 패턴 추가
    # 백엔드 부분 대신 수정: 팀 생성/참여 API
    # ========================================
    path('create/', views.TeamCreateAPIView.as_view(), name='team_create_api'),
    path('join/', views.TeamJoinAPIView.as_view(), name='team_join_api'),
    path('list/', views.UserTeamsAPIView.as_view(), name='user_teams_api'),
    path('current/', views.CurrentTeamAPIView.as_view(), name='current_team_api'),
    path('info/<str:invite_code>/', views.TeamInfoAPIView.as_view(), name='team_info_api'),
    # 팀 관리 API는 dashboard.urls에 정의됨
    # ========================================
    
    # 기존 페이지 뷰 URL 패턴 (제거 - API 방식으로 통합)
    # path('create/', views.team_create_view, name='team_create'),
    # path('join/', views.team_join_view, name='team_join'),
]