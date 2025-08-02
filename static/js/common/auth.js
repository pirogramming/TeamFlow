/**
 * 인증 관리 기본 함수 (백엔드 테스트용)
 */

/**
 * 토큰 저장
 */
function setAuthToken(accessToken, refreshToken = "") {
  localStorage.setItem("access_token", accessToken);
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }
}

/**
 * 토큰 가져오기
 */
function getAuthToken() {
  return localStorage.getItem("access_token");
}

/**
 * 로그인 상태 확인
 */
function isLoggedIn() {
  return !!getAuthToken();
}

/**
 * 로그아웃
 */
function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/";
}

// 전역 함수로 노출
window.setAuthToken = setAuthToken;
window.getAuthToken = getAuthToken;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
