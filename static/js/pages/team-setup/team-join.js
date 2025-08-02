/**
 * 팀 참여 페이지 (백엔드 테스트용)
 * 
 * 백엔드 개발자 참고:
 * - POST /api/teams/join/ 엔드포인트로 초대코드 전송
 * - 필드: invite_code
 * - 응답: { "team": { "id": 1, "name": "팀명", "members_count": 3 } }
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('team-join-form');
    const successSection = document.getElementById('join-success-section');
    const formSection = document.getElementById('join-form-section');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                invite_code: formData.get('invite_code')
            };
            
            console.log('팀 참여 데이터 전송:', data);
            
            try {
                const result = await apiCall('/api/teams/join/', {
                    method: 'POST',
                    data: data
                });
                
                if (result.success) {
                    // 성공 화면 표시
                    if (formSection) formSection.style.display = 'none';
                    if (successSection) successSection.style.display = 'block';
                    
                    // 참여한 팀 정보 표시
                    document.getElementById('joined-team-name').textContent = result.data.team.name;
                    document.getElementById('joined-team-description').textContent = result.data.team.description || '-';
                    document.getElementById('joined-team-members').textContent = result.data.team.members_count + '명';
                    
                    console.log('팀 참여 성공:', result.data);
                } else {
                    alert('팀 참여 실패: ' + result.error);
                }
            } catch (error) {
                alert('오류 발생: ' + error.message);
            }
        });
    }
    
    // 초대 코드 입력 포맷팅
    const inviteCodeInput = document.getElementById('invite-code');
    if (inviteCodeInput) {
        inviteCodeInput.addEventListener('input', function(e) {
            // 대문자로 변환하고 6자리 제한
            e.target.value = e.target.value.toUpperCase().slice(0, 6);
        });
    }
});

// 네비게이션 함수들
function navigateToDashboard() {
    window.location.href = '/dashboard/';
}

function navigateToTeamCreate() {
    window.location.href = '/team/create/';
}

function joinAnotherTeam() {
    window.location.reload();
}

window.navigateToDashboard = navigateToDashboard;
window.navigateToTeamCreate = navigateToTeamCreate;
window.joinAnotherTeam = joinAnotherTeam;