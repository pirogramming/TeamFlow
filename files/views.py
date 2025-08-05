from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from .models import File
from teams.models import Team

@login_required
def file_list_view(request, team_id):
    """
    특정 팀의 파일 목록 페이지를 보여주는 뷰
    """
    team = get_object_or_404(Team, id=team_id)
    files = File.objects.filter(team=team).order_by('-uploaded_at') # 최신순으로 정렬
    
    context = {
        'team': team,
        'files': files,
    }
    return render(request, 'main/files.html', context)

@login_required
@require_http_methods(["POST"])
def file_upload_view(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    uploaded_file = request.FILES.get('file')

    if not uploaded_file:
        return JsonResponse({"success": False, "error": "파일이 전송되지 않았습니다."}, status=400)

    # 팀 멤버가 아니면 업로드 불가
    if not team.members.filter(id=request.user.id).exists():
        return JsonResponse({"success": False, "error": "팀 멤버만 파일을 업로드할 수 있습니다."}, status=403)

    file_instance = File.objects.create(
        team=team,
        uploader=request.user,
        file=uploaded_file,
        filename=uploaded_file.name
    )

    data = {
        "id": file_instance.id,
        "filename": file_instance.filename,
        "url": file_instance.file.url,
        "uploader_name": file_instance.uploader.username,
        "uploaded_at": file_instance.uploaded_at.strftime('%Y-%m-%d %H:%M'),
    }
    return JsonResponse({"success": True, "data": data})

@login_required
@require_http_methods(["POST"]) # HTML form과의 호환성을 위해 POST 사용
def file_delete_view(request, file_id):
    file_instance = get_object_or_404(File, id=file_id)

    # 팀장 또는 파일 업로더만 삭제 가능
    if request.user != file_instance.uploader and request.user != file_instance.team.owner:
        return JsonResponse({"success": False, "error": "파일을 삭제할 권한이 없습니다."}, status=403)

    file_instance.file.delete() # 실제 파일 삭제
    file_instance.delete()      # 데이터베이스 기록 삭제

    return JsonResponse({"success": True, "message": "파일이 성공적으로 삭제되었습니다."})