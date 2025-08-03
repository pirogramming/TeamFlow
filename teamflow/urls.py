from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from dashboard import views as dashboard

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/teams/', include('teams.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/auth/', include('users.urls')),

    # allauth 로그인/콜백
    path('accounts/', include('allauth.urls')),

    # 랜딩 페이지
    path('', dashboard.landing_page_view, name='landing_index'),
]

# 개발 환경 static 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
