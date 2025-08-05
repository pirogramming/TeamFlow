from django.db import models
from django.conf import settings
from teams.models import Team  # 팀 모델 연결

class Task(models.Model):
    STATUS_CHOICES = [
        ('대기중', '대기중'),
        ('진행중', '진행중'),
        ('완료', '완료'),
    ]

    PRIORITY_CHOICES = [
        ('보통', '보통'),
        ('중요', '중요'),
        ('긴급', '긴급'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=255)             # 작업명
    description = models.TextField(blank=True)          # 설명
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)  # 담당자
    due_date = models.DateField(null=True, blank=True)  # 마감일
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='대기중')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='보통')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.team}] {self.name}"
