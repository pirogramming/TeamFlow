from django.shortcuts import render
from django.http import JsonResponse
from teams.models import Team
from tasks.models import Task
from files.models import File
from teams.models import TeamMember
from django.utils.dateformat import DateFormat
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.http import HttpResponseForbidden
from .models import TeamLog


def format_date(date):
    return DateFormat(date).format('Y-m-d') if date else None

# ---------- HTML ----------
def team_log_page(request):
    # 그냥 HTML만 반환 → JS가 API 호출
    return render(request, 'main/team_log.html')

def team_log_detail_page(request, team_id):
    request.session['current_team_id'] = team_id  # 현재 팀 ID를 세션에 저장
    return render(request, 'main/team_log_detail.html', {'team_id': team_id})

# ---------- API ----------
# 로그인 필수 + 멤버십 필터
@login_required
def all_team_logs_api(request):
    # 로그인한 사용자가 속한 팀만
    teams = (Team.objects
             .filter(teammember__user=request.user)
             .distinct()
             .values('id', 'name', 'created_at'))

    result = []
    for t in teams:
        result.append({
            "team_id": t['id'],
            "title": t['name'],
            "status": "진행중",  # TODO: 필요 시 진행률 계산
            "last_activity": format_date(t['created_at']),
            "dashboard_url": f"/api/dashboard/{t['id']}/",  # 프로젝트 보기
        })
    return JsonResponse(result, safe=False)


#로그인 필수 + 접근권한 체크(해당 팀에 속해있지 않으면 403)
@login_required
def team_log_list_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)

    # 접근권한: 팀 멤버만
    is_member = TeamMember.objects.filter(team=team, user=request.user).exists()
    if not is_member:
        return HttpResponseForbidden("권한이 없습니다.")

    logs = []

    # ---- 커스텀 팀 로그(TeamLog): '본인 작성' 판별용 created_by_id 포함 ----
    for log in TeamLog.objects.filter(team=team).order_by('-created_at'):
        logs.append({
            "type": "teamlog",
            "title": log.title,
            "description": log.description,
            "status": "완료" if log.status == "completed" else "진행중",
            "date": format_date(log.created_at),
            "created_by_id": log.created_by_id,  # 본인 판별용
        })

    # ---- 작업(Task) ----
    for task in Task.objects.filter(team=team):
        logs.append({
            "type": "task",
            "title": task.title,
            "description": task.description,
            "status": "완료" if getattr(task, 'is_completed', False) else "진행중",
            "date": format_date(getattr(task, 'created_at', None)),
            "created_by_id": None,  # 시스템성/작성자 불명 → 숨김 버튼 노출 X
        })

    # ---- 파일(File) ----
    for f in File.objects.filter(team=team):
        logs.append({
            "type": "file",
            "title": "파일 업로드",
            "description": f.file.name.split('/')[-1],
            "date": format_date(getattr(f, 'uploaded_at', None)),
            "created_by_id": None,
        })

    # ---- 역할 변경(TeamMember) ----
    for m in TeamMember.objects.filter(team=team):
        logs.append({
            "type": "role",
            "title": "역할 변경",
            "description": f"{m.user.username} → {m.role}" if m.role else f"{m.user.username} 역할 미정",
            "date": format_date(getattr(m, 'created_at', None)),
            "created_by_id": None,
        })

    # 정렬: 날짜 없는 항목은 뒤로
    logs = sorted(logs, key=lambda x: (x['date'] is None, x['date']), reverse=True)

    return JsonResponse({
        "team": {
            "id": team.id,
            "title": team.name,
            "status": "진행중",
            "dashboard_url": f"/api/dashboard/{team.id}/",
        },
        "me_id": request.user.id,  # 프론트에서 '본인 로그' 판별용
        "logs": logs
    }, safe=False)
