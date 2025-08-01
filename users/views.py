from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.crypto import get_random_string


class GoogleLoginAPIView(APIView):
    """
    POST /api/auth/google/
    Body: { "token": "GOOGLE_ID_TOKEN" }
    """

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 구글 ID 토큰 검증
            idinfo = id_token.verify_oauth2_token(token, requests.Request())
            email = idinfo.get('email')
            name = idinfo.get('name')

            # username 값 만들기 (name 없으면 이메일 앞부분 사용)
            username = name or email.split('@')[0]
            if User.objects.filter(username=username).exists():
                username = f"{username}_{get_random_string(4)}"

            # 유저 생성 또는 조회
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': username}
            )

            # JWT 토큰 발급
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'created': created,
                'refresh': str(refresh),
                'access': str(access),
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
