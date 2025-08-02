/**
 * 팀 생성 페이지 (백엔드 테스트용)
 * 
 * 백엔드 개발자 참고:
 * - POST /api/teams/ 엔드포인트로 팀 정보 전송
 * - 필드: name, description
 * - 응답: { "id": 1, "name": "팀명", "invite_code": "ABC123" }
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('team-create-form');
    const successSection = document.getElementById('success-section');
    const formSection = document.getElementById('create-form-section');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                description: formData.get('description') || ''
            };
            
            console.log('팀 생성 데이터 전송:', data);
            
            try {
                const result = await apiCall('/api/teams/', {
                    method: 'POST',
                    data: data
                });
                
                if (result.success) {
                    // 성공 화면 표시
                    if (formSection) formSection.style.display = 'none';
                    if (successSection) successSection.style.display = 'block';
                    
                    // 생성된 팀 정보 표시
                    document.getElementById('created-team-name').textContent = result.data.name;
                    document.getElementById('created-team-description').textContent = result.data.description || '-';
                    document.getElementById('invite-code-text').textContent = result.data.invite_code;
                    
                    console.log('팀 생성 성공:', result.data);
                } else {
                    alert('팀 생성 실패: ' + result.error);
                }
            } catch (error) {
                alert('오류 발생: ' + error.message);
            }
        });
    }
    
    // 초대 코드 복사 버튼
    const copyBtn = document.getElementById('copy-code-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const codeText = document.getElementById('invite-code-text').textContent;
            navigator.clipboard.writeText(codeText).then(() => {
                alert('초대 코드가 복사되었습니다!');
            });
        });
    }
});

// 네비게이션 함수들
function navigateToDashboard() {
    window.location.href = '/dashboard/';
}

function navigateToTeamJoin() {
    window.location.href = '/team/join/';
}

window.navigateToDashboard = navigateToDashboard;
window.navigateToTeamJoin = navigateToTeamJoin;