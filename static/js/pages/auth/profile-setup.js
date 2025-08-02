/**
 * 프로필 설정 페이지 (백엔드 테스트용)
 * 
 * 백엔드 개발자 참고:
 * - PATCH /api/users/me/ 엔드포인트로 프로필 정보 전송
 * - 필드: name, major, specialization
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('profile-setup-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                major: formData.get('major'),
                specialization: formData.get('specialization') || ''
            };
            
            console.log('프로필 데이터 전송:', data);
            
            try {
                const result = await apiCall('/api/users/me/', {
                    method: 'PATCH',
                    data: data
                });
                
                if (result.success) {
                    alert('프로필 설정 완료!');
                    window.location.href = '/auth/team-setup/';
                } else {
                    alert('프로필 설정 실패: ' + result.error);
                }
            } catch (error) {
                alert('오류 발생: ' + error.message);
            }
        });
    }
});