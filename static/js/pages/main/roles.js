// 역할 관리 페이지 JavaScript

// 전역 변수
let currentTeamId = null;
let currentAIResult = null; // AI 추천 결과를 저장할 변수 (수정된 형식에 맞게 사용)
let socket = null; // 웹소켓 객체를 저장할 변수

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('역할 관리 페이지 초기화');

    // URL에서 팀 ID 추출
    const pathParts = window.location.pathname.split('/');
    // /<team_id>/roles/ 형태에서 team_id 추출
    // pathParts[0]은 빈 문자열, pathParts[1]이 team_id
    currentTeamId = pathParts[1];

    setupEventListeners();
    connectWebSocket(); // ✨ 웹소켓 연결 시작
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

    loadLastAssignment();
});

// 페이지 초기화 (DOMContentLoaded에서 이미 처리되므로 중복될 수 있음)
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
    
    const aiAssignBtn = document.getElementById('team-ai-assign-btn');
    if (aiAssignBtn) {
        aiAssignBtn.addEventListener('click', function() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                // AI 배정 시작을 알리는 메시지를 보냅니다.
                socket.send(JSON.stringify({ type: 'start_ai_assignment' }));
                showNotification('AI 역할 배정을 시작합니다. 잠시만 기다려주세요.', 'info');
                this.disabled = true; // 버튼 비활성화
            } else {
                showNotification('서버와 연결이 끊겼습니다. 새로고침 해주세요.', 'error');
            }
        });
    }
    // AI 추천 폼
    const aiForm = document.getElementById('ai-recommendation-form');
    if (aiForm) {
        aiForm.addEventListener('submit', handleAISubmission);
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

// ✨ 웹소켓 연결 함수
function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/roles/${currentTeamId}/assignment/`;
    
    socket = new WebSocket(wsUrl);

    socket.onopen = function(e) {
        console.log("✅ 웹소켓 연결 성공");
    };

    // 서버로부터 메시지를 받았을 때
    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        console.log("WebSocket 메시지 수신:", data);

        if (data.type === 'submission_update') {
            updateSubmissionStatusUI(data.total_members, data.submitted_members);
        } else if (data.type === 'assignment_complete') {
            updateAllMemberRolesUI(data.assignments);
            showTeamAssignmentResults(data.assignments);
            showNotification('AI가 팀 전체 역할을 배정했습니다!', 'success');
        }
    };

    socket.onclose = function(e) {
        console.error("웹소켓 연결이 종료되었습니다. 페이지를 새로고침해주세요.");
        showNotification('실시간 연결이 끊겼습니다. 새로고침이 필요합니다.', 'error');
    };

    socket.onerror = function(err) {
        console.error('웹소켓 오류:', err);
    };
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
        // 선호 역할 체크박스 강제 갱신 (탭 전환 시 최신 반영)
        updateAllPreferredRoles();
    } else {
        // 역할이 없으면 빈 알림 표시
        showEmptyRolesInAITab();
    }
}

async function handleAISubmission(e) {
    e.preventDefault();

    hideAIResult();
    const existingBoxes = document.querySelectorAll('.ai-individual-result-box');
    existingBoxes.forEach(box => box.remove());
    
    const aiAssignBtn = document.getElementById('team-ai-assign-btn');
    if (aiAssignBtn) {
        aiAssignBtn.disabled = true; // AI 배정 버튼 비활성화
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'resubmitting' }));
    } else {
        showNotification('서버와 연결이 끊겼습니다. 새로고침 해주세요.', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const traits = formData.getAll('traits');
    const preferredRoles = formData.getAll('preferred_roles');
    const major = formData.get('major');

    if (traits.length === 0) {
        showNotification('성향을 하나 이상 선택해주세요.', 'error');
        return;
    }

    const submissionData = {
        major: major,
        traits: traits,
        preferences: preferredRoles
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(submissionData));
        showNotification('내 정보를 제출했습니다. 다른 팀원들을 기다려주세요.', 'info');
        // 제출 후 폼 비활성화
        e.target.querySelectorAll('input, button').forEach(el => el.disabled = true);
    } else {
        showNotification('서버와 연결이 끊겼습니다. 새로고침 해주세요.', 'error');
    }
}
const assignButton = document.getElementById('team-ai-assign-btn');
// ✨ 실시간 제출 현황 UI 업데이트

function updateSubmissionStatusUI(total, submitted) {
    const statusEl = document.getElementById('submission-status'); // HTML에 <div id="submission-status"></div> 필요
    if (statusEl) {
        statusEl.textContent = `제출 현황: ${submitted.length} / ${total}`;
    }

    if(submitted.length === total && total > 0) {
        assignButton.disabled = false;
    }

    const submittedListEl = document.getElementById('submitted-list'); // HTML에 <ul id="submitted-list"></ul> 필요
    if (submittedListEl) {
        const submittedNames = submitted.map(member => member.name).join(', ');
        submittedListEl.innerHTML = `<strong>제출한 팀원:</strong> ${submittedNames}`;
    }
}

// ✨ AI가 배정한 전체 역할을 UI에 반영하는 함수
function updateAllMemberRolesUI(assignments) {
    assignments.forEach(assignment => {
        const memberItem = Array.from(document.querySelectorAll('.member-assignment-item'))
                                .find(el => el.querySelector('.member-details h4').textContent.trim() === assignment.username);
        
        if (memberItem) {
            const roleSelect = memberItem.querySelector('.role-select');
            const roleOption = Array.from(roleSelect.options).find(opt => opt.textContent === assignment.assigned_role);
            
            if (roleOption) {
                roleSelect.value = roleOption.value;
                const assignedRoleEl = memberItem.querySelector('.assigned-role-display');
                if(assignedRoleEl) {
                    assignedRoleEl.textContent = assignment.assigned_role;
                    assignedRoleEl.classList.add('ai-assigned');
                }
            }
        }
    });
    // 모든 역할 할당 후, 팀원 현황 카드도 업데이트
    updateAllMemberStatusCards(assignments);
}

// ✨ 팀원 현황 카드 전체 업데이트
function updateAllMemberStatusCards(assignments) {
    assignments.forEach(assignment => {
        const memberCard = document.querySelector(`.member-status-card[data-user-name="${assignment.username}"]`);
        if (memberCard) {
            let roleEl = memberCard.querySelector('.assigned-role, .no-role');
            if (!roleEl) {
                roleEl = document.createElement('div');
                memberCard.appendChild(roleEl);
            }
            roleEl.className = 'assigned-role ai-assigned';
            roleEl.textContent = assignment.assigned_role;
        }
    });
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
    const preferredRoles = formData.getAll('preferred_roles'); // preferred_roles는 roleId 값
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
                'Content-Type': 'application/json; charset=UTF-8',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({
                major: major,
                traits: traits,
                preferred_roles: preferredRoles // ✅ 다시 활성화하여 백엔드로 전달
            })
        });

        const data = await response.json();

        if (response.ok) {
            // ✅ AI 결과 표시: 백엔드에서 반환하는 data 객체 전체를 전달
            showAIResult(data);
        } else {
            // AI API 오류 시 더미 결과 사용 (오류 메시지 포함)
            console.error('AI API 오류 응답:', data.error || response.statusText);
            const dummyResult = generateDummyAIResult(major, traits, preferredRoles);
            showAIResult(dummyResult);
            showNotification(data.error || 'AI 추천 중 오류가 발생했습니다.', 'error');
        }

    } catch (error) {
        console.error('AI 추천 요청 중 네트워크 오류:', error);
        // 오류 시에도 더미 결과 사용
        const dummyResult = generateDummyAIResult(major, traits, preferredRoles);
        showAIResult(dummyResult);
        showNotification('AI 추천 요청 중 네트워크 오류가 발생했습니다.', 'error');
    }
}

// // 더미 AI 결과 생성 (AI API 문제로 인한 임시 처리)
// function generateDummyAIResult(major, traits, preferredRoles) {
//     const roleNames = ['프론트엔드 개발자', '백엔드 개발자', 'UI/UX 디자이너', '프로젝트 매니저', '데이터 분석가', 'QA 엔지니어'];
//     const randomRole = roleNames[Math.floor(Math.random() * roleNames.length)];

//     const traitText = traits.join(', ');
//     const preferredText = preferredRoles.length > 0 ? `선호 역할: ${preferredRoles.join(', ')}` : '';

//     // ✅ 더미 결과도 백엔드 응답 형식에 맞게 수정
//     return {
//         recommended_role: randomRole,
//         reason: `${major} 전공자로서 ${traitText}한 성향을 보이는 당신에게 "${randomRole}" 역할을 추천합니다. ${preferredText} ${traitText}한 특성을 활용하여 팀 프로젝트에서 뛰어난 성과를 낼 수 있을 것입니다.`
//     };
// }

function generateDummyAIResult(major, traits, preferredRoles) {
  // DOM에서 현재 등록된 역할 목록 수집
  const items = [...document.querySelectorAll('.role-item')];
  const pool = items.map(it => ({
    id: it.dataset.roleId,
    name: it.querySelector('.role-name')?.textContent?.trim() || ''
  })).filter(r => r.id && r.name);

  const selected = pool.length ? pool[Math.floor(Math.random() * pool.length)] 
                               : { id: null, name: '임시 역할' };

  const traitText = traits.join(', ');
  const preferredText = preferredRoles.length > 0 ? `선호 역할 ID: ${preferredRoles.join(', ')}` : '';

  return {
    recommended_role_id: selected.id,
    recommended_role: selected.name,
    reason: `${major} 전공, ${traitText} 성향을 바탕으로 "${selected.name}"을(를) 추천합니다. ${preferredText}`
  };
}


// AI 결과 표시
function showAIResult(result) {
  const resultContainer = document.getElementById('ai-result');
  const resultContent = document.getElementById('ai-result-content');
  const recommendedRoleNameElement = document.getElementById('recommended-role-name');

  if (!resultContainer || !resultContent || !recommendedRoleNameElement) return;

  // 백엔드/더미 모두 호환
  const recommendedRole = result.recommended_role || result.role || '';
  const reason = result.reason || '추천 이유를 불러올 수 없습니다.';
  let roleId = result.recommended_role_id || result.role_id || null;

  // 화면의 등록된 역할 리스트에서 name으로 id 탐색 (id 없을 때)
  if (!roleId && recommendedRole) {
    roleId = getRoleIdByName(recommendedRole);
  }

  // 전역 저장 (accept에서 사용)
  currentAIResult = {
    id: roleId,
    name: recommendedRole,
    description: reason,
  };

  recommendedRoleNameElement.textContent = recommendedRole || '추천 역할';
  resultContent.textContent = reason;

  resultContainer.classList.remove('hidden');
  resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // 버튼 활성화 + 클릭 바인딩(한 번만)
  const acceptBtn = resultContainer.querySelector('.btn-accept-role');
  if (acceptBtn) {
    acceptBtn.disabled = false;
    acceptBtn.onclick = acceptAIRole; // 동적 DOM이라 여기서 직접 바인딩이 안전
  }
}

// 역할 이름으로 DOM에서 roleId 찾아오기
function getRoleIdByName(name) {
  const items = document.querySelectorAll('.role-item');
  for (const it of items) {
    const n = it.querySelector('.role-name')?.textContent?.trim();
    if (n === name) {
      return it.dataset.roleId || null;
    }
  }
  return null;
}


// // AI 역할 수락
// async function acceptAIRole() {
//     if (!currentAIResult || !currentAIResult.name) {
//         showNotification('추천 결과를 찾을 수 없습니다.', 'error');
//         return;
//     }

//     const roleName = currentAIResult.name;
//     const roleDescription = currentAIResult.description; // AI 추천 이유를 설명으로 사용

//     try {
//         // 1. 먼저 역할을 등록
//         const createResponse = await fetch(`/api/dashboard/${currentTeamId}/roles/create/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCsrfToken()
//             },
//             body: JSON.stringify({
//                 name: roleName,
//                 description: roleDescription, // 설명 필드 추가
//                 is_ai_generated: true
//             })
//         });

//         const createData = await createResponse.json();

//         if (!createResponse.ok) {
//             throw new Error(createData.error || '역할 등록 실패');
//         }

//         // 2. 현재 사용자에게 AI 추천 역할 할당
//         const assignResponse = await fetch(`/api/dashboard/${currentTeamId}/roles/assign/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCsrfToken()
//             },
//             body: JSON.stringify({
//                 user_id: window.currentUserId || getCurrentUserId(),
//                 role_id: createData.role.id,
//                 is_ai_assigned: true
//             })
//         });

//         const assignData = await assignResponse.json();

//         if (!assignResponse.ok) {
//             throw new Error(assignData.error || '역할 할당 실패');
//         }

//         showNotification(`AI 추천 역할이 수락되었습니다: ${roleName}`, 'success');

//         // 3. UI 업데이트
//         // 역할 목록에 추가
//         addRoleToList(createData.role);

//         // 팀원 현황 업데이트 (현재 사용자)
//         updateMemberStatus(window.currentUserId || getCurrentUserId(), assignData.assignment);

//         // 대시보드 팀 현황 업데이트
//         updateDashboardTeamStatus();

//         // AI 결과 숨기기
//         hideAIResult();

//     } catch (error) {
//         console.error('AI 역할 수락 오류:', error);
//         showNotification(error.message || 'AI 역할 수락 중 오류가 발생했습니다.', 'error');
//     }
// }

async function acceptAIRole() {
  // ▶ 누락된 id는 화면에서 다시 찾아본다
  if (!currentAIResult || (!currentAIResult.id && !currentAIResult.name)) {
    showNotification('추천 결과를 찾을 수 없습니다.', 'error');
    return;
  }
  if (!currentAIResult.id && currentAIResult.name) {
    currentAIResult.id = getRoleIdByName(currentAIResult.name);
  }
  if (!currentAIResult.id) {
    // 필요하면 여기서 "역할 자동 생성 → 그 id로 assign" 로직을 넣을 수도 있음
    showNotification('등록된 역할 목록에서 추천 역할을 찾을 수 없습니다. 역할을 먼저 등록하세요.', 'error');
    return;
  }

  const userId = window.currentUserId || getCurrentUserId();
  if (!userId) {
    showNotification('현재 사용자 정보를 찾을 수 없습니다.', 'error');
    return;
  }

  try {
    const assignResponse = await fetch(`/api/dashboard/${currentTeamId}/roles/assign/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        user_id: userId,
        role_id: currentAIResult.id,
        is_ai_assigned: true
      })
    });

    const assignData = await assignResponse.json();
    if (!assignResponse.ok || !assignData.assignment) {
      throw new Error(assignData.error || '역할 할당 실패');
    }

    showNotification(`AI 추천 역할이 수락되었습니다: ${currentAIResult.name}`, 'success');
    updateMemberStatus(userId, assignData.assignment);
    updateDashboardTeamStatus();
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
function showTeamAssignmentResults(assignments) {
    // 현재 로그인한 사용자 ID를 가져옵니다.
    const currentUserId = window.currentUserId || getCurrentUserId();
    
    // assignments 배열에서 현재 사용자의 배정 결과를 찾습니다.
    // user_id의 데이터 타입이 다를 수 있으므로 String()으로 변환하여 비교합니다.
    const currentUserAssignment = assignments.find(
        (a) => String(a.user_id) === String(currentUserId)
    );

    const resultContainer = document.getElementById('ai-result');
    const recommendedRoleNameElement = document.getElementById('recommended-role-name');
    const resultContent = document.getElementById('ai-result-content');

    if (currentUserAssignment) {
        localStorage.setItem('lastAssignment', JSON.stringify(currentUserAssignment));
        
        // AI 배정 결과가 있는 경우, HTML 요소를 업데이트합니다.
        recommendedRoleNameElement.textContent = `${currentUserAssignment.username}님에게 추천하는 역할: ${currentUserAssignment.assigned_role}`;
        resultContent.innerHTML = `<p><strong>추천 이유:</strong> ${currentUserAssignment.reason || '추천 이유를 불러올 수 없습니다.'}</p>`;
        
        // 결과 컨테이너를 보이게 합니다.
        resultContainer.classList.remove('hidden');
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } 
}

function loadLastAssignment() {
    // 'lastAssignment' 키로 저장된 데이터 가져오기
    const lastAssignmentString = localStorage.getItem('lastAssignment');

    if (lastAssignmentString) {
        // JSON 문자열을 다시 객체로 변환
        const lastAssignment = JSON.parse(lastAssignmentString);
        
        const resultContainer = document.getElementById('ai-result');
        const recommendedRoleNameElement = document.getElementById('recommended-role-name');
        const resultContent = document.getElementById('ai-result-content');
        
        // 저장된 데이터로 UI 업데이트
        recommendedRoleNameElement.textContent = `${lastAssignment.username}님에게 추천하는 역할: ${lastAssignment.assigned_role}`;
        resultContent.innerHTML = `<p><strong>추천 이유:</strong> ${lastAssignment.reason || '추천 이유를 불러올 수 없습니다.'}</p>`;
        
        // 결과 컨테이너를 보이게 함
        resultContainer.classList.remove('hidden');
        resultContainer.style.display = 'block';
    }
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
        description: formData.get('description') ? formData.get('description').trim() : '' // 설명 필드 다시 추가됨
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

            // AI 탭 상태 업데이트는 사용자가 AI 탭을 클릭할 때 처리
            // showAIFormAfterRoleCreation()은 addRoleToList 내부에서 호출되므로 여기서 제거
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
    let aiFormContainer = document.querySelector('.ai-form-container'); // let으로 변경
    const emptyNotice = document.querySelector('.empty-roles-notice');

    if (aiSection) {
        // 기존 AI 폼 제거 (존재한다면)
        if (aiFormContainer) {
            aiFormContainer.remove();
            aiFormContainer = null; // 제거 후 null로 설정
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

    if (aiSection) { // aiSection이 존재하는지 확인
        // 빈 알림 숨기기
        if (emptyNotice) {
            emptyNotice.style.display = 'none';
        }

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
                </div>
            `;

            aiSection.appendChild(aiFormContainer);

            // 새로운 폼에 이벤트 리스너 추가
            const newForm = aiFormContainer.querySelector('#ai-recommendation-form');
            if (newForm) {
                newForm.addEventListener('submit', handleAIRecommendation);
            }
        } else {
            // 이미 AI 폼 컨테이너가 있으면 다시 표시
            aiFormContainer.style.display = 'block';
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

    // 역할이 추가되면 AI 폼을 표시하도록 호출
    showAIFormAfterRoleCreation();
}

// 선호 역할 목록 업데이트 (개별 역할 추가 시 사용되지 않음, updateAllPreferredRoles로 대체됨)
// function updatePreferredRoles(role) {
//     const preferredRoles = document.querySelector('.preferred-roles');
//     if (preferredRoles) {
//         const checkboxItem = document.createElement('label');
//         checkboxItem.className = 'checkbox-item';
//         checkboxItem.innerHTML = `
//             <input type="checkbox" name="preferred_roles" value="${role.name}">
//             <span>${role.name}</span>
//         `;
//         preferredRoles.appendChild(checkboxItem);
//     }
// }

// 모든 선호 역할 체크박스 업데이트
function updateAllPreferredRoles() {
    // 템플릿/동적 생성 모두 지원: 두 컨테이너 동시 갱신
    const containers = [
        document.getElementById('preferred-roles'),
        document.getElementById('preferred-roles-container'),
    ].filter(Boolean);

    if (containers.length === 0) return;

    const roleItems = document.querySelectorAll('.role-item');

    containers.forEach(container => {
        // 기존 체크박스들 제거
        container.innerHTML = '';

        if (roleItems.length === 0) {
            container.innerHTML = '<p class="no-roles-message">등록된 역할이 없습니다. 먼저 역할을 등록해주세요.</p>';
            return;
        }

        // 등록된 역할들로 체크박스 재생성
        roleItems.forEach(item => {
            const roleNameElement = item.querySelector('.role-name');
            if (!roleNameElement) return;
            const roleName = roleNameElement.textContent.trim();
            const roleId = item.dataset.roleId;

            const checkboxWrapper = document.createElement('label');
            checkboxWrapper.className = 'checkbox-item';
            checkboxWrapper.innerHTML = `
                <input type="checkbox" name="preferred_roles" value="${roleId}">
                <span class="checkbox-label">${roleName}</span>
            `;

            container.appendChild(checkboxWrapper);
        });
    });
}


// 팀원 현황 업데이트
function updateMemberStatus(userId, assignment) {
    // 팀원 현황 카드 찾기 및 업데이트
    const memberCards = document.querySelectorAll('.member-status-card');
    memberCards.forEach(card => {
        // user_id를 기반으로 카드 찾기
        if (card.dataset.userId === userId.toString()) {
            let assignedRoleElement = card.querySelector('.assigned-role, .no-role, .multiple-roles');

            if (!assignedRoleElement) {
                // 기존 역할 표시 요소가 없으면 새로 생성
                assignedRoleElement = document.createElement('div');
                card.appendChild(assignedRoleElement);
            }

            // '역할 없음' 또는 null/undefined일 경우 '역할 미정'으로 표시
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