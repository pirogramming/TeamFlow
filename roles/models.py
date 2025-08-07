# ========================================
# MGP: 역할 관리 모델 확장
# 역할 설명, 생성자, AI 생성 여부 필드 추가하여 사용자 요구사항에 맞게 개선
# 마이그레이션 문제 해결을 위해 모든 새 필드를 nullable로 수정
from django.db import models
from django.conf import settings
from teams.models import Team  # 이미 만든 Team 모델 연결

class Role(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)  # 역할 설명
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='roles')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)  # 생성자
    is_ai_generated = models.BooleanField(default=False)  # AI 생성 여부
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # nullable로 설정

    def __str__(self):
        return f"[{self.team.name}] {self.name}"

class MemberRoleAssignment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True)  # 팀 정보 추가 (nullable)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_roles', null=True, blank=True)  # 할당자
    assigned_by_ai = models.BooleanField(default=False)  # AI가 할당했는지 여부
    assigned_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # nullable로 설정

    class Meta:
        unique_together = ('user', 'team')  # 한 팀에서 한 사용자는 하나의 역할만

    def __str__(self):
        team_name = self.team.name if self.team else "Unknown Team"
        return f"{self.user.username} - {self.role.name} in {team_name}"
# ========================================
