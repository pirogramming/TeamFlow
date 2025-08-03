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
        
        // 대시보드 데이터 로드
        await loadDashboardData();
        
        // 더미 데이터로 UI 구성 (API 연결 전까지)
        setupDummyData();
        
    } catch (error) {
        console.error('대시보드 초기화 오류:', error);
        showNotification('대시보드 로딩에 실패했습니다.', 'error');
    }
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    // TODO: 실제 API 연결 시 사용
    // const teamId = getCurrentTeamId(); // 현재 팀 ID 가져오기
    // const response = await fetch(`/api/dashboard/${teamId}/`);
    // const data = await response.json();
    // return data;
    
    // 임시로 더미 데이터 반환
    return {
        overall_progress: 33,
        personal_progress: 50,
        deadline_count: 3,
        team_tasks: [
            {
                id: 1,
                title: 'UI 디자인 완성',
                assignee: '김철수',
                due_date: '2024-01-15',
                completed: false,
                urgent: true
            },
            {
                id: 2,
                title: '백엔드 API 개발',
                assignee: '이영희',
                due_date: '2024-01-18',
                completed: true,
                urgent: false
            },
            {
                id: 3,
                title: '데이터베이스 설계',
                assignee: '박민수',
                due_date: '2024-01-20',
                completed: false,
                urgent: false
            }
        ],
        personal_tasks: [
            {
                id: 4,
                title: '개인 과제 제출',
                due_date: '2024-01-16',
                completed: false,
                urgent: true
            },
            {
                id: 5,
                title: '논문 리뷰',
                due_date: '2024-01-19',
                completed: true,
                urgent: false
            }
        ],
        team_members: [
            {
                id: 1,
                name: '김철수',
                major: '컴퓨터공학과',
                role: '디자이너',
                avatar: null
            },
            {
                id: 2,
                name: '이영희',
                major: '소프트웨어학과',
                role: '개발자',
                avatar: null
            },
            {
                id: 3,
                name: '박민수',
                major: '디자인학과',
                role: '미정',
                avatar: null
            },
            {
                id: 4,
                name: '최지은',
                major: '컴퓨터공학과',
                role: '미정',
                avatar: null
            }
        ]
    };
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
function updateProgressBars() {
    // 전체 진행률
    const overallProgress = document.getElementById('overall-progress');
    const overallProgressFill = document.getElementById('overall-progress-fill');
    const overallProgressText = document.getElementById('overall-progress-text');
    
    if (overallProgress) overallProgress.textContent = '33%';
    if (overallProgressFill) overallProgressFill.style.width = '33%';
    if (overallProgressText) overallProgressText.textContent = '2/6';
    
    // 개인 완료율
    const personalProgress = document.getElementById('personal-progress');
    const personalProgressFill = document.getElementById('personal-progress-fill');
    const personalProgressText = document.getElementById('personal-progress-text');
    
    if (personalProgress) personalProgress.textContent = '50%';
    if (personalProgressFill) personalProgressFill.style.width = '50%';
    if (personalProgressText) personalProgressText.textContent = '1/2';
    
    // 마감 임박
    const deadlineCount = document.getElementById('deadline-count');
    if (deadlineCount) deadlineCount.textContent = '3';
}

// 팀 작업 목록 렌더링
function renderTeamTasks() {
    const teamTasksContainer = document.getElementById('team-tasks');
    if (!teamTasksContainer) return;
    
    const tasks = [
        {
            title: 'UI 디자인 완성',
            assignee: '김철수',
            dueDate: '2024-01-15',
            completed: false,
            urgent: true
        },
        {
            title: '백엔드 API 개발',
            assignee: '이영희',
            dueDate: '2024-01-18',
            completed: true,
            urgent: false
        },
        {
            title: '데이터베이스 설계',
            assignee: '박민수',
            dueDate: '2024-01-20',
            completed: false,
            urgent: false
        }
    ];
    
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
function renderPersonalTasks() {
    const personalTasksContainer = document.getElementById('personal-tasks');
    if (!personalTasksContainer) return;
    
    const tasks = [
        {
            title: '개인 과제 제출',
            dueDate: '2024-01-16',
            completed: false,
            urgent: true
        },
        {
            title: '논문 리뷰',
            dueDate: '2024-01-19',
            completed: true,
            urgent: false
        }
    ];
    
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
function renderTeamMembers() {
    const teamMembersContainer = document.getElementById('team-members');
    if (!teamMembersContainer) return;
    
    const members = [
        {
            name: '김철수',
            major: '컴퓨터공학과',
            role: '디자이너'
        },
        {
            name: '이영희',
            major: '소프트웨어학과',
            role: '개발자'
        },
        {
            name: '박민수',
            major: '디자인학과',
            role: '미정'
        },
        {
            name: '최지은',
            major: '컴퓨터공학과',
            role: '미정'
        }
    ];
    
    teamMembersContainer.innerHTML = members.map(member => `
        <div class="team-member">
            <div class="member-avatar">
                ${member.name.charAt(0)}
            </div>
            <div class="member-info">
                <h4 class="member-name">${member.name}</h4>
                <p class="member-major">${member.major}</p>
                <span class="member-role">${member.role}</span>
            </div>
        </div>
    `).join('');
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
    window.location.href = '/preview/team-setup/?from=dashboard';
}

// 팀 참여 핸들러
function handleJoinTeam() {
    window.location.href = '/preview/team-join/?from=dashboard';
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
