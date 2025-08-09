# ========================================
# MGP: TaskSerializer 필드 수정
# 백엔드 부분 대신 수정: 모델과 일치하도록 필드 구성 변경, 모든 필요한 필드 포함
from rest_framework import serializers
from .models import Task
from django.contrib.auth.models import User

class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source='assignee.first_name', read_only=True)
    # ========================================
    # MGP: 다중 담당자 직렬화 지원
    # - assignees: PK 배열 입력/출력
    # - assignees_names: 읽기 전용 이름 배열
    # ========================================
    assignees = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, required=False)
    assignees_names = serializers.SerializerMethodField(read_only=True)

    def get_assignees_names(self, obj):
        return [u.first_name or u.username for u in obj.assignees.all()]

    class Meta:
        model = Task
        fields = ['id', 'name', 'description', 'team', 'assignee', 'assignee_name', 'assignees', 'assignees_names', 'type', 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'assignee_name', 'assignees_names']
# ========================================
