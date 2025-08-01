from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from teams.models import Team, TeamMember
#from tasks.models import Task 'tasks' 앱의 Task 모델을 임포트했다고 가정

@login_required
def dashboard_view(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    user = request.user

    # 1. 팀 작업 및 개인 작업 정보 불러오기
    all_team_tasks = Task.objects.filter(team=team)
    personal_tasks = all_team_tasks.filter(assignee=user)

    # 2. 팀 현황 정보 불러오기 (이름, 학과, 역할)
    # User 모델에 'major' 필드가 있다고 가정
    team_members = TeamMember.objects.filter(team=team).select_related('user')

    # 3. 전체 진행률 및 개인 완료율 계산 
    total_tasks_count = all_team_tasks.count()
    completed_tasks_count = all_team_tasks.filter(is_completed=True).count()
    total_progress = (completed_tasks_count / total_tasks_count * 100) if total_tasks_count > 0 else 0

    personal_tasks_count = personal_tasks.count()
    personal_completed_count = personal_tasks.filter(is_completed=True).count()
    personal_progress = (personal_completed_count / personal_tasks_count * 100) if personal_tasks_count > 0 else 0
    
    # 4. 마감 임박 작업 계산
    # urgent_tasks_count = ... (D-day 계산 로직)

    # 프론트엔드에 전달할 모든 데이터를 context에 담기
    context = {
        'team': team,
        'team_tasks': all_team_tasks,
        'personal_tasks': personal_tasks,
        'team_members': team_members,
        'total_progress': round(total_progress),
        'completed_tasks_count': completed_tasks_count,
        'total_tasks_count': total_tasks_count,
        'personal_progress': round(personal_progress),
        'personal_completed_count': personal_completed_count,
        'personal_tasks_count': personal_tasks_count,
        # 'urgent_tasks_count': urgent_tasks_count,
    }
    
    return render(request, 'dashboard/dashboard.html', context)