#HTML 렌더링 (프론트 페이지)
from django.shortcuts import render, get_object_or_404
from teams.models import Team
from .models import Task
from rest_framework.decorators import api_view
from rest_framework.response import Response

def tasks_page(request, team_id):
    # 특정 팀 불러오기
    team = get_object_or_404(Team, id=team_id)
    tasks = Task.objects.filter(team=team)
    team_members = team.teammember_set.select_related('user')

    return render(request, 'main/tasks.html', {
        'team': team,
        'tasks': tasks,
        'team_members': team_members,
    })


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
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 작업 상세
class TaskDetailView(generics.RetrieveAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id):
        task = get_object_or_404(Task, team_id=team_id)
        serializer = self.serializer_class(task)
        return Response(serializer.data)

# 작업 삭제
class TaskDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, team_id):
        task_id = request.data.get('id')
        task = get_object_or_404(Task, id=task_id, team_id=team_id)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# 작업 수정
class TaskUpdateView(generics.UpdateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, team_id):
        task_id = request.data.get('id')
        task = get_object_or_404(Task, id=task_id, team_id=team_id)
        serializer = self.serializer_class(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
