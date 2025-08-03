/**
 * 팀 참여 페이지 - Notion 스타일
 * 팀 참여 기능
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 팀 참여 페이지 JavaScript 로드됨');
    
    // DOM 요소들 (실제 HTML 구조에 맞게 수정)
    const joinForm = document.querySelector('.team-form');
    const joinBtn = document.querySelector('.btn.btn-primary.btn-full');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    console.log('DOM 요소 확인:');
    console.log('- joinForm:', joinForm);
    console.log('- joinBtn:', joinBtn);
    console.log('- tabBtns:', tabBtns.length);
    
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

            console.log(`🔍 팀 정보 조회 시작: ${inviteCode}`);
            
            /**
             * 🔗 백엔드 API 연결점 - 팀 정보 미리보기
             * 
             * 엔드포인트: GET /api/teams/info/{invite_code}/
             * URL 파라미터: invite_code (6자리 영숫자)
             * 
             * 기대하는 응답:
             * - 성공시 (200): {success: true, team: {id, name, description, leader, members, created_at}}
             * - 실패시 (404): {error: "유효하지 않은 초대 코드입니다."}
             * 
             * 📋 백엔드 처리 사항:
             * 1. 초대 코드로 팀 검색 (Team.objects.get(invite_code=code))
             * 2. 팀 멤버 수 계산 (TeamMember.objects.filter(team=team).count())
             * 3. 팀장 정보 조회 (role='팀장'인 멤버 또는 team.owner)
             * 4. 팀에 참여하지 않은 사용자도 볼 수 있는 공개 정보만 반환
             */
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            const response = await fetch(`/api/teams/info/${inviteCode}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                credentials: 'same-origin'
            });

            console.log(`📡 API 응답 상태: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                console.log('📋 팀 정보 응답:', result);
                
                if (result.success && result.team) {
                    showTeamInfo(result.team);
                } else {
                    console.log('❌ 팀 정보 없음');
                    hideTeamInfo();
                }
            } else {
                const error = await response.json();
                console.log('❌ API 에러:', error);
                hideTeamInfo();
            }

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
        console.log('🎯 팀 참여 폼 제출됨!');
        e.preventDefault();
        
        if (isSubmitting) {
            console.log('⚠️ 이미 제출 중...');
            return;
        }
        
        const formData = new FormData(joinForm);
        const data = {
            invite_code: formData.get('invite_code').trim().toUpperCase()
        };
        
        console.log('📋 폼 데이터:', data);
        
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
            console.log('팀 참여 API 호출 시작');
            console.log('초대 코드:', data.invite_code);
            console.log('CSRF 토큰:', csrftoken ? '존재함' : '없음');
            
            /**
             * 🔗 백엔드 API 연결점 - 팀 참여
             * 
             * 엔드포인트: POST /api/teams/join/
             * 요청 데이터: {invite_code: string}
             * 
             * 기대하는 응답:
             * - 성공시 (200): {success: true, team_id: number, team_name: string}
             * - 실패시 (400/404): {error: string}
             * 
             * 📋 백엔드 처리 사항:
             * 1. 초대 코드로 팀 검색 (Team.objects.get(invite_code=code))
             * 2. 이미 해당 팀 멤버인지 확인 (중복 참여 방지)
             * 3. 새 팀원으로 추가 (TeamMember 생성, 기본 역할: "팀원")
             * 4. 참여한 팀을 current_team_id로 세션에 저장
             */
            const response = await fetch('/api/teams/join/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(data),
                credentials: 'same-origin'  // Django 세션 쿠키 포함
            });
            
            console.log('API 응답 상태:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                
                // 참여한 팀을 현재 팀으로 설정
                if (result.success && result.team_id) {
                    await setCurrentTeam(result.team_id);
                }
                
                // 성공 메시지와 함께 대시보드로 이동
                showNotification(`"${result.team_name}" 팀에 참여했습니다!`, 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard/';
                }, 1500);
            } else {
                const error = await response.json();
                console.log('API 에러 응답:', error);
                throw new Error(error.error || error.message || '팀 참여에 실패했습니다.');
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
        
        // 2초 후 대시보드로 이동
        setTimeout(() => {
            window.location.href = '/dashboard/';
        }, 2000);
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
    window.location.href = '/team/create/';
}

function joinAnotherTeam() {
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

// 현재 팀 설정 함수
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
window.navigateToTeamCreate = navigateToTeamCreate;
window.joinAnotherTeam = joinAnotherTeam;
window.goBack = goBack; 