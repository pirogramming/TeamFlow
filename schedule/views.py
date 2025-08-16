import json
from collections import defaultdict
from datetime import date, timedelta

from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from teams.models import Team
from tasks.models import Task
from .models import Meeting, SchedulePoll, Vote

# ===================================================================
# 페이지 렌더링 뷰
# ===================================================================

@login_required
def calendar_page_view(request, team_id):
    """
    일정 관리(FullCalendar) 메인 HTML 페이지를 렌더링합니다.
    """
    team = get_object_or_404(Team, id=team_id)
    context = {
        'team': team,
    }
    return render(request, 'main/calendar.html', context)

# ===================================================================
# API 뷰 (JSON 응답)
# ===================================================================

@login_required
def schedule_list_view(request, team_id):
    """
    GET /api/teams/{team_id}/schedule/detail
    FullCalendar에 표시할 모든 일정(회의, 과제)을 JSON으로 반환합니다.
    """
    team = get_object_or_404(Team, id=team_id)
    if not team.members.filter(id=request.user.id).exists():
        return HttpResponseForbidden("팀 멤버가 아닙니다.")

    events = []
    today = date.today()
    
    # 1. 회의 일정을 events 리스트에 추가
    meetings = Meeting.objects.filter(team_id=team_id)
    for meeting in meetings:
        events.append({
            'id': f"meeting_{meeting.id}",
            'title': meeting.title,
            'start': meeting.start_time.isoformat(),
            'end': meeting.end_time.isoformat(),
            'color': '#3498db', # 회의는 파란색
            'extendedProps': {
                'type': 'meeting',
                'description': '팀 회의 일정입니다.'
            }
        })
    
    # 2. Task(할 일) 데이터를 가져와 events 리스트에 추가
    from django.db.models import Q
    tasks = Task.objects.filter(
        Q(team_id=team_id) & (Q(assignee=request.user) | Q(assignees=request.user))
    ).distinct().prefetch_related('assignees')
    for task in tasks:
        if not task.due_date:
            continue

        color = '#808080' # 기본 색상
        
        if task.status == 'completed':
            color = '#adb5bd' # 완료된 작업은 회색 (가장 높은 우선순위)
        elif task.due_date < today:
            color = '#343a40' # 지난 작업은 검은색 계열
        elif task.is_deadline_imminent:
            color = '#e74c3c' # 마감 임박은 빨간색
        elif task.type == 'personal':
            color = '#2ecc71' # 개인 할 일은 초록색
        elif task.type == 'team':
            color = '#f1c40f' # 팀 할 일은 노란색

        assignee_usernames = [assignee.username for assignee in task.assignees.all()]
        assignee_ids = [assignee.id for assignee in task.assignees.all()]
        assignee_first_names = [user.first_name for user in task.assignees.all()]

        events.append({
            'id': f"task_{task.id}",
            'title': f"[작업] {task.name}",
            'start': task.due_date.isoformat(),
            'allDay': True,
            'color': color,
            'extendedProps': {
                'type': 'task',
                'description': task.description,
                'assignee': ', '.join(assignee_usernames) if assignee_usernames else '미지정',
                'status': task.get_status_display(),
                'assigneeIds': assignee_ids,
                'assignee_first_name': ', '.join(assignee_first_names) if assignee_first_names else '미지정',
                
            }
        })

    return JsonResponse(events, safe=False)

@login_required
@require_http_methods(["POST"])
def schedule_create_view(request, team_id):
    """
    POST /api/teams/{team_id}/schedule/create
    새로운 회의 일정을 생성합니다.
    """
    team = get_object_or_404(Team, id=team_id)
    if not team.members.filter(id=request.user.id).exists():
        return HttpResponseForbidden("팀 멤버가 아닙니다.")
        
    data = json.loads(request.body)
    meeting = Meeting.objects.create(
        team_id=team_id,
        title=data.get('title'),
        start_time=data.get('start'),
        end_time=data.get('end'),
        created_by=request.user
    )
    return JsonResponse({'success': True, 'message': '회의가 추가되었습니다.', 'id': meeting.id})

@login_required
@require_http_methods(["DELETE"])
def schedule_delete_view(request, team_id, schedule_id):
    """
    DELETE 요청을 받아 특정 회의 일정을 삭제합니다.
    """
    meeting = get_object_or_404(Meeting, id=schedule_id, team_id=team_id)
    
    if request.user != meeting.created_by and request.user != meeting.team.owner:
        return JsonResponse({"error": "일정을 삭제할 권한이 없습니다."}, status=403)
        
    meeting.delete()
    return HttpResponse(status=204)

@login_required
@require_http_methods(["PATCH"])
def schedule_update_view(request, team_id, schedule_id):
    """
    PATCH /api/teams/{team_id}/schedule/{schedule_id}/update
    특정 회의 일정의 시간/내용을 수정합니다.
    """
    meeting = get_object_or_404(Meeting, id=schedule_id, team_id=team_id)
    data = json.loads(request.body)
    
    meeting.title = data.get('title', meeting.title)
    meeting.start_time = data.get('start', meeting.start_time)
    meeting.end_time = data.get('end', meeting.end_time)
    meeting.save()
    
    return JsonResponse({'success': True, 'message': '일정이 수정되었습니다.'})

@login_required
def schedule_mediate_view(request, team_id):
    """
    GET /api/teams/{team_id}/schedule/mediate
    When2Meet 그리드에 필요한 데이터와 가장 많이 겹치는 시간대, 그리고 이번 주 날짜를 계산하여 JSON으로 반환합니다.
    """
    poll, _ = SchedulePoll.objects.get_or_create(team_id=team_id, is_active=True)
    votes = Vote.objects.filter(poll=poll).select_related('voter')
    
    availability_data = defaultdict(lambda: {'count': 0, 'users': []})
    
    for vote in votes:
        if isinstance(vote.available_slots, dict):
            for day, slots in vote.available_slots.items():
                for slot in slots:
                    slot_key = f"{day}-{slot}"
                    availability_data[slot_key]['count'] += 1
                    availability_data[slot_key]['users'].append(vote.voter.username)
    
    best_slots = []
    if availability_data:
        max_votes = max((data['count'] for data in availability_data.values()), default=0)
        if max_votes > 0:
            best_slots = [
                slot for slot, data in availability_data.items() 
                if data['count'] == max_votes
            ]

    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    week_dates = [(start_of_week + timedelta(days=i)).strftime('%m/%d') for i in range(7)]

    my_vote = Vote.objects.filter(poll=poll, voter=request.user).first()
    my_slots = my_vote.available_slots if my_vote else {}

    return JsonResponse({
        'poll_id': poll.id,
        'team_members_count': poll.team.members.count(),
        'availability': availability_data,
        'my_vote': my_slots,
        'best_slots': best_slots,
        'week_dates': week_dates,
    })

@login_required
@require_http_methods(["POST"])
def save_vote_view(request, team_id):
    """
    POST /api/teams/{team_id}/schedule/save_vote
    사용자의 '가능한 시간' 투표를 저장합니다.
    """
    poll, _ = SchedulePoll.objects.get_or_create(team_id=team_id, is_active=True)
    data = json.loads(request.body)
    available_slots = data.get('available_slots', {})

    Vote.objects.update_or_create(
        poll=poll,
        voter=request.user,
        defaults={'available_slots': available_slots}
    )
    return JsonResponse({'success': True, 'message': '시간이 저장되었습니다.'})