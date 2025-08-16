/**
 * 일정 관리 페이지 JavaScript - 탭 구조 및 When2Meet 기능
 * 지침: 두 개의 하위 탭 (전체 일정 / 회의 시간 조율)
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소 참조
    const teamDataElement = document.getElementById('team-data');
    if (!teamDataElement) {
        console.error('오류: 팀 데이터를 찾을 수 없습니다.');
        return;
    }
    
    const teamData = JSON.parse(teamDataElement.textContent);
    const teamId = teamData.teamId;
    
    // 탭 관련 요소
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // 일정 관련 요소
    const calendarEl = document.getElementById('calendar');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const scheduleModal = document.getElementById('schedule-modal');
    const scheduleForm = document.getElementById('add-schedule-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');
    
    // When2Meet 관련 요소
    const when2meetGrid = document.getElementById('when2meet-grid');
    const saveVoteBtn = document.getElementById('save-vote-btn');
    const tooltip = document.getElementById('hover-tooltip');
    
    // modal 관련 요소
    const detailModal = document.getElementById('event-detail-modal');
    const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    let currentEventId = null;
    let currentEventType = null;

    // 상태 변수
    let calendar = null;
    let isMouseDown = false;
    let myVoteData = {};
    let availabilityData = {};

    // 초기화
    initializeTabs();
    initializeCalendar();
    initializeModal();
    initializeWhen2Meet();

    /**
     * 탭 기능 초기화
     */
    function initializeTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                switchTab(targetTab);
            });
        });
    }

    /**
     * 탭 전환 기능
     */
    function switchTab(tabName) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });

        if (tabName === 'schedule' && calendar) {
            setTimeout(() => calendar.updateSize(), 100);
        } else if (tabName === 'meeting') {
            loadWhen2MeetData();
        }
    }

    /**
     * FullCalendar 초기화
     */
    function initializeCalendar() {
        if (!calendarEl) return;

        // 세그먼트 컨트롤 이벤트 리스너 설정
        const segmentBtns = document.querySelectorAll('.segment-btn');
        segmentBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const viewType = this.dataset.view;
                
                // 활성 상태 업데이트
                segmentBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // 캘린더 뷰 변경
                if (viewType === 'month') {
                    calendar.changeView('dayGridMonth');
                } else if (viewType === 'week') {
                    calendar.changeView('timeGridWeek');
                }
            });
        });

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: { 
                left: 'prev,next today', 
                center: 'title', 
                right: '' // 기존 버튼 제거
            },
            events: `/api/teams/${teamId}/schedule/detail`,
            editable: true,
            timeZone: 'local',
            height: 'auto',
            datesSet: function(info) {
                // 뷰 변경 시 세그먼트 컨트롤 자동 업데이트
                const currentView = info.view.type;
                const segmentBtns = document.querySelectorAll('.segment-btn');
                
                segmentBtns.forEach(btn => {
                    btn.classList.remove('active');
                    if ((currentView === 'dayGridMonth' && btn.dataset.view === 'month') ||
                        (currentView === 'timeGridWeek' && btn.dataset.view === 'week')) {
                        btn.classList.add('active');
                    }
                });
            },
            eventClick: function(info) {
                
                const event = info.event;
                currentEventId = event.id;
                currentEventType = event.extendedProps.type;

                modalTitle.textContent = event.title;
                
                let contentHTML = '';
                if (currentEventType === 'task') {
                    const assigneeName = event.extendedProps.assignee_first_name || event.extendedProps.assignee || '미정';
                    contentHTML = `
                        <p><strong>상태:</strong> ${event.extendedProps.status}</p>
                        <p><strong>담당자:</strong> ${assigneeName}</p>
                        <p><strong>마감일:</strong> ${new Date(event.start).toLocaleDateString()}</p>
                        <p><strong>설명:</strong> ${event.extendedProps.description || '없음'}</p>
                    `;
                    // ✨ 작업 일정일 경우 삭제 버튼 숨김
                    deleteEventBtn.style.display = 'none';
                } else { // meeting
                    contentHTML = `
                        <p><strong>시작:</strong> ${new Date(event.start).toLocaleString()}</p>
                        <p><strong>종료:</strong> ${new Date(event.end).toLocaleString()}</p>
                        <p><strong>설명:</strong> ${event.extendedProps.description || '팀 회의입니다.'}</p>
                    `;
                    // ✨ 회의 일정일 경우 삭제 버튼 표시
                    deleteEventBtn.style.display = 'block';
                }
                modalBody.innerHTML = contentHTML;
                detailModal.classList.add('active');
            }
        });

        try {
            calendar.render();
            console.log('✅ FullCalendar 렌더링 완료');
        } catch (error) {
            console.error('❌ FullCalendar 렌더링 오류:', error);
            calendarEl.innerHTML = '<p style="color: red; text-align: center; padding: 2rem;">캘린더를 불러올 수 없습니다.</p>';
        }

        closeDetailModalBtn.addEventListener('click', () => detailModal.classList.remove('active'));
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.classList.remove('active');
            }
        });

        // 삭제 버튼 클릭 이벤트
        deleteEventBtn.addEventListener('click', async () => {
            if (!currentEventId || currentEventType !== 'meeting') return;

            if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
                const [type, id] = currentEventId.split('_');
                const deleteUrl = `/api/teams/${teamId}/schedule/${id}/delete`;

                try {
                    const response = await fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: { 'X-CSRFToken': getCookie('csrftoken') }
                    });

                    // 204 No Content 응답을 올바르게 처리합니다.
                    if (response.ok) {
                        showToast('일정이 삭제되었습니다.', 'success');
                        detailModal.classList.remove('active');
                        calendar.refetchEvents();
                    } else {
                        if (response.headers.get("content-length") > 0) {
                            const result = await response.json();
                            showToast(`삭제 실패: ${result.error || '알 수 없는 오류'}`, 'error');
                        } else {
                            showToast(`삭제 실패: 서버에서 오류가 발생했습니다. (상태 코드: ${response.status})`, 'error');
                        }
                    }
                } catch (error) {
                    console.error('삭제 오류:', error);
                    showToast('오류가 발생했습니다.', 'error');
                }
            }
        });
    }

    /**
     * 모달 기능 초기화
     */
    function initializeModal() {
        if (!addScheduleBtn || !scheduleModal) return;

        addScheduleBtn.addEventListener('click', openScheduleModal);
        closeModalBtn.addEventListener('click', closeScheduleModal);
        cancelScheduleBtn.addEventListener('click', closeScheduleModal);
        scheduleModal.addEventListener('click', (e) => {
            if (e.target === scheduleModal) {
                closeScheduleModal();
            }
        });
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }

    /**
     * 일정 추가 모달 열기
     */
    function openScheduleModal() {
        scheduleModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        
        document.getElementById('schedule-start').value = formatDateTimeLocal(startTime);
        document.getElementById('schedule-end').value = formatDateTimeLocal(endTime);
    }

    /**
     * 일정 추가 모달 닫기
     */
    function closeScheduleModal() {
        scheduleModal.classList.remove('active');
        document.body.style.overflow = '';
        scheduleForm.reset();
    }

    /**
     * 일정 추가 폼 제출 처리
     */
    async function handleScheduleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('schedule-title').value,
            start: document.getElementById('schedule-start').value,
            end: document.getElementById('schedule-end').value
        };

        try {
            const response = await fetch(`/api/teams/${teamId}/schedule/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showToast('일정이 추가되었습니다.', 'success');
                closeScheduleModal();
                calendar.refetchEvents();
            } else {
                showToast('일정 추가에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('일정 추가 오류:', error);
            showToast('오류가 발생했습니다.', 'error');
        }
    }

    /**
     * When2Meet 기능 초기화
     */
    function initializeWhen2Meet() {
        if (!when2meetGrid || !saveVoteBtn) return;
        saveVoteBtn.addEventListener('click', saveVote);
    }

    /**
     * When2Meet 데이터 로드 및 그리드 렌더링
     */
    async function loadWhen2MeetData() {
        try {
            const response = await fetch(`/api/teams/${teamId}/schedule/mediate`);
            const data = await response.json();
            
            availabilityData = data.availability;
            myVoteData = data.my_vote || {};
            
            renderWhen2MeetGrid(data);
            setupGridInteractions();
        } catch (error) {
            console.error('When2Meet 데이터 로드 오류:', error);
            when2meetGrid.innerHTML = '<p style="color: red; text-align: center; padding: 2rem;">데이터를 불러올 수 없습니다.</p>';
        }
    }

    /**
     * When2Meet 그리드 렌더링
     */
    function renderWhen2MeetGrid(data) {
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        const timeSlots = [];
        
        for (let hour = 0; hour <= 24; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}00`);
        }

        let gridHTML = '';
        
        gridHTML += '<div class="grid-header"></div>';
        days.forEach((day, index) => {
            const date = data.week_dates ? data.week_dates[index] : '';
            gridHTML += `<div class="grid-header">${day}<br><small>${date}</small></div>`;
        });

        timeSlots.forEach(timeSlot => {
            const hour = parseInt(timeSlot.substring(0, 2));
            const displayTime = `${hour}:00`;
            
            gridHTML += `<div class="time-label">${displayTime}</div>`;
            
            days.forEach((day, dayIndex) => {
                const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][dayIndex];
                const slotKey = `${dayKey}-${timeSlot}`;
                const availability = availabilityData[slotKey];
                const isMyVote = myVoteData[dayKey] && myVoteData[dayKey].includes(timeSlot);
                
                let cellClass = 'grid-cell';
                let cellStyle = '';
                let dataUsers = '';
                
                if (availability) {
                    const count = availability.count;
                    const users = availability.users || [];
                    const intensity = Math.min(count / data.team_members_count, 1);
                    
                    cellStyle = `background-color: rgba(35, 131, 226, ${0.1 + intensity * 0.7});`;
                    dataUsers = users.join(', ');
                }
                
                if (isMyVote) {
                    cellClass += ' selected';
                }
                
                gridHTML += `<div class="${cellClass}" 
                                data-day="${dayKey}" 
                                data-slot="${timeSlot}"
                                data-users="${dataUsers}"
                                style="${cellStyle}">
                                ${availability ? availability.count : ''}
                            </div>`;
            });
        });

        when2meetGrid.innerHTML = gridHTML;
    }

    /**
     * 그리드 마우스 인터랙션 설정
     */
    function setupGridInteractions() {
        const cells = when2meetGrid.querySelectorAll('.grid-cell');
        
        cells.forEach(cell => {
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseenter', continueSelection);
            cell.addEventListener('mouseup', endSelection);
            cell.addEventListener('mouseenter', showTooltip);
            cell.addEventListener('mouseleave', hideTooltip);
        });

        document.addEventListener('mouseup', endSelection);
    }

    /**
     * 드래그 선택 관련 함수들
     */
    function startSelection(e) {
        isMouseDown = true;
        toggleCellSelection(e.target);
    }
    function continueSelection(e) {
        if (isMouseDown && e.target.classList.contains('grid-cell')) {
            toggleCellSelection(e.target);
        }
    }
    function endSelection() {
        isMouseDown = false;
    }

    /**
     * 셀 선택 토글
     */
    function toggleCellSelection(cell) {
        const day = cell.dataset.day;
        const slot = cell.dataset.slot;
        
        if (!myVoteData[day]) {
            myVoteData[day] = [];
        }
        
        const index = myVoteData[day].indexOf(slot);
        if (index > -1) {
            myVoteData[day].splice(index, 1);
            cell.classList.remove('selected');
        } else {
            myVoteData[day].push(slot);
            cell.classList.add('selected');
        }
    }

    /**
     * 툴팁 관련 함수들
     */
    function showTooltip(e) {
        const cell = e.target;
        const users = cell.dataset.users;
        
        if (users && users.trim()) {
            tooltip.querySelector('.tooltip-content').textContent = `가능한 팀원: ${users}`;
            tooltip.classList.add('show');
            
            const rect = cell.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        }
    }
    function hideTooltip() {
        tooltip.classList.remove('show');
    }

    /**
     * 투표 저장
     */
    async function saveVote() {
        try {
            const response = await fetch(`/api/teams/${teamId}/schedule/save_vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ available_slots: myVoteData })
            });
            const result = await response.json();
            if (result.success) {
                showToast('시간이 저장되었습니다.', 'success');
                loadWhen2MeetData();
            } else {
                showToast('저장에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('투표 저장 오류:', error);
            showToast('오류가 발생했습니다.', 'error');
        }
    }

    /**
     * 유틸리티 함수들
     */
    function formatDateTimeLocal(date) {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function showToast(message, type = 'info') {
        alert(message);
    }

    // 개발자 디버깅용
    if (window.TeamFlow && window.TeamFlow.debug) {
        window.CalendarDebug = {
            switchTab,
            loadWhen2MeetData,
            saveVote,
            myVoteData,
            availabilityData
        };
        console.log('🔧 Calendar 디버그 함수들이 window.CalendarDebug에 노출되었습니다.');
    }
});