from django.shortcuts import render
from django.http import JsonResponse
from teams.models import Team
from tasks.models import Task
from files.models import File
from teams.models import TeamMember
from django.utils.dateformat import DateFormat

def format_date(date):
    return DateFormat(date).format('Y-m-d') if date else None

# ---------- HTML ----------
def team_log_page(request):
    # 그냥 HTML만 반환 → JS가 API 호출
    return render(request, 'main/team_log.html')

def team_log_detail_page(request, team_id):
    return render(request, 'main/team_log_detail.html', {'team_id': team_id})

# ---------- API ----------
def all_team_logs_api(request):
    teams = Team.objects.all().values('id', 'name', 'created_at')

    result = []
    for t in teams:
        result.append({
            "team_id": t['id'],
            "title": t['name'],
            "status": "진행중",
            "last_activity": format_date(t['created_at']),
        })

    return JsonResponse(result, safe=False)


def team_log_list_api(request, team_id):
    team = Team.objects.get(id=team_id)
    logs = []

    # 작업
    tasks = Task.objects.filter(team_id=team_id)
    for task in tasks:
        logs.append({
            "type": "task",
            "title": task.title,
            "description": task.description,
            "status": "완료" if task.is_completed else "진행중",
            "date": format_date(task.created_at)
        })

    # 파일
    files = File.objects.filter(team_id=team_id)
    for f in files:
        logs.append({
            "type": "file",
            "title": "파일 업로드",
            "description": f.file.name.split('/')[-1],
            "date": format_date(f.uploaded_at)
        })

    # 역할 변경
    members = TeamMember.objects.filter(team_id=team_id)
    for m in members:
        logs.append({
            "type": "role",
            "title": "역할 변경",
            "description": f"{m.user.username} → {m.role}" if m.role else f"{m.user.username} 역할 미정",
            "date": format_date(m.created_at)
        })

    # 정렬
    logs = sorted(logs, key=lambda x: x['date'] or '', reverse=True)

    return JsonResponse({
        "team": {
            "id": team.id,
            "title": team.name,
            "status": "진행중"
        },
        "logs": logs
    }, safe=False)
