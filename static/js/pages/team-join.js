/**
 * 팀 참여 페이지 - Notion 스타일
 * 팀 참여 기능
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소들
    const joinForm = document.getElementById('team-join-form');
    const joinBtn = document.getElementById('team-join-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // 폼 상태
    let isSubmitting = false;
    
    // 초기 버튼 상태 설정 (초대 코드가 없으면 비활성화)
    if (joinBtn) {
        joinBtn.disabled = true;
    }
    
    // 탭 전환 이벤트
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            if (targetTab === 'create') {
                navigateToTeamCreate();
            }
        });
    });
    
    // 팀 참여 폼 제출
    if (joinForm) {
        joinForm.addEventListener('submit', handleTeamJoin);
        
        // 실시간 유효성 검사 및 팀 정보 불러오기
        const inviteCodeInput = joinForm.querySelector('#invite-code');
        if (inviteCodeInput) {
            inviteCodeInput.addEventListener('input', () => {
                const codeValue = inviteCodeInput.value.trim();
                
                // 실시간 에러 메시지 관리
                updateErrorMessages(codeValue);
                
                // 버튼 상태 업데이트 (코드가 있으면 활성화)
                updateButtonStates();
                
                // 6자리 코드가 완성되면 팀 정보 불러오기
                if (codeValue.length === 6) {
                    fetchTeamInfo(codeValue);
                } else {
                    hideTeamInfo();
                }
            });
        }
    }
    
    // 팀 참여 폼 유효성 검사
    function validateJoinForm() {
        if (!joinForm) return false;
        
        const inviteCodeInput = joinForm.querySelector('#invite-code');
        const codeValid = inviteCodeInput && 
                         inviteCodeInput.value.trim().length === 6 && 
                         /^[A-Z0-9]{6}$/.test(inviteCodeInput.value.trim());
        
        return codeValid;
    }

    // 실시간 에러 메시지 관리
    function updateErrorMessages(codeValue) {
        if (!joinForm) return;
        
        const inviteCodeInput = joinForm.querySelector('#invite-code');
        if (!inviteCodeInput) return;
        
        const codeValid = codeValue.length === 6 && /^[A-Z0-9]{6}$/.test(codeValue);
        
        // 초대 코드 필드 에러 처리
        inviteCodeInput.classList.toggle('error', !codeValid && codeValue.length > 0);
        let errorElement = inviteCodeInput.parentNode.querySelector('.error-message');
        
        if (!codeValid && codeValue.length > 0) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                inviteCodeInput.parentNode.appendChild(errorElement);
            }
            
            if (codeValue.length !== 6) {
                errorElement.textContent = '6자리 초대 코드를 입력해주세요.';
            } else {
                errorElement.textContent = '올바른 초대 코드를 입력해주세요.';
            }
        } else if (errorElement) {
            errorElement.remove();
        }
    }

    // 팀 참여 폼 에러 메시지 표시 (제출 시에만 사용)
    function showJoinFormErrors() {
        if (!joinForm) return;
        
        const inviteCodeInput = joinForm.querySelector('#invite-code');
        if (!inviteCodeInput) return;
        
        const codeValue = inviteCodeInput.value.trim();
        const codeValid = codeValue.length === 6 && /^[A-Z0-9]{6}$/.test(codeValue);
        
        // 초대 코드 필드 에러 처리
        inviteCodeInput.classList.toggle('error', !codeValid);
        let errorElement = inviteCodeInput.parentNode.querySelector('.error-message');
        
        if (!codeValid) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                inviteCodeInput.parentNode.appendChild(errorElement);
            }
            
            if (codeValue.length === 0) {
                errorElement.textContent = '초대 코드를 입력해주세요.';
            } else if (codeValue.length !== 6) {
                errorElement.textContent = '6자리 초대 코드를 입력해주세요.';
            } else {
                errorElement.textContent = '올바른 초대 코드를 입력해주세요.';
            }
        } else if (errorElement) {
            errorElement.remove();
        }
    }

    // 팀 정보 불러오기
    async function fetchTeamInfo(inviteCode) {
        const teamInfoSection = document.getElementById('team-info-section');
        if (!teamInfoSection) return;

        try {
            // 로딩 상태 표시
            showTeamInfoLoading();

            // 실제 API 호출 (백엔드 개발자와 협의 필요)
            // const response = await fetch(`/api/teams/info/${inviteCode}/`);
            // if (response.ok) {
            //     const teamData = await response.json();
            //     showTeamInfo(teamData);
            // } else {
            //     hideTeamInfo();
            // }

            // 임시로 더미 데이터 사용 (백엔드 API 완성 후 제거)
            setTimeout(() => {
                const dummyTeamData = {
                    name: '웹 개발 스터디',
                    description: 'React와 Node.js를 활용한 풀스택 개발',
                    leader: '이영희',
                    members: 2
                };
                showTeamInfo(dummyTeamData);
            }, 500);

        } catch (error) {
            console.error('팀 정보 불러오기 실패:', error);
            hideTeamInfo();
        }
    }

    // 팀 정보 표시
    function showTeamInfo(teamData) {
        const teamInfoSection = document.getElementById('team-info-section');
        const teamNameEl = document.getElementById('preview-team-name');
        const teamDescEl = document.getElementById('preview-team-description');
        const teamLeaderEl = document.getElementById('preview-team-leader');

        if (teamInfoSection && teamNameEl && teamDescEl && teamLeaderEl) {
            teamNameEl.textContent = teamData.name;
            teamDescEl.textContent = teamData.description;
            teamLeaderEl.textContent = `팀장: ${teamData.leader}`;

            teamInfoSection.style.display = 'block';
        }
    }

    // 팀 정보 숨기기
    function hideTeamInfo() {
        const teamInfoSection = document.getElementById('team-info-section');
        if (teamInfoSection) {
            teamInfoSection.style.display = 'none';
        }
    }

    // 팀 정보 로딩 상태 표시
    function showTeamInfoLoading() {
        const teamInfoSection = document.getElementById('team-info-section');
        const teamNameEl = document.getElementById('preview-team-name');
        const teamDescEl = document.getElementById('preview-team-description');
        const teamLeaderEl = document.getElementById('preview-team-leader');

        if (teamInfoSection && teamNameEl && teamDescEl && teamLeaderEl) {
            teamNameEl.textContent = '팀 정보 불러오는 중...';
            teamDescEl.textContent = '';
            teamLeaderEl.textContent = '팀장: -';

            teamInfoSection.style.display = 'block';
        }
    }
    
    // 버튼 상태 업데이트
    function updateButtonStates() {
        if (joinBtn) {
            const inviteCodeInput = joinForm.querySelector('#invite-code');
            const codeValue = inviteCodeInput ? inviteCodeInput.value.trim() : '';
            const hasCode = codeValue.length > 0;
            joinBtn.disabled = !hasCode || isSubmitting;
        }
    }
    
    // 팀 참여 처리
    async function handleTeamJoin(e) {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        const formData = new FormData(joinForm);
        const data = {
            invite_code: formData.get('invite_code').trim().toUpperCase()
        };
        
        // 유효성 검사 및 에러 메시지 표시
        if (!validateJoinForm()) {
            showJoinFormErrors();
            showNotification('올바른 초대 코드를 입력해주세요.', 'error');
            return;
        }
        
        // 로딩 상태 시작
        isSubmitting = true;
        setButtonLoading(joinBtn, true);
        
        try {
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            const response = await fetch('/api/teams/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                showTeamJoinSuccess(result);
            } else {
                const error = await response.json();
                throw new Error(error.message || '팀 참여에 실패했습니다.');
            }
        } catch (error) {
            console.error('팀 참여 오류:', error);
            showNotification(error.message || '팀 참여에 실패했습니다.', 'error');
        } finally {
            isSubmitting = false;
            setButtonLoading(joinBtn, false);
        }
    }
    
    // 팀 참여 성공 화면 표시
    function showTeamJoinSuccess(result) {
        const formSection = document.getElementById('join-form-section');
        const successSection = document.getElementById('join-success-section');
        
        if (formSection) formSection.style.display = 'none';
        if (successSection) {
            successSection.style.display = 'block';
            
            // 팀 정보 업데이트
            const teamNameEl = document.getElementById('joined-team-name');
            const teamDescEl = document.getElementById('joined-team-description');
            const teamMembersEl = document.getElementById('joined-team-members');
            
            if (teamNameEl) teamNameEl.textContent = result.team?.name || '-';
            if (teamDescEl) teamDescEl.textContent = result.team?.description || '-';
            if (teamMembersEl) teamMembersEl.textContent = `${result.team?.member_count || 0}명`;
        }
        
        showNotification('팀에 성공적으로 참여했습니다!', 'success');
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

function navigateToTeamCreate() {
    window.location.href = '/preview/team-setup/';
}

function joinAnotherTeam() {
    window.location.reload();
}

function goBack() {
    window.location.href = '/preview/team-setup-selection/';
}

// 전역 스코프에 함수 할당
window.navigateToDashboard = navigateToDashboard;
window.navigateToTeamCreate = navigateToTeamCreate;
window.joinAnotherTeam = joinAnotherTeam;
window.goBack = goBack; 