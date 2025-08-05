from django.urls import path
from .views import TaskCreateView, TaskDetailView, TaskDeleteView, TaskUpdateView, tasks_page

urlpatterns = [
    # 프론트 페이지
    path('', tasks_page, name='tasks-page'),

    # API
    path('create/', TaskCreateView.as_view(), name='task-create'),
    path('detail/', TaskDetailView.as_view(), name='task-detail'),
    path('delete/', TaskDeleteView.as_view(), name='task-delete'),
    path('update/', TaskUpdateView.as_view(), name='task-update'),
]
