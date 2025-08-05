from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source='assignee.first_name', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'name', 'priority', 'status', 'due_date', 'assignee_name']
