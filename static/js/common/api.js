/**
 * API 통신 기본 함수 (백엔드 테스트용)
 *
 * 백엔드 개발자 참고:
 * - 모든 POST 요청에 CSRF 토큰 포함
 * - Authorization 헤더에 JWT 토큰 포함
 */

/**
 * 기본 API 호출 함수
 */
async function apiCall(url, options = {}) {
  const token = localStorage.getItem("access_token");

  const defaultHeaders = {
    "Content-Type": "application/json",
    "X-CSRFToken": document.querySelector("[name=csrf-token]")?.content || "",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method: "GET",
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  };

  if (
    options.data &&
    (config.method === "POST" ||
      config.method === "PUT" ||
      config.method === "PATCH")
  ) {
    config.body = JSON.stringify(options.data);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (response.ok) {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: data.error || data.detail || "요청 실패",
      };
    }
  } catch (error) {
    console.error("API 호출 오류:", error);
    return { success: false, error: "네트워크 오류" };
  }
}

// 전역 함수로 노출
window.apiCall = apiCall;
