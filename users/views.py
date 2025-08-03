from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.utils import needs_profile_setup
from teams.models import TeamMember


# 프로필 설정 페이지
@login_required
def profile_setup_page(request):
    return render(request, 'auth/profile-setup.html')


# 로그인 후 리다이렉트
@login_required
def after_login_redirect(request):
    user = request.user

    # 프로필 미완성 시 -> 프로필 설정 페이지
    if needs_profile_setup(user):
        return redirect('profile-setup')

    # 팀 유무 확인
    team_member = TeamMember.objects.filter(user=user).first()
    if team_member:
        # 팀 있으면 대시보드로
        return redirect('dashboard', team_id=team_member.team.id)
    else:
        # 팀 없으면 팀 생성/참여 페이지로 (팀 생성 페이지로 우선 보냄)
        return redirect('team_create')


# ========================================
# CSS 프로필 설정 미리보기용 임시 뷰 (협업에 영향 없음)
# MGP:프론트엔드 개발 중 CSS 확인을 위해 추가
def profile_setup_preview(request):
    return render(request, 'auth/profile-setup.html')

def team_setup_preview(request):
    """팀 생성 페이지 미리보기 (CSS 테스트용) - MGP 개발"""
    return render(request, 'team/create.html')

def team_join_preview(request):
    """팀 참여 페이지 미리보기 (CSS 테스트용) - MGP 개발"""
    return render(request, 'team/join.html')

def team_setup_selection_preview(request):
    """팀 설정 선택 페이지 미리보기 (CSS 테스트용) - MGP 개발"""
    return render(request, 'auth/team-setup.html')

def dashboard_preview(request):
    """대시보드 페이지 미리보기 (CSS 테스트용) - MGP 개발"""
    return render(request, 'main/dashboard.html')
# ========================================


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

        # 프로필 업데이트
        profile = user.profile
        if major:
            profile.major = major
        if specialization:
            profile.specialization = specialization
        profile.save()

        return Response({"success": True, "id": user.id})
