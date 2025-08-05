// 대시보드 JavaScript - MGP 개발

document.addEventListener('DOMContentLoaded', function() {
    // 대시보드 초기화
    initializeDashboard();
    
    // 이벤트 리스너 등록
    setupEventListeners();
});

// 대시보드 초기화
async function initializeDashboard() {
    try {
        // 로딩 상태 표시
        showLoadingState();
        
        // 헤더는 자체적으로 초기화됨 (header.js에서 처리)
        
        // 대시보드 데이터 로드
        const data = await loadDashboardData();
        
        // 실제 데이터로 UI 구성
        setupDashboardData(data);
        
        // 로딩 상태 숨기기
        hideLoadingState();
        
    } catch (error) {
        console.error('대시보드 초기화 오류:', error);
        showNotification('대시보드 로딩에 실패했습니다.', 'error');
        hideLoadingState();
    }
}

/**
 * 🔗 백엔드 API 연결점 - 대시보드 데이터 로드
 * 
 * 엔드포인트: GET /api/dashboard/api/
 * 요청 데이터: 없음 (GET 요청)
 * 
 * 기대하는 응답:
 * {
 *   user: {name: string, role: string},
 *   team: {id: number, name: string, description: string, invite_code: string, created_at: string},
 *   user_role: string,
 *   team_members: [{user__first_name: string, user__profile__major: string, role: string}, ...],
 *   total_progress: number,
 *   personal_progress: number,
 *   deadline_count: number,
 *   team_tasks: [...],
 *   personal_tasks: [...]
 * }
 * 
 * 📋 백엔드 처리 사항:
 * 1. request.session['current_team_id']로 현재 선택된 팀 확인
 * 2. 없으면 사용자의 첫 번째 팀을 current_team_id로 설정
 * 3. 팀 정보, 멤버 목록, 작업 현황, 마감일 등 종합 데이터 반환
 * 4. 헤더에서 프로젝트 변경 시 이 API가 다시 호출됨
 */
async function loadDashboardData(teamId = null) {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    const url = teamId
        ? `/api/dashboard/api/?team_id=${teamId}` // 팀 선택 시 해당 ID 전달
        : `/api/dashboard/api/`;                  // 기본: 세션 값 사용

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        credentials: 'same-origin'
    });

    if (!response.ok) throw new Error('대시보드 데이터 로드 실패');
    return await response.json();
}

// 대시보드 새로고침 (헤더에서 프로젝트 변경 시 호출)
async function refreshDashboard(teamId = null) {
    console.log('🔄 대시보드 새로고침 시작 (프로젝트 변경됨), teamId:', teamId); // 디버그

    try {
        showLoadingState();

        // teamId를 그대로 API 호출에 전달
        const data = await loadDashboardData(teamId);

        console.log('🔄 API 응답 데이터:', data);

        if (teamId) {
            window.location.href = `/api/dashboard/${teamId}/`;
        }

        setupDashboardData(data);
        hideLoadingState();

        console.log('✅ 대시보드 새로고침 완료');
    } catch (error) {
        console.error('❌ 대시보드 새로고침 오류:', error);
        showNotification('팀 정보 업데이트에 실패했습니다.', 'error');
        hideLoadingState();
    }
}

// 더미 데이터로 UI 구성
function setupDummyData() {
    // 진행률 업데이트
    updateProgressBars();
    
    // 작업 목록 렌더링
    renderTeamTasks();
    renderPersonalTasks();
    
    // 팀 현황 렌더링
    renderTeamMembers();
    
    // 로딩 상태 제거
    hideLoadingState();
}

// 진행률 바 업데이트
function updateProgressBars(totalProgress, personalProgress) {
    const overallProgressBar = document.querySelector('.overall-progress-bar');
    const personalProgressBar = document.querySelector('.personal-progress-bar');
    
    if (overallProgressBar) {
        overallProgressBar.style.width = `${totalProgress}%`;
        overallProgressBar.setAttribute('aria-valuenow', totalProgress);
    }
    
    if (personalProgressBar) {
        personalProgressBar.style.width = `${personalProgress}%`;
        personalProgressBar.setAttribute('aria-valuenow', personalProgress);
    }
}

