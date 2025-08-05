from django.db import models
from django.conf import settings
from teams.models import Team

class Meeting(models.Model):
    """FullCalendar에 표시될 회의 일정 모델"""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='meetings')
    title = models.CharField(max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"[{self.team.name}] {self.title}"

class SchedulePoll(models.Model):
    """'일정 조율' 자체를 나타내는 모델"""
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='schedule_polls')
    title = models.CharField(max_length=200, default="팀 미팅 시간 조율")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Vote(models.Model):
    """팀원 한 명의 '가능한 시간' 투표를 저장하는 모델"""
    poll = models.ForeignKey(SchedulePoll, on_delete=models.CASCADE, related_name='votes')
    voter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # 사용자가 선택한 시간 슬롯을 JSON 형태로 저장
    # 예: {"mon": ["0900", "0930"], "tue": ["1400"]}
    available_slots = models.JSONField(default=dict)

    class Meta:
        unique_together = ('poll', 'voter')