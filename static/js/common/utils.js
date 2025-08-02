/**
 * 공통 유틸리티 함수 (백엔드 테스트용)
 */

/**
 * 로딩 표시
 */
function showLoading(message = "처리 중입니다...") {
  const loading = document.getElementById("global-loading");
  if (loading) {
    loading.querySelector("p").textContent = message;
    loading.style.display = "flex";
  }
}

/**
 * 로딩 숨김
 */
function hideLoading() {
  const loading = document.getElementById("global-loading");
  if (loading) {
    loading.style.display = "none";
  }
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
  alert("✅ " + message);
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
  alert("❌ " + message);
}

/**
 * 사용자 정보 저장
 */
function setUserInfo(userData) {
  localStorage.setItem("user_info", JSON.stringify(userData));
}

/**
 * 사용자 정보 가져오기
 */
function getUserInfo() {
  const data = localStorage.getItem("user_info");
  return data ? JSON.parse(data) : null;
}

// 전역 함수로 노출
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showSuccess = showSuccess;
window.showError = showError;
window.setUserInfo = setUserInfo;
window.getUserInfo = getUserInfo;
