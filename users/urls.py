from django.urls import path
from .views import UserMeUpdateView, after_login_redirect, profile_page, profile_setup_page

urlpatterns = [
    path('me/', UserMeUpdateView.as_view(), name='user-me-update'),
    path('profile/', profile_page, name='profile-page'),
    path('profile-setup/', profile_setup_page, name='profile-setup'),
    path('after-login/', after_login_redirect, name='after-login'),
]
