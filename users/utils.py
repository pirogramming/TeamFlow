# users/utils.py

#프로필 존재/미완성 여부 확인 로직

def needs_profile_setup(user):
    # 프로필 없거나, 주요 필드 비어있으면 True
    try:
        profile = user.profile
        return not profile.major or not profile.specialization
    except:
        return True
