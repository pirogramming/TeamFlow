from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Role, MemberRoleAssignment
from teams.models import Team
# from users.models import CustomUser  # 유저 모델
from .clova_ai import call_clova_recommendation, make_prompt
from django.shortcuts import render


# 역할 등록
def register_roles(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    if request.method == 'POST':
        roles = request.POST.getlist('roles[]')  # ["기획자", "디자이너"]
        for r in roles:
            Role.objects.create(name=r, team=team)
    return JsonResponse({"status": "ok"})

# AI 역할 추천 API
@csrf_exempt
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


def roles_page(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    return render(request, 'main/roles.html', {
        'team': team,
        'current_team_id': team.id  # 사이드바에서 쓰기 위해 전달
    })
