import uuid
from django.db import models
from django.conf import settings

def generate_invite_code():
    return str(uuid.uuid4().hex)[:6].upper()

class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_teams")
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='TeamMember', related_name="joined_teams")
    invite_code = models.CharField(max_length=6, unique=True, default=generate_invite_code)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class TeamMember(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, default="미정") 
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'team') 