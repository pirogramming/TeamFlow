// 작업 관리 JavaScript

// PATCH: 전역 단일 소스
window.currentTeamId ??= null;

// 팀 변경 이벤트 수신 (한 번만)
window.addEventListener('team:changed', (e) => {
  const { teamId, teamName } = e.detail || {};
  if (!teamId) return;
  window.currentTeamId = String(teamId);

  // 대시보드 tasks 페이지라면 URL도 정규화
  const newUrl = `/api/dashboard/${window.currentTeamId}/tasks/`;
  if (window.location.pathname.startsWith('/api/dashboard/') && window.location.pathname !== newUrl) {
    history.replaceState({}, '', newUrl);
  }

  if (typeof loadTasks === 'function') loadTasks();
});

// teamId 확보 헬퍼 (header가 세팅할 시간 대기 → 최후엔 세션 조회)
async function getTeamId() {
  for (let i = 0; i < 20; i++) { // 최대 2초 대기
    if (window.currentTeamId) return window.currentTeamId;
    await new Promise(r => setTimeout(r, 100));
  }
  try {
    const r = await fetch('/api/teams/current/', { credentials: 'same-origin' });
    if (r.ok) {
      const j = await r.json();
      if (j?.success && j?.team?.id) {
        window.currentTeamId = j.team.id;
        return window.currentTeamId;
      }
    }
  } catch {}
  return null;
}

