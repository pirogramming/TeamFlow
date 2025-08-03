from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from teams.models import Team, TeamMember
from django.db.models import F
# from tasks.models import Task # ⬅️ tasks 앱이 준비될 때까지 주석 처리합니다.

def landing_page_view(request):
    return render(request, 'landing/index.html')


@login_required
def dashboard_router_view(request):
    my_team = Team.objects.filter(members=request.user).first()

    if my_team:
        return redirect('dashboard', team_id=my_team.id)
    else:
        return redirect('team_join')
    

@login_required
def dashboard_view(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    user = request.user

    # 1. 팀 작업 및 개인 작업 정보 (임시로 빈 리스트 전달)
    all_team_tasks = []
    personal_tasks = []

    # 2. 팀 현황 정보 불러오기 (이름, 학과, 역할)
    # User 모델에 'profile'과 'major' 필드가 있다고 가정
    team_members = TeamMember.objects.filter(team=team).annotate(
        name=F('user__username'),
        major=F('user__profile__major')
    ).values('name', 'major', 'role')

    # 3. 전체 진행률 및 개인 완료율 계산 (임시로 0으로 설정)
    total_tasks_count = 0
    completed_tasks_count = 0
    total_progress = 0

    personal_tasks_count = 0
    personal_completed_count = 0
    personal_progress = 0
    
    # 프론트엔드에 전달할 모든 데이터를 context에 담기
    context = {
        'team': team,
        'team_tasks': all_team_tasks,
        'personal_tasks': personal_tasks,
        'team_members': team_members,
        'total_progress': total_progress,
        'completed_tasks_count': completed_tasks_count,
        'total_tasks_count': total_tasks_count,
        'personal_progress': personal_progress,
        'personal_completed_count': personal_completed_count,
        'personal_tasks_count': personal_tasks_count,
    }
    
    return render(request, 'main/dashboard.html', context)