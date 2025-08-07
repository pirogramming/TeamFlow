from django.urls import path
from . import views

urlpatterns = [
    # 역할 페이지
    path('api/dashboard/<int:team_id>/roles/', views.roles_page, name='roles-page'),
    
    # 역할 등록
    path('api/dashboard/<int:team_id>/roles/register/', views.register_roles, name='register-roles'),

    # AI 역할 추천 API (팀 ID 없어도 됨)
    path('roles/ai-recommend-role/', views.recommend_role_api, name='ai-recommend-role'),
]