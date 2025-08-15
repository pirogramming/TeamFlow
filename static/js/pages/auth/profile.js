/**
 * 프로필 페이지 JavaScript
 * /api/auth/profile/ 엔드포인트를 사용한 현대적인 프로필 관리
 */

class ProfileManager {
    constructor() {
        this.form = document.getElementById('profile-form');
        this.submitBtn = document.getElementById('save-btn');
        this.restoreBtn = document.getElementById('restore-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.loadingElement = document.getElementById('profile-loading');
        this.messageElement = document.getElementById('profile-message');
        
        this.isSubmitting = false;
        this.originalData = {};
        
        this.init();
    }

    init() {
        this.loadProfile();
        this.bindEvents();
    }

    bindEvents() {
        // 폼 제출 이벤트
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // 복구하기 버튼 이벤트
        this.restoreBtn.addEventListener('click', () => this.restoreForm());

        // 로그아웃 버튼 이벤트
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // 입력 필드 변경 감지
        this.form.addEventListener('input', () => this.checkFormChanges());
        
        // 키보드 이벤트 (Escape로 복구)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.restoreForm();
            }
        });
    }

    /**
     * 로그아웃 처리
     */
    handleLogout() {
        try {
            // 클라이언트 토큰 제거 (프론트 인증 토큰 사용 시)
            if (typeof window.logout === 'function') {
                // window.logout 은 토큰을 제거하고 '/'로 이동
                window.localStorage.removeItem('access_token');
                window.localStorage.removeItem('refresh_token');
            }

            // 서버 세션 로그아웃 후 랜딩으로 이동
            window.location.href = '/auth/logout/';
        } catch (e) {
            console.error('로그아웃 실패:', e);
            window.location.href = '/auth/logout/';
        }
    }

    /**
     * 프로필 데이터 로드
     */
    async loadProfile() {
        try {
            this.showLoading(true);
            this.hideMessage();
            
            const response = await fetch('/api/auth/profile/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.populateForm(data);
            this.originalData = { ...data };
            
            // 추가 정보 업데이트
            this.updateAdditionalInfo(data);
            
        } catch (error) {
            console.error('프로필 로드 실패:', error);
            this.showMessage('프로필 정보를 불러오는데 실패했습니다.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 폼에 데이터 채우기
     */
    populateForm(data) {
        const fields = ['first_name', 'major', 'specialization'];
        
        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.value = data[field] || '';
            }
        });

        // 표시 이름 업데이트
        const displayName = document.getElementById('display-name');
        if (displayName) {
            displayName.textContent = data.first_name || '사용자';
        }
    }

    /**
     * 추가 정보 업데이트 (통계 등)
     */
    updateAdditionalInfo(data) {
        // 가입일 표시 (백엔드에서 ISO로 전달됨)
        const joinDateElement = document.getElementById('join-date');
        if (joinDateElement) {
            const raw = data.join_date;
            if (raw) {
                const d = new Date(raw);
                // 유효성 체크 후 포맷팅
                joinDateElement.textContent = isNaN(d.getTime())
                    ? '-'
                    : d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
            } else {
                joinDateElement.textContent = '-';
            }
        }

        // 실제 값 반영
        if (typeof data.teams_count !== 'undefined') {
            this.updateStat('teams-count', String(data.teams_count));
        }
        if (typeof data.tasks_count !== 'undefined') {
            this.updateStat('tasks-count', String(data.tasks_count));
        }
    }

    updateStat(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * 폼 제출 처리
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        if (!this.validateForm()) {
            return;
        }
        
        this.isSubmitting = true;
        this.updateSubmitButton();
        
        try {
            const formData = new FormData(this.form);
            const data = {
                name: formData.get('first_name').trim(),
                major: formData.get('major').trim(),
                specialization: formData.get('specialization')?.trim() || ''
            };

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            const response = await fetch('/api/auth/profile/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('프로필이 성공적으로 업데이트되었습니다.', 'success');
                this.originalData = { ...data, first_name: data.name };
                this.updateAdditionalInfo(result);
                
                // 표시 이름 업데이트
                const displayName = document.getElementById('display-name');
                if (displayName) {
                    displayName.textContent = data.name;
                }
                
                // 버튼 상태 업데이트
                this.checkFormChanges();
                
                // 리다이렉트 제거 - 현재 페이지에서 그대로 유지
            }
            
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            this.showMessage(`프로필 업데이트에 실패했습니다: ${error.message}`, 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton();
        }
    }

    /**
     * 폼 유효성 검사
     */
    validateForm() {
        const firstNameInput = document.getElementById('first_name');
        const majorInput = document.getElementById('major');
        
        let isValid = true;
        
        // 이름 필드 검사
        if (!firstNameInput.value.trim()) {
            this.markFieldAsError(firstNameInput, '이름을 입력해주세요.');
            isValid = false;
        } else {
            this.clearFieldError(firstNameInput);
        }
        
        // 전공 필드 검사
        if (!majorInput.value.trim()) {
            this.markFieldAsError(majorInput, '전공을 입력해주세요.');
            isValid = false;
        } else {
            this.clearFieldError(majorInput);
        }
        
        return isValid;
    }

    markFieldAsError(field, message) {
        field.classList.add('error');
        
        // 기존 에러 메시지 제거
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 새 에러 메시지 추가
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorMsg = field.parentNode.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }

    /**
     * 폼 변경사항 확인
     */
    checkFormChanges() {
        const currentData = {
            first_name: document.getElementById('first_name').value.trim(),
            major: document.getElementById('major').value.trim(),
            specialization: document.getElementById('specialization').value.trim()
        };
        
        const hasChanges = 
            currentData.first_name !== (this.originalData.first_name || '') ||
            currentData.major !== (this.originalData.major || '') ||
            currentData.specialization !== (this.originalData.specialization || '');
        
        this.submitBtn.disabled = !hasChanges;
        this.restoreBtn.disabled = !hasChanges;
    }

    /**
     * 폼 복구 (원래 데이터로 되돌리기)
     */
    restoreForm() {
        this.populateForm(this.originalData);
        this.checkFormChanges();
        this.hideMessage();
        
        // 모든 에러 상태 제거
        const errorInputs = this.form.querySelectorAll('.error');
        errorInputs.forEach(input => this.clearFieldError(input));
    }

    /**
     * 제출 버튼 상태 업데이트
     */
    updateSubmitButton() {
        if (this.isSubmitting) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = `
                <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
                저장 중...
            `;
        } else {
            this.submitBtn.innerHTML = `
                <svg class="btn-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                저장하기
            `;
            this.checkFormChanges();
        }
    }

    /**
     * 로딩 상태 표시
     */
    showLoading(show) {
        if (show) {
            this.loadingElement.classList.add('show');
        } else {
            this.loadingElement.classList.remove('show');
        }
    }

    /**
     * 메시지 표시
     */
    showMessage(message, type = 'success') {
        this.messageElement.textContent = message;
        this.messageElement.className = `profile-message ${type} show`;
        
        // 5초 후 자동 숨김
        setTimeout(() => {
            this.hideMessage();
        }, 5000);
    }

    /**
     * 메시지 숨김
     */
    hideMessage() {
        this.messageElement.classList.remove('show');
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});

// 전역 에러 핸들러
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    const messageElement = document.getElementById('profile-message');
    if (messageElement) {
        messageElement.textContent = '예상치 못한 오류가 발생했습니다.';
        messageElement.className = 'profile-message error show';
    }
});