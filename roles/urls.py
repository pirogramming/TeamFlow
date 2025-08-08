# ========================================
# MGP: 역할 관리 URL 패턴 확장
# 사용자 요구사항에 맞는 새로운 API 엔드포인트 추가 (역할 삭제 기능 포함)
from django.urls import path
from . import views

urlpatterns = [
    # 역할 페이지
    path('<int:team_id>/roles/', views.roles_page, name='roles-page'),
    
    # 역할 관리 API
    path('api/dashboard/<int:team_id>/roles/list/', views.roles_list_api, name='roles-list-api'),
    path('api/dashboard/<int:team_id>/roles/create/', views.create_role_api, name='roles-create-api'),
    path('api/dashboard/<int:team_id>/roles/assign/', views.assign_role_api, name='roles-assign-api'),
    path('api/dashboard/<int:team_id>/roles/<int:role_id>/delete/', views.delete_role_api, name='roles-delete-api'),
    
    # 기존 API (호환성 유지)
    path('api/dashboard/<int:team_id>/roles/', views.roles_page, name='roles-page-legacy'),
    path('api/dashboard/<int:team_id>/roles/register/', views.register_roles, name='register-roles'),

    # AI 역할 추천 API (팀 ID 없어도 됨)
    path('roles/ai-recommend-role/', views.recommend_role_api, name='ai-recommend-role'),
]
# ========================================