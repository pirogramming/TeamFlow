from django.http import JsonResponse, HttpResponse, Http404, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from .models import File
from teams.models import Team
from urllib.parse import quote
import os
import io
import zipfile

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

@login_required
def file_download_view(request, file_id):
    """
    파일 ID를 받아 해당 파일을 다운로드할 수 있도록 반환합니다.
    """
    file_instance = get_object_or_404(File, id=file_id)

    # 1. 권한 확인: 해당 팀의 멤버인지 확인합니다.
    if not file_instance.team.members.filter(id=request.user.id).exists():
        return HttpResponseForbidden("파일을 다운로드할 권한이 없습니다.")

    # 2. 파일 경로를 가져와 파일을 엽니다.
    #    (로컬/클라우드 상관없이 file.path 또는 file.open()으로 동작)
    try:
        # settings.DEFAULT_FILE_STORAGE에 따라 자동으로 올바른 저장소에서 파일을 엽니다.
        file_path = file_instance.file.path
        if os.path.exists(file_path):
            with open(file_path, 'rb') as fh:
                # 3. HttpResponse 객체에 파일 내용을 담아 반환합니다.
                response = HttpResponse(fh.read(), content_type="application/octet-stream")
                
                # 4. 파일 이름을 UTF-8로 인코딩하여 헤더에 추가합니다.
                filename_header = f'attachment; filename*=UTF-8\'\'{quote(file_instance.filename)}'
                response['Content-Disposition'] = filename_header
                
                return response
        raise FileNotFoundError
    except (FileNotFoundError, AttributeError):
        # 클라우드 스토리지 등 .path를 지원하지 않는 경우 .open() 사용
        try:
            with file_instance.file.open('rb') as fh:
                response = HttpResponse(fh.read(), content_type="application/octet-stream")
                filename_header = f'attachment; filename*=UTF-8\'\'{quote(file_instance.filename)}'
                response['Content-Disposition'] = filename_header
                return response
        except Exception:
            raise Http404("파일을 찾을 수 없거나 열 수 없습니다.")
        
@login_required
def files_batch_download_view(request, team_id):
    """
    특정 팀의 모든 파일을 zip 파일로 압축하여 일괄 다운로드합니다.
    """
    team = get_object_or_404(Team, id=team_id)
    if not team.members.filter(id=request.user.id).exists():
        return HttpResponseForbidden("파일을 다운로드할 권한이 없습니다.")

    files = team.files.all()
    if not files:
        raise Http404("다운로드할 파일이 없습니다.")

    # 메모리 상에서 zip 파일을 생성합니다.
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as zip_file:
        for file_instance in files:
            with file_instance.file.open('rb') as f:
                # 각 파일을 zip 아카이브에 추가합니다.
                zip_file.writestr(file_instance.filename, f.read())
    
    buffer.seek(0)
    
    # zip 파일을 HttpResponse로 반환합니다.
    response = HttpResponse(buffer, content_type='application/zip')
    response['Content-Disposition'] = f'attachment; filename="{team.name}_files.zip"'
    return response