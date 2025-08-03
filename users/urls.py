from django.urls import path
from .views import UserMeUpdateView, profile_setup_page

urlpatterns = [
    path('me/', UserMeUpdateView.as_view(), name='user-me-update'),
    path('profile-setup/', profile_setup_page, name='profile-setup'),
]
