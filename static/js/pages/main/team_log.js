/**
 * 팀플 기록 페이지 JavaScript
 * Clean Code 원칙 준수: DRY, KISS, 명확한 네이밍
 */

document.addEventListener('DOMContentLoaded', function() {
    // ===== 공용 유틸: 로컬 숨김(본인 PC 전용) =====
    const TeamLogLocalHide = (() => {
        const HIDE_KEY_PREFIX = 'teamlog_hidden_'; // team별로 구분

        function getHiddenSet(teamId){
            const raw = localStorage.getItem(HIDE_KEY_PREFIX + teamId);
            return new Set(raw ? JSON.parse(raw) : []);
        }
        function saveHiddenSet(teamId, set){
            localStorage.setItem(HIDE_KEY_PREFIX + teamId, JSON.stringify([...set]));
        }
        function hideLocally(teamId, logClientId){
            const s = getHiddenSet(teamId);
            s.add(logClientId);
            saveHiddenSet(teamId, s);
            // 이 페이지에선 로그 렌더가 없으니 noop. 상세페이지에선 render() 호출
        }
        function filterLogs(teamId, logs){
            const hidden = getHiddenSet(teamId);
            // 로그 객체에 client_id가 있어야 함(상세 페이지에서 생성/부여)
            return logs.filter(l => !hidden.has(l.client_id));
        }
        return { getHiddenSet, saveHiddenSet, hideLocally, filterLogs };
    })();

    // 전역 노출(상세 페이지에서도 쓰게)
    window.TeamLogLocalHide = TeamLogLocalHide;

    // ===== 탭 해시 제거 (탭이 있을 때만 동작; 없으면 조용히 패스) =====
    (function initTabWithoutHash(){
        const tabs = document.querySelectorAll('.tab[data-tab], .tab[href^="#"]');
        if (!tabs.length) return;

        tabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // a[href="#..."]면 기본 해시 이동 막기
                if (btn.tagName === 'A' && btn.getAttribute('href')?.startsWith('#')) {
                    e.preventDefault();
                }
                const tab = btn.dataset.tab || btn.getAttribute('href')?.replace('#','') || '';
                if (!tab) return;

                // TODO: 실제 탭 컨텐츠 전환 로직 호출 (예: showTab(tab))
                // showTab(tab);

                const url = new URL(window.location);
                url.searchParams.set('tab', tab);
                history.pushState({}, '', url); // # 안 붙음
            });
        });
    })();


    // DOM 요소 참조
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const teamProjectsGrid = document.getElementById('team-projects-grid');
    const emptyState = document.getElementById('empty-state');
    const errorState = document.getElementById('error-state');

    // 초기화
    initializeTeamLogPage();

    /**
     * 페이지 초기화
     */
    async function initializeTeamLogPage() {
        try {
            showLoadingState();
            const teamProjects = await fetchTeamProjects();
            
            if (teamProjects.length === 0) {
                showEmptyState();
            } else {
                renderTeamProjects(teamProjects);
                showProjectsGrid();
            }
        } catch (error) {
            console.error('팀플 기록 로드 실패:', error);
            showErrorState();
        }
    }

    /**
     * 백엔드에서 팀 프로젝트 목록 가져오기
     */
    async function fetchTeamProjects() {
        const response = await fetch('/api/dashboard/team_log/api/list/');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const projects = await response.json();
        return projects;
    }

    /**
     * 팀 프로젝트 카드들 렌더링
     */
    function renderTeamProjects(projects) {
        const projectsHTML = projects.map(project => createProjectCard(project)).join('');
        teamProjectsGrid.innerHTML = projectsHTML;
    }

    /**
     * 개별 프로젝트 카드 HTML 생성
     */
    function createProjectCard(project) {
        const statusClass = project.status === '완료' ? 'status-completed' : 'status-active';
        const statusText = project.status === '완료' ? '완료' : '진행중';
        
        // 가상의 팀원 데이터 (실제로는 백엔드에서 제공해야 함)
        const mockTeamMembers = generateMockTeamMembers(project.team_id);
        const progressPercentage = calculateProgressPercentage(project);

        // /api/dashboard/{teamid} 로 이동
        // 백엔드에서 내려주는 project.dashboard_url이 우선, 없으면 폴백
        const dashboardUrl = project.dashboard_url || `/api/dashboard/${project.team_id}/`;


        return `
            <div class="project-card">
                <div class="project-card-header">
                    <div>
                        <h3 class="project-title">${escapeHtml(project.title)}</h3>
                        <p class="project-description">${formatProjectPeriod(project.last_activity)}</p>
                    </div>
                    <span class="project-status ${statusClass}">${statusText}</span>
                </div>

                <div class="team-info-section">
                    <div class="team-members-count">
                        <svg class="members-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                        팀원 ${mockTeamMembers.names.length}명
                    </div>
                    <div class="team-members-list">
                        ${renderTeamMembersList(mockTeamMembers)}
                    </div>
                </div>

                <div class="progress-section">
                    <div class="progress-header">
                        <span class="progress-label">전체 완료율</span>
                        <span class="progress-percentage">${progressPercentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="detailed-progress">
                        <div class="progress-item">
                            <p class="progress-number completed">${mockTeamMembers.completedTasks}</p>
                            <p class="progress-item-label">완료 작업</p>
                        </div>
                        <div class="progress-item">
                            <p class="progress-number in-progress">${mockTeamMembers.totalTasks}</p>
                            <p class="progress-item-label">전체 작업</p>
                        </div>
                    </div>
                </div>

                <div class="project-card-actions">
                    <a href="${dashboardUrl}" class="btn-primary">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        프로젝트 보기
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * 팀원 이름 목록 렌더링
     */
    function renderTeamMembersList(teamData) {
        const { names } = teamData;
        return names.join(', ');
    }

    /**
     * 진행률 계산 (임시 로직)
     */
    function calculateProgressPercentage(project) {
        // 실제로는 백엔드에서 계산된 값을 받아야 함
        const mockProgress = Math.floor(Math.random() * 101);
        return mockProgress;
    }

    /**
     * 가상 팀원 데이터 생성 (실제로는 백엔드에서 제공)
     */
    function generateMockTeamMembers(teamId) {
        const memberNames = ['김철수', '이영희', '박민수', '최지은', '정현우'];
        const teamSize = Math.floor(Math.random() * 4) + 2; // 2-5명
        const selectedNames = memberNames.slice(0, teamSize);
        
        const totalTasks = Math.floor(Math.random() * 15) + 5; // 5-20개
        const completedTasks = Math.floor(totalTasks * (Math.random() * 0.8 + 0.1)); // 10-90%

        return {
            names: selectedNames,
            totalTasks,
            completedTasks
        };
    }

    /**
     * 프로젝트 기간 포맷팅
     */
    function formatProjectPeriod(lastActivity) {
        if (!lastActivity) return '2024년 1학기 캡스톤 디자인';
        
        try {
            const date = new Date(lastActivity);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const semester = month <= 6 ? '1학기' : '2학기';
            return `${year}년 ${semester} 캡스톤 디자인`;
        } catch {
            return '2024년 1학기 캡스톤 디자인';
        }
    }

    /**
     * HTML 이스케이프 (XSS 방지)
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * UI 상태 관리 함수들
     */
    function showLoadingState() {
        loadingSkeleton.style.display = 'grid';
        teamProjectsGrid.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    }

    function showProjectsGrid() {
        loadingSkeleton.style.display = 'none';
        teamProjectsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    }

    function showEmptyState() {
        loadingSkeleton.style.display = 'none';
        teamProjectsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        errorState.style.display = 'none';
    }

    function showErrorState() {
        loadingSkeleton.style.display = 'none';
        teamProjectsGrid.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'block';
    }

    // 개발자 디버깅을 위한 전역 함수 노출
    if (window.TeamFlow && window.TeamFlow.debug) {
        window.TeamLogDebug = {
            fetchTeamProjects,
            renderTeamProjects,
            showLoadingState,
            showEmptyState,
            showErrorState
        };
        console.log('🔧 TeamLog 디버그 함수들이 window.TeamLogDebug에 노출되었습니다.');
    }
});