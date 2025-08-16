from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from teams.models import Team, TeamMember
from django.db.models import F
from tasks.models import Task
from datetime import date, timedelta

def landing_page_view(request):
    return render(request, 'landing/index.html')


# ========================================
# MGP: 대시보드 API 엔드포인트 수정
# 백엔드 부분 대신 수정: Task 모델에 없는 priority 필드 제거, 올바른 필드명으로 수정
class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            print("\n===== [DashboardAPIView GET 호출] =====")

            # 1. team_id 우선순위: 쿼리 파라미터 > 세션
            team_id = request.query_params.get('team_id') or request.session.get('current_team_id')
            print(f"[1] 요청 파라미터 team_id: {request.query_params.get('team_id')}")
            print(f"[2] 세션 저장 team_id: {request.session.get('current_team_id')}")
            print(f"[3] 최종 team_id: {team_id}")

            # 2. team_id 없으면 첫 번째 팀 자동 선택
            if not team_id:
                first_team_member = TeamMember.objects.filter(user=request.user).first()
                if not first_team_member:
                    print("[Error] 사용자가 어떤 팀에도 속해있지 않음")
                    return Response({'error': '팀에 속해있지 않습니다.'}, status=404)
                
                team_id = first_team_member.team.id
                request.session['current_team_id'] = team_id
                request.session.save()
                print(f"[4] 세션에 첫 번째 팀 저장: {team_id}")

            # 3. 해당 팀의 멤버십 검증
            try:
                team_member = TeamMember.objects.get(user=request.user, team_id=team_id)
                print(f"[5] 팀 멤버십 확인 성공: {team_member.team.name} (ID: {team_id})")
            except TeamMember.DoesNotExist:
                print(f"[Error] 팀 멤버 아님: team_id={team_id}")
                return Response({'error': '해당 팀의 멤버가 아닙니다.'}, status=403)

            team = team_member.team

            # 4. 팀 멤버 목록
            team_members = TeamMember.objects.filter(team=team).values(
                'user__first_name', 
                'user__profile__major', 
                'role'
            )
            print(f"[6] 팀 멤버 수: {len(team_members)}명")

            # 5. 팀 작업 / 개인 작업 조회
            all_tasks = Task.objects.filter(team=team).order_by('-created_at')
            team_tasks = all_tasks.filter(type='team')  # 팀 작업만
            personal_tasks = all_tasks.filter(type='personal', assignee=request.user)  # 개인 작업 중 본인 것만
            print(f"[7] 전체 작업 수: {all_tasks.count()}, 팀 작업 수: {team_tasks.count()}, 개인 작업 수: {personal_tasks.count()}")

            # 6. 진행률 계산
            total_tasks_count = all_tasks.count()
            completed_tasks_count = all_tasks.filter(status='completed').count()
            total_progress = int((completed_tasks_count / total_tasks_count) * 100) if total_tasks_count > 0 else 0

            personal_tasks_count = personal_tasks.count()
            personal_completed_count = personal_tasks.filter(status='completed').count()
            personal_progress = int((personal_completed_count / personal_tasks_count) * 100) if personal_tasks_count > 0 else 0

            # 7. 마감 임박 작업 수 계산 (팀 작업 + 개인 작업)
            from django.db.models import Q
            my_tasks = Task.objects.filter(
                Q(team_id=team_id) & (Q(assignee=request.user) | Q(assignees=request.user))
            ).distinct().order_by('-created_at')

            deadline_imminent_count = 0
            if team:
                deadline_threshold = date.today() + timedelta(days=1)
                
                # 팀 작업 + 개인 작업 중 완료되지 않은 마감 임박 작업 수
                imminent_tasks = my_tasks.filter(
                    team=team,
                    due_date__isnull=False,
                    due_date__lte=deadline_threshold,
                    status__in=['pending', 'in_progress']
                )
                deadline_imminent_count = imminent_tasks.count()

            print(f"[8] 전체 진행률: {total_progress}%, 개인 진행률: {personal_progress}%, 마감 임박: {deadline_imminent_count}개")

            # 8. 응답 데이터 구성
            dashboard_data = {
                'user': {
                    'name': request.user.first_name or '사용자',
                    'role': team_member.role or '미정'
                },
                'team': {
                    'id': team.id,
                    'name': team.name,
                    'description': team.description,
                    'invite_code': team.invite_code,
                    'created_at': team.created_at.isoformat() if team.created_at else None
                },
                'user_role': team_member.role,
                'team_members': list(team_members),
                'total_progress': total_progress,
                'personal_progress': personal_progress,
                'deadline_imminent_count': deadline_imminent_count,
                'team_tasks': list(team_tasks.values('id', 'name', 'status', 'due_date', 'type', 'assignee__first_name', 'assignee__username', 'description')),
                'personal_tasks': list(personal_tasks.values('id', 'name', 'status', 'due_date', 'type', 'description')),
            }

            print(f"[9] 응답 데이터 준비 완료: team_id={team.id}, team_name={team.name}")
            return Response(dashboard_data)

        except Exception as e:
            print(f"[Error] DashboardAPIView 예외 발생: {e}")
            return Response({'error': str(e)}, status=500)
