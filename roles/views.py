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

# 역할 페이지 렌더링
@login_required
def roles_page(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    request.session['current_team_id'] = team.id  # 현재 팀 ID를 세션에 저장
    
    # 팀 멤버 정보
    team_members = team.teammember_set.select_related('user')
    
    # 등록된 역할 목록
    team_roles = Role.objects.filter(team=team)
    
    # 현재 사용자의 프로필 정보 (전공)
    user_profile = getattr(request.user, 'profile', None)
    user_major = user_profile.major if user_profile else ''
    
    # 팀원별 역할 할당 정보
    role_assignments = MemberRoleAssignment.objects.filter(team=team).select_related('user', 'role')
    
    return render(request, 'main/roles.html', {
        'team': team,
        'team_members': team_members,
        'team_roles': team_roles,
        'user_major': user_major,
        'role_assignments': role_assignments,
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

# ========================================
# MGP: 역할 삭제 API 추가
# 역할 삭제 시 할당된 팀원들의 역할 할당도 함께 해제하는 로직 구현
# ========================================
@login_required
@csrf_exempt
@require_http_methods(["DELETE"])
def delete_role_api(request, team_id, role_id):
    team = get_object_or_404(Team, id=team_id)
    role = get_object_or_404(Role, id=role_id, team=team)
    
    try:
        # 역할이 할당된 팀원들의 할당을 먼저 해제
        assigned_members = MemberRoleAssignment.objects.filter(role=role)
        assigned_count = assigned_members.count()
        
        if assigned_count > 0:
            # 할당된 팀원들의 역할 할당 해제
            assigned_members.delete()
            print(f"[역할 삭제] {assigned_count}명의 팀원 역할 할당 해제 완료")
        
        # 역할 삭제
        role_name = role.name
        role.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'역할 "{role_name}"이 삭제되었습니다.' + (f' ({assigned_count}명의 할당 해제됨)' if assigned_count > 0 else '')
        })
        
    except Exception as e:
        print(f"[역할 삭제 오류] {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

# AI 역할 추천 API (dev 브랜치 로직 유지)
@csrf_exempt
@require_http_methods(["POST"])
def recommend_role_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            major = data.get("major")
            traits = data.get("traits", [])
            preferences = data.get("preferences", [])

            prompt = make_prompt(major, traits, preferences)
            print("🟢 프롬프트:", prompt)

            clova_response = call_clova_recommendation(prompt)
            print("📦 응답 전체:", json.dumps(clova_response, indent=2, ensure_ascii=False))

            # ✅ result 키가 있는지 확인
            if "result" not in clova_response:
                return JsonResponse({"error": "Clova 응답 실패", "detail": clova_response}, status=500)

            content = clova_response["result"]["output"]
            return JsonResponse({"recommended_role": content})

        except Exception as e:
            import traceback
            print("❌ 에러 발생:", e)
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

# ========================================
# MGP: 역할 할당 API 추가
# 팀원에게 역할을 할당하거나 업데이트하는 기능 구현
# ========================================
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
                'is_ai_assigned': assignment.assigned_by_ai
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': '잘못된 요청 형식입니다.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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

# 기존 함수들 (호환성 유지)
def register_roles(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    if request.method == 'POST':
        roles = request.POST.getlist('roles[]')  # ["기획자", "디자이너"]
        for r in roles:
            Role.objects.create(name=r, team=team, created_by=request.user)
    return JsonResponse({"status": "ok"})
# ========================================
