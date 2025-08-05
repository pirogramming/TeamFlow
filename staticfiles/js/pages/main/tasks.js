// 작업 관리 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const taskTypeSelect = document.getElementById('task-type');
    const assigneeGroup = document.getElementById('assignee-group');

    // 현재 팀 ID 가져오기
    const currentTeamId = window.location.pathname.split('/')[2]; // /teams/{team_id}/tasks/

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
                document.getElementById('task-due-date').value = taskData.due_date || '';
                document.getElementById('task-description').value = taskData.description || '';
                document.getElementById('task-details').value = taskData.details || '';
                
                // 담당자 선택 (다중 선택 처리)
                if (taskData.assignees && Array.isArray(taskData.assignees)) {
                    const assigneeCheckboxes = document.querySelectorAll('input[name="assignee"]');
                    assigneeCheckboxes.forEach(checkbox => {
                        checkbox.checked = taskData.assignees.includes(parseInt(checkbox.value));
                    });
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
                const response = await fetch(`/teams/${currentTeamId}/tasks/api/${taskId}/`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    }
                });

                if (response.ok) {
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

    // 작업 체크박스 토글
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            const isChecked = e.target.classList.contains('checked');

            try {
                const response = await fetch(`/teams/${currentTeamId}/tasks/api/${taskId}/update/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: JSON.stringify({
                        status: isChecked ? 'pending' : 'completed'
                    })
                });

                if (response.ok) {
                    e.target.classList.toggle('checked');
                    taskItem.classList.toggle('completed');
                } else {
                    throw new Error('작업 상태 업데이트 실패');
                }
            } catch (error) {
                console.error('작업 상태 업데이트 중 오류:', error);
                showNotification('작업 상태 업데이트에 실패했습니다.', 'error');
            }
        }
    });

    // 작업 삭제
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.task-delete')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = taskItem.dataset.taskId;

            if (confirm('이 작업을 삭제하시겠습니까?')) {
                try {
                    const response = await fetch(`/teams/${currentTeamId}/tasks/api/${taskId}/delete/`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRFToken': getCsrfToken()
                        }
                    });

                    if (response.ok) {
                        taskItem.remove();
                        showNotification('작업이 삭제되었습니다.', 'success');
                    } else {
                        throw new Error('작업 삭제 실패');
                    }
                } catch (error) {
                    console.error('작업 삭제 중 오류:', error);
                    showNotification('작업 삭제에 실패했습니다.', 'error');
                }
            }
        }
    });

    // 작업 추가/수정
    taskForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(taskForm);
        const taskData = Object.fromEntries(formData.entries());
        const isEdit = taskForm.hasAttribute('data-task-id');
        const taskId = taskForm.getAttribute('data-task-id');

        // 다중 담당자 처리
        if (taskData.type === 'team') {
            const assigneeCheckboxes = document.querySelectorAll('input[name="assignee"]');
            const selectedAssignees = Array.from(assigneeCheckboxes).filter(checkbox => checkbox.checked).map(checkbox => parseInt(checkbox.value));
            taskData.assignees = selectedAssignees;
            delete taskData.assignee; // 단일 assignee 필드 제거
        } else {
            delete taskData.assignee;
            delete taskData.assignees;
        }

        try {
            const url = isEdit 
                ? `/teams/${currentTeamId}/tasks/api/${taskId}/update/`
                : `/teams/${currentTeamId}/tasks/api/create/`;
            
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                const result = await response.json();
                closeModal();
                const message = isEdit ? '작업이 수정되었습니다.' : '새 작업이 추가되었습니다.';
                showNotification(message, 'success');
                location.reload(); // 페이지 새로고침
            } else {
                const errorData = await response.json();
                console.error('서버 오류:', errorData);
                throw new Error(isEdit ? '작업 수정 실패' : '작업 추가 실패');
            }
        } catch (error) {
            console.error('작업 처리 중 오류:', error);
            const message = isEdit ? '작업 수정에 실패했습니다.' : '작업 추가에 실패했습니다.';
            showNotification(message, 'error');
        }
    });
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
