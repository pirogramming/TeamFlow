/**
 * Google OAuth 간단 구현 (백엔드 테스트용)
 *
 * 백엔드 개발자 참고:
 * - POST /api/auth/google/ 엔드포인트로 Google ID 토큰 전송
 * - 응답: { "access": "jwt_token", "refresh": "refresh_token", "user": {...} }
 */

// /**
//  * Google 로그인 시작 (랜딩페이지 버튼에서 호출)
//  */
// function startGoogleAuth() {
//   const clientId = window.APP_CONFIG?.GOOGLE_CLIENT_ID;

//   if (!clientId) {
//     alert(
//       "Google OAuth CLIENT_ID가 설정되지 않았습니다. .env 파일을 확인하세요."
//     );
//     return;
//   }

//   // Google One Tap 초기화 및 실행
//   google.accounts.id.initialize({
//     client_id: clientId,
//     callback: handleGoogleResponse,
//   });

//   google.accounts.id.prompt();
// }

// static/js/common/google-auth.js

/**
 * Google 로그인 응답 처리
 * - login.html의 g_id_onload data-callback과 연결
 */
async function handleGoogleCredentialResponse(response) {
    try {
        console.log("Google 토큰 받음:", response.credential.substring(0, 50) + "...");

        const result = await fetch("/api/auth/google/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector("[name=csrf-token]")?.content || "",
            },
            body: JSON.stringify({ token: response.credential }),
        });

        const data = await result.json();

        if (result.ok) {
            console.log("로그인 성공:", data);
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh || "");
            window.location.href = "/dashboard/";
        } else {
            alert("로그인 실패: " + (data.error || "알 수 없는 오류"));
        }
    } catch (error) {
        alert("서버 연결 오류: " + error.message);
    }
}

// g_id_onload가 직접 이 함수 호출하므로 여기서 별도 초기화/등록 필요 없음
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;