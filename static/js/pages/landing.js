/**
 * TeamFlow 노션 스타일 랜딩 페이지 JavaScript
 * - GSAP: 부드러운 애니메이션
 * - 디자인 가이드 토큰 활용
 * - 성능 최적화된 스크롤 애니메이션
 */

// ========================================
// 1. 초기화 및 설정
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // Lucide 아이콘 초기화
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // AOS (Animate On Scroll) 초기화
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 400,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      delay: 0,
    });
  }

  // GSAP 플러그인 등록
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  // 초기 애니메이션 실행
  initNotionStyleAnimations();

  // 이벤트 리스너 등록
  initEventListeners();

  // 통계 카운터 애니메이션 초기화
  initStatsCounter();

  console.log("✨ TeamFlow 노션 스타일 랜딩 페이지 초기화 완료");
});

// 스크롤 시 헤더 스타일 변경
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.landing-header');
    
    function handleScroll() {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    
    // 초기 상태 확인
    handleScroll();
});

// ========================================
// 2. 구글 로그인 기능 (노션 스타일)
// ========================================

/**
 * 구글 OAuth 로그인 시작
 * Django Allauth 연동
 */
function startGoogleAuth() {
  try {
    // 버튼 애니메이션 (노션 스타일)
    const buttons = document.querySelectorAll('.btn-primary-large, .cta-btn-primary');
    buttons.forEach((button) => {
      // 부드러운 클릭 효과
      gsap.to(button, {
        scale: 0.98,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    });

    // 0.15초 후 리다이렉션 (더 빠른 반응)
    setTimeout(() => {
      window.location.href = "/accounts/google/login/";
    }, 150);
  } catch (error) {
    console.error("구글 로그인 오류:", error);
    showNotification("로그인 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
  }
}

/**
 * 섹션으로 부드러운 스크롤 (노션 스타일)
 */
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // GSAP이 있으면 사용, 없으면 기본 스크롤 사용
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: {
          y: section,
          offsetY: 80, // 헤더 높이 고려
        },
        ease: "power2.inOut",
      });
    } else {
      // 기본 부드러운 스크롤
      const headerHeight = 80; // 헤더 높이
      const targetPosition = section.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }
}

