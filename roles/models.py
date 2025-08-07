from django.db import models
from django.conf import settings
from teams.models import Team  # 이미 만든 Team 모델 연결

class Role(models.Model):
    name = models.CharField(max_length=50)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='roles')

    def __str__(self):
        return f"[{self.team.name}] {self.name}"

class MemberRoleAssignment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by_ai = models.BooleanField(default=False)  # AI가 할당했는지 여부
