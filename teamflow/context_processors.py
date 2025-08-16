"""
글로벌 컨텍스트 프로세서
모든 템플릿에서 공통으로 사용되는 컨텍스트 변수들을 제공합니다.
"""

from datetime import date, timedelta
from teams.models import Team
from tasks.models import Task
from users.models import Profile


def global_context(request):
    """
    모든 템플릿에서 사용할 수 있는 글로벌 컨텍스트 변수들을 제공합니다.
    """
    context = {}
    
    if request.user.is_authenticated:
        # 현재 사용자 정보
        context['current_user'] = request.user
        
        # 사용자 실제 이름 (first_name 우선, 없으면 username)
        user_display_name = request.user.first_name or request.user.username
        context['user_display_name'] = user_display_name
        
        # 사용자 역할 정보 (전공/전문분야)
        try:
            profile = Profile.objects.get(user=request.user)
            context['user_specialization'] = profile.specialization or "미정"
        except Profile.DoesNotExist:
            context['user_specialization'] = "미정"
        
        # 현재 팀 정보 (세션에서 가져오기)
        current_team_id = request.session.get('current_team_id')
        current_team = None
        
        if current_team_id:
            try:
                current_team = Team.objects.get(id=current_team_id)
                context['team'] = current_team
            except Team.DoesNotExist:
                pass
        
        # 첫 번째 팀을 기본으로 설정 (세션에 팀이 없는 경우)
        if not current_team:
            user_teams = Team.objects.filter(members=request.user)
            if user_teams.exists():
                current_team = user_teams.first()
                context['team'] = current_team
                request.session['current_team_id'] = current_team.id
        
        # 팀 내 역할 계산 (팀장/팀원)
        if current_team:
            if current_team.owner == request.user:
                context['team_role'] = "팀장"
            else:
                context['team_role'] = "팀원"
        else:
            context['team_role'] = "미정"
        
        # 마감 임박 작업 계산
        deadline_imminent_count = 0
        if current_team:
            # 오늘로부터 3일 이내의 마감 작업들
            deadline_threshold = date.today() + timedelta(days=1)
            from django.db.models import Q
            my_tasks = Task.objects.filter(
                (Q(assignee=request.user) | Q(assignees=request.user))
            ).distinct().order_by('-created_at')
            # 팀 작업 중 마감 임박
            team_tasks = my_tasks.filter(
                team=current_team,
                type='team',
                due_date__isnull=False,
                due_date__lte=deadline_threshold,
                status__in=['pending', 'in_progress']
            )
            
            # 개인 작업 중 마감 임박
            personal_tasks = Task.objects.filter(
                team=current_team,
                type='personal',
                assignee=request.user,
                due_date__isnull=False,
                due_date__lte=deadline_threshold,
                status__in=['pending', 'in_progress']
            )
            
            deadline_imminent_count = team_tasks.count() + personal_tasks.count()
        
        context['deadline_imminent_count'] = deadline_imminent_count
    
    return context