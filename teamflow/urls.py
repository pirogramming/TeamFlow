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

urlpatterns = [
    path('admin/', admin.site.urls),

    # API 엔드포인트 (팀, 대시보드)
    path('api/teams/', include('teams.urls')),
    path('api/dashboard/', include('dashboard.urls')),

    # allauth 로그인/콜백
    path('accounts/', include('allauth.urls')),

    # 랜딩 페이지
    path('', dashboard.landing_page_view, name='landing_index'),
]

# 개발 환경 static 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
