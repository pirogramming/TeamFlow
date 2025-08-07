// 역할 관리 페이지 JavaScript

// 전역 변수
let currentTeamId = null;
let currentAIResult = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('역할 관리 페이지 초기화');
    
    // URL에서 팀 ID 추출
    const pathParts = window.location.pathname.split('/');
    currentTeamId = pathParts[1]; // /9/roles/ 형태에서 9 추출
    
    setupEventListeners();
    
    // 기본적으로 AI 추천 탭 활성화
    switchTab('ai-recommend');
    
    // 등록된 역할이 있는지 확인하고 UI 상태 업데이트
    const roleItems = document.querySelectorAll('.role-item');
    if (roleItems.length > 0) {
        // 역할이 있으면 팀원 역할 지정 섹션 표시
        showTeamRoleAssignmentSection();
        // 선호 역할 체크박스 업데이트
        updateAllPreferredRoles();
        // 드롭다운 옵션 업데이트
        updateRoleSelectOptions();
    } else {
        // 역할이 없으면 AI 탭에 빈 상태 표시
        showEmptyRolesInAITab();
        hideTeamRoleAssignmentSection();
    }
});

// 페이지 초기화
function initializeRolesPage() {
    // 현재 팀 ID 가져오기
    const pathParts = window.location.pathname.split('/');
    currentTeamId = pathParts[1]; // /1/roles/ 형태에서 팀 ID 추출

    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 초기 탭 설정
    showTab('ai-recommend');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // AI 추천 폼
    const aiForm = document.getElementById('ai-recommendation-form');
    if (aiForm) {
        aiForm.addEventListener('submit', handleAIRecommendation);
    }

    // 모달 관련
    const roleModal = document.getElementById('role-modal');
    const closeModalBtn = document.getElementById('close-role-modal');
    const cancelBtn = document.getElementById('cancel-role');
    const roleForm = document.getElementById('role-form');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeRoleModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeRoleModal);
    }

    if (roleForm) {
        roleForm.addEventListener('submit', handleRoleCreation);
    }

    // 모달 외부 클릭 시 닫기
    if (roleModal) {
        roleModal.addEventListener('click', function(e) {
            if (e.target === roleModal) {
                closeRoleModal();
            }
        });
    }

    // AI 결과 버튼들
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-accept-role')) {
            acceptAIRole();
        }
    });
}

// 탭 전환
function switchTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(tabName);
    
    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    // AI 추천 탭으로 전환할 때 상태 업데이트
    if (tabName === 'ai-recommend') {
        updateAITabState();
    }
}

// AI 추천 탭 상태 업데이트
function updateAITabState() {
    const roleItems = document.querySelectorAll('.role-item');
    const hasRoles = roleItems.length > 0;
    
    if (hasRoles) {
        // 역할이 있으면 빈 알림 숨기고 AI 폼 표시
        hideEmptyRolesInAITab();
    } else {
        // 역할이 없으면 빈 알림 표시
        showEmptyRolesInAITab();
    }
}

// 탭 표시
function showTab(tabName) {
    switchTab(tabName);
}

// AI 추천 처리
async function handleAIRecommendation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const traits = formData.getAll('traits');
    const preferredRoles = formData.getAll('preferred_roles');
    const major = formData.get('major');
    
    if (traits.length === 0) {
        showNotification('성향을 하나 이상 선택해주세요.', 'error');
        return;
    }
    
    try {
        // AI 추천 요청
        const response = await fetch('/roles/ai-recommend-role/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                major: major,
                traits: traits,
                preferred_roles: preferredRoles
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // AI 결과 표시
            showAIResult(data.recommendation);
        } else {
            // AI API 오류 시 더미 결과 사용
            const dummyResult = generateDummyAIResult(major, traits, preferredRoles);
            showAIResult(dummyResult);
        }
        
    } catch (error) {
        console.error('AI 추천 오류:', error);
        // 오류 시에도 더미 결과 사용
        const dummyResult = generateDummyAIResult(major, traits, preferredRoles);
        showAIResult(dummyResult);
    }
}

