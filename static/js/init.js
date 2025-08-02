/**
 * 전역 초기화 (백엔드 테스트용)
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("TeamFlow 초기화 시작");

  // 로그인 상태 확인
  if (window.isLoggedIn && window.isLoggedIn()) {
    console.log("사용자 로그인 상태");
  } else {
    console.log("사용자 로그아웃 상태");
  }

  // 전역 에러 핸들러
  window.addEventListener("error", function (e) {
    console.error("JavaScript 오류:", e.error);
  });

  console.log("TeamFlow 초기화 완료");
});
