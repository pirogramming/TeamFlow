from django.urls import path
from . import views

# 앱 이름을 지정하여 URL 이름 충돌 방지
app_name = 'scheduler'

urlpatterns = [
    # 일정 CRUD API
    path('teams/<int:team_id>/schedule/detail', views.schedule_list_view, name='schedule_list'),
    path('teams/<int:team_id>/schedule/create', views.schedule_create_view, name='schedule_create'),
    path('teams/<int:team_id>/schedule/<int:schedule_id>/update', views.schedule_update_view, name='schedule_update'),
    path('teams/<int:team_id>/schedule/<int:schedule_id>/delete', views.schedule_delete_view, name='schedule_delete'),
    
    # 일정 조율 API
    path('teams/<int:team_id>/schedule/mediate', views.schedule_mediate_view, name='schedule_mediate'),
    path('teams/<int:team_id>/schedule/save_vote', views.save_vote_view, name='save_vote'),
]