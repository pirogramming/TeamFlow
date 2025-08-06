# ========================================
# MGP: TaskSerializer 필드 수정
# 백엔드 부분 대신 수정: 모델과 일치하도록 필드 구성 변경, 모든 필요한 필드 포함
from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source='assignee.first_name', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'name', 'description', 'team', 'assignee', 'assignee_name', 'type', 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'assignee_name']
# ========================================