document.addEventListener('DOMContentLoaded', async function() {
    // 전역 변수
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const taskTypeSelect = document.getElementById('task-type');
    const assigneeGroup = document.getElementById('assignee-group');

    // 현재 팀 ID 가져오기 (URL 시도 후 세션 보완)
    const fromUrl = window.location.pathname.split('/')[3];  // /api/dashboard/{team_id}/tasks/
    if (fromUrl && /^\d+$/.test(fromUrl)) window.currentTeamId = fromUrl;
    const readyId = await getTeamId();
    if (!readyId) {
        showNotification('팀 정보가 없습니다. 팀을 먼저 선택하세요.', 'error');
        return;
    }

    await loadTasks();

    // 탭 전환
    const tabs = document.querySelectorAll('.task-tab');
    const taskSections = document.querySelectorAll('.task-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 활성 탭 변경
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 작업 목록 전환
            const targetTab = tab.dataset.tab;
            taskSections.forEach(section => {
                section.classList.add('hidden');
                if (section.id === `${targetTab}-tasks`) {
                    section.classList.remove('hidden');
                }
            });
        });
    });

    // 모달 열기
    function openModal(isEdit = false, taskData = null) {
        if (!isEdit) {
            taskForm.reset();
            document.querySelector('.modal-header h2').textContent = '새 작업 추가';
            document.querySelector('button[type="submit"]').textContent = '추가';
        } else {
            // 수정 모드
            document.querySelector('.modal-header h2').textContent = '작업 수정';
            document.querySelector('button[type="submit"]').textContent = '수정';
            
            // 폼에 데이터 채우기
            if (taskData) {
                document.getElementById('task-name').value = taskData.name || '';
                document.getElementById('task-type').value = taskData.type || 'team';
                document.getElementById('task-due-date').value = taskData.due_date
                    ? new Date(taskData.due_date).toISOString().split('T')[0]
                    : '';

                document.getElementById('task-description').value = taskData.description || '';
                
                // 다중 담당자 체크 반영
                if (Array.isArray(taskData.assignees)) {
                    taskData.assignees.forEach(id => {
                        const cb = document.querySelector(`input[name="assignee"][value="${id}"]`);
                        if (cb) cb.checked = true;
                    });
                } else if (taskData.assignee) {
                    const cb = document.querySelector(`input[name="assignee"][value="${taskData.assignee}"]`);
                    if (cb) cb.checked = true;
                }

            }
        }
        
        updateAssigneeVisibility();
        taskModal.classList.remove('hidden');
        document.getElementById('task-name').focus();
    }

    // 모달 닫기
    function closeModal() {
        taskModal.classList.add('hidden');
        taskForm.reset();
        taskForm.removeAttribute('data-task-id');
    }

    // 작업 유형에 따른 담당자 필드 표시/숨김
    function updateAssigneeVisibility() {
        if (taskTypeSelect.value === 'team') {
            assigneeGroup.style.display = 'block';
        } else {
            assigneeGroup.style.display = 'none';
        }
    }

    // 이벤트 리스너
    addTaskBtn?.addEventListener('click', () => openModal(false));
    closeModalBtn?.addEventListener('click', closeModal);
    cancelTaskBtn?.addEventListener('click', closeModal);
    taskTypeSelect?.addEventListener('change', updateAssigneeVisibility);

    // 모달 배경 클릭 시 닫기
    taskModal?.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeModal();
        }
    });

    // 작업 수정 버튼 클릭
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.task-edit')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = taskItem.dataset.taskId;

            try {
                const response = await fetch(`/api/dashboard/${window.currentTeamId}/tasks/${taskId}/`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    }
                });

                if (response.status === 204) {
                    await loadTasks(); // 내용 없음이면 목록 리프레시
                    return;
                } else if (response.ok) {
                    const taskData = await response.json();
                    taskForm.setAttribute('data-task-id', taskId);
                    openModal(true, taskData);
                } else {
                    throw new Error('작업 정보 가져오기 실패');
                }
            } catch (error) {
                console.error('작업 정보 가져오기 중 오류:', error);
                showNotification('작업 정보를 가져오는데 실패했습니다.', 'error');
            }
        }
    });

    // 작업 체크박스 토글 (위임: 한 군데만)
    document.addEventListener('click', async (e) => {
        const checkbox = e.target.closest('.task-checkbox');
        if (!checkbox) return;

        const taskItem = checkbox.closest('.task-item');
        const taskId = taskItem.dataset.taskId;

        const isCompleted = checkbox.classList.contains('checked');
        const newStatus = isCompleted ? 'pending' : 'completed';

        try {
            const response = await fetch(`/api/dashboard/${window.currentTeamId}/tasks/${taskId}/update/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('업데이트 실패');

            // 서버 반영된 상태로 목록 다시 불러오기
            await loadTasks();

        } catch (error) {
            console.error('체크박스 상태 업데이트 오류:', error);
            showNotification('작업 상태 변경 실패', 'error');
        }
    });

    // 작업 삭제 (위임)
    document.addEventListener('click', async (e) => {
        if (!e.target.closest('.task-delete')) return;

        const taskItem = e.target.closest('.task-item');
        const taskId = taskItem.dataset.taskId;

        if (!confirm('이 작업을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/dashboard/${window.currentTeamId}/tasks/${taskId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });

            if (response.status === 204 || response.ok) {
                taskItem.remove();
                showNotification('작업이 삭제되었습니다.', 'success');
                setTimeout(() => loadTasks(), 300);
            } else {
                throw new Error('작업 삭제 실패');
            }

        } catch (error) {
            console.error('작업 삭제 중 오류:', error);
            showNotification('작업 삭제에 실패했습니다.', 'error');
        }
    });

    // 작업 추가/수정
    taskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(taskForm);
        const taskData = Object.fromEntries(formData.entries());
        const isEdit = taskForm.hasAttribute('data-task-id');
        const taskId = taskForm.getAttribute('data-task-id');

        // 연도(마감일) 유효성: 비어있으면 경고 후 중단
        const dueDate = (taskData.due_date || '').trim();
        if (!dueDate) {
            showNotification('연도를 선택해주세요.', 'error');
            return;
        }

        if (taskData.type === 'team') {
            // 체크된 담당자 모두 수집 → assignees 배열로 전송 (백엔드 M2M)
            const assigneeCheckboxes = document.querySelectorAll('input[name="assignee"]:checked');
            const selectedIds = Array.from(assigneeCheckboxes).map(cb => parseInt(cb.value));
            taskData.assignees = selectedIds;
            // 호환성: 단일 assignee 필드도 첫 번째 값만 동반 전송
            taskData.assignee = selectedIds[0] || null;
        } else {
            const currentUserId = window.currentUserId; // 전역 변수에서 ID 가져오기
            taskData.assignee = parseInt(currentUserId);
            taskData.assignees = [parseInt(currentUserId)];
        }

        try {
            const url = isEdit 
                ? `/api/dashboard/${window.currentTeamId}/tasks/${taskId}/update/`
                : `/api/dashboard/${window.currentTeamId}/tasks/create/`;
            
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify(taskData)
            });

            if (response.status === 204) {
                closeModal();
                showNotification(isEdit ? '작업이 수정되었습니다.' : '새 작업이 추가되었습니다.', 'success');
                await loadTasks();
            } else if (response.ok) {
                try { await response.json(); } catch {}
                closeModal();
                const message = isEdit ? '작업이 수정되었습니다.' : '새 작업이 추가되었습니다.';
                showNotification(message, 'success');
                await loadTasks();
            } else {
                let errorData = null;
                try { errorData = await response.json(); } catch {}
                console.error('서버 오류:', errorData || response.status);
                showNotification(isEdit ? '작업 수정 실패' : '작업 추가 실패', 'error');
            }

        } catch (error) {
            console.error('작업 처리 중 오류:', error);
            const message = isEdit ? '작업 수정에 실패했습니다.' : '작업 추가에 실패했습니다.';
            showNotification(message, 'error');
        }
    });

    // 작업 편집 (전역 노출용으로 아래에서 window에 붙임)
    async function editTask(taskId) {
        const taskForm = document.getElementById('task-form');
        try {
            const response = await fetch(`/api/dashboard/${window.currentTeamId}/tasks/${taskId}/`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });

            if (!response.ok) throw new Error('작업 정보 가져오기 실패');

            const taskData = await response.json();
            taskForm.setAttribute('data-task-id', taskId);
            openModal(true, taskData);

        } catch (error) {
            console.error('작업 편집 오류:', error);
            showNotification('작업 정보를 가져오는데 실패했습니다.', 'error');
        }
    }

    // 전역 export (onclick 대응)
    window.editTask = editTask;
});

// CSRF 토큰 가져오기
function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // 스타일 적용
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);

    // 3초 후 제거
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 알림 애니메이션
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;
document.head.appendChild(style);

async function loadTasks() {
    try {
        const response = await fetch(`/api/dashboard/${window.currentTeamId}/tasks/list/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCsrfToken()
            }
        });

        if (!response.ok) throw new Error('작업 불러오기 실패');

        const data = await response.json();

        renderTaskList('team', data.team_tasks);
        renderTaskList('personal', data.personal_tasks);

    } catch (error) {
        console.error('작업 목록 갱신 오류:', error);
        showNotification('작업 목록 갱신 실패', 'error');
    }
}

