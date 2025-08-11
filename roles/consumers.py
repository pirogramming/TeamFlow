import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from .models import AISubmission, Role, MemberRoleAssignment
from teams.models import Team
# roles/clova_ai.py에서 팀 전체 배정용 함수들을 정확히 import 합니다.
from .clova_ai import make_team_assignment_prompt, call_clova_team_assignment

class RoleAssignmentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.team_id = self.scope['url_route']['kwargs']['team_id']
        self.team_group_name = f'role_assignment_team_{self.team_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.team_group_name,
            self.channel_name
        )
        await self.accept()
        await self.broadcast_submission_status()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.team_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'resubmitting':
            # 💡 'resubmitting' 신호를 받으면 기존 제출 기록을 삭제합니다.
            await self.delete_submission_for_user()
            return # 이 시점에서 함수 종료 (다음 제출 메시지를 기다림)
        
        elif data.get('type') == 'start_ai_assignment':
            await self.trigger_ai_assignment()
        else:
            # 기존 제출 로직
            await self.save_submission(data)
            await self.broadcast_submission_status()

    @sync_to_async
    def delete_submission_for_user(self):
        """
        현재 팀에서 해당 사용자의 기존 제출 기록을 삭제하는 함수
        """
        try:
            submission = AISubmission.objects.get(team_id=self.team_id, user=self.user)
            submission.delete()
            print(f"✅ 사용자 {self.user.username}의 기존 제출 기록을 삭제했습니다.")
        except AISubmission.DoesNotExist:
            print(f"⚠️ 사용자 {self.user.username}의 기존 제출 기록이 없습니다.")
            return
        
    @sync_to_async
    def save_submission(self, data):
        AISubmission.objects.update_or_create(
            team_id=self.team_id,
            user=self.user,
            defaults={
                'major': data.get('major'),
                'traits': data.get('traits', []),
                'preferences': data.get('preferences', [])
            }
        )

    async def broadcast_submission_status(self):
        total_members, submitted_members_data = await self.get_submission_status()
        
        await self.channel_layer.group_send(
            self.team_group_name,
            {
                'type': 'submission_update',
                'total_members': total_members,
                'submitted_members': submitted_members_data,
                'all_submitted': len(submitted_members_data) == total_members and total_members > 0
            }
        )
        

    @sync_to_async
    def get_submission_status(self):
        team = Team.objects.get(id=self.team_id)
        total_members = team.members.count()
        submissions = AISubmission.objects.filter(team_id=self.team_id).select_related('user')
        submitted_members_data = [{'id': sub.user.id, 'name': sub.user.username} for sub in submissions]
        return total_members, submitted_members_data
    
    async def trigger_ai_assignment(self):
        if await self.is_ai_assignment_complete():
            print("✅ AI 배정이 이미 완료되어 추가 실행을 건너뜁니다.")
            return
        assignments = await self.run_ai_assignment()
        if assignments: # assignments가 None이 아닐 때만 메시지 전송
            await self.channel_layer.group_send(
                self.team_group_name,
                {
                    'type': 'assignment_complete',
                    'assignments': assignments
                }
            )

    @sync_to_async
    def is_ai_assignment_complete(self):
        """팀 객체의 ai_roles_assigned 상태를 확인합니다."""
        try:
            team = Team.objects.get(id=self.team_id)
            return team.ai_roles_assigned
        except Team.DoesNotExist:
            return True # 팀이 없으면 True를 반환하여 실행을 막습니다.

    @sync_to_async
    def set_ai_assignment_complete(self):
        """팀 객체의 ai_roles_assigned를 True로 설정합니다."""
        try:
            team = Team.objects.get(id=self.team_id)
            team.ai_roles_assigned = True
            team.save()
            print(f"✅ 팀 {team.id}의 AI 배정 상태를 완료로 업데이트했습니다.")
        except Team.DoesNotExist:
            print(f"❌ 팀 {self.team_id}를 찾을 수 없어 상태 업데이트에 실패했습니다.")

    @sync_to_async
    def run_ai_assignment(self):
        team = Team.objects.get(id=self.team_id)
        team_roles = list(Role.objects.filter(team=team).values_list('name', flat=True))
        submissions = AISubmission.objects.filter(team=team).select_related('user')
        
        members_info = [{
            'name': sub.user.username,
            'major': sub.major,
            'traits': sub.traits,
            'preferences': sub.preferences
        } for sub in submissions]

        prompt = make_team_assignment_prompt(team_roles, members_info)
        
        # 팀 전체 배정용 함수를 호출하도록 수정합니다.
        assignments = call_clova_team_assignment(prompt)

        if not assignments or not isinstance(assignments, list):
            print(f"❌ AI 응답이 유효하지 않음: {assignments}")
            return None

        # DB에 최종 결과 저장
        for assignment in assignments:
            try:
                user = User.objects.get(username=assignment['username'])
                assignment['user_id'] = user.id
                role = Role.objects.get(team=team, name=assignment['assigned_role'])
                MemberRoleAssignment.objects.update_or_create(
                    user=user, team=team, defaults={'role': role, 'assigned_by_ai': True}
                )
            except (User.DoesNotExist, Role.DoesNotExist) as e:
                print(f"❌ 역할 저장 실패: {e}")
                continue
        AISubmission.objects.filter(team=team).delete()
        return assignments

    async def submission_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def assignment_complete(self, event):
        await self.send(text_data=json.dumps(event))