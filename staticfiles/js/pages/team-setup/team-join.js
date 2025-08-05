/**
 * 팀 참여 페이지 (전통 Django 방식)
 * * - 폼 제출은 HTML의 action 속성을 통해 서버에서 직접 처리합니다.
 * - JavaScript는 입력 포맷팅, 페이지 이동과 같은 보조적인 역할만 담당합니다.
 */

document.addEventListener('DOMContentLoaded', function() {
    // 폼 제출(submit) 이벤트 리스너를 제거합니다.
    // 이제 폼은 브라우저의 기본 동작에 따라 서버로 제출됩니다.
    console.log('팀 참여 페이지 스크립트 로드됨.');
    
    // 초대 코드 입력 포맷팅 (사용자 경험 향상)
    const inviteCodeInput = document.getElementById('invite-code');
    if (inviteCodeInput) {
        inviteCodeInput.addEventListener('input', function(e) {
            // 입력값을 대문자로 변환하고 6자리로 제한합니다.
            e.target.value = e.target.value.toUpperCase().slice(0, 6);
        });
    }
});

/**
 * 대시보드 페이지로 이동하는 함수
 * (HTML의 onclick 속성에서 호출)
 */
function navigateToDashboard() {
    window.location.href = '/dashboard/';
}

/**
 * 팀 생성 페이지로 이동하는 함수
 * (HTML의 onclick 속성에서 호출)
 */
function navigateToTeamCreate() {
    // Django urls.py에 정의된 'team_create' URL 이름으로 이동하는 것이 더 좋습니다.
    // 여기서는 직접 경로를 지정합니다.
    window.location.href = '/api/teams/create';
}

/**
 * 현재 페이지를 새로고침하여 다른 팀에 참여할 수 있도록 하는 함수
 */
function joinAnotherTeam() {
    window.location.reload();
}

// HTML의 onclick 속성에서 함수를 호출할 수 있도록 전역 스코프에 할당
window.navigateToDashboard = navigateToDashboard;
window.navigateToTeamCreate = navigateToTeamCreate;
window.joinAnotherTeam = joinAnotherTeam;