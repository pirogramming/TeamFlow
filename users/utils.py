# users/utils.py

def needs_profile_setup(user):
    # 프로필 없거나 전공(major)이 비어있으면 True
    try:
        profile = user.profile
        return not profile.major  # specialization은 선택이므로 체크 안 함
    except:
        return True
