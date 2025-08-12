// 테마 토글 제거됨 (라이트 모드만 유지)

// 헤더 JavaScript - MGP 개발

//URL에서 team_id 읽기: /api/dashboard/{team_id}/
function readTeamIdFromPath() {
  const parts = location.pathname.split('/').filter(Boolean); // ["api","dashboard","{id}"]
  if (parts[0] === 'api' && parts[1] === 'dashboard' && /^\d+$/.test(parts[2] || '')) {
    return Number(parts[2]);
  }
  return null;
}

// PATCH: 전역 단일 소스
window.currentTeamId ??= null;
window.currentTeamId = readTeamIdFromPath() ?? window.currentTeamId;

document.addEventListener('DOMContentLoaded', async function() { // PATCH: async
    // 헤더 초기화 전에 URL 없으면 세션에서 보완
    await resolveInitialTeamId(); // PATCH
    // 헤더 초기화
    await initializeHeader();
    // 이벤트 리스너 등록
    setupHeaderEventListeners();
});

// PATCH: URL 없으면 세션으로 현재 팀 해석
async function resolveInitialTeamId() {
    const fromUrl = readTeamIdFromPath();
    if (fromUrl) {
        window.currentTeamId = fromUrl;
        await ensureSessionTeam(fromUrl);
        return fromUrl;
    }
    try {
        const r = await fetch('/api/teams/current/', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'X-CSRFToken': getCsrfToken(), 'Content-Type': 'application/json' }
        });
        if (r.ok) {
            const j = await r.json();
            if (j?.success && j?.team?.id) {
                window.currentTeamId = j.team.id;
                return window.currentTeamId;
            }
        }
    } catch (e) {
        console.warn('resolveInitialTeamId error:', e);
    }
    return null;
}

// 헤더 초기화
async function initializeHeader() {
    console.log('헤더 초기화 시작');

    // 1) URL team_id를 세션 current_team_id로 반영
    if (window.currentTeamId) { // PATCH
        await ensureSessionTeam(window.currentTeamId); // PATCH
    }

    // 2) 팀 목록 먼저 로드(드롭다운 옵션 생성)
    await loadProjectList();

    // 3) 현재 프로젝트(헤더 타이틀) 로드
    await loadCurrentProject();

    // PATCH: 현재 팀 하이라이트
    if (window.currentTeamId) {
        markActiveProjectItem(window.currentTeamId);
    }

    console.log('헤더 초기화 완료');
}

//URL의 team_id를 세션 current_team_id로 맞춰두기
async function ensureSessionTeam(teamId) {
    try {
        const res = await fetch('/api/teams/current/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ team_id: teamId })
        });
        console.log('[ensureSessionTeam] status:', res.status);
    } catch (e) {
        console.warn('[ensureSessionTeam] failed:', e);
    }
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
 * GET /api/teams/current/
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
 * GET /api/teams/list/
 */
async function loadProjectList() {
    const projectList = document.getElementById('project-list');
    if (!projectList) return;

    try {
        console.log('실제 팀 목록 API 호출 시작...');
        const response = await fetch('/api/teams/list/', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        });

        console.log('팀 목록 API 응답 상태:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('팀 목록 데이터:', data);
            if (data.success && data.teams) {
                console.log('실제 팀 목록으로 업데이트:', data.teams);
                updateProjectList(data.teams);
            } else {
                console.log('팀 목록 API success가 false 또는 teams 없음');
                showNoProjectsMessage();
            }
        } else {
            const errorData = await response.text();
            console.log('팀 목록 API 오류:', response.status, errorData);
            showNoProjectsMessage();
        }
    } catch (error) {
        console.error('팀 목록 로드 오류:', error);
        showNoProjectsMessage();
    }
}

// 현재 프로젝트 정보 업데이트
function updateCurrentProject(teamData) {
    console.log('프로젝트 정보 업데이트 시작:', teamData);
    
    const currentProjectName = document.getElementById('current-project-name');
    console.log('프로젝트 이름 요소:', currentProjectName);
    
    if (currentProjectName && teamData?.name) { // PATCH: 안전 가드
        console.log('프로젝트 이름 업데이트:', teamData.name);
        currentProjectName.textContent = teamData.name;
        console.log('업데이트 후 텍스트:', currentProjectName.textContent);
    } else {
        console.log('프로젝트 이름 업데이트 실패 - 요소 또는 이름 없음');
        if (currentProjectName) {
            currentProjectName.textContent = '프로젝트를 선택하세요';
        }
    }
}

// 프로젝트 목록 업데이트 (드롭다운)
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

    //현재 팀 하이라이트
    if (window.currentTeamId) { // PATCH
        markActiveProjectItem(window.currentTeamId); // PATCH
    }
}

