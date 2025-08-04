// 헤더 JavaScript - MGP 개발

document.addEventListener('DOMContentLoaded', function() {
    // 헤더 초기화
    initializeHeader();
    
    // 이벤트 리스너 등록
    setupHeaderEventListeners();
});

// 헤더 초기화
function initializeHeader() {
    // 헤더는 대시보드에서 통합 관리하므로 여기서는 기본 초기화만
    console.log('헤더 초기화 완료');
    
    // 프로젝트 정보 로드
    loadCurrentProject();
    loadProjectList();
}

// 사용자 정보 로드 (대시보드에서 통합 관리)
async function loadUserInfo() {
    // 대시보드에서 사용자 정보를 관리하므로 여기서는 빈 함수
    console.log('헤더 사용자 정보는 대시보드에서 관리됩니다.');
}

// 사용자 정보 업데이트
function updateUserInfo(userData) {
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userName) userName.textContent = userData.name;
    if (userRole) userRole.textContent = userData.role;
    
    if (userAvatar) {
        userAvatar.textContent = userData.name;
    }
}

/**
 * 🔗 백엔드 API 연결점 - 현재 선택된 팀 조회 (헤더용)
 * 
 * 엔드포인트: GET /api/teams/current/
 * 요청 데이터: 없음 (GET 요청)
 * 
 * 기대하는 응답:
 * - 성공시 (200): {success: true, team: {id, name, description, role, is_owner}}
 * - 실패시 (404): {error: "참여한 팀이 없습니다."}
 * 
 * 📋 백엔드 처리 사항:
 * 1. request.session['current_team_id']로 현재 팀 확인
 * 2. 없으면 사용자의 첫 번째 팀을 current_team_id로 설정
 * 3. 해당 팀에서 사용자의 역할 정보도 함께 반환
 * 4. 헤더의 프로젝트 이름 표시에 사용됨
 */
async function loadCurrentProject() {
    try {
        console.log('현재 프로젝트 정보 로드 시작...');
        
        const response = await fetch('/api/teams/current/', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API 응답 상태:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('현재 프로젝트 데이터:', data);
            if (data.success && data.team) {
                updateCurrentProject(data.team);
            } else {
                console.log('프로젝트 데이터가 없습니다.');
                showNoTeamMessage();
            }
        } else if (response.status === 404) {
            console.log('참여한 팀이 없습니다.');
            // 참여한 팀이 없는 경우
            showNoTeamMessage();
        } else {
            console.log('API 응답 오류:', response.status);
            const errorData = await response.text();
            console.log('오류 내용:', errorData);
            showNoTeamMessage();
        }
    } catch (error) {
        console.error('현재 프로젝트 정보 로드 오류:', error);
        showNoTeamMessage();
    }
}

/**
 * 🔗 백엔드 API 연결점 - 사용자 팀 목록 조회 (헤더 드롭다운용)
 * 
 * 엔드포인트: GET /api/teams/list/
 * 요청 데이터: 없음 (GET 요청)
 * 
 * 기대하는 응답:
 * {
 *   success: true,
 *   teams: [
 *     {id: number, name: string, description: string, role: string, is_owner: boolean, invite_code: string, created_at: string},
 *     ...
 *   ]
 * }
 * 
 * 📋 백엔드 처리 사항:
 * 1. 사용자가 멤버로 속한 모든 팀 조회 (TeamMember.objects.filter(user=request.user))
 * 2. 각 팀에서 사용자의 역할 정보 포함
 * 3. 팀장 여부 (is_owner) 정보 포함
 * 4. 헤더 드롭다운에서 프로젝트 선택에 사용됨
 */
