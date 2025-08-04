/**
 * 팀 생성 페이지 - Notion 스타일
 * 팀 생성 기능
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const createForm = document.getElementById('team-create-form');
    const createBtn = document.getElementById('team-create-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // 폼 상태
    let isSubmitting = false;
    
    // 초기 버튼 상태 설정 (팀 이름이 없으면 비활성화)
    if (createBtn) {
        createBtn.disabled = true;
    }

    // 페이지 로드 시 초대 코드 자동 생성
    generateInviteCode();
    
    // 탭 전환 이벤트
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            if (targetTab === 'join') {
                navigateToTeamJoin();
            }
        });
    });
    
    // 팀 생성 폼 제출
    if (createForm) {
        createForm.addEventListener('submit', handleTeamCreate);
        
        // 실시간 유효성 검사
        const nameInput = createForm.querySelector('#team-name');
        const descriptionInput = createForm.querySelector('#team-description');
        
        [nameInput, descriptionInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    // 팀 이름이 비어있고 팀 설명에 입력이 있을 때만 유효성 검사
                    const nameValue = nameInput.value.trim();
                    const descriptionValue = descriptionInput.value.trim();
                    
                    if (nameValue.length === 0 && descriptionValue.length > 0) {
                        validateCreateForm();
                    } else if (nameValue.length > 0) {
                        validateCreateForm();
                    }
                    updateButtonStates();
                });
            }
        });
    }
    
    // 초대 코드 복사 기능
    const copyBtn = document.getElementById('copy-code-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyInviteCode);
    }


    
    // 팀 생성 폼 유효성 검사
    function validateCreateForm() {
        if (!createForm) return false;
        
        const nameInput = createForm.querySelector('#team-name');
        const nameValid = nameInput && nameInput.value.trim().length >= 2;
        
        // 이름 필드 에러 처리
        if (nameInput) {
            nameInput.classList.toggle('error', !nameValid);
            let errorElement = nameInput.parentNode.querySelector('.error-message');
            
            if (!nameValid && !errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                nameInput.parentNode.appendChild(errorElement);
            }
            
            if (errorElement) {
                if (nameValid) {
                    errorElement.remove();
                } else {
                    errorElement.textContent = '팀 이름을 입력해주세요.';
                }
            }
        }
        
        return nameValid;
    }
    
    // 버튼 상태 업데이트
    function updateButtonStates() {
        if (createBtn) {
            const nameInput = createForm.querySelector('#team-name');
            const nameValid = nameInput && nameInput.value.trim().length >= 2;
            createBtn.disabled = !nameValid || isSubmitting;
        }
    }
    
    // 팀 생성 처리
    async function handleTeamCreate(e) {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        const formData = new FormData(createForm);
        const data = {
            name: formData.get('name').trim(),
            description: formData.get('description')?.trim() || ''
        };
        
        // 유효성 검사
        if (!validateCreateForm()) {
            showNotification('팀 이름을 입력해주세요.', 'error');
            return;
        }
        
        // 로딩 상태 시작
        isSubmitting = true;
        setButtonLoading(createBtn, true);
        
        try {
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            /**
             * 🔗 백엔드 API 연결점 - 팀 생성
             * 
             * 엔드포인트: POST /api/teams/create/
             * 요청 데이터: {team_name: string, team_description: string}
             * 
             * 기대하는 응답:
             * - 성공시 (200): {success: true, team_id: number, team_name: string}
             * - 실패시 (400/500): {error: string}
             * 
             * 📋 백엔드 처리 사항:
             * 1. 팀 생성 (Team 모델)
             * 2. 생성자를 팀장으로 설정 (TeamMember 모델)
             * 3. 고유한 6자리 초대 코드 생성 (영숫자)
             * 4. 생성된 팀을 사용자의 current_team_id로 세션에 저장
             */
            const response = await fetch('/api/teams/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(data),
                credentials: 'same-origin'  // Django 세션 쿠키 포함
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // 생성한 팀을 현재 팀으로 설정
                if (result.success && result.team_id) {
                    await setCurrentTeam(result.team_id);
                }
                
                // 성공 메시지와 함께 대시보드로 이동
                showNotification(`"${result.team_name}" 팀이 생성되었습니다!`, 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard/';
                }, 1500);
            } else {
                const error = await response.json();
                throw new Error(error.message || '팀 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('팀 생성 오류:', error);
            showNotification(error.message || '팀 생성에 실패했습니다.', 'error');
        } finally {
            isSubmitting = false;
            setButtonLoading(createBtn, false);
        }
    }
    
    // 팀 생성 성공 화면 표시
    function showTeamCreateSuccess(result) {
        const formSection = document.getElementById('create-form-section');
        const successSection = document.getElementById('success-section');
        
        if (formSection) formSection.style.display = 'none';
        if (successSection) {
            successSection.style.display = 'block';
            
            // 팀 정보 업데이트
            const teamNameEl = document.getElementById('created-team-name');
            const teamDescEl = document.getElementById('created-team-description');
            const inviteCodeEl = document.getElementById('invite-code-text');
            
            if (teamNameEl) teamNameEl.textContent = result.team?.name || '-';
            if (teamDescEl) teamDescEl.textContent = result.team?.description || '-';
            if (inviteCodeEl) inviteCodeEl.textContent = result.invite_code || '------';
        }
        
        showNotification('팀이 성공적으로 생성되었습니다!', 'success');
        
        // 2초 후 대시보드로 이동
        setTimeout(() => {
            window.location.href = '/dashboard/';
        }, 2000);
    }
    
    // 초대 코드 생성
    function generateInviteCode() {
        const inviteCodeEl = document.getElementById('invite-code-text');
        if (!inviteCodeEl) return;
        
        // 6자리 랜덤 코드 생성 (숫자 + 대문자)
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        inviteCodeEl.textContent = code;
    }

    // 초대 코드 복사
    async function copyInviteCode() {
        const inviteCodeEl = document.getElementById('invite-code-text');
        if (!inviteCodeEl) return;
        
        const code = inviteCodeEl.textContent;
        if (code === '------') return;
        
        try {
            await navigator.clipboard.writeText(code);
            showNotification('초대 코드가 복사되었습니다!', 'success');
        } catch (error) {
            console.error('복사 실패:', error);
            showNotification('복사에 실패했습니다.', 'error');
        }
    }
    
    // 버튼 로딩 상태 설정
    function setButtonLoading(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
    
    // 토스트 알림 표시
    function showNotification(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
});

