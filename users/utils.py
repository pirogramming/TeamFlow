# users/utils.py

# ========================================
# 원래 백엔드 개발자 코드 (주석처리)
# def needs_profile_setup(user):
#     # 프로필 없거나 전공(major)이 비어있으면 True
#     try:
#         profile = user.profile
#         return not profile.major  # specialization은 선택이므로 체크 안 함
#     except:
#         return True
# ========================================

# ========================================
# MGP: 기존 사용자 확인 및 프로필 설정 완료 여부 확인 로직 개선
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 기존 사용자 확인 로직 수정

def needs_profile_setup(user):
    """
    사용자가 프로필 설정이 필요한지 확인
    - 프로필이 없거나 전공(major)이 비어있으면 True
    - 기존 사용자는 False 반환
    """
    try:
        profile = user.profile
        # 전공이 설정되어 있고, 이름이 설정되어 있으면 프로필 설정 완료로 간주
        has_major = bool(profile.major and profile.major.strip())
        has_name = bool(user.first_name and user.first_name.strip())
        return not (has_major and has_name)
    except Exception as e:
        # 프로필이 없는 경우 (새 사용자)
        return True

def is_existing_user(user):
    """
    사용자가 기존 사용자인지 확인
    - 프로필 설정이 완료된 사용자는 기존 사용자로 간주
    """
    return not needs_profile_setup(user)

def get_user_profile_status(user):
    """
    사용자의 프로필 상태를 반환
    - 'new': 새 사용자 (프로필 설정 필요)
    - 'incomplete': 기존 사용자이지만 프로필 미완성
    - 'complete': 프로필 설정 완료
    """
    try:
        profile = user.profile
        has_major = bool(profile.major and profile.major.strip())
        has_name = bool(user.first_name and user.first_name.strip())
        
        if has_major and has_name:
            return 'complete'
        elif has_name:
            return 'incomplete'
        else:
            return 'new'
    except:
        return 'new'
# ========================================