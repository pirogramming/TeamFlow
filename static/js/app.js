/**
 * TeamFlow 앱 메인 (백엔드 테스트용)
 */

(function () {
  "use strict";

  // 앱 설정
  window.TeamFlow = {
    version: "1.0.0",
    debug: window.APP_CONFIG?.DEBUG || false,
  };

  console.log("TeamFlow v" + window.TeamFlow.version + " 로드됨");

  // 디버그 모드일 때 추가 로깅
  if (window.TeamFlow.debug) {
    console.log("디버그 모드 활성화");
    console.log("APP_CONFIG:", window.APP_CONFIG);
  }

  // ========================================
  // MGP: 단순한 알림 시스템 */
  // 백엔드 팀원이 해결해야 할 부분 대신 해결: 눈에 안 띄는 작은 알림 */
  // ========================================
  
  // 알림 시스템 초기화
  function initNotifications() {
    const notifications = document.querySelectorAll('.notification[data-auto-hide="true"]');
    
    notifications.forEach(notification => {
      // 자동 숨김 (3초 후)
      setTimeout(() => {
        if (notification && notification.parentNode) {
          hideNotification(notification);
        }
      }, 3000);
      
      // 닫기 버튼 이벤트
      const closeBtn = notification.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          hideNotification(notification);
        });
      }
    });
  }

  // 알림 숨김 함수
  function hideNotification(notification) {
    notification.style.animation = 'slideOutNotification 0.3s ease-out forwards';
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }

  // DOM 로드 완료 시 알림 시스템 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
  } else {
    initNotifications();
  }

  // 전역 알림 표시 함수
  window.showNotification = function(message, type = 'info', autoHide = true) {
    const notificationsContainer = document.getElementById('global-notifications');
    if (!notificationsContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('data-auto-hide', autoHide);
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-text">${message}</div>
      </div>
      <button class="notification-close" type="button" aria-label="닫기">&times;</button>
    `;

    notificationsContainer.appendChild(notification);
    
    // 새로 추가된 알림 초기화
    initNotifications();
    
    // 자동 숨김
    if (autoHide) {
      setTimeout(() => {
        if (notification && notification.parentNode) {
          hideNotification(notification);
        }
      }, 3000);
    }
  };

  // ========================================
})();