// 팀 작업 목록 렌더링
function renderTeamTasks(tasks = []) {
    const teamTasksContainer = document.getElementById('team-tasks');
    if (!teamTasksContainer) return;
    
    teamTasksContainer.innerHTML = tasks.map(task => `
        <div class="task-item" data-task-id="${task.id || Math.random()}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(this, ${task.completed})"></div>
            <div class="task-content">
                <h4 class="task-title">${task.title}</h4>
                <p class="task-meta">담당자: ${task.assignee} • ${task.dueDate}</p>
            </div>
            ${task.urgent ? '<span class="task-tag">긴급</span>' : ''}
        </div>
    `).join('');
}

// 개인 작업 목록 렌더링
function renderPersonalTasks(tasks = []) {
    const personalTasksContainer = document.getElementById('personal-tasks');
    if (!personalTasksContainer) return;
    
    personalTasksContainer.innerHTML = tasks.map(task => `
        <div class="task-item" data-task-id="${task.id || Math.random()}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(this, ${task.completed})"></div>
            <div class="task-content">
                <h4 class="task-title">${task.title}</h4>
                <p class="task-meta">${task.dueDate}</p>
            </div>
            ${task.urgent ? '<span class="task-tag">긴급</span>' : ''}
        </div>
    `).join('');
}

