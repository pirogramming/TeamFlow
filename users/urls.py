from django.urls import path
from .views import GoogleLoginAPIView, login_page

urlpatterns = [
    path('login/', login_page, name='login-page'),
    path('google/', GoogleLoginAPIView.as_view(), name='google-login'),
]