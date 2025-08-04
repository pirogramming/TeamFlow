from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.utils import needs_profile_setup, is_existing_user, get_user_profile_status
from teams.models import TeamMember
from allauth.socialaccount.models import SocialAccount


# ========================================
# MGP: 로그아웃 뷰 추가
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 로그인/로그아웃 로직
# ========================================
def logout_view(request):
    """
    로그아웃 후 랜딩 페이지로 리다이렉트
    """
    logout(request)
    return redirect('/')
# ========================================


# ========================================
# MGP: 커스텀 소셜 로그인 뷰 추가
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 소셜 로그인 후 리다이렉트 로직
# ========================================
def custom_google_login(request):
    """
    Google 로그인 후 3rdparty signup을 우회하고 바로 프로필 설정 페이지로 이동
    """
    print(f"custom_google_login 호출됨 - 사용자 인증 상태: {request.user.is_authenticated}")
    
    # 로그인된 사용자인 경우
    if request.user.is_authenticated:
        # 프로필 설정 완료 여부 확인
        profile_status = get_user_profile_status(request.user)
        print(f"사용자 프로필 상태: {profile_status}")
        
        if profile_status == 'complete':
            # 프로필 설정 완료된 사용자: 팀 유무 확인 후 대시보드로
            team_member = TeamMember.objects.filter(user=request.user).first()
            if team_member:
                print("프로필 완료 + 팀 있음 - 대시보드로 리다이렉트")
                return redirect('dashboard', team_id=team_member.team.id)
            else:
                print("프로필 완료 + 팀 없음 - 팀 설정 페이지로 리다이렉트")
                return redirect('team-setup')
        else:
            # 프로필 설정 미완성 사용자: 프로필 설정 페이지로
            print("프로필 미완성 - 프로필 설정 페이지로 리다이렉트")
            return redirect('profile-setup')
    
    print("로그인되지 않은 사용자 - Google 로그인 페이지로 리다이렉트")
    # 로그인되지 않은 경우 Google 로그인 페이지로
    return redirect('/accounts/google/login/')
# ========================================


# 프로필 설정 페이지
@login_required
def profile_setup_page(request):
    return render(request, 'auth/profile-setup.html')


# ========================================
# 원래 백엔드 개발자 코드 (주석처리)
# @login_required
# def after_login_redirect(request):
#     user = request.user
# 
#     # 프로필 미완성 시 -> 프로필 설정 페이지
#     if needs_profile_setup(user):
#         return redirect('profile-setup')
# 
#     # 팀 유무 확인
#     team_member = TeamMember.objects.filter(user=user).first()
#     if team_member:
#         # 팀 있으면 대시보드로
#         return redirect('dashboard', team_id=team_member.team.id)
#     else:
#         # 팀 없으면 팀 생성/참여 페이지로 (팀 생성 페이지로 우선 보냄)
#         return redirect('team_create')
# ========================================

# ========================================
# MGP: 로그인 후 리다이렉트 로직 개선
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 로그인 후 리다이렉트 로직 수정
# ========================================
@login_required
def after_login_redirect(request):
    """
    로그인 후 사용자 상태에 따라 적절한 페이지로 리다이렉트
    - 새 사용자: 프로필 설정 페이지
    - 기존 사용자 (프로필 완료): 대시보드
    - 기존 사용자 (프로필 미완성): 프로필 설정 페이지
    """
    user = request.user
    
    # 사용자 프로필 상태 확인
    profile_status = get_user_profile_status(user)
    
    if profile_status == 'complete':
        # 프로필 설정 완료된 사용자: 팀 유무 확인 후 대시보드로
        team_member = TeamMember.objects.filter(user=user).first()
        if team_member:
            return redirect('dashboard', team_id=team_member.team.id)
        else:
            # 팀이 없으면 팀 설정 선택 페이지로
            return redirect('team-setup')
    else:
        # 새 사용자 또는 프로필 미완성 사용자: 프로필 설정 페이지로
        return redirect('profile-setup')
# ========================================


# ========================================
# 원래 백엔드 개발자 코드 (주석처리)
# class UserMeUpdateView(APIView):
#     permission_classes = [IsAuthenticated]
# 
#     def patch(self, request):
#         name = request.data.get('name')
#         major = request.data.get('major')
#         specialization = request.data.get('specialization')
# 
#         user = request.user
# 
#         # 이름 업데이트
#         if name:
#             user.first_name = name
#             user.save()
# 
#         # 프로필 업데이트
#         profile = user.profile
#         if major:
#             profile.major = major
#         if specialization:
#             profile.specialization = specialization
#         profile.save()
# 
#         return Response({"success": True, "id": user.id})
# ========================================

# ========================================
# MGP: 프로필 업데이트 API 개선
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 프로필 설정 완료 후 리다이렉트 로직
# ========================================
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

        # ========================================
        # MGP: 프로필 설정 완료 후 리다이렉트 로직 추가
        # 백엔드 팀원이 해결해야 할 부분 대신 해결: 프로필 설정 완료 후 올바른 페이지로 리다이렉트
        # ========================================
        
        # 프로필 설정 완료 여부 확인
        profile_status = get_user_profile_status(user)
        
        response_data = {
            "success": True, 
            "id": user.id,
            "profile_status": profile_status
        }
        
        # 프로필 설정이 완료되면 팀 설정 페이지로 리다이렉트 정보 추가
        if profile_status == 'complete':
            response_data["redirect_url"] = "/team-setup/"
        
        return Response(response_data)

        # ========================================