// 전역 함수들 (HTML에서 호출)
function navigateToDashboard() {
    window.location.href = '/dashboard/';
}

function navigateToTeamJoin() {
    window.location.href = '/team/join/';
}

function createAnotherTeam() {
    window.location.reload();
}

function goBack() {
    // URL 파라미터에서 어디서 왔는지 확인
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    
    // 대시보드에서 온 경우 대시보드로 돌아가기
    if (from === 'dashboard') {
        window.location.href = '/dashboard/';
    } else {
        // 팀 설정 선택 페이지에서 온 경우 팀 설정 선택 페이지로 돌아가기
        window.location.href = '/team-setup/';
    }
}

// CSRF 토큰 가져오기 함수
function getCsrfToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

/**
 * 🔗 백엔드 API 연결점 - 현재 팀 설정
 * 
 * 엔드포인트: POST /api/teams/current/
 * 요청 데이터: {team_id: number}
 * 
 * 기대하는 응답:
 * - 성공시 (200): {success: true, team: {id, name, description, role}}
 * - 실패시 (400/403): {error: string}
 * 
 * 📋 백엔드 처리 사항:
 * 1. 사용자가 해당 팀의 멤버인지 확인
 * 2. request.session['current_team_id'] = team_id 설정
 * 3. 헤더의 프로젝트 선택에서 사용됨
 */
async function setCurrentTeam(teamId) {
    try {
        const csrftoken = getCsrfToken();
        const response = await fetch('/api/teams/current/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ team_id: teamId }),
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            console.log('현재 팀 설정 완료:', teamId);
            return true;
        } else {
            console.error('현재 팀 설정 실패:', response.status);
            return false;
        }
    } catch (error) {
        console.error('현재 팀 설정 오류:', error);
        return false;
    }
}

// 전역 스코프에 함수 할당
window.navigateToDashboard = navigateToDashboard;
window.navigateToTeamJoin = navigateToTeamJoin;
window.createAnotherTeam = createAnotherTeam;
window.goBack = goBack; 