// 더미 AI 결과 생성 (AI API 문제로 인한 임시 처리)
function generateDummyAIResult(major, traits, preferredRoles) {
    const roleNames = ['프론트엔드 개발자', '백엔드 개발자', 'UI/UX 디자이너', '프로젝트 매니저', '데이터 분석가', 'QA 엔지니어'];
    const randomRole = roleNames[Math.floor(Math.random() * roleNames.length)];
    
    const traitText = traits.join(', ');
    const preferredText = preferredRoles.length > 0 ? `선호 역할: ${preferredRoles.join(', ')}` : '';
    
    return {
        role_name: randomRole,
        description: `${major} 전공자로서 ${traitText}한 성향을 보이는 당신에게 "${randomRole}" 역할을 추천합니다. ${preferredText} ${traitText}한 특성을 활용하여 팀 프로젝트에서 뛰어난 성과를 낼 수 있을 것입니다.`
    };
}

// AI 결과 표시
function showAIResult(result) {
    const resultContainer = document.getElementById('ai-result');
    const resultContent = document.getElementById('ai-result-content');
    const recommendedRoleName = document.getElementById('recommended-role-name');
    
    if (resultContainer && resultContent && recommendedRoleName) {
        // 결과 내용 설정
        if (typeof result === 'string') {
            // 문자열 형태의 결과 처리
            const roleMatch = result.match(/추천 역할:\s*([^\n]+)/);
            const roleName = roleMatch ? roleMatch[1].trim() : '추천 역할';
            const description = result.replace(/추천 역할:\s*[^\n]+\n?/, '').trim();
            
            recommendedRoleName.textContent = roleName;
            resultContent.textContent = description;
        } else {
            // 객체 형태의 결과 처리
            recommendedRoleName.textContent = result.role_name || '추천 역할';
            resultContent.textContent = result.description || result;
        }
        
        // 결과 컨테이너 표시
        resultContainer.classList.remove('hidden');
        
        // 스크롤을 결과로 이동
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// AI 역할 수락
async function acceptAIRole() {
    const aiResult = document.getElementById('ai-result-content');
    const recommendedRoleName = document.getElementById('recommended-role-name');
    
    if (!aiResult || !recommendedRoleName) {
        showNotification('추천 결과를 찾을 수 없습니다.', 'error');
        return;
    }

    const roleName = recommendedRoleName.textContent.trim();
    const roleDescription = aiResult.textContent.trim();
    
    try {
        // 1. 먼저 역할을 등록
        const createResponse = await fetch(`/api/dashboard/${currentTeamId}/roles/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                name: roleName,
                description: roleDescription,
                is_ai_generated: true
            })
        });

        const createData = await createResponse.json();
        
        if (!createResponse.ok) {
            throw new Error(createData.error || '역할 등록 실패');
        }

        // 2. 현재 사용자에게 AI 추천 역할 할당
        const assignResponse = await fetch(`/api/dashboard/${currentTeamId}/roles/assign/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                user_id: window.currentUserId || getCurrentUserId(),
                role_id: createData.role.id,
                is_ai_assigned: true
            })
        });

        const assignData = await assignResponse.json();
        
        if (!assignResponse.ok) {
            throw new Error(assignData.error || '역할 할당 실패');
        }

        showNotification(`AI 추천 역할이 수락되었습니다: ${roleName}`, 'success');
        
        // 3. UI 업데이트
        // 역할 목록에 추가
        addRoleToList(createData.role);
        
        // 팀원 현황 업데이트 (현재 사용자)
        updateMemberStatus(window.currentUserId || getCurrentUserId(), assignData.assignment);
        
        // 대시보드 팀 현황 업데이트
        updateDashboardTeamStatus();
        
        // AI 결과 숨기기
        hideAIResult();
        
    } catch (error) {
        console.error('AI 역할 수락 오류:', error);
        showNotification(error.message || 'AI 역할 수락 중 오류가 발생했습니다.', 'error');
    }
}

// AI 결과 숨기기
function hideAIResult() {
    const resultContainer = document.getElementById('ai-result');
    if (resultContainer) {
        resultContainer.classList.add('hidden');
    }
}

