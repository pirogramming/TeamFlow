# users/apps.py
from django.apps import AppConfig
from django.conf import settings

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        # # 1) SocialApp 자동 생성
        # from allauth.socialaccount.models import SocialApp
        # from django.contrib.sites.models import Site
        # import os

        # try:
        #     site = Site.objects.get_current()

        #     client_id = os.getenv("GOOGLE_CLIENT_ID")
        #     secret = os.getenv("GOOGLE_SECRET")

        #     if not SocialApp.objects.filter(provider="google").exists():
        #         app = SocialApp.objects.create(
        #             provider="google",
        #             name="Google",
        #             client_id=client_id,
        #             secret=secret,
        #         )
        #         app.sites.add(site)
        # except Exception as e:
        #     # 에러 디버깅 위해 print 추가
        #     print(f"[UsersConfig.ready] SocialApp setup skipped: {e}")

        # 2) signals 불러오기
        import users.signals
