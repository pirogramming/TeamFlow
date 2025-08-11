# ========================================
# MGP: Clova AI API 설정 수정 (최소 패치 안정화)
# - base_url 정정 (/v1)
# - 헤더 ASCII 강제 (User-Agent)
# - JSON 응답 강제 시도 + 파싱 fallback
import os
from pathlib import Path
from typing import Tuple, List, Union
import json
from dotenv import load_dotenv
from openai import OpenAI

import re
import json

def _extract_json(text: str) -> dict:
    """
    응답 문자열에서 코드블록/잡텍스트를 제거하고 첫 번째 { ... } JSON만 파싱.
    모델이 중괄호 직전에 마침표/쉼표 등을 붙이는 실수를 보정한다.
    """
    if not text:
        raise ValueError("empty response")

    t = text.strip()

    # ``` 또는 ```json 으로 감싼 코드블록 제거
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\s*", "", t)
        t = re.sub(r"\s*```$", "", t).strip()

    # 문자열 전체에서 첫 번째 JSON 객체만 추출
    m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", t)
    if not m:
        raise ValueError(f"no JSON object or array found in: {text!r}")
    json_str = m.group(0)

    # 스마트 따옴표 보정
    json_str = json_str.replace("“", '"').replace("”", '"').replace("’", "'")

    # 1차 시도
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # 흔한 깨짐 보정:
        # - 마지막 } 바로 앞의 불필요한 마침표/쉼표 제거
        # - 마지막 } 바로 앞의 " . } 같은 패턴 정리
        fixed = json_str

        # ..."} .}  → ..."}}
        fixed = re.sub(r'"\s*[.,]\s*}', '"}', fixed)

        # ...123 ,}  → ...123}
        fixed = re.sub(r'([0-9\]\}"])\\s*,\\s*}', r'\1}', fixed)

        # 키-값 뒤에 붙은 트레일링 콤마 제거
        fixed = re.sub(r',\s*}', '}', fixed)

        # 공백 정리(안전)
        fixed = re.sub(r':\s+', ': ', fixed)

        return json.loads(fixed)



BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# 환경 변수 이름 혼동 방지
#   - OPENAI_API_KEY 에 nv- 로 시작하는 Clova 키를 넣어두었다면 그대로 사용 가능
API_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("CLOVA_API_KEY") or ""

def _ascii(s: str) -> str:
    return (s or "").encode("ascii", "ignore").decode("ascii")

# UA 오염(한글) 방지: httpx가 헤더를 ASCII로 인코딩하기 때문에 여기서 정리
os.environ.pop("OPENAI_USER_AGENT_APPEND", None)

client = OpenAI(
    api_key=API_KEY,  # Authorization: Bearer nv-***** 로 전송됨
    base_url="https://clovastudio.stream.ntruss.com/v1/openai",
    default_headers={
        "User-Agent": "TeamFlow/1.0",  # 반드시 ASCII
    },
)

