from django.urls import path
from . import views

urlpatterns = [
    path('teams/<int:team_id>/files/upload', views.file_upload_view, name='file_upload'),
    path('files/<int:file_id>/delete', views.file_delete_view, name='file_delete'),
    path('files/<int:file_id>/download/', views.file_download_view, name='file_download'),
    path('teams/<int:team_id>/files/download-all/', views.files_batch_download_view, name='files_batch_download'),
]