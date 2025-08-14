from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Team, TeamMember # ⬅️ TeamMember도 import 해야 합니다.

# ========================================
# MGP: REST API 엔드포인트 추가
# 백엔드 팀원이 해결해야 할 부분 대신 해결: 팀 생성/참여 API
# ========================================
class TeamCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            name = request.data.get('name')
            description = request.data.get('description', '')
            # ========================================
            # MGP: 프론트엔드에서 전달받은 초대 코드 사용
            # 백엔드 팀원이 해결해야 할 부분 대신 해결: 팀 생성 시 초대 코드 일관성 유지
            # ========================================
            invite_code = request.data.get('invite_code', '')  # 프론트엔드에서 전달받은 초대 코드
            
            if not name:
                return Response({'error': '팀 이름은 필수입니다.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # ========================================
            # MGP: 팀 생성 시 프론트엔드에서 생성한 초대 코드 사용
            # 백엔드 팀원이 해결해야 할 부분 대신 해결: 초대 코드 일관성 보장
            # ========================================
            new_team = Team.objects.create(
                name=name,
                description=description,
                owner=request.user,
                invite_code=invite_code  # 프론트엔드에서 생성한 코드 사용
            )
            
            # 팀 멤버로 추가 (팀장)
            TeamMember.objects.create(team=new_team, user=request.user, role="팀장")
            
            return Response({
                'success': True,
                'team_id': new_team.id,
                'team_name': new_team.name,
                'invite_code': new_team.invite_code
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TeamJoinAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            print(f"[팀 참여 API] 사용자: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
            print(f"[팀 참여 API] 요청 데이터: {request.data}")
            
            invite_code = request.data.get('invite_code')
            print(f"[팀 참여 API] 초대 코드: {invite_code}")
            
            if not invite_code:
                print("[팀 참여 API] 오류: 초대 코드 없음")
                return Response({'error': '초대 코드는 필수입니다.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 팀 찾기
            try:
                team = Team.objects.get(invite_code=invite_code)
                print(f"[팀 참여 API] 팀 찾음: {team.name} (ID: {team.id})")
            except Team.DoesNotExist:
                print(f"[팀 참여 API] 오류: 초대 코드 '{invite_code}'에 해당하는 팀 없음")
                return Response({'error': '유효하지 않은 초대 코드입니다.'}, status=status.HTTP_404_NOT_FOUND)
            
            # 이미 참여한 팀인지 확인
            if TeamMember.objects.filter(team=team, user=request.user).exists():
                print(f"[팀 참여 API] 오류: 사용자 {request.user.username}는 이미 {team.name} 팀의 멤버")
                return Response({'error': '이미 참여한 팀입니다.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 팀 멤버로 추가
            TeamMember.objects.create(team=team, user=request.user, role="팀원")
            print(f"[팀 참여 API] 성공: 사용자 {request.user.username}를 {team.name} 팀에 추가")
            
            return Response({
                'success': True,
                'team_id': team.id,
                'team_name': team.name
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"[팀 참여 API] 예외 발생: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserTeamsAPIView(APIView):
    """사용자가 참여한 팀 목록 반환"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # 사용자가 참여한 팀 목록 가져오기
            team_memberships = TeamMember.objects.filter(user=request.user).select_related('team')
            
            teams_data = []
            for membership in team_memberships:
                team = membership.team
                teams_data.append({
                    'id': team.id,
                    'name': team.name,
                    'description': team.description,
                    'role': membership.role,
                    'is_owner': team.owner == request.user,
                    'invite_code': team.invite_code,
                    'created_at': team.created_at.isoformat()
                })
            
            return Response({
                'success': True,
                'teams': teams_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CurrentTeamAPIView(APIView):
    """현재 선택된 팀 설정/조회"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """현재 선택된 팀 정보 반환"""
        try:
            # 세션에서 현재 팀 ID 가져오기 (없으면 첫 번째 팀)
            current_team_id = request.session.get('current_team_id')
            print(f"[현재 팀 조회] 사용자: {request.user.username}")
            print(f"[현재 팀 조회] 세션의 현재 팀 ID: {current_team_id}")
            
            if current_team_id:
                try:
                    team_membership = TeamMember.objects.get(team_id=current_team_id, user=request.user)
                    team = team_membership.team
                except TeamMember.DoesNotExist:
                    # 현재 팀이 유효하지 않으면 첫 번째 팀으로 설정
                    team_membership = TeamMember.objects.filter(user=request.user).select_related('team').first()
                    if not team_membership:
                        return Response({'error': '참여한 팀이 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
                    team = team_membership.team
                    request.session['current_team_id'] = team.id
            else:
                # 첫 번째 팀으로 설정
                team_membership = TeamMember.objects.filter(user=request.user).select_related('team').first()
                if not team_membership:
                    return Response({'error': '참여한 팀이 없습니다.'}, status=status.HTTP_404_NOT_FOUND)
                team = team_membership.team
                request.session['current_team_id'] = team.id
            
            return Response({
                'success': True,
                'team': {
                    'id': team.id,
                    'name': team.name,
                    'description': team.description,
                    'role': team_membership.role,
                    'is_owner': team.owner == request.user
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """현재 팀 설정"""
        try:
            team_id = request.data.get('team_id')
            print(f"[현재 팀 변경] 요청된 팀 ID: {team_id}")
            print(f"[현재 팀 변경] 사용자: {request.user.username}")
            
            if not team_id:
                return Response({'error': '팀 ID는 필수입니다.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 사용자가 해당 팀의 멤버인지 확인
            try:
                team_membership = TeamMember.objects.get(team_id=team_id, user=request.user)
                
                # 세션 변경 전후 확인
                old_team_id = request.session.get('current_team_id')
                request.session['current_team_id'] = team_id
                request.session.save()  # 명시적으로 세션 저장
                
                print(f"[현재 팀 변경] 성공: {old_team_id} → {team_id} ({team_membership.team.name})")
                print(f"[현재 팀 변경] 팀 초대 코드: {team_membership.team.invite_code}")
                print(f"[현재 팀 변경] 세션 저장됨: current_team_id = {request.session.get('current_team_id')}")
                
                return Response({
                    'success': True,
                    'team': {
                        'id': team_membership.team.id,
                        'name': team_membership.team.name,
                        'description': team_membership.team.description,
                        'role': team_membership.role
                    }
                }, status=status.HTTP_200_OK)
                
            except TeamMember.DoesNotExist:
                return Response({'error': '해당 팀의 멤버가 아닙니다.'}, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========================================
# MGP: 팀 정보 미리보기 API 추가
# 백엔드 부분 대신 수정: 초대 코드로 팀 정보 조회 API
# ========================================
class TeamInfoAPIView(APIView):
    """초대 코드로 팀 정보 조회 (팀 참여 페이지용)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, invite_code):
        """초대 코드로 팀 정보 조회"""
        try:
            print(f"[팀 정보 조회] 초대 코드: {invite_code}")
            print(f"[팀 정보 조회] 사용자: {request.user.username}")
            
            # 초대 코드로 팀 찾기
            try:
                team = Team.objects.get(invite_code=invite_code)
                print(f"[팀 정보 조회] 팀 찾음: {team.name} (ID: {team.id})")
            except Team.DoesNotExist:
                print(f"[팀 정보 조회] 오류: 초대 코드 '{invite_code}'에 해당하는 팀 없음")
                return Response({'error': '유효하지 않은 초대 코드입니다.'}, status=status.HTTP_404_NOT_FOUND)
            
            # 팀 멤버 수 계산
            member_count = TeamMember.objects.filter(team=team).count()
            
            # 팀장 정보 가져오기
            team_leader = TeamMember.objects.filter(team=team, role='팀장').first()
            leader_name = team_leader.user.first_name if team_leader and team_leader.user.first_name else team.owner.username
            
            team_info = {
                'id': team.id,
                'name': team.name,
                'description': team.description or '팀 설명이 없습니다.',
                'leader': leader_name,
                'members': member_count,
                'created_at': team.created_at.isoformat() if team.created_at else None
            }
            
            print(f"[팀 정보 조회] 응답 데이터: {team_info}")
            
            return Response({
                'success': True,
                'team': team_info
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"[팀 정보 조회] 예외 발생: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# ========================================


# ========================================

# ========================================
# MGP: 프론트엔드 페이지 뷰 함수들 추가 (프리뷰 제거 후 실제 페이지 연결)
@login_required
def team_setup_page(request):
    """팀 설정 선택 페이지"""
    # 사용자 정보를 context에 추가
    context = {
        'user': request.user,
        'user_profile': getattr(request.user, 'profile', None)
    }
    return render(request, 'auth/team-setup.html', context)

@login_required
def team_create_page(request):
    """팀 생성 페이지"""
    return render(request, 'team/create.html')

@login_required
def team_join_page(request):
    """팀 참여 페이지"""
    return render(request, 'team/join.html')


# ========================================
# 팀 삭제 / 팀 탈퇴 API
# ========================================
class TeamDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, team_id):
        try:
            team = Team.objects.get(id=team_id)
            # 권한: 팀장만 삭제 가능
            if team.owner != request.user:
                return Response({'error': '팀을 삭제할 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)

            team_name = team.name
            team.delete()
            return Response({'success': True, 'message': f'팀 "{team_name}"이 삭제되었습니다.'}, status=status.HTTP_200_OK)
        except Team.DoesNotExist:
            return Response({'error': '존재하지 않는 팀입니다.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TeamLeaveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, team_id):
        try:
            try:
                membership = TeamMember.objects.get(team_id=team_id, user=request.user)
            except TeamMember.DoesNotExist:
                return Response({'error': '해당 팀의 멤버가 아닙니다.'}, status=status.HTTP_404_NOT_FOUND)

            # 팀장은 바로 탈퇴 불가(먼저 팀장 권한 위임 필요) - 안전장치
            if membership.team.owner == request.user:
                return Response({'error': '팀장은 탈퇴할 수 없습니다. 팀장 권한을 위임 후 진행하세요.'}, status=status.HTTP_400_BAD_REQUEST)

            membership.delete()
            return Response({'success': True, 'message': '팀에서 탈퇴했습니다.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# ========================================

@login_required
def team_create_view(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        
        new_team = Team.objects.create(
            name=name,
            description=description,
            owner=request.user 
        )
        
        # ✨ 이 부분을 수정했습니다.
        # TeamMember 객체를 직접 생성하여 생성자를 '팀장'으로 추가합니다.
        TeamMember.objects.create(team=new_team, user=request.user, role="팀장")
        
        return redirect('/')

    return render(request, 'team/create.html')


@login_required
def team_join_view(request):
    if request.method == 'POST':
        code = request.POST.get('invite_code')
        try:
            team_to_join = Team.objects.get(invite_code=code)
            
            # members 필드를 직접 확인하는 대신, TeamMember 모델을 통해 확인합니다.
            if TeamMember.objects.filter(team=team_to_join, user=request.user).exists():
                return render(request, 'team/join.html', {'error': '이미 참여한 팀입니다.'})

            # ✨ 이 부분을 수정했습니다.
            # TeamMember 객체를 직접 생성하여 참여자를 '팀원'으로 추가합니다.
            TeamMember.objects.create(team=team_to_join, user=request.user, role="팀원")
            
            return redirect('/')
            
        except Team.DoesNotExist:
            return render(request, 'team/join.html', {'error': '유효하지 않은 초대 코드입니다.'})
            
    return render(request, 'team/join.html')