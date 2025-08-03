from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import Team, TeamMember # ⬅️ TeamMember도 import 해야 합니다.

@login_required
def team_create_view(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        
        new_team = Team.objects.create(
            name=name,
            description=description,
            owner=request.user 
        )
        
        # ✨ 이 부분을 수정했습니다.
        # TeamMember 객체를 직접 생성하여 생성자를 '팀장'으로 추가합니다.
        TeamMember.objects.create(team=new_team, user=request.user, role="팀장")
        
        return redirect('/')

    return render(request, 'team/create.html')


@login_required
def team_join_view(request):
    if request.method == 'POST':
        code = request.POST.get('invite_code')
        try:
            team_to_join = Team.objects.get(invite_code=code)
            
            # members 필드를 직접 확인하는 대신, TeamMember 모델을 통해 확인합니다.
            if TeamMember.objects.filter(team=team_to_join, user=request.user).exists():
                return render(request, 'team/join.html', {'error': '이미 참여한 팀입니다.'})

            # ✨ 이 부분을 수정했습니다.
            # TeamMember 객체를 직접 생성하여 참여자를 '팀원'으로 추가합니다.
            TeamMember.objects.create(team=team_to_join, user=request.user, role="팀원")
            
            return redirect('/')
            
        except Team.DoesNotExist:
            return render(request, 'team/join.html', {'error': '유효하지 않은 초대 코드입니다.'})
            
    return render(request, 'team/join.html')