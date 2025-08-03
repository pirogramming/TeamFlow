from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.generic import View
from django.http import JsonResponse
from django.contrib.auth.models import User

# 프로필 설정 페이지
@login_required
def profile_setup_page(request):
    return render(request, 'auth/profile-setup.html')

# 프로필 업데이트 API
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

class UserMeUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        name = request.data.get('name')
        major = request.data.get('major')
        specialization = request.data.get('specialization')

        user = request.user
        if name:
            user.first_name = name  # 단순하게 first_name에 저장
        if major:
            user.profile.major = major  # 커스텀 필드라면 profile 모델 필요
        if specialization:
            user.profile.specialization = specialization
        user.save()

        return Response({"success": True})
