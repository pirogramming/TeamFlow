from django.contrib import admin
from .models import Team, TeamMember

# 1. TeamMember를 Team 페이지 안에서 바로 추가/수정할 수 있도록
#    인라인(Inline) 모델을 정의합니다.
class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1  # 기본적으로 추가할 수 있는 빈 멤버 슬롯의 수
    autocomplete_fields = ['user'] # 사용자가 많을 때 검색으로 찾을 수 있게 해줍니다.

# 2. Team 모델에 대한 관리자 설정을 커스터마이징합니다.
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at') # 목록에 보일 필드
    search_fields = ('name', 'owner__username')   # 검색 기능 추가
    
    # ✨ 이 부분이 핵심입니다.
    # Team 페이지에 TeamMember 인라인을 포함시킵니다.
    inlines = [TeamMemberInline]

# 3. Team 모델을 등록합니다.
#    혹시 다른 곳에 admin.site.register(Team)이 있어도 충돌하지 않도록
#    먼저 등록을 해제하고 다시 등록하는 것이 안전합니다.
try:
    admin.site.unregister(Team)
except admin.sites.NotRegistered:
    pass
admin.site.register(Team, TeamAdmin)


# TeamMember 모델도 별도로 관리할 수 있도록 등록합니다. (선택사항)
@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role', 'joined_at')
    list_filter = ('team', 'role')
    search_fields = ('user__username', 'team__name') # 검색 기능 추가