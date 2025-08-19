from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from team_log import views as team_log_views
from dashboard import views as dashboard
from django.views.generic import RedirectView
from django.contrib.staticfiles.storage import staticfiles_storage
# ========================================
# MGP: 프론트엔드 페이지 URL 패턴 추가 (프리뷰 제거 후 실제 페이지 연결)
from users import views as users
from teams import views as teams
from dashboard.views import set_current_team # type: ignore
# ========================================

# ========================================
# MGP: 작업 관리 URL 패턴 추가
# 백엔드 부분 대신 수정: tasks 앱 URL 연결
from tasks import views as tasks
# ========================================

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('', include('roles.urls')),

    path('api/teams/', include('teams.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/auth/', include('users.urls')),

    # allauth 로그인/콜백
    path('accounts/', include('allauth.urls')),

    # 실제 페이지들 URL 패턴
    path('profile-setup/', users.profile_setup_page, name='profile-setup'),
    path('auth/profile/', users.profile_page, name='profile-page'),
    path('team-setup/', teams.team_setup_page, name='team-setup'),
    path('team/create/', teams.team_create_page, name='team_create'),
    path('team/join/', teams.team_join_page, name='team_join'),
    path('dashboard/', dashboard.dashboard_page, name='dashboard'),
    path('api/dashboard/set-current-team/', set_current_team, name='set-current-team'),
    path('api/dashboard/team_log/', include('team_log.urls')),

    # ========================================
    # MGP: 작업 관리 URL 패턴 추가
    # 백엔드 부분 대신 수정: tasks 앱 URL 연결
    path('api/dashboard/<int:team_id>/tasks/', include('tasks.urls')),
    # ========================================

    # 로그인 후 리다이렉트
    path('api/auth/after-login/', users.after_login_redirect, name='after_login_redirect'),

    # 커스텀 Google 로그인
    path('auth/google-login/', users.custom_google_login, name='custom_google_login'),

    # 로그아웃
    path('auth/logout/', users.logout_view, name='logout'),

    # 랜딩 페이지
    path('', dashboard.landing_page_view, name='landing_index'),

    # 파일 URL
    path('api/', include('files.urls')),

    # 일정 URL
    path('api/', include('schedule.urls')),

    path('team-log/', team_log_views.team_log_page, name='team_log_page'),  # HTML 페이지

    re_path(r'^favicon\.ico$', RedirectView.as_view(
        url=staticfiles_storage.url('images/logos/teamflow-icon.png'),
        permanent=False
    )),


]

# 개발 환경 static 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 미디어 파일 서빙 (파일 업로드 등)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
