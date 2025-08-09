from django.db import models
from django.conf import settings
from teams.models import Team

class File(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='files')
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='team_files/')
    filename = models.CharField(max_length=255) # 원본 파일 이름
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.team.name}] {self.filename}"