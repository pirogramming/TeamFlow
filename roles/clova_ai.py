import os
from pathlib import Path
import requests
from dotenv import load_dotenv

# ✅ 프로젝트 루트 경로 기준으로 .env 강제 로딩
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")  # 여기가 핵심!!!

# ✅ 확인 로그 찍기
print("✅ CLOVA_API_KEY:", os.getenv("CLOVA_API_KEY"))
print("✅ NCP_API_URL:", os.getenv("NCP_API_URL"))

load_dotenv()

import os
import requests

def call_clova_recommendation(prompt):
    url = os.getenv("CLOVA_API_URL")
    api_key = os.getenv("CLOVA_API_KEY")  # 새로운 Bearer 키

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
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

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code != 200:
        print("❌ Clova 호출 실패:", response.status_code, response.text)
        raise Exception(f"Clova 오류: {response.status_code} {response.text}")

    return response.json()


def make_prompt(major, traits, preferences):
    trait_str = ", ".join(traits)
    pref_str = ", ".join(preferences)
    prompt = f"전공은 {major}이고, 성향은 {trait_str}이며, 선호하는 작업은 {pref_str}입니다. 이 사람에게 가장 어울리는 역할은 무엇인가요?"
    return prompt

    
print("✅ CLOVA_API_KEY:", os.getenv("CLOVA_API_KEY"))
print("✅ NCP_API_URL:", os.getenv("NCP_API_URL"))