async function loadProjectList() {
    try {
        console.log('프로젝트 목록 로드 시작...');
        
        const response = await fetch('/api/teams/list/', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        });
        
        console.log('프로젝트 목록 API 응답 상태:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('프로젝트 목록 데이터:', data);
            if (data.success) {
                console.log('프로젝트 목록 업데이트 함수 호출:', data.teams);
                updateProjectList(data.teams);
            } else {
                console.log('프로젝트 목록 API success가 false');
            }
        } else {
            const errorData = await response.text();
            console.log('프로젝트 목록 API 오류:', response.status, errorData);
        }
    } catch (error) {
        console.error('프로젝트 목록 로드 오류:', error);
    }
}

// 현재 프로젝트 정보 업데이트
function updateCurrentProject(teamData) {
    console.log('프로젝트 정보 업데이트 시작:', teamData);
    
    const currentProjectName = document.getElementById('current-project-name');
    console.log('프로젝트 이름 요소:', currentProjectName);
    
    if (currentProjectName && teamData.name) {
        console.log('프로젝트 이름 업데이트:', teamData.name);
        currentProjectName.textContent = teamData.name;
        console.log('업데이트 후 텍스트:', currentProjectName.textContent);
    } else {
        console.log('프로젝트 이름 업데이트 실패 - 요소 또는 이름 없음');
    }
}

// 프로젝트 목록 업데이트
function updateProjectList(teams) {
    console.log('프로젝트 목록 업데이트 시작:', teams);
    
    const projectList = document.getElementById('project-list');
    console.log('프로젝트 목록 요소:', projectList);
    
    if (!projectList) {
        console.log('프로젝트 목록 요소를 찾을 수 없음');
        return;
    }
    
    projectList.innerHTML = '';
    console.log('프로젝트 목록 초기화됨');
    
    if (teams.length === 0) {
        console.log('참여한 프로젝트가 없음');
        projectList.innerHTML = `
            <div class="dropdown-item no-projects">
                <span>참여한 프로젝트가 없습니다</span>
            </div>
        `;
        return;
    }
    
    console.log(`${teams.length}개의 프로젝트 목록 생성 중...`);
    
    teams.forEach(team => {
        console.log('프로젝트 항목 생성:', team.name);
        
        const projectItem = document.createElement('div');
        projectItem.className = 'dropdown-item project-item';
        projectItem.dataset.teamId = team.id;
        
        projectItem.innerHTML = `
            <div class="project-info">
                <span class="project-title">${team.name}</span>
                <span class="project-role">${team.role}</span>
            </div>
            <div class="project-status">
                ${team.is_owner ? '<span class="owner-badge">팀장</span>' : ''}
            </div>
        `;
        
        projectItem.addEventListener('click', () => selectProject(team.id, team.name));
        projectList.appendChild(projectItem);
    });
    
    console.log('프로젝트 목록 업데이트 완료');
}

/**
 * 🔗 백엔드 API 연결점 - 헤더에서 프로젝트 변경
 * 
 * 엔드포인트: POST /api/teams/current/
 * 요청 데이터: {team_id: number}
 * 
 * 기대하는 응답:
 * - 성공시 (200): {success: true, team: {id, name, description, role}}
 * - 실패시 (403): {error: "해당 팀의 멤버가 아닙니다."}
 * 
 * 📋 백엔드 처리 사항:
 * 1. 사용자가 해당 팀의 멤버인지 확인
 * 2. request.session['current_team_id'] = team_id 설정
 * 3. 세션 저장 (request.session.save())
 * 4. 이후 대시보드 API 호출 시 새로운 팀 데이터 반환
 * 5. 헤더의 현재 프로젝트 이름 업데이트
 */
