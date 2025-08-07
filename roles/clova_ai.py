# ========================================
# MGP: Clova AI API 설정 수정
# 사용자 제공 API 키 적용 및 환경변수 의존성 제거
import requests
import os

CLOVA_API_URL = "https://clovastudio.stream.naver.com/testapp/v1/chat-completions/HCX"
# 사용자 제공 API 키 사용
CLOVA_API_KEY = "nv-61fd3b43f97747159bd6eef23e4bead4MTQw"

def make_prompt(major, traits, preferences):
    traits_str = ", ".join(traits)
    prefs_str = ", ".join(preferences)
    return f"""전공: {major}
성향: {traits_str}
선호 작업: {prefs_str}

이 정보를 바탕으로 가장 적절한 팀 역할을 하나 추천해주세요. 이유도 간단히 설명해주세요."""

def call_clova_recommendation(prompt):
    headers = {
        "X-NCP-CLOVASTUDIO-API-KEY": CLOVA_API_KEY,
        "X-NCP-APIGW-API-KEY": CLOVA_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "messages": [
            {"role": "system", "content": "당신은 역할을 추천하는 팀 빌딩 도우미입니다."},
            {"role": "user", "content": prompt}
        ],
        "topP": 0.8,
        "temperature": 0.7,
        "maxTokens": 200,
    }

    response = requests.post(CLOVA_API_URL, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()
# ========================================
