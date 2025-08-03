/**
 * 팀 설정 선택 페이지 - Notion 스타일
 * 팀 만들기/참여하기 선택 기능
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const optionCards = document.querySelectorAll('.option-card');
    const createBtn = document.querySelector('[data-action="create"]');
    const joinBtn = document.querySelector('[data-action="join"]');
    
    // 카드 클릭 이벤트
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.option;
            handleOptionClick(action);
        });
    });
    
    // 버튼 클릭 이벤트 (카드 내부 버튼)
    if (createBtn) {
        createBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 카드 클릭 이벤트와 중복 방지
            handleOptionClick('create');
        });
    }
    
    if (joinBtn) {
        joinBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 카드 클릭 이벤트와 중복 방지
            handleOptionClick('join');
        });
    }
    
    // 옵션 클릭 처리
    function handleOptionClick(action) {
        // 클릭 효과
        const card = document.querySelector(`[data-option="${action}"]`);
        if (card) {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
        
        // 페이지 이동
        if (action === 'create') {
            navigateToTeamCreate();
        } else if (action === 'join') {
            navigateToTeamJoin();
        }
    }
    
    // 키보드 접근성
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.closest('.option-card')) {
                e.preventDefault();
                const action = focusedElement.closest('.option-card').dataset.option;
                handleOptionClick(action);
            }
        }
    });
    
    // 카드에 포커스 가능하도록 설정
    optionCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', card.querySelector('.option-title').textContent);
    });
});

// 전역 함수들 (HTML에서 호출)
function navigateToTeamCreate() {
    window.location.href = '/preview/team-setup/';
}

function navigateToTeamJoin() {
    window.location.href = '/preview/team-join/';
}

// 전역 스코프에 함수 할당
window.navigateToTeamCreate = navigateToTeamCreate;
window.navigateToTeamJoin = navigateToTeamJoin; 