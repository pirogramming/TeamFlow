# ========================================
# MGP: allauth 커스텀 어댑터 생성 (3rdparty signup 완전 우회)
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 소셜 로그인 후 리다이렉트 로직
# ========================================

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.urls import reverse
from django.shortcuts import redirect
from users.utils import get_user_profile_status
from teams.models import TeamMember


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    일반 계정 로그인 후 리다이렉트 로직
    """
    def get_user_display(self, user):
        return (getattr(user, "get_full_name", lambda: "")()
                or getattr(user, "first_name", "")
                or getattr(user, "email", "")
                or getattr(user, "username", ""))
    

    def get_login_redirect_url(self, request):
        """
        로그인 후 리다이렉트 URL 결정
        """
        user = request.user
        profile_status = get_user_profile_status(user)
        
        if profile_status == 'complete':
            # 프로필 설정 완료된 사용자: 팀 유무 확인 후 대시보드로
            team_member = TeamMember.objects.filter(user=user).first()
            if team_member:
                return reverse('dashboard', kwargs={'team_id': team_member.team.id})
            else:
                # 팀이 없으면 팀 설정 선택 페이지로
                return reverse('team-setup')
        else:
            # 새 사용자 또는 프로필 미완성 사용자: 프로필 설정 페이지로
            return reverse('profile-setup')


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    소셜 계정 로그인 후 리다이렉트 로직 (3rdparty signup 완전 우회)
    """
    
    def pre_social_login(self, request, sociallogin):
        """
        소셜 로그인 전 처리 - 3rdparty signup 우회
        """
        # 기존 사용자 확인 및 프로필 상태 업데이트
        user = sociallogin.user
        if user.is_authenticated:
            # 기존 사용자의 경우 프로필 상태 확인
            profile_status = get_user_profile_status(user)
            sociallogin.state['profile_status'] = profile_status
    
    def populate_user(self, request, sociallogin, data):
        """
        소셜 로그인 사용자 정보 채우기
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Google에서 받은 이름 정보 설정
        if 'name' in data:
            user.first_name = data['name']
        
        return user
    
    def save_user(self, request, sociallogin, form=None):
        """
        소셜 로그인 사용자 저장 - 3rdparty signup 우회
        """
        user = super().save_user(request, sociallogin, form)
        
        # 사용자 저장 후 바로 프로필 설정 페이지로 리다이렉트
        sociallogin.state['redirect_to'] = reverse('profile-setup')
        
        return user
    
    def get_connect_redirect_url(self, request, socialaccount):
        """
        소셜 계정 연결 후 리다이렉트 URL 결정
        """
        user = request.user
        profile_status = get_user_profile_status(user)
        
        if profile_status == 'complete':
            # 프로필 설정 완료된 사용자: 팀 유무 확인 후 대시보드로
            team_member = TeamMember.objects.filter(user=user).first()
            if team_member:
                return reverse('dashboard', kwargs={'team_id': team_member.team.id})
            else:
                # 팀이 없으면 팀 설정 선택 페이지로
                return reverse('team-setup')
        else:
            # 새 사용자 또는 프로필 미완성 사용자: 프로필 설정 페이지로
            return reverse('profile-setup')
    
    def is_open_for_signup(self, request, sociallogin):
        """
        3rdparty signup 완전 비활성화
        """
        return True  # 항상 True로 설정하여 3rdparty signup 우회
    
    def get_signup_form_initial_data(self, sociallogin):
        """
        3rdparty signup 폼 초기 데이터 - 비활성화
        """
        return {}  # 빈 딕셔너리 반환하여 3rdparty signup 폼 비활성화 