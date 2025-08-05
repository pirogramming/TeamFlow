from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from teams.models import Team, TeamMember
from django.db.models import F
from tasks.models import Task

def landing_page_view(request):
    return render(request, 'landing/index.html')


# ========================================
# MGP: 대시보드 API 엔드포인트 추가
# 백엔드 부분 대신 수정: 세션 기반 현재 팀 확인 로직 추가
# ========================================
class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # ========================================
            # MGP: 세션 기반 현재 팀 선택 로직 추가
            # 백엔드 부분 대신 수정: 헤더에서 선택한 팀을 대시보드에 반영
            
            # 세션에서 현재 선택된 팀 ID 가져오기
            current_team_id = request.session.get('current_team_id')
            print(f"[대시보드 API] 세션의 현재 팀 ID: {current_team_id}")
            
            if current_team_id:
                # 현재 선택된 팀의 멤버십 확인
                try:
                    team_member = TeamMember.objects.get(user=request.user, team_id=current_team_id)
                    team = team_member.team
                    print(f"[대시보드 API] 현재 팀: {team.name} (ID: {team.id}, 코드: {team.invite_code})")
                except TeamMember.DoesNotExist:
                    print(f"[대시보드 API] 사용자가 팀 {current_team_id}의 멤버가 아님, 첫 번째 팀 사용")
                    # 사용자가 해당 팀의 멤버가 아니면 첫 번째 팀 사용
                    team_member = TeamMember.objects.filter(user=request.user).first()
                    if not team_member:
                        return Response({'error': '팀에 속해있지 않습니다.'}, status=404)
                    team = team_member.team
            else:
                # 세션에 현재 팀이 없으면 첫 번째 팀 사용
                print("[대시보드 API] 세션에 현재 팀 없음, 첫 번째 팀 사용")
                team_member = TeamMember.objects.filter(user=request.user).first()
                if not team_member:
                    return Response({'error': '팀에 속해있지 않습니다.'}, status=404)
                team = team_member.team
                
                # 첫 번째 팀을 세션에 저장
                request.session['current_team_id'] = team.id
                print(f"[대시보드 API] 첫 번째 팀을 현재 팀으로 설정: {team.name} (ID: {team.id})")
            # ========================================
            
            # 현재 사용자의 팀 멤버십 다시 가져오기 (역할 정보 포함)
            team_member = TeamMember.objects.get(user=request.user, team=team)
            
            # 팀 멤버 정보 가져오기
            team_members = TeamMember.objects.filter(team=team).values(
                'user__first_name', 
                'user__profile__major', 
                'role'
            )
            
            # 대시보드 데이터 구성
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
                'total_progress': 0,  # 임시 데이터
                'completed_tasks_count': 0,  # 임시 데이터
                'total_tasks_count': 0,  # 임시 데이터
                'personal_progress': 0,  # 임시 데이터
                'personal_completed_count': 0,  # 임시 데이터
                'personal_tasks_count': 0,  # 임시 데이터
            }
            
            return Response(dashboard_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
# ========================================


# ========================================
# MGP: 대시보드 페이지 뷰 함수 추가 (프리뷰 제거 후 실제 페이지 연결)
@login_required
def dashboard_page(request):
    """대시보드 페이지"""
    return render(request, 'main/dashboard.html')
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