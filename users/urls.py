from django.urls import path
from .views import UserMeUpdateView, after_login_redirect, profile_page, profile_setup_page

urlpatterns = [
    path('me/', UserMeUpdateView.as_view(), name='user-me-update'),
    path('profile/', UserMeUpdateView.as_view(), name='user-profile-api'),  # /api/auth/profile/ 엔드포인트
    path('profile-setup/', profile_setup_page, name='profile-setup'),
    path('after-login/', after_login_redirect, name='after-login'),
]
