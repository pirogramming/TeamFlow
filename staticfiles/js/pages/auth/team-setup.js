/**
 * 팀 설정 선택 페이지 (백엔드 테스트용)
 */

document.addEventListener('DOMContentLoaded', function() {
    // 팀 만들기 버튼
    const createTeamBtn = document.querySelector('[data-action="create"]');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', function() {
            window.location.href = '/team/create/';
        });
    }
    
    // 팀 참여하기 버튼
    const joinTeamBtn = document.querySelector('[data-action="join"]');
    if (joinTeamBtn) {
        joinTeamBtn.addEventListener('click', function() {
            window.location.href = '/team/join/';
        });
    }
});

// HTML에서 호출하는 네비게이션 함수들
function navigateToTeamCreate() {
    window.location.href = '/team/create/';
}

function navigateToTeamJoin() {
    window.location.href = '/team/join/';
}

window.navigateToTeamCreate = navigateToTeamCreate;
window.navigateToTeamJoin = navigateToTeamJoin;