//현재 선택된 팀을 드롭다운에서 강조
function markActiveProjectItem(teamId) {
    document.querySelectorAll('#project-list .project-item').forEach(el => {
        el.classList.toggle('active', String(el.dataset.teamId) === String(teamId));
    });
}

/**
 * 🔗 백엔드 API 연결점 - 헤더에서 프로젝트 변경
 * POST /api/teams/current/  → 세션 변경 후, 해당 팀 대시보드로 이동
 */
async function selectProject(teamId, teamName) { // PATCH: 전면 보강
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
        
        if (!response.ok) {
            showHeaderNotification('프로젝트 변경에 실패했습니다.', 'error');
            return;
        }
        const data = await response.json();
        if (!data.success) {
            showHeaderNotification('프로젝트 변경에 실패했습니다.', 'error');
            return;
        }

        // 전역 상태/하이라이트/타이틀 동기화
        window.currentTeamId = teamId;
        markActiveProjectItem(teamId);
        await loadCurrentProject();

        hideProjectDropdown();
        showHeaderNotification(`프로젝트가 "${teamName}"으로 변경되었습니다.`, 'success');

        // 팀 전환 전역 이벤트 발행
        window.dispatchEvent(new CustomEvent('team:changed', { detail: { teamId, teamName } }));

        // 현재 경로 기준으로 동일 섹션에서 팀 전환하도록 URL 재구성
        const parts = location.pathname.split('/').filter(Boolean); // ['api','dashboard','{id}',...]
        let targetUrl = null;
        if (parts[0] === 'api' && parts[1] === 'dashboard') {
            // /api/dashboard/{id}/... → teamId만 교체
            if (parts.length === 2) {
                // 루트인 경우 대시보드 메인으로 이동
                targetUrl = `/api/dashboard/${teamId}/`;
            } else {
                parts[2] = String(teamId);
                targetUrl = `/${parts.join('/')}`;
                if (!targetUrl.endsWith('/')) targetUrl += '/';
            }
        } else {
            // 그 외 페이지에서는 대시보드 메인으로 이동
            targetUrl = `/api/dashboard/${teamId}/`;
        }

        // 내비게이션 실행
        if (targetUrl && targetUrl !== location.pathname) {
            location.href = targetUrl;
            return;
        }

        // 폴백: 대시보드 함수가 있으면 사용
        if (typeof refreshDashboard === 'function') {
            console.log('🔄 헤더에서 대시보드 새로고침 요청, teamId:', teamId);
            refreshDashboard(teamId);
        } else if (typeof loadDashboardData === 'function') {
            console.log('⚠️ refreshDashboard 없음, loadDashboardData 사용');
            loadDashboardData(teamId);
        }

    } catch (error) {
        console.error('프로젝트 선택 오류:', error);
        showHeaderNotification('프로젝트 변경에 실패했습니다.', 'error');
    }
}

// 참여한 팀이 없을 때 메시지 표시
function showNoProjectsMessage() {
    const projectList = document.getElementById('project-list');
    if (projectList) {
        projectList.innerHTML = `
            <div class="dropdown-item no-projects">
                <span>참여한 팀이 없습니다</span>
            </div>
        `;
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

// 알림 정보 로드 (더미 데이터 - 대시보드에서 실제 데이터 관리)
async function loadNotificationInfo() {
    try {
        console.log('알림 정보는 대시보드에서 관리됩니다.');
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
    
    // 프로젝트 드롭다운 토글
    const projectDropdown = document.getElementById('project-dropdown');
    const projectDropdownMenu = document.getElementById('project-dropdown-menu');
    
    if (projectDropdown && projectDropdownMenu) {
        projectDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            projectDropdownMenu.classList.toggle('show');
            projectDropdown.classList.toggle('active');
        });
    }

    // === MGP: 햄버거 메뉴 이벤트 리스너 추가 ===
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (hamburgerBtn && sidebar) {
        // 햄버거 버튼 클릭 시 사이드바 토글
        hamburgerBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('show');
            }
        });
        
        // 오버레이 클릭 시 사이드바 닫기
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', function() {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
            });
        }
        
        // ESC 키로 사이드바 닫기
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('show');
                }
            }
        });
    }
    /* === /MGP === */

    // 드롭다운 외부 클릭 시 닫기
    
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
    showHeaderNotification('마감 임박 작업: 3개', 'info');
}

// 새 프로젝트 생성 핸들러
function handleCreateNewProject() {
    hideProjectDropdown();
    window.location.href = '/team/create/?from=header';
}

// 프로필 토글 핸들러
function handleProfileToggle() {
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