# ========================================
# MGP: Clova AI API 설정 수정
# 사용자 제공 API 키 적용 및 환경변수 의존성 제거
import os
import openai # OpenAI SDK 임포트
from pathlib import Path
from dotenv import load_dotenv
import json # JSON 파싱을 위해 추가
from typing import Union, Tuple

# 프로젝트 루트 경로 기준으로 .env 파일 강제 로딩
# .env 파일에 OPENAI_API_KEY가 설정되어 있어야 합니다.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# ✅ 환경 변수에서 OPENAI_API_KEY 불러오기
# 보안을 위해 API 키를 코드에 직접 노출하지 마세요.
# OpenAI SDK는 기본적으로 OPENAI_API_KEY 환경 변수를 찾습니다.
CLOVA_API_KEY = os.getenv("OPENAI_API_KEY") # <-- 변수 이름을 OPENAI_API_KEY로 변경

# ✅ OpenAI 클라이언트 인스턴스화
# Clova Studio의 OpenAI 호환 API 엔드포인트를 base_url로 설정합니다.
# 이 URL은 앱 이름을 포함하지 않습니다. (SDK가 자동으로 처리)
client = openai.OpenAI(
    api_key=CLOVA_API_KEY,
    base_url="https://clovastudio.stream.ntruss.com/v1/openai"
)


def call_clova_recommendation(prompt: str, role_types: list[str]) -> Union[Tuple[str, str], None]: # ✅ Union[Tuple[str, str], None]으로 수정
    """
    Clova Studio API를 호출하여 팀 프로젝트 역할 추천을 받습니다.
    OpenAI SDK의 chat.completions.create 메서드를 사용하며,
    추천 역할과 간략한 추천 이유를 각각 다른 변수에 저장하여 반환합니다.
    모든 예외 처리가 제거되었습니다.

    Args:
        prompt (str): 사용자 정보가 담긴 프롬프트.
        role_types (list[str]): 추천할 역할 종류 리스트.

    Returns:
        tuple[str, str] | None: (추천 역할, 추천 이유) 튜플 또는 오류 발생 시 None.
    """
    role_list_str = ", ".join(role_types)

    # LLM에게 특정 JSON 형식으로 응답하도록 지시하는 시스템 메시지
    system_content = (
        "너는 팀 프로젝트 역할 추천 AI야. "
        "사용자가 제공한 역할 종류 중에서 가장 적합한 역할을 추천하고, "
        "그 이유를 아주 간략한 문장으로 설명해줘. "
        "응답은 반드시 다음 JSON 형식으로 제공해야 해: "
        '{"recommendedRole": "추천 역할", "reason": "간략한 추천 이유"}.'
    )

    # LLM에게 전달할 사용자 메시지
    user_content = f"{prompt}\n추천할 역할 종류는 다음과 같아: {role_list_str}"

    # OpenAI SDK를 사용하여 Chat Completions API 호출
    response = client.chat.completions.create(
        model="HCX-005",  # 사용하려는 Clova Studio 모델명 (예: HCX-005)
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ],
        top_p=0.8,
        temperature=0.7,
        max_tokens=200,
        # ✅ response_format={"type": "json_object"} 제거
    )

    # 응답에서 메시지 내용 추출 및 JSON 파싱
    if response.choices and response.choices[0].message and response.choices[0].message.content:
        response_text = response.choices[0].message.content
        # 예외 처리가 제거되었으므로, JSON 파싱 실패 시 오류가 발생합니다.
        parsed_response = json.loads(response_text)
        recommended_role = parsed_response.get("recommendedRole")
        reason = parsed_response.get("reason")

        if recommended_role and reason:
            return recommended_role, reason
        else:
            # 필드가 누락되었을 경우의 처리 (예외 처리가 없으므로 None 반환)
            print("❌ Clova 응답 JSON에 'recommendedRole' 또는 'reason' 필드가 누락되었습니다.")
            return None
    else:
        # 유효한 메시지 내용이 없을 경우의 처리 (예외 처리가 없으므로 None 반환)
        print("❌ Clova 응답에 유효한 메시지 내용이 없습니다.")
        return None


def make_prompt(major, traits, preferences):
    trait_str = ", ".join(traits)
    pref_str = ", ".join(preferences)
    prompt = f"전공은 {major}이고, 성향은 {trait_str}이며, 선호하는 작업은 {pref_str}입니다. 이 사람에게 가장 어울리는 역할은 무엇인가요?"
    return prompt
# ========================================
