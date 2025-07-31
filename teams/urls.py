from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.team_create_view, name='team_create'),
    path('join/', views.team_join_view, name='team_join'),
]