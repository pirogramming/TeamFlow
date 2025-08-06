# ========================================
# MGP: 작업 관리 URL 패턴 수정
# 백엔드 부분 대신 수정: RESTful API 구조로 변경, task_id 파라미터 추가
from django.urls import path
from .views import TaskCreateView, TaskDetailView, TaskDeleteView, TaskListAPIView, TaskUpdateView, tasks_page

urlpatterns = [
    path('list/', TaskListAPIView, name='task-list'),
    # API
    path('create/', TaskCreateView.as_view(), name='task-create'),
    path('<int:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('<int:task_id>/delete/', TaskDeleteView.as_view(), name='task-delete'),
    path('<int:task_id>/update/', TaskUpdateView.as_view(), name='task-update'),

    # 프론트 페이지
    path('', tasks_page, name='tasks-page'),
]
# ========================================
