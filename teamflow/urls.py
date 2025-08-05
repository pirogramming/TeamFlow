from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from dashboard import views as dashboard
# ========================================
# MGP: 프론트엔드 페이지 URL 패턴 추가 (프리뷰 제거 후 실제 페이지 연결)
from users import views as users
from teams import views as teams
# ========================================

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/teams/', include('teams.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/auth/', include('users.urls')),

    # allauth 로그인/콜백
    path('accounts/', include('allauth.urls')),

    # ========================================
    # MGP: 실제 페이지들 URL 패턴 (프리뷰 제거 후 실제 페이지 연결)
    path('auth/profile-setup/', users.profile_setup_page, name='profile-setup'),
    path('team-setup/', teams.team_setup_page, name='team-setup'),
    path('team/create/', teams.team_create_page, name='team_create'),
    path('team/join/', teams.team_join_page, name='team_join'),
    path('dashboard/', dashboard.dashboard_page, name='dashboard'),
    # ========================================

    # ========================================
    # MGP: 로그인 후 리다이렉트 URL 패턴 추가
    # 백엔드 팀원이 해결해야 할 부분 대신 해결: 로그인 후 리다이렉트 로직 수정
    # ========================================
    path('api/auth/after-login/', users.after_login_redirect, name='after_login_redirect'),

    # ========================================
    # MGP: 커스텀 Google 로그인 URL 추가
    # 백엔드 팀원이 해결해야 할 부분 대신 해결: 소셜 로그인 후 리다이렉트 로직
    # ========================================
    path('auth/google-login/', users.custom_google_login, name='custom_google_login'),

    # ========================================
    # MGP: 로그아웃 URL 추가
    # 백엔드 팀원이 해결해야 할 부분 대신 해결: 로그인/로그아웃 로직
    # ========================================
    path('auth/logout/', users.logout_view, name='logout'),

    # 랜딩 페이지
    path('', dashboard.landing_page_view, name='landing_index'),

    # 파일 URL
    path('api/', include('files.urls')),

    # 일정 URL
    path('api/', include('schedule.urls')),
]

# 개발 환경 static 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 미디어 파일 서빙 (파일 업로드 등)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
