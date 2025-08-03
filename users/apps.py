# users/apps.py
from django.apps import AppConfig
from django.conf import settings

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from allauth.socialaccount.models import SocialApp
        from django.contrib.sites.models import Site
        import os

        try:
            site = Site.objects.get_current()

            client_id = os.getenv("GOOGLE_CLIENT_ID")
            secret = os.getenv("GOOGLE_SECRET")

            if not SocialApp.objects.filter(provider="google").exists():
                app = SocialApp.objects.create(
                    provider="google",
                    name="Google",
                    client_id=client_id,
                    secret=secret,
                )
                app.sites.add(site)
        except:
            pass

def ready(self):
    import users.signals
