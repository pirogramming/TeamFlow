/**
 * 전역 초기화 (백엔드 테스트용)
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("TeamFlow 초기화 시작");

  // 로그인 상태 확인 (Django 템플릿에서 전달된 정보 사용)
  if (window.APP_CONFIG && window.APP_CONFIG.USER) {
    const user = window.APP_CONFIG.USER;
    console.log("사용자 정보:", user);
    
    if (user.isAuthenticated) {
      console.log(`사용자 로그인 상태: ${user.email} (ID: ${user.id})`);
    } else {
      console.log("사용자 로그아웃 상태");
    }
  } else {
    console.log("사용자 정보를 찾을 수 없음 - APP_CONFIG 확인 필요");
  }

  // 전역 에러 핸들러
  window.addEventListener("error", function (e) {
    console.error("JavaScript 오류:", e.error);
  });

  console.log("TeamFlow 초기화 완료");
});
