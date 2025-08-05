document.addEventListener('DOMContentLoaded', function() {
    // Django 템플릿에서 팀 ID 가져오기
    const teamDataElement = document.getElementById('team-data');
    const teamData = JSON.parse(teamDataElement.textContent);
    const teamId = teamData.teamId;

    // 뷰 컨테이너 및 버튼 요소
    const calendarView = document.getElementById('calendar-view');
    const schedulerView = document.getElementById('scheduler-view');
    const goToSchedulerBtn = document.getElementById('go-to-scheduler-btn');
    const backToCalendarBtn = document.getElementById('back-to-calendar-btn');

    // FullCalendar 초기화
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        events: `/api/teams/${teamId}/schedule/detail`,
        editable: true,
        eventClick: function(info) {
            if (confirm(`'${info.event.title}' 일정을 삭제하시겠습니까?`)) {
                deleteSchedule(info.event.id);
            }
        }
    });
    calendar.render();

    // --- 화면 전환 로직 ---
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

    // --- 일정 조율 (When2Meet) 로직 ---
    const gridContainer = document.getElementById('when2meet-grid');
    let isMouseDown = false;
    let myVoteData = {};

    async function renderWhen2MeetGrid() {
        const response = await fetch(`/api/teams/${teamId}/schedule/mediate`);
        const data = await response.json();
        const availability = data.availability;
        myVoteData = data.my_vote || {};

        gridContainer.innerHTML = '';
        const days = ['Time', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.className = 'grid-header';
            headerCell.textContent = day;
            gridContainer.appendChild(headerCell);
        });

        for (let hour = 9; hour < 18; hour++) {
            for (let min of ['00', '30']) {
                const time = `${String(hour).padStart(2, '0')}${min}`;
                const timeLabel = document.createElement('div');
                timeLabel.className = 'time-label';
                timeLabel.textContent = `${hour}:${min}`;
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
                    gridContainer.appendChild(cell);
                });
            }
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

    // --- 회의 추가 로직 ---
    document.getElementById('add-meeting-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('meeting-title').value;
        const start = document.getElementById('meeting-start').value;
        const end = document.getElementById('meeting-end').value;

        const response = await fetch(`/api/teams/${teamId}/schedule/create`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')},
            body: JSON.stringify({ title, start, end }),
        });
        const result = await response.json();
        if (result.success) {
            alert('회의가 추가되었습니다!');
            backToCalendarBtn.click();
        } else {
            alert('회의 추가에 실패했습니다.');
        }
    });

    // --- 일정 삭제 로직 ---
    async function deleteSchedule(scheduleId) {
        const response = await fetch(`/api/teams/${teamId}/schedule/${scheduleId}/delete`, {
            method: 'DELETE',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
        });
        const result = await response.json();
        if (result.success) {
            alert('일정이 삭제되었습니다.');
            calendar.refetchEvents();
        } else {
            alert('일정 삭제에 실패했습니다.');
        }
    }

    // CSRF 토큰 헬퍼 함수
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