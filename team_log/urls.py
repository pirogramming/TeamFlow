from django.urls import path
from . import views

urlpatterns = [
    # 이 URL이 프론트 페이지로 동작
    path('list/', views.team_log_page, name='team_log_page'),

    # 특정 팀 상세
    path('<int:team_id>/list/', views.team_log_detail_page, name='team_log_detail_page'),

    # 실제 JSON API
    path('api/list/', views.all_team_logs_api, name='all_team_logs_api'),
    path('<int:team_id>/api/list/', views.team_log_list_api, name='team_log_list_api'),
]