// 현재 사용자 ID 가져오기
function getCurrentUserId() {
    // 메타 태그나 전역 변수에서 사용자 ID 가져오기
    const userIdMeta = document.querySelector('meta[name="user-id"]');
    if (userIdMeta) {
        return parseInt(userIdMeta.getAttribute('content'));
    }
    
    // 팀원 목록에서 현재 사용자 찾기 (fallback)
    const memberItems = document.querySelectorAll('.member-assignment-item');
    for (let item of memberItems) {
        const userId = item.dataset.userId;
        if (userId) {
            return parseInt(userId);
        }
    }
    
    return null;
}

// 역할 등록 모달 열기
function openRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // 폼 초기화
        const form = document.getElementById('role-form');
        if (form) {
            form.reset();
        }
        
        // 첫 번째 입력 필드에 포커스
        const nameInput = document.getElementById('role-name');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }
}

// 역할 등록 모달 닫기
function closeRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 역할 생성 처리
async function handleRoleCreation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const roleData = {
        name: formData.get('name').trim(),
        description: '' // 설명 필드 제거됨
    };
    
    if (!roleData.name) {
        showNotification('역할명을 입력해주세요.', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/dashboard/${currentTeamId}/roles/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(roleData)
        });

        const data = await response.json();
        
        if (response.ok) {
            showNotification('새 역할이 등록되었습니다!', 'success');
            closeRoleModal();
            
            // 역할 목록 업데이트 (새로고침 없이)
            addRoleToList(data.role);
            
            // 직접입력 탭 유지 - 자동 전환 제거
            // switchTab('ai-recommend'); // 제거됨
            
            // AI 탭 상태 업데이트는 사용자가 AI 탭을 클릭할 때 처리
            // hideEmptyRolesInAITab(); // 제거됨
            
        } else {
            throw new Error(data.error || '역할 등록 실패');
        }
        
    } catch (error) {
        console.error('역할 생성 오류:', error);
        showNotification(error.message || '역할 등록 중 오류가 발생했습니다.', 'error');
    }
}

