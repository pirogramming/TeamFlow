document.addEventListener('DOMContentLoaded', function() {
    // --- 1. 필수 데이터 및 요소 확인 ---
    const teamDataElement = document.getElementById('team-data');
    if (!teamDataElement) {
        console.error('오류: 팀 데이터가 담긴 <script id="team-data"> 태그를 찾을 수 없습니다.');
        return; // 스크립트 실행 중단
    }
    const teamData = JSON.parse(teamDataElement.textContent);
    const teamId = teamData.teamId;

    const calendarView = document.getElementById('calendar-view');
    const schedulerView = document.getElementById('scheduler-view');
    const goToSchedulerBtn = document.getElementById('go-to-scheduler-btn');
    const backToCalendarBtn = document.getElementById('back-to-calendar-btn');
    const calendarEl = document.getElementById('calendar');

    // 필수 요소들이 모두 존재하는지 확인
    if (!calendarView || !schedulerView || !goToSchedulerBtn || !backToCalendarBtn || !calendarEl) {
        console.error('오류: HTML에서 필수 요소를 찾을 수 없습니다. (ID: calendar-view, scheduler-view, go-to-scheduler-btn, back-to-calendar-btn, calendar)');
        return; // 스크립트 실행 중단
    }

    // --- 2. FullCalendar 초기화 ---
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
        events: `/api/teams/${teamId}/schedule/detail`,
        editable: true,
        // ✨ 시간대 설정을 'local'로 명시하여 브라우저의 현지 시간대를 사용하도록 합니다.
        timeZone: 'local',
    });
    
    // 캘린더 렌더링 시도 및 오류 처리
    try {
        calendar.render();
        console.log('✅ 캘린더가 성공적으로 렌더링되었습니다.');
    } catch (error) {
        console.error('❌ 캘린더 렌더링 중 오류 발생:', error);
        calendarEl.innerHTML = '<p style="color: red;">캘린더를 불러오는 데 실패했습니다. 개발자 콘솔을 확인하세요.</p>';
    }
    
    // --- 3. 이벤트 리스너 및 기능 함수들 ---
    goToSchedulerBtn.addEventListener('click', () => {
        calendarView.style.display = 'none';
        schedulerView.style.display = 'block';
        renderWhen2MeetGrid();
    });

    backToCalendarBtn.addEventListener('click', () => {
        schedulerView.style.display = 'none';
        calendarView.style.display = 'block';
        calendar.refetchEvents();
    });

    const gridContainer = document.getElementById('when2meet-grid');
    let isMouseDown = false;
    let myVoteData = {};

    async function renderWhen2MeetGrid() {
        try {
            const response = await fetch(`/api/teams/${teamId}/schedule/mediate`);
            const data = await response.json();
            const availability = data.availability;
            const bestSlots = data.best_slots || [];
            const weekDates = data.week_dates || [];
            myVoteData = data.my_vote || {};

            gridContainer.innerHTML = '';
            const days = ['Time', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            days.forEach((day, index) => {
                const headerCell = document.createElement('div');
                headerCell.className = 'grid-header';
                if (index > 0) {
                    headerCell.innerHTML = `${day}<br><small>${weekDates[index-1]}</small>`;
                } else {
                    headerCell.textContent = day;
                }
                gridContainer.appendChild(headerCell);
            });

            for (let hour = 0; hour < 24; hour++) {
                const time = String(hour).padStart(2, '0');
                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                timeLabel.textContent = `${time}:00`;
                gridContainer.appendChild(timeLabel);

                days.slice(1).forEach(day => {
                    const dayKey = day.toLowerCase();
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.day = dayKey;
                    cell.dataset.time = time;
                    
                    const count = availability[`${dayKey}-${time}`] || 0;
                    if (count > 0) {
                        cell.style.backgroundColor = `rgba(40, 167, 69, ${Math.min(count / data.team_members_count, 1)})`;
                    }
                    
                    if (myVoteData[dayKey] && myVoteData[dayKey].includes(time)) {
                        cell.classList.add('selected');
                    }

                    if (bestSlots.includes(`${dayKey}-${time}`)) {
                        cell.classList.add('best-slot');
                    }
                    
                    gridContainer.appendChild(cell);
                });
            }
        } catch (error) {
            console.error('❌ 일정 조율 그리드 렌더링 오류:', error);
            gridContainer.innerHTML = '<p style="color: red;">일정 조율 정보를 불러오는 데 실패했습니다.</p>';
        }
    }

    gridContainer.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('grid-cell')) {
            isMouseDown = true;
            toggleCellSelection(e.target);
        }
    });
    gridContainer.addEventListener('mouseover', (e) => {
        if (isMouseDown && e.target.classList.contains('grid-cell')) {
            toggleCellSelection(e.target);
        }
    });
    document.addEventListener('mouseup', () => isMouseDown = false);
    
    function toggleCellSelection(cell) {
        cell.classList.toggle('selected');
        const day = cell.dataset.day;
        const time = cell.dataset.time;
        if (!myVoteData[day]) myVoteData[day] = [];
        if (cell.classList.contains('selected')) {
            if (!myVoteData[day].includes(time)) myVoteData[day].push(time);
        } else {
            myVoteData[day] = myVoteData[day].filter(t => t !== time);
        }
    }

    document.getElementById('save-vote-btn').addEventListener('click', async () => {
        const response = await fetch(`/api/teams/${teamId}/schedule/save_vote`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')},
            body: JSON.stringify({ available_slots: myVoteData }),
        });
        const result = await response.json();
        alert(result.success ? '시간이 저장되었습니다!' : '저장에 실패했습니다.');
        if (result.success) renderWhen2MeetGrid();
    });

    document.getElementById('add-meeting-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('meeting-title').value;
        const startValue = document.getElementById('meeting-start').value;
        const endValue = document.getElementById('meeting-end').value;

        // ✨ 핵심 수정: 입력받은 현지 시간 문자열을 UTC 시간으로 변환하여 전송합니다.
        const startUTC = new Date(startValue).toISOString();
        const endUTC = new Date(endValue).toISOString();

        const response = await fetch(`/api/teams/${teamId}/schedule/create`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')},
            body: JSON.stringify({ title, start: startUTC, end: endUTC }),
        });
        const result = await response.json();
        if (result.success) {
            alert('회의가 추가되었습니다!');
            backToCalendarBtn.click();
        } else {
            alert('회의 추가에 실패했습니다.');
        }
    });

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
});