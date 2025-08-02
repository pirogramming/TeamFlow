from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import Team

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
        new_team.members.add(request.user)
        
        # 팀 생성 후 이동할 페이지 (예: 대시보드)
        # return redirect('dashboard') 
        return redirect('/') # 임시로 메인 페이지로 이동

    return render(request, 'team/create.html')


@login_required
def team_join_view(request):
    if request.method == 'POST':
        code = request.POST.get('invite_code')
        try:
            team_to_join = Team.objects.get(invite_code=code)
            
            if request.user in team_to_join.members.all():
                return render(request, 'teams/team_join.html', {'error': '이미 참여한 팀입니다.'})

            team_to_join.members.add(request.user)
            # 원래는 대시보드로 리다이렉트 
            return redirect('/') # 임시로 메인 페이지로 이동
            
        except Team.DoesNotExist:
            return render(request, 'teams/team_join.html', {'error': '유효하지 않은 초대 코드입니다.'})
            
    return render(request, 'teams/team_join.html')