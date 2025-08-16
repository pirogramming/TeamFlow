#HTML 렌더링 (프론트 페이지)
from django.shortcuts import render, get_object_or_404
from teams.models import Team
from .models import Task
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes


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
    current_user_id = request.user.id
    return render(request, 'main/tasks.html', {
        'team': team,
        'team_tasks': team_tasks,
        'personal_tasks': personal_tasks,
        'team_members': team_members,
        'current_user_id': current_user_id,
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

#팀별 작업 리스트 반환하는 API 추가
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def TaskListAPIView(request, team_id):
    team = get_object_or_404(Team, id=team_id)

    team_tasks = Task.objects.filter(team=team, type='team')
    personal_tasks = Task.objects.filter(team=team, type='personal', assignee=request.user)

    return Response({
        "team_tasks": TaskSerializer(team_tasks, many=True).data,
        "personal_tasks": TaskSerializer(personal_tasks, many=True).data
    })

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
        elif data.get('type') == 'team' and not data.get('assignee'):
            data['assignee'] = None  # 담당자 미정 허용

        # ========================================
        # MGP: 다중 담당자 필드 처리
        # 프론트에서 assignee(단일) 외에 assignees(배열)로 오면 ManyToMany에 저장
        # ========================================
        assignees = data.get('assignees', [])
        if isinstance(assignees, str):
            # JSON 문자열로 올 수 있어 파싱
            import json
            try:
                assignees = json.loads(assignees)
            except Exception:
                assignees = []

        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            task = serializer.save()
            if assignees:
                task.assignees.set(assignees)
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
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
            task = serializer.save()
            # ========================================
            # MGP: 다중 담당자 갱신 처리
            # ========================================
            assignees = request.data.get('assignees', None)
            if assignees is not None:
                if isinstance(assignees, str):
                    import json
                    try:
                        assignees = json.loads(assignees)
                    except Exception:
                        assignees = []
                task.assignees.set(assignees)
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# ========================================
