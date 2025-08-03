// 사용자 프로필 확인 및 네비게이션 유틸리티 - MGP 개발

/**
 * 실제 사용자 정보를 가져오는 함수
 * @returns {Promise<Object>} 사용자 정보
 */
async function fetchUserData() {
    try {
        // TODO: 실제 API 연결 시 사용
        // const response = await fetch('/api/auth/me/', {
        //     method: 'GET',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
        //     }
        // });
        // 
        // if (!response.ok) {
        //     throw new Error(`HTTP ${response.status}`);
        // }
        // 
        // const userData = await response.json();
        // return {
        //     has_profile: userData.profile_completed || false,
        //     profile_completed: userData.profile_completed || false,
        //     name: userData.name || userData.first_name || '사용자',
        //     role: userData.role || '미정',
        //     avatar: userData.avatar || null
        // };
        
        // 임시로 더미 데이터 사용 (실제로는 API에서 받아온 데이터로 판단)
        const userData = {
            has_profile: true, // true면 기존 회원, false면 신규 회원
            profile_completed: true,
            name: '김철수', // 실제 사용자 이름
            role: '미정' // 실제 사용자 역할
        };
        
        return userData;
    } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        // 오류 시 기본 데이터 반환
        return {
            has_profile: false,
            profile_completed: false,
            name: '사용자',
            role: '미정'
        };
    }
}

/**
 * 사용자 프로필 확인 및 적절한 페이지로 네비게이션
 * @param {string} fallbackUrl - 오류 시 이동할 기본 URL
 */
async function checkUserProfileAndNavigate(fallbackUrl = '/preview/dashboard/') {
    try {
        const userData = await fetchUserData();
        
        if (userData.has_profile && userData.profile_completed) {
            // 기존 회원: 대시보드로 이동
            window.location.href = '/preview/dashboard/';
        } else {
            // 신규 회원: 프로필 설정 페이지로 이동
            window.location.href = '/preview/profile-setup/';
        }
    } catch (error) {
        console.error('사용자 프로필 확인 오류:', error);
        // 오류 시 기본 URL로 이동
        window.location.href = fallbackUrl;
    }
}

/**
 * 사용자가 기존 회원인지 확인
 * @returns {Promise<boolean>} 기존 회원 여부
 */
async function isExistingUser() {
    try {
        const userData = await fetchUserData();
        return userData.has_profile && userData.profile_completed;
    } catch (error) {
        console.error('사용자 확인 오류:', error);
        return false;
    }
}

/**
 * 사용자 프로필 상태에 따른 뒤로가기 처리
 * @param {string} fallbackUrl - 오류 시 이동할 기본 URL
 */
async function handleBackNavigation(fallbackUrl = '/preview/dashboard/') {
    await checkUserProfileAndNavigate(fallbackUrl);
}

// 전역 함수로 내보내기
window.fetchUserData = fetchUserData;
window.checkUserProfileAndNavigate = checkUserProfileAndNavigate;
window.isExistingUser = isExistingUser;
window.handleBackNavigation = handleBackNavigation; 