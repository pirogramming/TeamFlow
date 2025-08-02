/**
 * 팀 생성 페이지 (전통 Django 방식)
 * * - 폼 제출은 HTML의 action 속성을 통해 서버에서 직접 처리합니다.
 * - JavaScript는 페이지 이동과 같은 보조적인 역할만 담당합니다.
 */

document.addEventListener('DOMContentLoaded', function() {
    // 폼 제출(submit) 이벤트 리스너를 제거합니다.
    // 이제 폼은 브라우저의 기본 동작에 따라 서버로 제출됩니다.
    console.log('팀 생성 페이지 스크립트 로드됨.');
});

/**
 * 대시보드 페이지로 이동하는 함수
 * (HTML의 onclick 속성에서 호출)
 */
function navigateToDashboard() {
    // Django의 URL 템플릿 태그를 사용하는 것이 더 안전하지만,
    // JS 파일에서는 직접 경로를 지정해야 합니다.
    window.location.href = '/dashboard/';
}

/**
 * 팀 참여 페이지로 이동하는 함수
 * (HTML의 onclick 속성에서 호출)
 */
function navigateToTeamJoin() {
    window.location.href = '/api/teams/join'; // Django urls.py에 정의된 경로
}

// onclick 속성에서 함수를 호출할 수 있도록 전역 스코프에 할당
window.navigateToDashboard = navigateToDashboard;
window.navigateToTeamJoin = navigateToTeamJoin;

// 참고: 팀 생성 성공 시 보여주던 '초대 코드 복사' 기능은
// 이제 Django가 리디렉션한 *다음 페이지*(예: 대시보드 또는 별도의 성공 페이지)에서
// 구현해야 합니다.