#HTML 렌더링 (프론트 페이지)
from django.shortcuts import render, get_object_or_404
from teams.models import Team
from .models import Task
from rest_framework.decorators import api_view
from rest_framework.response import Response

# ========================================
# MGP: 작업 관리 페이지 뷰 수정
# 백엔드 부분 대신 수정: 현재 팀 정보 가져오기 로직 추가
from django.contrib.auth.decorators import login_required

@login_required
def tasks_page(request, team_id):
    # 현재 팀 정보 가져오기
    team = get_object_or_404(Team, id=team_id)
    request.session['current_team_id'] = team.id  # 현재 팀 ID를 세션에 저장
    
    # 팀 작업과 개인 작업 분리
    team_tasks = Task.objects.filter(team=team, type='team')
    personal_tasks = Task.objects.filter(team=team, type='personal', assignee=request.user)
    
    # 팀 멤버 정보
    team_members = team.teammember_set.select_related('user')

    return render(request, 'main/tasks.html', {
        'team': team,
        'team_tasks': team_tasks,
        'personal_tasks': personal_tasks,
        'team_members': team_members,
        'hide_sidebar': False,  # 사이드바 표시
        'hide_footer': False,   # 푸터 표시
    })
# ========================================


# ========================================
# MGP: 작업 관리 API 뷰 수정
# 백엔드 부분 대신 수정: URL 파라미터 구조 변경, 개인 작업 자동 담당자 설정, 오류 처리 개선
#API (CRUD)
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Task
from teams.models import Team
from .serializers import TaskSerializer

# 작업 생성
class TaskCreateView(generics.CreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, team_id):
        team = get_object_or_404(Team, id=team_id)
        data = request.data.copy()
        data['team'] = team.id
        
        # 개인 작업인 경우 현재 사용자를 담당자로 설정
        if data.get('type') == 'personal':
            data['assignee'] = request.user.id
        
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 작업 상세
class TaskDetailView(generics.RetrieveAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id, task_id):
        task = get_object_or_404(Task, id=task_id, team_id=team_id)
        serializer = self.serializer_class(task)
        return Response(serializer.data)

# 작업 삭제
class TaskDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, team_id, task_id):
        task = get_object_or_404(Task, id=task_id, team_id=team_id)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# 작업 수정
class TaskUpdateView(generics.UpdateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, team_id, task_id):
        task = get_object_or_404(Task, id=task_id, team_id=team_id)
        serializer = self.serializer_class(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# ========================================
