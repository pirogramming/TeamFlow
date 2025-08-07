# ========================================
# MGP: Clova AI API 설정 수정
# 사용자 제공 API 키 적용 및 환경변수 의존성 제거
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# ✅ 프로젝트 루트 경로 기준으로 .env 강제 로딩
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")  # 여기가 핵심!!!

CLOVA_API_URL = "https://clovastudio.stream.naver.com/testapp/v1/chat-completions/HCX"
# 사용자 제공 API 키 사용
CLOVA_API_KEY = "nv-61fd3b43f97747159bd6eef23e4bead4MTQw"

# ✅ 확인 로그 찍기
print("✅ CLOVA_API_KEY:", CLOVA_API_KEY)
print("✅ NCP_API_URL:", os.getenv("NCP_API_URL"))

def call_clova_recommendation(prompt):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CLOVA_API_KEY}",
        "X-NCP-CLOVASTUDIO-MODEL": "GPT-4"
    }

    payload = {
        "messages": [
            {"role": "system", "content": "너는 팀 프로젝트 역할 추천 AI야."},
            {"role": "user", "content": prompt}
        ],
        "topP": 0.8,
        "temperature": 0.7,
        "maxTokens": 200
    }

    response = requests.post(CLOVA_API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        print("❌ Clova 호출 실패:", response.status_code, response.text)
        raise Exception(f"Clova 오류: {response.status_code} {response.text}")

    return response.json()

def make_prompt(major, traits, preferences):
    trait_str = ", ".join(traits)
    pref_str = ", ".join(preferences)
    prompt = f"전공은 {major}이고, 성향은 {trait_str}이며, 선호하는 작업은 {pref_str}입니다. 이 사람에게 가장 어울리는 역할은 무엇인가요?"
    return prompt
# ========================================
