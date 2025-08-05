import json
from collections import defaultdict

from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from teams.models import Team
from .models import Meeting, SchedulePoll, Vote
# from tasks.models import Task # 나중에 Task 모델 임포트

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

    meetings = Meeting.objects.filter(team_id=team_id)
    # tasks = Task.objects.filter(team_id=team_id) # 나중에 Task 기능 추가 시

    events = []
    for meeting in meetings:
        events.append({
            'id': meeting.id, # 일정 수정을 위해 id 추가
            'title': meeting.title,
            'start': meeting.start_time.isoformat(),
            'end': meeting.end_time.isoformat(),
            'color': '#3498db', # 회의는 파란색 계열로 표시
            'type': 'meeting'
        })
    
    # for task in tasks:
    #     events.append({ ... }) # 과제는 다른 색으로 표시

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
    DELETE /api/teams/{team_id}/schedule/{schedule_id}/delete
    특정 회의 일정을 삭제합니다.
    """
    meeting = get_object_or_404(Meeting, id=schedule_id, team_id=team_id)
    
    # 팀장 또는 일정 생성자만 삭제 가능
    if request.user != meeting.created_by and request.user != meeting.team.owner:
        return HttpResponseForbidden("일정을 삭제할 권한이 없습니다.")
        
    meeting.delete()
    return JsonResponse({'success': True, 'message': '일정이 삭제되었습니다.'})

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
    When2Meet 그리드에 필요한 데이터를 계산하여 JSON으로 반환합니다.
    """
    poll, _ = SchedulePoll.objects.get_or_create(team_id=team_id, is_active=True)
    votes = Vote.objects.filter(poll=poll)
    
    availability_counts = defaultdict(int)
    for vote in votes:
        for day, slots in vote.available_slots.items():
            for slot in slots:
                availability_counts[f"{day}-{slot}"] += 1
    
    my_vote = Vote.objects.filter(poll=poll, voter=request.user).first()
    my_slots = my_vote.available_slots if my_vote else {}

    return JsonResponse({
        'poll_id': poll.id,
        'team_members_count': poll.team.members.count(),
        'availability': availability_counts,
        'my_vote': my_slots,
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