// 역할 삭제
async function deleteRole(roleId) {
    if (!confirm('이 역할을 삭제하시겠습니까?\n할당된 팀원의 역할이 미정으로 변경됩니다.')) {
        return;
    }

    try {
        const response = await fetch(`/api/dashboard/${currentTeamId}/roles/${roleId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            showNotification('역할이 삭제되었습니다.', 'success');
            
            // 1. 역할 목록에서 제거
            const roleItem = document.querySelector(`[data-role-id="${roleId}"]`);
            if (roleItem) {
                roleItem.remove();
            }
            
            // 2. 해당 역할이 할당된 팀원들을 미정으로 변경
            updateMembersWithDeletedRole(roleId);
            
            // 3. 빈 상태 확인 및 처리
            const rolesList = document.getElementById('roles-list');
            if (rolesList && rolesList.children.length === 0) {
                rolesList.innerHTML = '<div class="empty-roles"><p>등록된 역할이 없습니다.</p></div>';
                
                // AI 추천 탭도 빈 상태로 변경 (AI 탭이 활성화된 경우에만)
                const aiTab = document.getElementById('ai-recommend');
                if (aiTab && aiTab.classList.contains('active')) {
                    showEmptyRolesInAITab();
                }
                
                // 팀원 역할 지정 섹션 숨기기
                hideTeamRoleAssignmentSection();
            } else {
                // 4. 드롭다운 옵션 업데이트
                updateRoleSelectOptions();
            }
            
            // 5. 선호 역할에서도 제거
            updateAllPreferredRoles();
            
            // 6. 대시보드 팀 현황 업데이트
            updateDashboardTeamStatus();
            
        } else {
            throw new Error(data.error || '역할 삭제 실패');
        }
        
    } catch (error) {
        console.error('역할 삭제 오류:', error);
        showNotification('역할 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 삭제된 역할이 할당된 팀원들을 미정으로 변경
function updateMembersWithDeletedRole(deletedRoleId) {
    // 팀원 현황 카드들 업데이트
    const memberCards = document.querySelectorAll('.member-status-card');
    memberCards.forEach(card => {
        const assignedRoleElement = card.querySelector('.assigned-role, .multiple-roles');
        if (assignedRoleElement && assignedRoleElement.dataset.roleId === deletedRoleId.toString()) {
            // 역할을 미정으로 변경
            const noRoleElement = document.createElement('div');
            noRoleElement.className = 'no-role';
            noRoleElement.textContent = '역할 미정';
            assignedRoleElement.replaceWith(noRoleElement);
        }
    });
    
    // 역할 지정 드롭다운들 초기화
    const roleSelects = document.querySelectorAll('.role-select');
    roleSelects.forEach(select => {
        if (select.value === deletedRoleId.toString()) {
            select.value = '';
        }
    });
}

// AI 추천 탭에 빈 역할 알림 표시
function showEmptyRolesInAITab() {
    const aiSection = document.querySelector('#ai-recommend .ai-section');
    const aiFormContainer = document.querySelector('.ai-form-container');
    const emptyNotice = document.querySelector('.empty-roles-notice');
    
    if (aiSection) {
        // 기존 AI 폼 제거
        if (aiFormContainer) {
            aiFormContainer.remove();
        }
        
        // 빈 역할 알림이 없으면 생성
        if (!emptyNotice) {
            const emptyNoticeHTML = `
                <div class="empty-roles-notice">
                    <div class="empty-icon">⚠️</div>
                    <h3>등록한 역할이 없어요</h3>
                    <p>AI 역할 추천을 받기 전에 먼저 역할을 등록해주세요</p>
                    <button class="btn-go-to-direct" onclick="switchTab('direct-input')">
                        <span>역할 등록하러 가기</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>
            `;
            aiSection.insertAdjacentHTML('beforeend', emptyNoticeHTML);
        } else {
            // 이미 있는 빈 역할 알림 표시
            emptyNotice.style.display = 'block';
        }
    }
}

// AI 추천 탭의 빈 역할 알림 숨기기 및 AI 폼 표시
function hideEmptyRolesInAITab() {
    const emptyNotice = document.querySelector('.empty-roles-notice');
    if (emptyNotice) {
        emptyNotice.style.display = 'none';
        // AI 폼 컨테이너 생성 및 표시
        showAIFormAfterRoleCreation();
    }
}

// 역할 등록 후 AI 폼 표시
function showAIFormAfterRoleCreation() {
    const aiSection = document.querySelector('.ai-section');
    const emptyNotice = document.querySelector('.empty-roles-notice');
    
    if (emptyNotice && aiSection) {
        // 빈 알림 숨기기
        emptyNotice.style.display = 'none';
        
        // AI 폼 컨테이너가 없으면 생성
        let aiFormContainer = document.querySelector('.ai-form-container');
        if (!aiFormContainer) {
            aiFormContainer = document.createElement('div');
            aiFormContainer.className = 'ai-form-container';
            aiFormContainer.innerHTML = `
                <form id="ai-recommendation-form">
                    <div class="form-group">
                        <label>전공</label>
                        <input type="text" id="major" value="${document.getElementById('major')?.value || ''}" readonly>
                    </div>

                    <div class="form-group">
                        <label>성향 (중복 선택 가능) <span class="required">*</span></label>
                        <div class="checkbox-grid">
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="분석적">
                                <span>분석적</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="창의적">
                                <span>창의적</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="체계적">
                                <span>체계적</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="소통형">
                                <span>소통형</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="리더십">
                                <span>리더십</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="꼼꼼함">
                                <span>꼼꼼함</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="적극적">
                                <span>적극적</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" name="traits" value="신중함">
                                <span>신중함</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>선호 역할 (팀에서 등록된 역할, 선택사항)</label>
                        <div class="preferred-roles" id="preferred-roles-container">
                            <!-- 동적으로 추가됨 -->
                        </div>
                    </div>

                    <button type="submit" class="btn-ai-analyze">
                        <span>AI 역할 분석 시작</span>
                    </button>
                </form>

                <div id="ai-result" class="ai-result-container hidden">
                    <div class="result-header">
                        <h3>AI 추천 결과</h3>
                        <div class="recommended-role-name" id="recommended-role-name"></div>
                    </div>
                    <div id="ai-result-content" class="result-content"></div>
                    <div class="result-actions">
                        <button class="btn-accept-role">추천 역할 수락</button>
                    </div>
                </div>
            `;
            
            aiSection.appendChild(aiFormContainer);
            
            // 새로운 폼에 이벤트 리스너 추가
            const newForm = aiFormContainer.querySelector('#ai-recommendation-form');
            if (newForm) {
                newForm.addEventListener('submit', handleAIRecommendation);
            }
        }
        
        // 선호 역할 목록 업데이트
        updateAllPreferredRoles();
    }
}

// 역할 리스트에 새 역할 추가 (새로고침 없이)
function addRoleToList(role) {
    const rolesList = document.getElementById('roles-list');
    
    // 빈 상태 메시지 제거
    const emptyMessage = rolesList.querySelector('.empty-roles');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // 새 역할 아이템 생성
    const roleItem = document.createElement('div');
    roleItem.className = 'role-item';
    roleItem.dataset.roleId = role.id;
    roleItem.innerHTML = `
        <span class="role-name">${role.name}</span>
        <button class="role-delete-btn" onclick="deleteRole(${role.id})" title="역할 삭제">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
        </button>
    `;
    
    rolesList.appendChild(roleItem);
    
    // 선호 역할 체크박스 업데이트
    updateAllPreferredRoles();
    
    // 드롭다운 옵션 업데이트
    updateRoleSelectOptions();
    
    // 팀원 역할 지정 섹션 표시
    showTeamRoleAssignmentSection();
}

// 선호 역할 목록 업데이트
function updatePreferredRoles(role) {
    const preferredRoles = document.querySelector('.preferred-roles');
    if (preferredRoles) {
        const checkboxItem = document.createElement('label');
        checkboxItem.className = 'checkbox-item';
        checkboxItem.innerHTML = `
            <input type="checkbox" name="preferred_roles" value="${role.name}">
            <span>${role.name}</span>
        `;
        preferredRoles.appendChild(checkboxItem);
    }
}

// 모든 선호 역할 체크박스 업데이트
function updateAllPreferredRoles() {
    const preferredRolesContainer = document.getElementById('preferred-roles');
    if (!preferredRolesContainer) return;
    
    // 기존 체크박스들 제거
    preferredRolesContainer.innerHTML = '';
    
    // 등록된 역할들로 체크박스 재생성
    const roleItems = document.querySelectorAll('.role-item');
    roleItems.forEach(item => {
        const roleName = item.querySelector('.role-name').textContent;
        const roleId = item.dataset.roleId;
        
        const checkboxWrapper = document.createElement('label');
        checkboxWrapper.className = 'checkbox-item';
        checkboxWrapper.innerHTML = `
            <input type="checkbox" name="preferred_roles" value="${roleId}">
            <span class="checkbox-label">${roleName}</span>
        `;
        
        preferredRolesContainer.appendChild(checkboxWrapper);
    });
    
    // 역할이 없으면 안내 메시지 표시
    if (roleItems.length === 0) {
        preferredRolesContainer.innerHTML = '<p class="no-roles-message">등록된 역할이 없습니다. 먼저 역할을 등록해주세요.</p>';
    }
}





// 팀원 현황 업데이트
function updateMemberStatus(userId, assignment) {
    // 팀원 현황 카드 찾기 및 업데이트
    const memberCards = document.querySelectorAll('.member-status-card');
    memberCards.forEach(card => {
        const memberName = card.querySelector('h4').textContent.trim();
        const assignmentUserName = assignment.user || '';
        
        if (memberName === assignmentUserName || card.dataset.userId === userId.toString()) {
            let assignedRoleElement = card.querySelector('.assigned-role, .no-role, .multiple-roles');
            
            if (!assignedRoleElement) {
                // 기존 역할 표시 요소가 없으면 새로 생성
                assignedRoleElement = document.createElement('div');
                card.appendChild(assignedRoleElement);
            }
            
            if (assignment.role && assignment.role !== '역할 없음') {
                assignedRoleElement.className = `assigned-role ${assignment.is_ai_assigned ? 'ai-assigned' : ''}`;
                assignedRoleElement.dataset.roleId = assignment.role_id || ''; // role ID 저장
                assignedRoleElement.innerHTML = `
                    ${assignment.role}
                    ${assignment.is_ai_assigned ? '<small>(AI 추천)</small>' : ''}
                `;
            } else {
                assignedRoleElement.className = 'no-role';
                assignedRoleElement.textContent = '역할 미정';
                delete assignedRoleElement.dataset.roleId; // role ID 제거
            }
            
            // 팀장인 경우 팀장 표시도 유지 (팀장 = team.owner)
            const teamRole = card.querySelector('.team-role');
            if (teamRole && teamRole.textContent.includes('팀장')) {
                // 팀장 + 할당된 역할 표시
                if (assignment.role && assignment.role !== '역할 없음') {
                    assignedRoleElement.innerHTML = `
                        <span class="leader-role">팀장</span>
                        <span class="assigned-role-name">${assignment.role}</span>
                        ${assignment.is_ai_assigned ? '<small>(AI 추천)</small>' : ''}
                    `;
                    assignedRoleElement.className = `multiple-roles ${assignment.is_ai_assigned ? 'ai-assigned' : ''}`;
                    assignedRoleElement.dataset.roleId = assignment.role_id || ''; // role ID 저장
                }
            }
        }
    });
}

// 역할 할당
async function assignRole(userId) {
    const roleSelect = document.querySelector(`select[data-user-id="${userId}"]`);
    const roleId = roleSelect.value;
    
    if (!roleId) {
        showNotification('역할을 선택해주세요.', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/dashboard/${currentTeamId}/roles/assign/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                user_id: userId,
                role_id: roleId,
                is_ai_assigned: false
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            showNotification(`역할이 할당되었습니다: ${data.assignment.role}`, 'success');
            
            // 팀원 현황 업데이트
            updateMemberStatus(userId, data.assignment);
            
            // 대시보드 팀 현황도 업데이트
            updateDashboardTeamStatus();
            
        } else {
            throw new Error(data.error || '역할 할당 실패');
        }
        
    } catch (error) {
        console.error('역할 할당 오류:', error);
        showNotification(error.message || '역할 할당 중 오류가 발생했습니다.', 'error');
    }
}

// 대시보드 팀 현황 업데이트
async function updateDashboardTeamStatus() {
    try {
        // 현재 페이지가 대시보드인 경우에만 업데이트
        if (window.location.pathname === '/dashboard/') {
            // 대시보드의 loadDashboardData 함수가 있다면 호출
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }
    } catch (error) {
        console.error('대시보드 업데이트 오류:', error);
    }
}

// CSRF 토큰 가져오기
function getCsrfToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));
    return cookieValue ? cookieValue.split('=')[1] : '';
}

// 알림 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // 타입별 배경색
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 표시
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 전역 함수로 노출 (HTML에서 호출용)
window.switchTab = switchTab;
window.openRoleModal = openRoleModal;
window.assignRole = assignRole;
window.deleteRole = deleteRole;

// 팀원 역할 지정 섹션 숨기기
function hideTeamRoleAssignmentSection() {
    const assignmentSection = document.getElementById('team-role-assignment');
    if (assignmentSection) {
        assignmentSection.style.display = 'none';
    }
}

// 팀원 역할 지정 섹션 표시
function showTeamRoleAssignmentSection() {
    const assignmentSection = document.getElementById('team-role-assignment');
    if (assignmentSection) {
        assignmentSection.style.display = 'block';
    }
}

// 역할 선택 드롭다운 옵션 업데이트
function updateRoleSelectOptions() {
    const roleSelects = document.querySelectorAll('.role-select');
    const roleItems = document.querySelectorAll('.role-item');
    
    roleSelects.forEach(select => {
        // 기존 옵션 제거 (첫 번째 "역할 선택" 옵션 제외)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // 현재 역할들로 옵션 재생성
        roleItems.forEach(item => {
            const roleName = item.querySelector('.role-name').textContent;
            const roleId = item.dataset.roleId;
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = roleName;
            select.appendChild(option);
        });
    });
}



