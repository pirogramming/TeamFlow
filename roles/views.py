# ========================================
# MGP: 역할 관리 뷰 확장
# 사용자 요구사항에 맞는 API 엔드포인트 추가 및 기존 뷰 개선 (역할 삭제 기능 포함)
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
import json
from .models import Role, MemberRoleAssignment
from teams.models import Team, TeamMember
from users.models import Profile
from .clova_ai import call_clova_recommendation, make_prompt
import logging
logger = logging.getLogger(__name__)


# 역할 페이지 렌더링
@login_required
def roles_page(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    request.session['current_team_id'] = team.id  # 현재 팀 ID를 세션에 저장
    
    # 팀 멤버 정보
    team_members = team.teammember_set.select_related('user', 'user__profile')
    
    # 등록된 역할 목록
    team_roles = Role.objects.filter(team=team)
    
    # 현재 사용자의 프로필 정보 (전공)
    user_profile = getattr(request.user, 'profile', None)
    user_major = user_profile.major if user_profile else ''
    
    # ✨ 이 부분이 핵심 수정 사항입니다.
    # 1. MemberRoleAssignment에서 최신 역할 할당 정보를 가져옵니다.
    assignments = MemberRoleAssignment.objects.filter(team=team).select_related('role')
    # 2. user_id를 키로, 할당된 역할 객체를 값으로 하는 딕셔너리를 만듭니다.
    assignment_map = {assignment.user_id: assignment.role for assignment in assignments}
    
    # 3. 각 팀원 객체에 할당된 역할을 직접 추가합니다.
    for member in team_members:
        member.assigned_role = assignment_map.get(member.user.id)
    
    return render(request, 'main/roles.html', {
        'team': team,
        'team_members': team_members, # ✨ 최신 역할이 반영된 리스트를 전달
        'team_roles': team_roles,
        'user_major': user_major,
        # 'role_assignments'는 이제 'team_members'에 통합되었으므로 별도로 필요 없습니다.
        'current_team_id': team.id,
        'hide_sidebar': False,
        'hide_footer': False,
    })

# 역할 목록 조회 API
@login_required
@require_http_methods(["GET"])
def roles_list_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    roles = Role.objects.filter(team=team).values('id', 'name', 'description', 'is_ai_generated')
    return JsonResponse({'roles': list(roles)})

# 새 역할 생성 API
@login_required
@csrf_exempt
@require_http_methods(["POST"])
def create_role_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    
    try:
        data = json.loads(request.body)
        role_name = data.get('name', '').strip()
        role_description = data.get('description', '').strip()
        
        if not role_name:
            return JsonResponse({'error': '역할명을 입력해주세요.'}, status=400)
        
        # 중복 체크
        if Role.objects.filter(team=team, name=role_name).exists():
            return JsonResponse({'error': '이미 존재하는 역할명입니다.'}, status=400)
        
        role = Role.objects.create(
            name=role_name,
            description=role_description,
            team=team,
            created_by=request.user,
            is_ai_generated=data.get('is_ai_generated', False)
        )
        
        return JsonResponse({
            'success': True,
            'role': {
                'id': role.id,
                'name': role.name,
                'description': role.description,
                'is_ai_generated': role.is_ai_generated
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': '잘못된 요청 형식입니다.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# 역할 삭제 API
@login_required
@csrf_exempt
@require_http_methods(["DELETE"])
def delete_role_api(request, team_id, role_id):
    team = get_object_or_404(Team, id=team_id)
    role = get_object_or_404(Role, id=role_id, team=team)
    
    try:
        assigned_members = MemberRoleAssignment.objects.filter(role=role)
        assigned_count = assigned_members.count()
        
        if assigned_count > 0:
            assigned_members.delete()
        
        role_name = role.name
        role.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'역할 "{role_name}"이 삭제되었습니다.'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# AI 역할 추천 API
@csrf_exempt
@require_http_methods(["POST"])
def recommend_role_api(request):
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
        major = (data.get("major") or getattr(getattr(request.user, "profile", None), "major", "") or "").strip()
        traits = data.get("traits") or []
        preferences = data.get("preferences") or []

        team_id = request.session.get("current_team_id")
        if team_id:
            roles_qs = Role.objects.filter(team_id=team_id).only("name")
        else:
            roles_qs = Role.objects.none()

        available_role_names = [r.name for r in roles_qs]
        if not available_role_names:
            # 최소 기본값 (비어있으면 LLM 프롬프트가 애매해짐)
            available_role_names = ["기획", "개발", "디자인", "PM"]

        # 3) 프롬프트 생성
        prompt = make_prompt(major, traits, preferences)

        # 4) LLM 호출
        result = call_clova_recommendation(prompt, available_role_names)
        
        if not result:
            return JsonResponse({"ok": False, "error": "LLM 응답 파싱 실패"}, status=502)

        role, reason = result
        return JsonResponse({"ok": True, "role": role, "reason": reason}, status=200)

    except Exception as e:
        logger.exception("recommend_role_api failed")
        # 500 대신 502로 내려서 프론트가 메시지를 그대로 보여줄 수 있게 함
        return JsonResponse({"ok": False, "error": str(e)}, status=502)

# 역할 할당 API
@login_required
@csrf_exempt
@require_http_methods(["POST", "PATCH"])
def assign_role_api(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        role_id = data.get('role_id')
        is_ai_assigned = data.get('is_ai_assigned', False)
        
        if not user_id or not role_id:
            return JsonResponse({'error': '사용자와 역할을 선택해주세요.'}, status=400)
        
        user = get_object_or_404(User, id=user_id)
        role = get_object_or_404(Role, id=role_id, team=team)
        
        # 기존 할당 업데이트 또는 새로 생성
        assignment, created = MemberRoleAssignment.objects.update_or_create(
            user=user,
            team=team,
            defaults={
                'role': role,
                'assigned_by': request.user,
                'assigned_by_ai': is_ai_assigned
            }
        )
        
        return JsonResponse({
            'success': True,
            'assignment': {
                'user': user.username,
                'role': role.name,
                'role_id': role.id, # ✨ 프론트엔드에서 사용하기 위해 role_id 추가
                'is_ai_assigned': assignment.assigned_by_ai
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': '잘못된 요청 형식입니다.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ✨ 누락되었던 register_roles 함수를 다시 추가했습니다.
def register_roles(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    if request.method == 'POST':
        roles = request.POST.getlist('roles[]')
        for r in roles:
            Role.objects.create(name=r, team=team, created_by=request.user)
    return JsonResponse({"status": "ok"})
# ========================================

# MGP: 개선된 프롬프트 생성 함수 추가
# 선호 역할을 포함한 더 상세한 AI 추천을 위한 프롬프트 생성
# ========================================
def make_enhanced_prompt(major, traits, preferences, preferred_roles):
    traits_str = ", ".join(traits) if traits else "없음"
    prefs_str = ", ".join(preferences) if preferences else "없음"
    preferred_roles_str = ", ".join(preferred_roles) if preferred_roles else "없음"
    
    return f"""전공: {major}
성향: {traits_str}
선호 작업: {prefs_str}
선호 역할: {preferred_roles_str}

이 정보를 바탕으로 가장 적절한 팀 역할을 하나 추천해주세요. 
추천하는 역할명과 그 이유를 간단히 설명해주세요.
응답 형식: "추천 역할: [역할명] - [이유]" """