# ========================================
# MGP: Task 모델 수정
# 백엔드 부분 대신 수정: 팀/개인 작업 구분을 위한 type 필드 추가, assignee와 due_date 필드 nullable 설정, 마감 임박 판단 메서드 추가
from django.db import models
from django.contrib.auth.models import User
from teams.models import Team
from datetime import date, timedelta

class Task(models.Model):
    TASK_TYPES = (
        ('team', '팀 작업'),
        ('personal', '개인 작업'),
    )

    STATUS_CHOICES = (
        ('pending', '대기중'),
        ('in_progress', '진행중'),
        ('completed', '완료'),
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=10, choices=TASK_TYPES, default='team')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return self.name
    
    @property
    def is_deadline_imminent(self):
        """마감 임박 여부 확인 (당일 또는 전날 마감)"""
        if not self.due_date or self.status == 'completed':
            return False
        
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        return self.due_date == today or self.due_date == tomorrow
# ========================================
