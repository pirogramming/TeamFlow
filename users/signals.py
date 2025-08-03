from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    # 프로필이 없으면 생성할 때 기본값 넣기
    Profile.objects.get_or_create(
        user=instance,
        defaults={
            'major': '',
            'specialization': ''
        }
    )
    # 이후 save 호출 (이미 존재해도 업데이트 동작)
    if hasattr(instance, 'profile'):
        instance.profile.save()
