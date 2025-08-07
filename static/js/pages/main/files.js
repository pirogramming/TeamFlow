/**
 * 파일 관리 페이지 JavaScript
 * 드래그 앤 드롭, 파일 업로드, 삭제 기능 - Design Guide 준수
 */

document.addEventListener('DOMContentLoaded', function() {
    const teamDataElement = document.getElementById('team-data');
    const teamData = JSON.parse(teamDataElement.textContent);
    const teamId = teamData.teamId;

    const uploadForm = document.getElementById('file-upload-form');
    const fileInput = document.getElementById('file-input');
    const fileInputButton = document.querySelector('.file-input-button');
    const uploadArea = document.getElementById('upload-area');
    const fileList = document.getElementById('file-list');

    // 드래그 앤 드롭 초기화
    initializeDragAndDrop();
    
    // 파일 입력 버튼 클릭 이벤트
    if (fileInputButton) {
        fileInputButton.addEventListener('click', () => fileInput.click());
    }
    
    // --- 파일 업로드 로직 ---
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (fileInput.files.length === 0) {
            showErrorMessage('업로드할 파일을 선택해주세요.');
            return;
        }

        await uploadFile(fileInput.files[0]);
    });

    // --- 파일 삭제 로직 ---
    if (fileList) {
        fileList.addEventListener('click', function(e) {
            if (e.target.closest('.btn-delete')) {
                if (confirm('정말로 이 파일을 삭제하시겠습니까?')) {
                    const listItem = e.target.closest('.file-card');
                    const fileId = listItem.dataset.fileId;
                    deleteFile(fileId, listItem);
                }
            }
        });
    }

    /**
     * 드래그 앤 드롭 초기화
     */
    function initializeDragAndDrop() {
        if (!uploadArea) return;

        // 드래그 이벤트 방지
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // 시각적 피드백
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        // 파일 드롭 처리
        uploadArea.addEventListener('drop', handleDrop, false);
        
        // 클릭으로 파일 선택
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        uploadArea.classList.add('dragover');
    }

    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            uploadFile(files[0]);
        }
    }

    /**
     * 파일 업로드 처리
     */
    async function uploadFile(file) {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        
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
                showSuccessMessage('파일이 업로드되었습니다.');
                addFileToList(result.data);
                uploadForm.reset();
            } else {
                showErrorMessage('업로드 실패: ' + result.error);
            }
        } catch (error) {
            showErrorMessage('오류 발생: ' + error.message);
        }
    }

    /**
     * 파일 삭제 함수
     */
    async function deleteFile(fileId, listItem) {
        try {
            const response = await fetch(`/api/files/${fileId}/delete`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            });

            const result = await response.json();

            if (result.success) {
                showSuccessMessage('파일이 삭제되었습니다.');
                listItem.remove();
                
                // 빈 상태 체크
                if (fileList && fileList.children.length === 0) {
                    showEmptyState();
                }
            } else {
                showErrorMessage('삭제 실패: ' + result.error);
            }
        } catch (error) {
            showErrorMessage('오류 발생: ' + error.message);
        }
    }

    /**
     * 파일 목록에 새 파일 카드 추가
     */
    function addFileToList(fileData) {
        // 빈 상태 메시지 제거
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // 파일 그리드가 없으면 생성
        let currentFileList = document.getElementById('file-list');
        if (!currentFileList) {
            const fileListContainer = document.querySelector('.file-list-container');
            fileListContainer.innerHTML = `
                <h3>업로드된 파일</h3>
                <ul id="file-list" class="files-grid"></ul>
            `;
            currentFileList = document.getElementById('file-list');
        }

        const fileExtension = getFileExtension(fileData.filename);
        const fileIcon = getFileIcon(fileExtension);
        const fileSize = formatFileSize(fileData.file_size || 0);

        const li = document.createElement('li');
        li.className = 'file-card';
        li.dataset.fileId = fileData.id;
        li.innerHTML = `
            <div class="file-card-header">
              <div class="file-icon">${fileIcon}</div>
              <div class="file-info">
                <h4 class="file-name" title="${escapeHtml(fileData.filename)}">${escapeHtml(fileData.filename)}</h4>
                <div class="file-meta">
                  <span class="file-size">${fileSize}</span>
                  <span class="file-date">방금 전</span>
                  <span class="file-uploader">${escapeHtml(fileData.uploader_name)}</span>
                </div>
              </div>
            </div>
            <div class="file-actions">
              <a href="/api/files/${fileData.id}/download" class="btn-download">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
                다운로드
              </a>
              <button class="btn-delete" title="파일 삭제">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
        `;
        
        currentFileList.prepend(li);
    }

    /**
     * 유틸리티 함수들
     */
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    function getFileIcon(extension) {
        const iconMap = {
            'pdf': 'PDF',
            'doc': 'DOC', 'docx': 'DOC',
            'ppt': 'PPT', 'pptx': 'PPT',
            'xls': 'XLS', 'xlsx': 'XLS',
            'jpg': 'IMG', 'jpeg': 'IMG', 'png': 'IMG', 'gif': 'IMG',
            'zip': 'ZIP', 'rar': 'ZIP'
        };
        return iconMap[extension] || 'FILE';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showEmptyState() {
        const fileListContainer = document.querySelector('.file-list-container');
        fileListContainer.innerHTML = `
            <h3>업로드된 파일</h3>
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3>업로드된 파일이 없습니다</h3>
                <p>첫 번째 파일을 업로드해보세요</p>
            </div>
        `;
    }

    function showSuccessMessage(message) {
        // 간단한 알림 (나중에 토스트 알림으로 개선 가능)
        alert(message);
    }

    function showErrorMessage(message) {
        alert(message);
    }

    /**
     * CSRF 토큰 헬퍼 함수
     */
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

    // 개발자 디버깅을 위한 전역 함수 노출
    if (window.TeamFlow && window.TeamFlow.debug) {
        window.FilesDebug = {
            uploadFile,
            deleteFile,
            addFileToList,
            showEmptyState
        };
        console.log('🔧 Files 디버그 함수들이 window.FilesDebug에 노출되었습니다.');
    }
});