// 팀원 목록 렌더링
function renderTeamMembers(members = []) {
    const teamMembersContainer = document.getElementById('team-members');
    if (!teamMembersContainer) return;
    
    teamMembersContainer.innerHTML = members.map(member => {
        // 안전한 문자열 처리
        const name = member.user__first_name || member.name || '사용자';
        const major = member.user__profile__major || member.major || '전공 미정';
        const role = member.role || '미정';
        const avatarText = name.charAt(0) || '사';
        
        return `
            <div class="team-member">
                <div class="member-avatar">
                    ${avatarText}
                </div>
                <div class="member-info">
                    <h4 class="member-name">${name}</h4>
                    <p class="member-major">${major}</p>
                    <span class="member-role">${role}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 작업 토글 함수
function toggleTask(checkbox, currentState) {
    const newState = !currentState;
    checkbox.classList.toggle('checked', newState);
    
    // TODO: API 호출로 작업 상태 업데이트
    // updateTaskStatus(taskId, newState);
    
    // 진행률 업데이트
    updateProgressBars();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 프로젝트 드롭다운
    const projectDropdown = document.getElementById('project-dropdown');
    if (projectDropdown) {
        projectDropdown.addEventListener('click', handleProjectDropdown);
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
}

// 프로젝트 드롭다운 핸들러
function handleProjectDropdown() {
    // TODO: 프로젝트 선택 모달 또는 드롭다운 메뉴 구현
    showNotification('프로젝트 선택 기능은 준비 중입니다.', 'info');
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
    showNotification('마감 임박 작업: 3개', 'info');
}

// 로딩 상태 표시
function showLoadingState() {
    // TODO: 로딩 스피너 표시
}

// 로딩 상태 제거
function hideLoadingState() {
    // TODO: 로딩 스피너 제거
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
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

// 초대 코드 섹션 업데이트
function updateInviteCodeSection(team) {
    console.log('🔑 초대 코드 섹션 업데이트 시작');
    console.log('📋 팀 데이터:', team);
    
    const inviteCodeInput = document.getElementById('invite-code-input');
    const copyButton = document.getElementById('copy-invite-code');
    
    console.log('🎯 초대 코드 입력란:', inviteCodeInput);
    
    if (inviteCodeInput && team && team.invite_code) {
        console.log(`✅ 초대 코드 설정: ${team.invite_code}`);
        inviteCodeInput.value = team.invite_code;
    } else {
        console.log('❌ 초대 코드 설정 실패:');
        console.log('- 입력란:', !!inviteCodeInput);
        console.log('- 팀 데이터:', !!team);
        console.log('- 초대 코드:', team?.invite_code);
    }
    
    // 복사 버튼 이벤트 리스너 등록
    if (copyButton && !copyButton.hasAttribute('data-listener-added')) {
        copyButton.addEventListener('click', copyInviteCode);
        copyButton.setAttribute('data-listener-added', 'true');
        console.log('복사 버튼 이벤트 리스너 등록됨');
    }
}

// 초대 코드 복사 함수
async function copyInviteCode() {
    const inviteCodeInput = document.getElementById('invite-code-input');
    const copyButton = document.getElementById('copy-invite-code');
    
    if (!inviteCodeInput || !inviteCodeInput.value || inviteCodeInput.value === '------') {
        showNotification('복사할 초대 코드가 없습니다.', 'error');
        return;
    }
    
    try {
        // 클립보드에 복사
        await navigator.clipboard.writeText(inviteCodeInput.value);
        
        // 시각적 피드백
        copyButton.classList.add('copied');
        
        // 복사 성공 알림
        showNotification('복사 완료!', 'success');
        
        // 1.5초 후 원래 상태로 복원
        setTimeout(() => {
            copyButton.classList.remove('copied');
        }, 1500);
        
        console.log('초대 코드 복사 완료:', inviteCodeInput.value);
        
    } catch (error) {
        console.error('클립보드 복사 실패:', error);
        
        // Fallback: input 선택하여 복사
        try {
            inviteCodeInput.select();
            inviteCodeInput.setSelectionRange(0, 99999); // 모바일 대응
            document.execCommand('copy');
            showNotification('초대 코드가 복사되었습니다!', 'success');
        } catch (fallbackError) {
            console.error('Fallback 복사도 실패:', fallbackError);
            showNotification('복사에 실패했습니다. 수동으로 복사해주세요.', 'error');
        }
    }
}

// 실제 데이터로 UI 구성
function setupDashboardData(data) {
    // 사용자 정보 표시
    updateUserInfo(data.user);
    
    // 팀 정보 표시
    updateTeamInfo(data.team);
    
    // 초대 코드 섹션 업데이트
    updateInviteCodeSection(data.team);
    
    // 프로젝트 드롭다운 설정
    setupProjectDropdown(data.team);
    
    // 진행률 업데이트
    updateProgressBars(data.total_progress, data.personal_progress);
    
    // 팀 멤버 표시 (데이터가 있는 경우에만)
    if (data.team_members && Array.isArray(data.team_members)) {
        renderTeamMembers(data.team_members);
    }
    
    // 작업 목록 표시
    function renderTeamTasks(tasks = []) {
    const teamTasksContainer = document.getElementById('team-tasks');
    if (!teamTasksContainer) return;
    
    teamTasksContainer.innerHTML = tasks.length
        ? tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-content">
                    <h4 class="task-title">${task.name}</h4>
                    <p class="task-meta">담당자: ${task.assignee_name || '미정'} • ${task.due_date || ''}</p>
                    <span class="task-priority task-priority-${task.priority}">
                        ${task.priority}
                    </span>
                    <span class="task-status">${task.status}</span>
                </div>
            </div>
        `).join('')
        : '<p>팀 작업이 없습니다.</p>';
    }   

    function renderPersonalTasks(tasks = []) {
    const personalTasksContainer = document.getElementById('personal-tasks');
    if (!personalTasksContainer) return;

    personalTasksContainer.innerHTML = tasks.length
        ? tasks.map(task => `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-content">
                    <h4 class="task-title">${task.name}</h4>
                    <p class="task-meta">${task.due_date || ''}</p>
                    <span class="task-priority task-priority-${task.priority}">
                        ${task.priority}
                    </span>
                    <span class="task-status">${task.status}</span>
                </div>
            </div>
        `).join('')
        : '<p>내 작업이 없습니다.</p>';
    }

}

