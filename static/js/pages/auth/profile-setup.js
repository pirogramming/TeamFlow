/*
 * 원본 백엔드 테스트용 코드 (보존)
 * 
 * /**
 *  * 프로필 설정 페이지 (백엔드 테스트용)
 *  * 
 *  * 백엔드 개발자 참고:
 *  * - PATCH /api/auth/me/ 엔드포인트로 프로필 정보 전송
 *  * - 필드: name, major, specialization
 *  *\/
 * 
 * document.addEventListener('DOMContentLoaded', function() {
 *     const form = document.getElementById('profile-setup-form');
 *     
 *     if (form) {
 *         form.addEventListener('submit', async function(e) {
 *             e.preventDefault();
 *             
 *             const formData = new FormData(form);
 *             const data = {
 *                 name: formData.get('name'),
 *                 major: formData.get('major'),
 *                 specialization: formData.get('specialization') || ''
 *             };
 *             
 *             console.log('프로필 데이터 전송:', data);
 * 
 *             try {
 *                 const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
 * 
 *                 const response = await fetch('/api/users/me/', {
 *                     method: 'PATCH',
 *                     headers: {
 *                         'Content-Type': 'application/json',
 *                         'X-CSRFToken': csrftoken
 *                     },
 *                     body: JSON.stringify(data)
 *                 });
 * 
 *                 if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *                 const result = await response.json();
 * 
 *                 if (result.id) {
 *                     alert('프로필 설정 완료!');
 *                     window.location.href = '/dashboard/';  // 대시보드로 이동
 *                 } else {
 *                     alert('프로필 설정 실패');
 *                 }
 *             } catch (error) {
 *                 alert('오류 발생: ' + error.message);
 *             }
 *         });
 *     }
 * });
 */

// ========================================
/**
 * 프로필 설정 페이지 - NEW
 * 
 * 기능:
 * - 폼 유효성 검사
 * - 실시간 피드백
 * - 로딩 상태 관리
 * - 에러 처리
 * - API 연동 (/api/auth/me/)
 * 
 * 백엔드 개발자 참고:
 * - PATCH /api/auth/me/ 엔드포인트로 프로필 정보 전송
 * - 필드: name, major, specialization
 */

document.addEventListener('DOMContentLoaded', function() {
    // 디버깅: 페이지 로드 상태 확인
    console.log('프로필 설정 페이지 로드됨');
    console.log('현재 URL:', window.location.href);
    
    // CSRF 토큰 확인
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    console.log('CSRF 토큰 존재:', !!csrfToken);
    
    // 세션 쿠키 확인 (디버깅용)
    const sessionCookie = document.cookie.includes('sessionid');
    console.log('세션 쿠키 존재:', sessionCookie);
    console.log('전체 쿠키:', document.cookie);

    // DOM 요소들
    const form = document.getElementById('profile-setup-form');
    const submitBtn = document.getElementById('profile-submit-btn');
    
    if (!form) return;
    
    // 폼 요소들
    const nameInput = document.getElementById('name');
    const majorInput = document.getElementById('major');
    const specializationInput = document.getElementById('specialization');
    
    // 유효성 검사 상태
    let isFormValid = false;
    let isSubmitting = false;
    
    // 초기 버튼 상태 설정 (비활성화)
    updateSubmitButton();
    
    // 유효성 검사 함수
    function validateField(field, minLength = 1) {
        const value = field.value.trim();
        const isValid = value.length >= minLength;
        
        // 에러 클래스 토글
        field.classList.toggle('error', !isValid);
        
        // 에러 메시지 처리
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!isValid && !errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }
        
        if (errorElement) {
            if (isValid) {
                errorElement.remove();
            } else {
                // 워딩 변경
                if (field.id === 'name') {
                    errorElement.textContent = '이름을 입력해주세요.';
                } else if (field.id === 'major') {
                    errorElement.textContent = '전공을 입력해주세요.';
                } else {
                    const fieldName = field.getAttribute('placeholder') || field.name;
                    errorElement.textContent = `${fieldName}을(를) 입력해주세요.`;
                }
            }
        }
        
        return isValid;
    }
    
    // 전체 폼 유효성 검사 (에러 메시지 포함)
    function validateForm() {
        const nameValid = validateField(nameInput, 2);
        const majorValid = validateField(majorInput, 2);
        
        isFormValid = nameValid && majorValid;
        updateSubmitButton();
        
        return isFormValid;
    }
    
    // 제출 버튼 상태 업데이트
    function updateSubmitButton() {
        if (submitBtn) {
            submitBtn.disabled = !isFormValid || isSubmitting;
            
            if (isSubmitting) {
                submitBtn.innerHTML = `
                    <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                    처리 중...
                `;
            } else {
                submitBtn.innerHTML = `
                    다음 단계로
                    <svg class="btn-icon" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                `;
            }
        }
    }
    
    // 실시간 유효성 검사 이벤트
    [nameInput, majorInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                // 다른 필드에 입력이 있으면 모든 필드 검사
                if (nameInput.value.trim().length > 0 || majorInput.value.trim().length > 0) {
                    validateField(nameInput, 2);
                    validateField(majorInput, 2);
                }
                // 폼 유효성 확인
                const nameValid = nameInput.value.trim().length >= 2;
                const majorValid = majorInput.value.trim().length >= 2;
                isFormValid = nameValid && majorValid;
                updateSubmitButton();
            });
        }
    });
    
    // 폼 제출 처리
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm() || isSubmitting) return;
        
        isSubmitting = true;
        updateSubmitButton();
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name').trim(),
            major: formData.get('major').trim(),
            specialization: formData.get('specialization')?.trim() || ''
        };

        try {
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            // 디버깅: 요청 정보 로그
            console.log('프로필 설정 요청:', {
                url: '/api/auth/me/',
                method: 'PATCH',
                data: data,
                csrftoken: csrftoken ? '존재함' : '없음'
            });

            const response = await fetch('/api/auth/me/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(data),
                credentials: 'same-origin'  // 세션 쿠키 포함
            });

            // 디버깅: 응답 정보 로그
            console.log('프로필 설정 응답:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('프로필 설정 오류 상세:', errorData);
                throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('프로필 설정 성공:', result);

            if (result.success) {
                // 성공 애니메이션
                submitBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    완료!
                `;
                
                // 성공 메시지 표시
                showNotification('프로필 설정이 완료되었습니다!', 'success');
                
                // 바로 팀 설정 선택 페이지로 리다이렉션
                window.location.href = '/team-setup/';
            } else {
                throw new Error('프로필 저장에 실패했습니다.');
            }
            
        } catch (error) {
            console.error('프로필 설정 오류:', error);
            
            // 에러 메시지 표시
            showNotification(error.message || '오류가 발생했습니다. 다시 시도해주세요.', 'error');
            
            // 버튼 상태 복원
            isSubmitting = false;
            updateSubmitButton();
        }
    });
    
    // 알림 표시 함수
    function showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // 스타일 적용
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;
        
        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        document.body.appendChild(notification);
    }
    
    // 초기 유효성 검사 제거 (버튼 클릭 시에만 검사)
    
    // 접근성 개선
    form.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            if (isFormValid && !isSubmitting) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);
