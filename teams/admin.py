from django.contrib import admin
from .models import Team, TeamMember # Team과 TeamMember 모델을 불러옵니다.

# Team 모델을 관리자 페이지에 등록
admin.site.register(Team)

# TeamMember 모델을 관리자 페이지에 등록
admin.site.register(TeamMember)