// 사용자 정보 업데이트
function updateUserInfo(user) {
    console.log('사용자 정보 업데이트:', user); // 디버깅 로그 추가
    
    // 사이드바의 사용자 이름과 역할 업데이트
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    const avatarTextElement = document.getElementById('avatar-text');
    
    console.log('아바타 텍스트 요소:', avatarTextElement); // 디버깅 로그 추가
    
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    
    if (userRoleElement && user.role) {
        userRoleElement.textContent = user.role;
    }
    
    // 아바타 텍스트 업데이트 (이름의 첫 글자)
    if (avatarTextElement && user.name) {
        const firstChar = user.name.charAt(0);
        avatarTextElement.textContent = firstChar;
        console.log('아바타 텍스트 설정됨:', firstChar); // 디버깅 로그 추가
    } else {
        console.log('아바타 텍스트 요소를 찾을 수 없거나 사용자 이름이 없음'); // 디버깅 로그 추가
    }
}

// 팀 정보 업데이트
function updateTeamInfo(team) {
    console.log('팀 정보 업데이트:', team); // 디버깅 로그 추가
    
    // 헤더의 프로젝트 이름은 헤더 JavaScript에서 관리하므로 여기서는 제거
    // 대시보드에서는 다른 팀 관련 정보만 업데이트
    console.log('팀 정보가 로드됨:', team.name);
}

// 프로젝트 드롭다운 설정
function setupProjectDropdown(currentTeam) {
    const dropdownButton = document.getElementById('project-dropdown');
    const dropdownMenu = document.getElementById('project-dropdown-menu');
    const projectList = document.getElementById('project-list');
    const createNewProjectBtn = document.getElementById('create-new-project');
    
    if (!dropdownButton || !dropdownMenu) return;
    
    // 드롭다운 토글
    dropdownButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdownMenu.style.display === 'block';
        
        if (isOpen) {
            dropdownMenu.style.display = 'none';
            dropdownButton.classList.remove('active');
        } else {
            dropdownMenu.style.display = 'block';
            dropdownButton.classList.add('active');
            loadProjectList();
        }
    });
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
            dropdownButton.classList.remove('active');
        }
    });
    
    // 새 프로젝트 만들기 버튼
    if (createNewProjectBtn) {
        createNewProjectBtn.addEventListener('click', function() {
            window.location.href = '/team/create/?from=dashboard';
        });
    }
}

// 프로젝트 목록 로드
async function loadProjectList() {
    const projectList = document.getElementById('project-list');
    if (!projectList) return;
    
    try {
        // 현재는 더미 데이터 사용 (나중에 API로 변경)
        const projects = [
            {
                id: 1,
                name: '웹 개발 프로젝트',
                status: '진행중',
                isActive: true
            },
            {
                id: 2,
                name: '모바일 앱 개발',
                status: '진행중',
                isActive: false
            },
            {
                id: 3,
                name: '신세 신잉플',
                status: '진행중',
                isActive: false
            }
        ];
        
        renderProjectList(projects);
        
    } catch (error) {
        console.error('프로젝트 목록 로드 오류:', error);
    }
}

// 프로젝트 목록 렌더링
function renderProjectList(projects) {
    const projectList = document.getElementById('project-list');
    if (!projectList) return;
    
    projectList.innerHTML = projects.map(project => `
        <div class="dropdown-item ${project.isActive ? 'active' : ''}" data-project-id="${project.id}">
            <svg class="dropdown-item-icon" fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <div class="dropdown-item-content">
                <div class="dropdown-item-name">${project.name}</div>
                <span class="dropdown-item-status">${project.status}</span>
            </div>
        </div>
    `).join('');
    
    // 프로젝트 선택 이벤트
    projectList.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            const projectId = this.dataset.projectId;
            selectProject(projectId);
        });
    });
}

// 프로젝트 선택
async function selectProject(projectId) {
    console.log('프로젝트 선택됨, projectId:', projectId); // 클릭 시 값 확인

    if (!projectId) {
        console.error('❌ projectId가 비어있음 - 드롭다운 data-project-id 확인 필요');
        return;
    }

    try {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // 세션에 선택된 team_id 저장
        const response = await fetch('/api/dashboard/set-current-team/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ team_id: projectId })
        });

        const result = await response.json();
        console.log('세션 저장 결과:', result);

        // teamId 전달해서 새로고침
        refreshDashboard(projectId);

    } catch (error) {
        console.error('팀 변경 중 오류:', error);
    }
}
