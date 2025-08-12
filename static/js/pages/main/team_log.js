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

    // ===== 프로젝트 카드 로컬 삭제 (팀 기록 카드용) =====
    const DeletedProjects = (() => {
        const NEW_KEY = 'teamlog_deleted_projects';
        const OLD_KEY = 'teamlog_hidden_projects'; // 이전 버전 호환

        function getDeletedSet() {
            // 마이그레이션: 예전에 저장된 숨김 목록이 있으면 합침
            let fromNew = [];
            let fromOld = [];
            try { fromNew = JSON.parse(localStorage.getItem(NEW_KEY) || '[]'); } catch { fromNew = []; }
            try { fromOld = JSON.parse(localStorage.getItem(OLD_KEY) || '[]'); } catch { fromOld = []; }
            const merged = new Set([...(fromNew || []), ...(fromOld || [])].map(String));
            if (fromOld && fromOld.length) {
                localStorage.removeItem(OLD_KEY);
                localStorage.setItem(NEW_KEY, JSON.stringify([...merged]));
            }
            return merged;
        }
        function saveDeletedSet(set) {
            localStorage.setItem(NEW_KEY, JSON.stringify([...set]));
        }
        function isDeleted(teamId) {
            const s = getDeletedSet();
            return s.has(String(teamId));
        }
        function markDeleted(teamId) {
            const s = getDeletedSet();
            s.add(String(teamId));
            saveDeletedSet(s);
        }
        function restore(teamId) {
            const s = getDeletedSet();
            s.delete(String(teamId));
            saveDeletedSet(s);
        }
        function filter(projects) {
            const s = getDeletedSet();
            return (projects || []).filter(p => !s.has(String(p.team_id)));
        }
        return { getDeletedSet, saveDeletedSet, isDeleted, markDeleted, restore, filter };
    })();
    window.TeamLogDeletedProjects = DeletedProjects;

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
            const visibleProjects = DeletedProjects.filter(teamProjects);
            
            if (visibleProjects.length === 0) {
                showEmptyState();
            } else {
                renderTeamProjects(visibleProjects);
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
        const response = await fetch('/api/dashboard/team_log/api/list/', {
            credentials: 'same-origin'
        });
        
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
        const projectsHTML = (projects || []).map(project => createProjectCard(project)).join('');
        teamProjectsGrid.innerHTML = projectsHTML;
    }

    /**
     * 개별 프로젝트 카드 HTML 생성
     */
    function createProjectCard(project) {
        const teamMembers = project.team_members || { names: [], totalTasks: 0, completedTasks: 0 };
        const totalTasks = Number(teamMembers.totalTasks) || 0;
        const completedTasks = Number(teamMembers.completedTasks) || 0;
        const progressPercentage = (typeof project.progress_percentage === 'number')
            ? project.progress_percentage
            : (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

        const isCompleted = totalTasks > 0 && completedTasks >= totalTasks;
        const statusClass = isCompleted ? 'status-completed' : 'status-active';
        const statusText = isCompleted ? '완료' : '진행중';

        // /api/dashboard/{teamid} 로 이동
        // 백엔드에서 내려주는 project.dashboard_url이 우선, 없으면 폴백
        const dashboardUrl = project.dashboard_url || `/api/dashboard/${project.team_id}/`;

        return `
            <div class="project-card" data-team-id="${project.team_id}">
                <div class="project-card-header">
                    <div>
                        <h3 class="project-title">${escapeHtml(project.title)}</h3>
                    </div>
                    <span class="project-status ${statusClass}">${statusText}</span>
                </div>

                <div class="team-info-section">
                    <div class="team-members-count">
                        <svg class="members-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                        </svg>
                        팀원 ${teamMembers.names.length}명
                    </div>
                    <div class="team-members-list">
                        ${renderTeamMembersList(teamMembers)}
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
                            <p class="progress-number completed">${completedTasks}</p>
                            <p class="progress-item-label">완료 작업</p>
                        </div>
                        <div class="progress-item">
                            <p class="progress-number in-progress">${totalTasks}</p>
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
                    <button type="button" class="btn-danger project-delete-btn" title="이 팀 삭제/탈퇴">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h10"></path>
                        </svg>
                        삭제/탈퇴
                    </button>
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

    // ===== 이벤트 위임: 카드 숨기기 처리 =====
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.project-delete-btn');
        if (!btn) return;

        const card = btn.closest('.project-card');
        const teamId = card?.dataset?.teamId;
        if (!card || !teamId) return;

        // 백엔드에서 현재 사용자의 팀 소유 여부를 헤더를 통해 가져올 수 있으나,
        // 카드 데이터에는 없으므로 확인 팝업에서 분기 선택 제공
        const choice = await promptDeleteOrLeave();
        if (!choice) return;

        const confirmMsg = choice === 'delete'
            ? '정말 팀을 삭제하시겠어요?\n삭제 후 복구할 수 없습니다. (팀장만 가능)'
            : '정말 팀에서 탈퇴하시겠어요?\n탈퇴 후 복구할 수 없습니다.';
        if (!window.confirm(confirmMsg)) return;

        try {
            // 로딩 표시(optional)
            if (window.showLoading) window.showLoading('처리 중입니다...');

            const url = choice === 'delete'
                ? `/api/dashboard/${teamId}/team/delete/`
                : `/api/dashboard/${teamId}/team/leave/`;

            const method = choice === 'delete' ? 'DELETE' : 'POST';
            const res = await fetch(url, {
                method,
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': (window.getCsrfToken?.() || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '')
                }
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.success === false) {
                throw new Error(data?.error || `요청 실패 (HTTP ${res.status})`);
            }

            // 성공: 로컬 삭제표시 + DOM 제거
            DeletedProjects.markDeleted(teamId);
            card.remove();
            if (window.showSuccess) window.showSuccess('처리되었습니다.');

            const hasCards = !!teamProjectsGrid.querySelector('.project-card');
            if (!hasCards) {
                showEmptyState();
            }
        } catch (err) {
            console.error('팀 삭제/탈퇴 실패:', err);
            if (window.showError) window.showError(err.message || '처리에 실패했습니다.');
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    });

    function promptDeleteOrLeave() {
        // 간단 분기: 확인 창 2단계 대신 기본 confirm을 두 번 사용
        // 1) 팀 삭제 시도? (팀장만 가능)
        const wantDelete = window.confirm('팀 전체를 삭제하시려면 확인을 누르세요.\n팀에서 탈퇴만 하시려면 취소를 누르세요.');
        return wantDelete ? 'delete' : 'leave';
    }
});