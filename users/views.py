from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# 프로필 설정 페이지
@login_required
def profile_setup_page(request):
    return render(request, 'auth/profile-setup.html')

# ========================================
# CSS 프로필 설정 미리보기용 임시 뷰 (협업에 영향 없음)
# MGP:프론트엔드 개발 중 CSS 확인을 위해 추가
def profile_setup_preview(request):
    return render(request, 'auth/profile-setup.html')
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

        # Profile 필드 업데이트
        profile = user.profile
        if major:
            profile.major = major
        if specialization:
            profile.specialization = specialization
        profile.save()

        return Response({"success": True})