# ========================================


# ========================================
# MGP: 대시보드 페이지 뷰 수정
# 백엔드 부분 대신 수정: 현재 팀 정보 가져오기 로직 추가, 팀 멤버 정보 포함, 올바른 작업 분류 및 진행률 계산
@login_required
def dashboard_page(request):
    """대시보드 페이지"""
    # 현재 팀 정보 가져오기
    team_id = request.session.get('current_team_id')
    if not team_id:
        # 첫 번째 팀 선택
        team_member = TeamMember.objects.filter(user=request.user).first()
        if team_member:
            team = team_member.team
            request.session['current_team_id'] = team.id
        else:
            # 팀이 없는 경우 팀 생성/참여 페이지로 리다이렉트
            return redirect('team_setup')
    else:
        team = get_object_or_404(Team, id=team_id)

    # 팀 멤버 정보 가져오기 (현재 사용자 포함)
    team_members = TeamMember.objects.filter(team=team).select_related('user', 'user__profile').values(
        'user__first_name', 
        'user__profile__major', 
        'role'
    )

    # 작업 분류 명확화
    all_tasks = Task.objects.filter(team=team).order_by('-created_at')
    
    # 팀 작업: type이 'team'인 모든 작업 (담당자 관계없이)
    team_tasks = all_tasks.filter(type='team')
    
    # 개인 작업: type이 'personal'이면서 현재 사용자가 담당자인 작업
    personal_tasks = all_tasks.filter(type='personal', assignee=request.user)

    # 디버깅용 출력
    print(f"현재 사용자 ID: {request.user.id}")
    print(f"팀: {team.name} (ID: {team.id})")
    print(f"전체 작업 수: {all_tasks.count()}")
    print(f"팀 작업 수: {team_tasks.count()}")
    print(f"개인 작업 수: {personal_tasks.count()}")
    print("=== 팀 작업 목록 ===")
    for task in team_tasks:
        print(f"- {task.name} (담당자: {task.assignee.id if task.assignee else 'None'})")
    print("=== 개인 작업 목록 ===")
    for task in personal_tasks:
        print(f"- {task.name} (담당자: {task.assignee.id})")

    # 진행률 계산 (completed 상태 기준)
    total_tasks_count = all_tasks.count()
    completed_tasks_count = all_tasks.filter(status='completed').count()
    total_progress = int((completed_tasks_count / total_tasks_count) * 100) if total_tasks_count > 0 else 0

    personal_tasks_count = personal_tasks.count()
    personal_completed_count = personal_tasks.filter(status='completed').count()
    personal_progress = int((personal_completed_count / personal_tasks_count) * 100) if personal_tasks_count > 0 else 0

    # deadline_imminent_count는 context processor에서 전역적으로 처리

    return render(request, 'main/dashboard.html', {
        'team': team,
        'team_members': team_members,
        'team_tasks': team_tasks,
        'personal_tasks': personal_tasks,
        'total_progress': total_progress,
        'personal_progress': personal_progress,
        'total_tasks_count': total_tasks_count,
        'completed_tasks_count': completed_tasks_count,
        'personal_tasks_count': personal_tasks_count,
        'personal_completed_count': personal_completed_count,

    })
