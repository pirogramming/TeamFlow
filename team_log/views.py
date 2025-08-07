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
    # TODO: 현재는 모든 팀을 반환하고 있음 - 사용자가 속한 팀만 반환하도록 수정 필요
    # teams = Team.objects.filter(members=request.user)
    teams = Team.objects.all().values('id', 'name', 'created_at')

    result = []
    for t in teams:
        # TODO: 프론트엔드에서 필요한 추가 데이터:
        # 1. 팀원 정보 (이름 리스트)
        # 2. 진행률 데이터 (완료된 작업 수, 전체 작업 수)
        # 3. 실제 진행 상태 계산
        result.append({
            "team_id": t['id'],
            "title": t['name'],
            "status": "진행중",  # TODO: Task 완료율 기반으로 계산 필요
            "last_activity": format_date(t['created_at']),
            # TODO: 아래 필드들 추가 필요
            # "members": [팀원 이름 리스트],
            # "progress": {"completed": 완료작업수, "total": 전체작업수, "percentage": 진행율}
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