def call_clova_recommendation(prompt: str, role_types: List[str]) -> Union[Tuple[str, str], None]:
    role_list_str = ", ".join(role_types)

    system_content = (
        "너는 팀 프로젝트 역할 추천 AI야. "
        "사용자가 제공한 역할 종류 중에서 가장 적합한 역할을 추천하고, "
        "그 이유를 아주 간략한 문장으로 설명해줘. "
        "응답은 반드시 순수 JSON만 출력해야해. 설명 문장이나 마크다운 코드블록(```), 텍스트를 절대 추가하지 마. "
        '{"recommendedRole": "추천 역할", "reason": "간략한 추천 이유"}.'
    )
    user_content = f"{prompt}\n추천할 역할 종류는 다음과 같아: {role_list_str}"

    # 1차: JSON 강제 시도 (미지원이면 서버가 무시하거나 에러낼 수 있음)
    try:
        resp = client.chat.completions.create(
            model="HCX-005",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_content},
            ],
            temperature=0.7,
            top_p=0.8,
            max_tokens=200,
            response_format={"type": "json_object"},
        )
        text = (resp.choices[0].message.content or "").strip()
        parsed = _extract_json(text)
        rec = parsed.get("recommendedRole")
        reason = parsed.get("reason")
        if rec and reason:
            return rec, reason
    except Exception:
        # fallback으로 바로 아래 일반 텍스트 파싱 재시도
        pass

    # 2차: 일반 응답 → 수동 JSON 파싱
    resp = client.chat.completions.create(
        model="HCX-005",
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        temperature=0.7,
        top_p=0.8,
        max_tokens=200,
    )
    text = (resp.choices[0].message.content or "").strip()

    try:
        parsed = _extract_json(text)
    except Exception:
        print("❌ Clova 응답 JSON 파싱 실패:", text)
        return None

    rec = parsed.get("recommendedRole")
    reason = parsed.get("reason")
    if rec and reason:
        return rec, reason
    print("❌ Clova 응답 JSON에 필드 누락:", parsed)
    return None

def call_clova_team_assignment(prompt: str) -> Union[list, None]:
    """
    팀 전체 역할 배정을 요청하고, JSON 배열을 반환합니다.
    """
    system_content = (
        "너는 프로젝트 팀의 역할을 배정하는 HR 전문가야. "
        "사용자가 제공한 역할 종류와 팀원 정보를 보고, 중복 없이 역할을 배정해줘. "
        "응답은 반드시 순수 JSON 배열만 출력해야해. 다른 설명은 절대 추가하지 마."
    )
    user_content = prompt
    try:
        resp = client.chat.completions.create(
            model="HCX-005",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_content},
            ],
            temperature=0.5,
            top_p=0.8,
            max_tokens=1024, # 여러 명의 정보를 반환해야 하므로 토큰 수 증가
        )
        text = (resp.choices[0].message.content or "").strip()
        parsed = _extract_json(text)
        if isinstance(parsed, list):
            return parsed
        else:
            print(f"❌ AI 응답이 예상된 배열 형식이 아님: {parsed}")
            return None
    except Exception as e:
        print(f"❌ Clova 팀 배정 API 호출 실패: {e}")
        return None

def make_prompt(major, traits, preferences):
    trait_str = ", ".join(traits)
    pref_str = ", ".join(preferences)
    return f"전공은 {major}이고, 성향은 {trait_str}이며, 선호하는 작업은 {pref_str}입니다. 이 사람에게 가장 어울리는 역할은 무엇인가요?"
# ========================================

# ✨ 이 함수를 파일 맨 아래에 추가하세요.
def make_team_assignment_prompt(team_roles, members_info):
    """
    팀 전체의 역할과 멤버 정보를 바탕으로 AI에게 보낼 프롬프트를 생성합니다.
    """
    roles_list_str = "\n- ".join(team_roles)
    members_info_str = "\n".join([
        f"- {member['name']}: 전공({member['major']}), 성향({', '.join(member['traits'])}), 선호({', '.join(member['preferences'])})"
        for member in members_info
    ])

    prompt = f"""
너는 프로젝트 팀의 역할을 배정하는 HR 전문가야.
아래에 있는 '팀 역할 목록'과 각 '팀원 정보'를 보고, 각 팀원에게 가장 적합한 역할을 중복되지 않게 하나씩만 배정해줘. 모든 팀원이 역할을 하나씩 가져야 해.

[팀 역할 목록]
- {roles_list_str}

[팀원 정보]
{members_info_str}

[출력 형식]
반드시 아래와 같은 JSON 배열 형식으로만 답변해줘. 다른 설명은 절대 추가하지 마.
[
  {{"username": "팀원이름1", "assigned_role": "배정된역할1"}},
  {{"username": "팀원이름2", "assigned_role": "배정된역할2"}}
]
"""
    return prompt