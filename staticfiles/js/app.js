/**
 * TeamFlow 앱 메인 (백엔드 테스트용)
 */

(function () {
  "use strict";

  // 앱 설정
  window.TeamFlow = {
    version: "1.0.0",
    debug: window.APP_CONFIG?.DEBUG || false,
  };

  console.log("TeamFlow v" + window.TeamFlow.version + " 로드됨");

  // 디버그 모드일 때 추가 로깅
  if (window.TeamFlow.debug) {
    console.log("디버그 모드 활성화");
    console.log("APP_CONFIG:", window.APP_CONFIG);
  }
})();
