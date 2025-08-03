// 헤더 JavaScript - MGP 개발

document.addEventListener('DOMContentLoaded', function() {
    // 헤더 초기화
    initializeHeader();
    
    // 이벤트 리스너 등록
    setupHeaderEventListeners();
});

// 헤더 초기화
function initializeHeader() {
    // 사용자 정보 로드
    loadUserInfo();
    
    // 프로젝트 정보 로드
    loadProjectInfo();
    
    // 알림 정보 로드
    loadNotificationInfo();
}

// 사용자 정보 로드
async function loadUserInfo() {
    try {
        // 공통 유틸리티에서 사용자 정보 가져오기
        const userData = await fetchUserData();
        
        // 헤더용 사용자 정보 업데이트
        const headerUserData = {
            name: userData.name,
            role: userData.role,
            avatar: userData.avatar || null
        };
        
        updateUserInfo(headerUserData);
    } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
    }
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

// 프로젝트 정보 로드
async function loadProjectInfo() {
    try {
        // TODO: 실제 API 연결 시 사용
        // const response = await fetch('/api/projects/current/');
        // const projectData = await response.json();
        
        // 임시 더미 데이터
        const projectData = {
            name: '웹 개발 프로젝트',
            subtitle: '2024년 1학기 캡스톤 디자인',
            team_name: '웹 개발 스터디'
        };
        
        updateProjectInfo(projectData);
    } catch (error) {
        console.error('프로젝트 정보 로드 오류:', error);
    }
}

// 프로젝트 정보 업데이트
function updateProjectInfo(projectData) {
    const projectTitle = document.getElementById('project-title');
    const projectSubtitle = document.getElementById('project-subtitle');
    const currentProjectName = document.getElementById('current-project-name');
    
    if (projectTitle) projectTitle.textContent = projectData.name;
    if (projectSubtitle) projectSubtitle.textContent = projectData.subtitle;
    if (currentProjectName) currentProjectName.textContent = projectData.team_name;
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
    
    // 프로필 토글
    const profileToggle = document.getElementById('profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', handleProfileToggle);
    }
}

// 프로젝트 드롭다운 핸들러
function handleProjectDropdown() {
    // TODO: 프로젝트 선택 모달 또는 드롭다운 메뉴 구현
    showHeaderNotification('프로젝트 선택 기능은 준비 중입니다.', 'info');
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
    showHeaderNotification('마감 임박 작업: 3개', 'info');
}

// 프로필 토글 핸들러
function handleProfileToggle() {
    // TODO: 프로필 메뉴 또는 설정 페이지로 이동
    showHeaderNotification('프로필 설정 기능은 준비 중입니다.', 'info');
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