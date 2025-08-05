document.addEventListener('DOMContentLoaded', function() {
    const teamDataElement = document.getElementById('team-data');
    const teamData = JSON.parse(teamDataElement.textContent);
    const teamId = teamData.teamId;

    const uploadForm = document.getElementById('file-upload-form');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    
    // --- 파일 업로드 로직 ---
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (fileInput.files.length === 0) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        // CSRF 토큰은 헤더로 보냅니다.
        
        try {
            const response = await fetch(`/api/teams/${teamId}/files/upload`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                alert('파일이 업로드되었습니다.');
                addFileToList(result.data); // 성공 시 파일 목록에 동적으로 추가
                uploadForm.reset(); // 폼 초기화
            } else {
                alert('업로드 실패: ' + result.error);
            }
        } catch (error) {
            alert('오류 발생: ' + error.message);
        }
    });

    // --- 파일 삭제 로직 ---
    fileList.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('정말로 이 파일을 삭제하시겠습니까?')) {
                const listItem = e.target.closest('li');
                const fileId = listItem.dataset.fileId;
                deleteFile(fileId, listItem);
            }
        }
    });

    async function deleteFile(fileId, listItem) {
        try {
            const response = await fetch(`/api/files/${fileId}/delete`, {
                method: 'POST', // HTML form 호환성을 위해 POST 사용
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            });

            const result = await response.json();

            if (result.success) {
                alert('파일이 삭제되었습니다.');
                listItem.remove(); // 화면에서 해당 항목 제거
            } else {
                alert('삭제 실패: ' + result.error);
            }
        } catch (error) {
            alert('오류 발생: ' + error.message);
        }
    }

    // 파일 목록에 새 항목을 추가하는 함수
    function addFileToList(fileData) {
        const noFilesMessage = document.getElementById('no-files-message');
        if (noFilesMessage) {
            noFilesMessage.remove();
        }

        const li = document.createElement('li');
        li.dataset.fileId = fileData.id;
        li.innerHTML = `
            <a href="${fileData.url}" target="_blank">${fileData.filename}</a>
            <span>(by ${fileData.uploader_name})</span>
            <button class="delete-btn">삭제</button>
        `;
        fileList.prepend(li); // 목록의 맨 위에 추가
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