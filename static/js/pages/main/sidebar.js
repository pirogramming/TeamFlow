// 사이드바 JavaScript - MGP 개발

document.addEventListener('DOMContentLoaded', function() {
    // 사이드바 초기화
    initializeSidebar();
    
    // 이벤트 리스너 등록
    setupSidebarEventListeners();
});

// 사이드바 초기화
function initializeSidebar() {
    // 현재 페이지에 따른 활성 메뉴 설정
    setActiveMenuItem();
    
    // 사용자 정보 로드
    loadSidebarUserInfo();
    
    // 반응형 처리
    handleResponsiveSidebar();
}

// 현재 페이지에 따른 활성 메뉴 설정
function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const link = item.querySelector('.nav-link');
        if (link) {
            const href = link.getAttribute('href');
            if (href && currentPath.startsWith(href)) {
                // 기존 활성 상태 제거
                navItems.forEach(nav => nav.classList.remove('active'));
                // 현재 아이템 활성화
                item.classList.add('active');
            }
        }
    });
}

// 사용자 정보 로드
async function loadSidebarUserInfo() {
    try {
        // 공통 유틸리티에서 사용자 정보 가져오기
        const userData = await fetchUserData();
        
        // 사이드바용 사용자 정보 업데이트
        const sidebarUserData = {
            name: userData.name,
            role: userData.role,
            avatar: userData.avatar || null
        };
        
        updateSidebarUserInfo(sidebarUserData);
    } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
    }
}

// 사용자 정보 업데이트
function updateSidebarUserInfo(userData) {
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userName) userName.textContent = userData.name;
    if (userRole) userRole.textContent = userData.role;
    
    if (userAvatar) {
        userAvatar.textContent = userData.name;
    }
}

// 반응형 사이드바 처리
function handleResponsiveSidebar() {
    const isMobile = window.innerWidth <= 1024;
    
    if (isMobile) {
        // 모바일에서는 사이드바 숨김
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
}

// 이벤트 리스너 설정
function setupSidebarEventListeners() {
    // 네비게이션 링크 클릭
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // 프로필 토글
    const profileToggle = document.getElementById('profile-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', handleProfileToggle);
    }
    
    // 윈도우 리사이즈
    window.addEventListener('resize', handleWindowResize);
    
    // 모바일 메뉴 토글 (필요시)
    setupMobileMenuToggle();
}

// 네비게이션 링크 클릭 핸들러
function handleNavLinkClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');
    
    // 대시보드 링크 클릭 시 현재 페이지로 이동
    if (href === '/preview/dashboard/') {
        e.preventDefault();
        window.location.href = '/preview/dashboard/';
        return;
    }
    
    // 현재 활성 상태 제거
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // 클릭된 아이템 활성화
    const navItem = link.closest('.nav-item');
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // 모바일에서 사이드바 닫기
    if (window.innerWidth <= 1024) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
    
    // TODO: 실제 페이지 이동 또는 SPA 라우팅
    // 현재는 기본 링크 동작 사용
}

// 프로필 토글 핸들러
function handleProfileToggle() {
    // TODO: 프로필 메뉴 또는 설정 페이지로 이동
    showSidebarNotification('프로필 설정 기능은 준비 중입니다.', 'info');
}

// 윈도우 리사이즈 핸들러
function handleWindowResize() {
    handleResponsiveSidebar();
}

// 모바일 메뉴 토글 설정
function setupMobileMenuToggle() {
    // 모바일 메뉴 버튼이 있다면 추가
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    }
}

// 모바일 사이드바 토글
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// 사이드바 알림 표시
function showSidebarNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.sidebar-notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `sidebar-notification-toast ${type}`;
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

// 전역 함수로 모바일 사이드바 토글 제공
window.toggleMobileSidebar = toggleMobileSidebar;
