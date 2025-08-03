from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from users.utils import needs_profile_setup
from teams.models import TeamMember


# 프로필 설정 페이지
@login_required
def profile_setup_page(request):
    return render(request, 'auth/profile-setup.html')


@login_required
def after_login_redirect(request):
    user = request.user
    if needs_profile_setup(user):
        # 프로필 설정 페이지로
        return redirect('profile-setup')
    else:
        # 대시보드로
        return redirect('dashboard')  # 대시보드 URL name에 맞게 변경
    
@login_required
def after_login_redirect(request):
    user = request.user
    if needs_profile_setup(user):
        return redirect('profile-setup')


    # 유저가 속한 첫 팀 가져오기
    team_member = TeamMember.objects.filter(user=user).first()
    if team_member:
        return redirect('dashboard', team_id=team_member.team.id)
    else:
        # 팀이 없으면 팀 설정 페이지로 보내기
        return redirect('team-setup')  # 이 URL은 팀 생성/참여 페이지

@login_required
def after_login_redirect(request):
    user = request.user
    if needs_profile_setup(user):
        return redirect('profile-setup')

    team_member = TeamMember.objects.filter(user=user).first()
    if team_member:
        return redirect('dashboard', team_id=team_member.team.id)
    else:
        return redirect('team_create')  # 혹은 팀 선택 페이지로
    

# 프로필 업데이트 API
class UserMeUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        name = request.data.get('name')
        major = request.data.get('major')
        specialization = request.data.get('specialization')

        user = request.user

        # 이름 업데이트
        if name:
            user.first_name = name
            user.save()

        # Profile 필드 업데이트
        profile = user.profile
        if major:
            profile.major = major
        if specialization:
            profile.specialization = specialization
        profile.save()

        return Response({"success": True})