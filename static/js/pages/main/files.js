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
    const uploadBtn = document.getElementById('upload-btn');
    const fileList = document.getElementById('file-list');

    // 업로드 버튼 클릭 시 파일 선택창 열기
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => fileInput.click());
    }
    
    // 파일 선택 시 즉시 업로드
    fileInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            
            // 파일 크기 제한 (50MB)
            if (file.size > 50 * 1024 * 1024) {
                showErrorMessage('파일 크기가 50MB를 초과할 수 없습니다.');
                fileInput.value = ''; // 파일 선택 초기화
            return;
        }

            uploadFile(file);
        }
    });


    // --- 파일 삭제 로직 ---
    if (fileList) {
        fileList.addEventListener('click', function(e) {
            if (e.target.closest('.btn-delete')) {
                if (confirm('정말로 이 파일을 삭제하시겠습니까?')) {
                    const listItem = e.target.closest('.file-item');
                    const fileId = listItem.dataset.fileId;
                    deleteFile(fileId, listItem);
                }
            }
        });
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
            } else {
                showErrorMessage('업로드 실패: ' + result.error);
            }
        } catch (error) {
            showErrorMessage('오류 발생: ' + error.message);
        } finally {
            fileInput.value = ''; // 항상 파일 input 초기화
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
     * 파일 목록에 새 파일 아이템 추가
     */
    function addFileToList(fileData) {
        // 빈 상태 메시지 제거
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // 파일 리스트가 없으면 생성
        let currentFileList = document.getElementById('file-list');
        if (!currentFileList) {
            const fileListContainer = document.querySelector('.file-list-container');
            fileListContainer.innerHTML = `
                <h3>공유 파일</h3>
                <div id="file-list" class="file-list"></div>
            `;
            currentFileList = document.getElementById('file-list');
        }

        const fileExtension = getFileExtension(fileData.filename);
        const fileSize = formatFileSize(fileData.file_size || 0);

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = fileData.id;
        
        // 파일 아이콘 생성
        const iconSvg = fileExtension === 'pdf' ? 
            `<svg width="24" height="24" fill="#E53E3E" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>` :
            `<svg width="24" height="24" fill="#4299E1" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>`;
        
        fileItem.innerHTML = `
            <div class="file-icon">${iconSvg}</div>
              <div class="file-info">
                <div class="file-name">${escapeHtml(fileData.filename)}</div>
                <div class="file-meta">${fileSize} • 방금 전 • ${escapeHtml(fileData.uploader_name)}</div>
            </div>
            <div class="file-actions">
                <a href="/api/files/${fileData.id}/download" class="btn-download" title="다운로드">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
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
        
        currentFileList.prepend(fileItem);
    }

    /**
     * 유틸리티 함수들
     */
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
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
            <h3>공유 파일</h3>
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3>업로드된 파일이 없습니다</h3>
                <p>파일 업로드 버튼을 클릭하여 첫 번째 파일을 업로드해보세요</p>
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