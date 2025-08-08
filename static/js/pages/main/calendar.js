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
        // 탭 버튼 활성화 상태 변경
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 탭 패널 표시 상태 변경
        tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });

        // 탭별 초기화 로직
        if (tabName === 'schedule' && calendar) {
            // FullCalendar 리사이즈 (탭 전환 시 크기 조정)
            setTimeout(() => calendar.updateSize(), 100);
        } else if (tabName === 'meeting') {
            // When2Meet 데이터 로드
            loadWhen2MeetData();
        }
    }

    /**
     * FullCalendar 초기화
     */
    function initializeCalendar() {
        if (!calendarEl) return;

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: { 
                left: 'prev,next today', 
                center: 'title', 
                right: 'dayGridMonth' 
            },
            events: `/api/teams/${teamId}/schedule/detail`,
            editable: true,
            timeZone: 'local',
            height: 'auto',
            eventClick: function(info) {
                // 일정 클릭 시 수정/삭제 기능 (나중에 구현 가능)
                console.log('일정 클릭:', info.event.title);
            }
        });

        try {
            calendar.render();
            console.log('✅ FullCalendar 렌더링 완료');
        } catch (error) {
            console.error('❌ FullCalendar 렌더링 오류:', error);
            calendarEl.innerHTML = '<p style="color: red; text-align: center; padding: 2rem;">캘린더를 불러올 수 없습니다.</p>';
        }
    }

    /**
     * 모달 기능 초기화
     */
    function initializeModal() {
        if (!addScheduleBtn || !scheduleModal) return;

        // 모달 열기
        addScheduleBtn.addEventListener('click', openScheduleModal);
        
        // 모달 닫기
        closeModalBtn.addEventListener('click', closeScheduleModal);
        cancelScheduleBtn.addEventListener('click', closeScheduleModal);
        
        // 배경 클릭 시 모달 닫기
        scheduleModal.addEventListener('click', (e) => {
            if (e.target === scheduleModal) {
                closeScheduleModal();
            }
        });

        // 일정 추가 폼 제출
        scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }

    /**
     * 일정 추가 모달 열기
     */
    function openScheduleModal() {
        scheduleModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 현재 시간으로 기본값 설정
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 2시간 후
        
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
                calendar.refetchEvents(); // 캘린더 새로고침
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
        
        // 마우스 이벤트 설정은 그리드 렌더링 후에
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
        
        // 9:00 ~ 21:00 시간 슬롯 생성
        for (let hour = 0; hour <= 24; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}00`);
        }

        let gridHTML = '';
        
        // 헤더 행
        gridHTML += '<div class="grid-header"></div>'; // 좌상단 빈 칸
        days.forEach((day, index) => {
            const date = data.week_dates ? data.week_dates[index] : '';
            gridHTML += `<div class="grid-header">${day}<br><small>${date}</small></div>`;
        });

        // 시간 행들
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
                    
                    // 가용성에 따른 색상 설정
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
            // 마우스 드래그 선택
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseenter', continueSelection);
            cell.addEventListener('mouseup', endSelection);
            
            // hover 툴팁
            cell.addEventListener('mouseenter', showTooltip);
            cell.addEventListener('mouseleave', hideTooltip);
        });

        document.addEventListener('mouseup', endSelection);
    }

    /**
     * 드래그 선택 시작
     */
    function startSelection(e) {
        isMouseDown = true;
        toggleCellSelection(e.target);
    }

    /**
     * 드래그 선택 계속
     */
    function continueSelection(e) {
        if (isMouseDown && e.target.classList.contains('grid-cell')) {
            toggleCellSelection(e.target);
        }
    }

    /**
     * 드래그 선택 종료
     */
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
     * 툴팁 표시
     */
    function showTooltip(e) {
        const cell = e.target;
        const users = cell.dataset.users;
        
        if (users && users.trim()) {
            tooltip.querySelector('.tooltip-content').textContent = `가능한 팀원: ${users}`;
            tooltip.classList.add('show');
            
            // 툴팁 위치 설정
            const rect = cell.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        }
    }

    /**
     * 툴팁 숨김
     */
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
                loadWhen2MeetData(); // 데이터 새로고침
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
        // 간단한 토스트 알림 (나중에 개선 가능)
        alert(message);
    }

    // 개발자 디버깅을 위한 전역 함수 노출
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