/**
 * 간단한 알림 시스템
 */
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    color: white;
    background: ${type === "error" ? "#EF4444" : "#2383E2"};
    z-index: 1000;
    opacity: 0;
    transform: translateY(-10px);
  `;
  
  document.body.appendChild(notification);
  
  gsap.to(notification, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: "power2.out"
  });
  
  setTimeout(() => {
    gsap.to(notification, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => notification.remove()
    });
  }, 3000);
}

// ========================================
// 3. 노션 스타일 애니메이션
// ========================================

/**
 * 노션 스타일 애니메이션 초기화
 */
function initNotionStyleAnimations() {
  if (typeof gsap === "undefined") return;

  // 히어로 섹션 애니메이션
  initHeroAnimations();

  // 카드 호버 애니메이션
  initCardAnimations();

  // 스크롤 기반 애니메이션
  initScrollAnimations();

  // 3D 목업 애니메이션
  initMockupAnimations();
}

/**
 * 히어로 섹션 애니메이션 (노션 스타일)
 */
function initHeroAnimations() {
  const heroTl = gsap.timeline({ delay: 0.3 });

  heroTl
    .from(".hero-badge", {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    })
    .from(
      ".hero-title",
      {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.4"
    )
    .from(
      ".hero-description",
      {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.5"
    )
    .from(
      ".hero-cta",
      {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      },
      "-=0.4"
    )
    .from(
      ".hero-visual",
      {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.6"
    )
    .from(
      ".hero-trust",
      {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      },
      "-=0.3"
    );
}

/**
 * 카드 호버 애니메이션 (노션 스타일)
 */
function initCardAnimations() {
  const cards = document.querySelectorAll(".value-card, .case-card, .testimonial-card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        y: -4,
        duration: 0.2,
        ease: "power2.out",
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        y: 0,
        duration: 0.2,
        ease: "power2.out",
      });
    });
  });

  // 버튼 호버 애니메이션
  const buttons = document.querySelectorAll(".btn-primary-large, .btn-secondary-large, .cta-btn-primary, .cta-btn-secondary");
  
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      gsap.to(button, {
        y: -1,
        duration: 0.2,
        ease: "power2.out",
      });
    });

    button.addEventListener("mouseleave", () => {
      gsap.to(button, {
        y: 0,
        duration: 0.2,
        ease: "power2.out",
      });
    });
  });
}

/**
 * 스크롤 기반 애니메이션 (노션 스타일)
 */
function initScrollAnimations() {
  // 섹션별 순차 애니메이션
  const sections = gsap.utils.toArray("section:not(.hero-section)");
  
  sections.forEach((section) => {
    gsap.fromTo(
      section,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "top 30%",
          scrub: false,
        },
      }
    );
  });

  // 카드 격자 스태거 애니메이션
  const cardGrids = [".values-grid", ".cases-grid", ".stats-grid", ".testimonials-grid"];
  
  cardGrids.forEach((gridSelector) => {
    const grid = document.querySelector(gridSelector);
    if (grid) {
      const cards = grid.querySelectorAll(".value-card, .case-card, .stat-item, .testimonial-card");
      
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: grid,
            start: "top 80%",
            end: "top 40%",
            scrub: false,
          },
        }
      );
    }
  });
}

/**
 * 3D 목업 애니메이션
 */
function initMockupAnimations() {
  const mockups = document.querySelectorAll(".hero-dashboard, .feature-mockup");
  
  mockups.forEach((mockup) => {
    mockup.addEventListener("mouseenter", () => {
      gsap.to(mockup, {
        rotationY: mockup.classList.contains("hero-dashboard") ? -10 : 5,
        rotationX: 5,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    mockup.addEventListener("mouseleave", () => {
      gsap.to(mockup, {
        rotationY: mockup.classList.contains("hero-dashboard") ? -15 : 10,
        rotationX: 10,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  });
}

// ========================================
// 4. 통계 카운터 애니메이션
// ========================================

/**
 * 통계 카운터 애니메이션 초기화
 */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  
  statNumbers.forEach((stat) => {
    const target = parseInt(stat.getAttribute('data-target'));
    const counter = { value: 0 };
    
    ScrollTrigger.create({
      trigger: stat,
      start: "top 80%",
      onEnter: () => {
        gsap.to(counter, {
          value: target,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            stat.textContent = Math.round(counter.value);
          }
        });
      },
      once: true
    });
  });
}

// ========================================
// 5. 이벤트 리스너 (노션 스타일)
// ========================================

/**
 * 이벤트 리스너 초기화
 */
function initEventListeners() {
  // FAQ 아코디언 기능 (새로운 HTML 구조)
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    
    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      
      // 다른 FAQ 아이템들 닫기
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
          const otherAnswer = otherItem.querySelector(".faq-answer");
          if (typeof gsap !== "undefined") {
            gsap.to(otherAnswer, {
              maxHeight: 0,
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            otherAnswer.style.maxHeight = "0";
          }
        }
      });

      // 현재 아이템 토글
      if (isActive) {
        item.classList.remove("active");
        if (typeof gsap !== "undefined") {
          gsap.to(answer, {
            maxHeight: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        } else {
          answer.style.maxHeight = "0";
        }
      } else {
        item.classList.add("active");
        if (typeof gsap !== "undefined") {
          gsap.set(answer, { maxHeight: "auto" });
          const height = answer.scrollHeight;
          gsap.fromTo(answer, 
            { maxHeight: 0 }, 
            { 
              maxHeight: height,
              duration: 0.3,
              ease: "power2.out"
            }
          );
        } else {
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      }
    });
  });

  // 키보드 네비게이션
  document.addEventListener("keydown", handleKeyboardNavigation);

  // 리사이즈 이벤트
  window.addEventListener("resize", handleWindowResize);

  // 부드러운 스크롤 링크 - 모든 앵커 링크에 적용
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      if (targetId) {
        scrollToSection(targetId);
      }
    });
  });

  // 인터섹션 옵저버 (성능 최적화)
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // fade-in-up 클래스가 있는 요소들을 관찰
    document.querySelectorAll('.fade-in-up').forEach(el => {
      observer.observe(el);
    });
  }
}

/**
 * 키보드 네비게이션 핸들러 (접근성)
 */
function handleKeyboardNavigation(e) {
  // 접근성: 키보드로 섹션 이동
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "1":
        e.preventDefault();
        scrollToSection("hero-section");
        break;
      case "2":
        e.preventDefault();
        scrollToSection("core-values");
        break;
      case "3":
        e.preventDefault();
        scrollToSection("use-cases");
        break;
      case "4":
        e.preventDefault();
        scrollToSection("faq-section");
        break;
    }
  }
}

/**
 * 윈도우 리사이즈 핸들러
 */
function handleWindowResize() {
  // ScrollTrigger 리프레시
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }

  // AOS 리프레시
  if (typeof AOS !== "undefined") {
    AOS.refresh();
  }
}

// ========================================
// 6. 유틸리티 함수
// ========================================

/**
 * 성능 최적화: 디바운스 함수
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 모바일 디바이스 감지
 */
function isMobile() {
  return window.innerWidth <= 768;
}

/**
 * 애니메이션 비활성화 감지 (접근성)
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 로딩 상태 관리
 */
function showLoading(message = "로딩 중...") {
  const loading = document.getElementById("global-loading");
  if (loading) {
    loading.style.display = "flex";
    const text = loading.querySelector("p");
    if (text) text.textContent = message;
  }
}

function hideLoading() {
  const loading = document.getElementById("global-loading");
  if (loading) {
    loading.style.display = "none";
  }
}

// ========================================
// 7. 전역 함수 노출
// ========================================

// 전역 스코프에 함수 노출 (HTML onclick에서 사용)
window.startGoogleAuth = startGoogleAuth;
window.scrollToSection = scrollToSection;
window.showNotification = showNotification;

// 디버깅용 함수들 (개발 환경에서만)
if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
  window.teamflowDebug = {
    replayAnimations: initNotionStyleAnimations,
    refreshScrollTrigger: () => ScrollTrigger.refresh(),
    refreshAOS: () => AOS.refresh(),
    statsCounter: initStatsCounter,
  };
}

// 성능 모니터링 (개발 환경에서만)
if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
  window.addEventListener('load', () => {
    if (performance.mark) {
      performance.mark('landing-page-loaded');
      console.log('📊 Landing page performance metrics available in DevTools');
    }
  });
}

console.log("🎉 TeamFlow 노션 스타일 랜딩 페이지 JavaScript 완료");