# ========================================


@login_required
def dashboard_router_view(request):
    my_team = Team.objects.filter(members=request.user).first()

    if my_team:
        return redirect('dashboard', team_id=my_team.id)
    else:
        return redirect('team_join')
    

@login_required
def dashboard_view(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    user = request.user

    # 1. 팀 작업 및 개인 작업 정보 (임시로 빈 리스트 전달)
    # 팀 전체 작업
    all_team_tasks = Task.objects.filter(team=team).order_by('-created_at')

    # 개인 작업 (담당자가 현재 로그인한 사용자)
    personal_tasks = all_team_tasks.filter(assignee=user)

    # 2. 팀 현황 정보 불러오기 (이름, 학과, 역할)
    # User 모델에 'profile'과 'major' 필드가 있다고 가정
    team_members = TeamMember.objects.filter(team=team).annotate(
        name=F('user__username'),
        major=F('user__profile__major')
    ).values('name', 'major', 'role')

    # 3. 전체 진행률 및 개인 완료율 계산
    # 전체 진행률
    total_tasks_count = all_team_tasks.count()
    completed_tasks_count = all_team_tasks.filter(status='완료').count()
    total_progress = int((completed_tasks_count / total_tasks_count) * 100) if total_tasks_count > 0 else 0

    # 개인 진행률
    personal_tasks_count = personal_tasks.count()
    personal_completed_count = personal_tasks.filter(status='완료').count()
    personal_progress = int((personal_completed_count / personal_tasks_count) * 100) if personal_tasks_count > 0 else 0
        
    # 프론트엔드에 전달할 모든 데이터를 context에 담기
    context = {
        'team': team,
        'team_tasks': all_team_tasks,
        'personal_tasks': personal_tasks,
        'team_members': team_members,
        'total_progress': total_progress,
        'completed_tasks_count': completed_tasks_count,
        'total_tasks_count': total_tasks_count,
        'personal_progress': personal_progress,
        'personal_completed_count': personal_completed_count,
        'personal_tasks_count': personal_tasks_count,
    }
    
    return render(request, 'main/dashboard.html', context)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from teams.models import TeamMember

@api_view(['POST'])
def set_current_team(request):
    team_id = request.data.get('team_id')
    if not team_id:
        return Response({'error': 'team_id 누락'}, status=400)

    # 해당 팀의 멤버인지 확인
    if not TeamMember.objects.filter(user=request.user, team_id=team_id).exists():
        return Response({'error': '팀 멤버가 아님'}, status=403)

    # 세션에 team_id 저장
    request.session['current_team_id'] = team_id
    return Response({'success': True})


# ========================================
# 팀 관리 API (삭제/탈퇴)
# ========================================
class TeamDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, team_id):
        try:
            team = get_object_or_404(Team, id=team_id)
            # 권한: 팀장만 삭제 가능
            if team.owner != request.user:
                return Response({'error': '팀을 삭제할 권한이 없습니다.'}, status=403)

            team_name = team.name
            team.delete()
            return Response({'success': True, 'message': f'팀 "{team_name}"이 삭제되었습니다.'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class TeamLeaveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, team_id):
        try:
            membership = TeamMember.objects.filter(team_id=team_id, user=request.user).first()
            if not membership:
                return Response({'error': '해당 팀의 멤버가 아닙니다.'}, status=404)

            # 팀장은 바로 탈퇴 불가(먼저 팀장 권한 위임 필요)
            if membership.team.owner == request.user:
                return Response({'error': '팀장은 탈퇴할 수 없습니다. 팀장 권한을 위임 후 진행하세요.'}, status=400)

            membership.delete()
            return Response({'success': True, 'message': '팀에서 탈퇴했습니다.'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)