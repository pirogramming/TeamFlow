from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    major = models.CharField(max_length=100, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s profile"
    

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # User 저장될 때 Profile도 같이 저장
    if hasattr(instance, 'profile'):
        instance.profile.save()
        

from allauth.account.signals import user_signed_up
from django.dispatch import receiver

@receiver(user_signed_up)
def create_profile_on_signup(request, user, **kwargs):
    Profile.objects.get_or_create(user=user)