async function selectProject(teamId, teamName) {
    try {
        const response = await fetch('/api/teams/current/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ team_id: teamId })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                updateCurrentProject({ name: teamName });
                hideProjectDropdown();
                showHeaderNotification(`프로젝트가 "${teamName}"으로 변경되었습니다.`, 'success');
                
                // 대시보드 새로고침 (만약 대시보드 페이지에 있다면)
                if (typeof refreshDashboard === 'function') {
                    console.log('🔄 헤더에서 대시보드 새로고침 요청');
                    refreshDashboard();
                } else if (typeof loadDashboardData === 'function') {
                    console.log('⚠️ refreshDashboard 없음, loadDashboardData 사용');
                    loadDashboardData();
                }
            }
        } else {
            showHeaderNotification('프로젝트 변경에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('프로젝트 선택 오류:', error);
        showHeaderNotification('프로젝트 변경에 실패했습니다.', 'error');
    }
}

// 참여한 팀이 없을 때 메시지 표시
function showNoTeamMessage() {
    console.log('참여한 팀이 없음 - 메시지 표시');
    
    const currentProjectName = document.getElementById('current-project-name');
    console.log('프로젝트 이름 요소(노팀):', currentProjectName);
    
    if (currentProjectName) {
        currentProjectName.textContent = '프로젝트를 선택하세요';
        console.log('노팀 메시지 설정됨');
    } else {
        console.log('프로젝트 이름 요소를 찾을 수 없음(노팀)');
    }
}

// 알림 정보 로드
async function loadNotificationInfo() {
    try {
        // TODO: 실제 API 연결 시 사용
        // const response = await fetch('/api/notifications/count/');
        // const notificationData = await response.json();
        
        // 임시 더미 데이터
        const notificationData = {
            deadline_count: 3
        };
        
        updateNotificationInfo(notificationData);
    } catch (error) {
        console.error('알림 정보 로드 오류:', error);
    }
}

// 알림 정보 업데이트
function updateNotificationInfo(notificationData) {
    const deadlineNotification = document.getElementById('deadline-notification');
    
    if (deadlineNotification) {
        deadlineNotification.textContent = `마감 임박 ${notificationData.deadline_count}개`;
    }
}

// 이벤트 리스너 설정
function setupHeaderEventListeners() {
    console.log('헤더 이벤트 리스너 설정 시작...');
    
    // 프로젝트 드롭다운
    const projectDropdown = document.getElementById('project-dropdown');
    console.log('프로젝트 드롭다운 요소:', projectDropdown);
    
    if (projectDropdown) {
        projectDropdown.addEventListener('click', handleProjectDropdown);
        console.log('프로젝트 드롭다운 이벤트 리스너 등록됨');
    } else {
        console.log('프로젝트 드롭다운 요소를 찾을 수 없음');
    }
    
    // 팀 생성 버튼
    const createTeamBtn = document.getElementById('create-team-btn');
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', handleCreateTeam);
    }
    
    // 팀 참여 버튼
    const joinTeamBtn = document.getElementById('join-team-btn');
    if (joinTeamBtn) {
        joinTeamBtn.addEventListener('click', handleJoinTeam);
    }
    
    // 마감 임박 알림은 클릭 불가능한 안내 표시
    // const deadlineNotification = document.querySelector('.notification-item');
    // if (deadlineNotification) {
    //     deadlineNotification.addEventListener('click', handleDeadlineNotification);
    // }
    
    // 프로필 토글
    const profileToggle = document.getElementById('profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', handleProfileToggle);
    }
    
    // 새 프로젝트 만들기 버튼
    const createNewProjectBtn = document.getElementById('create-new-project');
    if (createNewProjectBtn) {
        createNewProjectBtn.addEventListener('click', handleCreateNewProject);
    }
}

// 프로젝트 드롭다운 핸들러
function handleProjectDropdown() {
    console.log('프로젝트 드롭다운 클릭됨');
    
    const dropdownMenu = document.getElementById('project-dropdown-menu');
    console.log('드롭다운 메뉴 요소:', dropdownMenu);
    
    if (dropdownMenu) {
        const isVisible = dropdownMenu.classList.contains('show');
        console.log('드롭다운 현재 표시 상태 (CSS 클래스):', isVisible);
        console.log('드롭다운 현재 CSS 클래스:', dropdownMenu.className);
        
        if (isVisible) {
            console.log('드롭다운 숨기기');
            hideProjectDropdown();
        } else {
            console.log('드롭다운 표시하기');
            showProjectDropdown();
        }
    } else {
        console.log('드롭다운 메뉴 요소를 찾을 수 없음');
    }
}

