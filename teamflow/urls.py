"""
URL configuration for teamflow project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from dashboard import views as dashboard
# ========================================
# MGP: CSS 미리보기용 임시 import (프론트엔드 개발 중 CSS 확인용)
from users import views as users
# ========================================

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/teams/', include('teams.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/auth/', include('users.urls')),

    # allauth 로그인/콜백
    path('accounts/', include('allauth.urls')),

    # 인증 페이지들
    path('auth/profile-setup/', users.profile_setup_page, name='auth_profile_setup'),
    # ========================================
# MGP: CSS 미리보기용 임시 URL (프론트엔드 개발 중 CSS 확인용)
path('preview/profile-setup/', users.profile_setup_preview, name='profile_setup_preview'),
path('preview/team-setup/', users.team_setup_preview, name='team_setup_preview'),
path('preview/team-join/', users.team_join_preview, name='team_join_preview'),
    path('preview/team-setup-selection/', users.team_setup_selection_preview, name='team_setup_selection_preview'),
    path('preview/dashboard/', users.dashboard_preview, name='dashboard_preview'),
    # ========================================

    # 랜딩 페이지
    path('', dashboard.landing_page_view, name='landing_index'),
]

# 개발 환경 static 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