function renderTaskList(type, tasks) {
    const container = document.querySelector(`#${type}-tasks .task-list`);
    container.innerHTML = ''; // 기존 목록 비우기

    if (!tasks.length) {
        container.innerHTML = `<div class="empty-state"><p>${type === 'team' ? '팀 작업이 없습니다.' : '개인 작업이 없습니다.'}</p></div>`;
        return;
    }

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.dataset.taskId = task.id;

        // 담당자 이름 표시 (다중 우선, 단일 호환)
        const names = Array.isArray(task.assignees_names) && task.assignees_names.length
            ? task.assignees_names.join(', ')
            : (task.assignee_name || '미정');

        taskItem.innerHTML = `
            <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" data-task-id="${task.id}"></div>
            <div class="task-content">
                <div class="task-header">
                    <span class="task-name ${task.status === 'completed' ? 'completed' : ''}">${task.name}</span>
                    <div class="task-meta">
                        ${task.is_deadline_imminent ? '<span class="task-badge">마감 임박</span>' : ''}
                    </div>
                </div>
                <div class="task-details">
                    <span class="task-assignee">
                        담당자: ${names}
                    </span>
                    ${task.due_date 
                        ? `<span class="task-separator">•</span><span class="task-due-date">${task.due_date}</span>` 
                        : ''}
                </div>

                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="task-edit" onclick="editTask(${task.id})" title="수정">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="task-delete" title="삭제">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(taskItem);
    });
}

// 생성용 API
async function createTask(data) {
    const response = await fetch(`/api/dashboard/${window.currentTeamId}/tasks/create/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('작업 생성 실패');
    try { return await response.json(); } catch { return {}; }
}
