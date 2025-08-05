from django.urls import path
from .views import TaskCreateView, TaskDetailView, TaskDeleteView, TaskUpdateView, tasks_page

urlpatterns = [
    # 프론트 페이지
    path('<int:team_id>/', tasks_page, name='tasks-page'),

    # API
    path('<int:team_id>/create', TaskCreateView.as_view(), name='task-create'),
    path('<int:team_id>/detail', TaskDetailView.as_view(), name='task-detail'),
    path('<int:team_id>/delete', TaskDeleteView.as_view(), name='task-delete'),
    path('<int:team_id>/update', TaskUpdateView.as_view(), name='task-update'),
]