// 프로젝트 드롭다운 표시
function showProjectDropdown() {
    console.log('드롭다운 표시 함수 실행');
    
    const dropdownMenu = document.getElementById('project-dropdown-menu');
    console.log('드롭다운 메뉴 요소(표시):', dropdownMenu);
    
    if (dropdownMenu) {
        console.log('드롭다운 CSS 클래스 변경 전:', dropdownMenu.className);
        
        // CSS 클래스를 사용해서 표시
        dropdownMenu.classList.add('show');
        
        console.log('드롭다운 CSS 클래스 변경 후:', dropdownMenu.className);
        console.log('드롭다운 표시 완료 (CSS 클래스 사용)');
        
        // 1초 후 다시 확인
        setTimeout(() => {
            console.log('1초 후 CSS 클래스 상태:', dropdownMenu.className);
            console.log('1초 후 실제 표시 상태:', getComputedStyle(dropdownMenu).display);
        }, 1000);
        
        // 외부 클릭 시 드롭다운 닫기 - 약간 지연시켜서 즉시 닫히는 것 방지
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
            console.log('드롭다운 외부 클릭 이벤트 등록됨 (지연)');
        }, 100);
    } else {
        console.log('드롭다운 메뉴 요소를 찾을 수 없음(표시)');
    }
}

// 프로젝트 드롭다운 숨기기
function hideProjectDropdown() {
    console.log('드롭다운 숨기기 함수 실행');
    
    const dropdownMenu = document.getElementById('project-dropdown-menu');
    if (dropdownMenu) {
        console.log('드롭다운 숨기기 전 CSS 클래스:', dropdownMenu.className);
        
        // CSS 클래스를 사용해서 숨기기
        dropdownMenu.classList.remove('show');
        
        console.log('드롭다운 숨기기 후 CSS 클래스:', dropdownMenu.className);
        console.log('드롭다운 숨기기 완료');
        
        document.removeEventListener('click', handleOutsideClick);
    } else {
        console.log('드롭다운 메뉴 요소를 찾을 수 없음(숨기기)');
    }
}

// 외부 클릭 핸들러
function handleOutsideClick(event) {
    const projectSelector = document.querySelector('.project-selector');
    if (projectSelector && !projectSelector.contains(event.target)) {
        hideProjectDropdown();
    }
}

// 팀 생성 핸들러
function handleCreateTeam() {
                window.location.href = '/team/create/?from=dashboard';
}

// 팀 참여 핸들러
function handleJoinTeam() {
                window.location.href = '/team/join/?from=dashboard';
}

// 마감 임박 알림 핸들러
function handleDeadlineNotification() {
    // TODO: 마감 임박 작업 목록 모달 표시
    showHeaderNotification('마감 임박 작업: 3개', 'info');
}

// 새 프로젝트 생성 핸들러
function handleCreateNewProject() {
    hideProjectDropdown();
    window.location.href = '/team/create/?from=header';
}

// 프로필 토글 핸들러
function handleProfileToggle() {
    // TODO: 프로필 메뉴 또는 설정 페이지로 이동
    showHeaderNotification('프로필 설정 기능은 준비 중입니다.', 'info');
}

// CSRF 토큰 가져오기
function getCsrfToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    const token = csrfToken ? csrfToken.value : 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    console.log('CSRF 토큰:', token ? '토큰 존재' : '토큰 없음');
    return token;
}

// 헤더 알림 표시
function showHeaderNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.header-notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `header-notification-toast ${type}`;
    notification.textContent = message;
    
    // 스타일 적용
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '1000',
        backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // 애니메이션
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
} 