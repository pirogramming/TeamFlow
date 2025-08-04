/**
 * 랜딩 페이지 JavaScript (외부 라이브러리 활용)
 * - GSAP: 프리미엄 애니메이션
 * - AOS: 스크롤 애니메이션
 * - Lucide: 아이콘 렌더링
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
      duration: 600,
      easing: "ease-out-cubic",
      once: true,
      offset: 100,
      delay: 0,
    });
  }

  // GSAP 플러그인 등록
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  // 초기 애니메이션 실행
  initLandingAnimations();

  // 이벤트 리스너 등록
  initEventListeners();

  console.log("🚀 TeamFlow 랜딩 페이지 초기화 완료");
});

// ========================================
// 2. 구글 로그인 기능
// ========================================

/**
 * 구글 OAuth 로그인 시작
 * Django Allauth 연동
 */
function startGoogleAuth() {
  try {
    // 로딩 상태 표시
    showLoading("Google 로그인 중...");

    // 버튼 애니메이션
    const buttons = document.querySelectorAll('[onclick="startGoogleAuth()"]');
    buttons.forEach((button) => {
      // GSAP 애니메이션: 버튼 클릭 효과
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    });

    // 0.2초 후 리다이렉션 (애니메이션 완료 후)
    setTimeout(() => {
      window.location.href = "/accounts/google/login/";
    }, 200);
  } catch (error) {
    console.error("구글 로그인 오류:", error);
    hideLoading();
    showError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
  }
}

/**
 * 기능 둘러보기 - 부드러운 스크롤
 */
function scrollToFeatures() {
  const featuresSection = document.getElementById("features");
  if (featuresSection) {
    // GSAP 스크롤 애니메이션
    gsap.to(window, {
      duration: 1.5,
      scrollTo: {
        y: featuresSection,
        offsetY: 80, // 헤더 높이만큼 오프셋
      },
      ease: "power2.inOut",
    });
  }
}

// ========================================
// 3. GSAP 애니메이션
// ========================================

/**
 * 메인 애니메이션 초기화
 */
function initLandingAnimations() {
  if (typeof gsap === "undefined") return;

  // 히어로 섹션 메인 애니메이션
  initHeroAnimations();

  // 기능 카드 호버 애니메이션
  initFeatureCardAnimations();

  // 스크롤 기반 애니메이션
  initScrollAnimations();

  // 배경 요소 애니메이션
  initBackgroundAnimations();
}

/**
 * 히어로 섹션 애니메이션
 */
function initHeroAnimations() {
  // 페이지 로드 시 히어로 타임라인
  const heroTl = gsap.timeline({ delay: 0.5 });

  heroTl
    .from(".hero h1", {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
    })
    .from(
      ".hero p",
      {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      },
      "-=0.8"
    )
    .from(
      ".hero .hero-buttons",
      {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.6"
    )
    .from(
      ".hero .hero-visual",
      {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      },
      "-=0.4"
    );
}

/**
 * 기능 카드 호버 애니메이션
 */
function initFeatureCardAnimations() {
  const featureCards = document.querySelectorAll(".feature-card");

  featureCards.forEach((card) => {
    const icon = card.querySelector(".feature-icon");

    // 마우스 엔터
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        y: -8,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(icon, {
        rotation: 5,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    // 마우스 리브
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        y: 0,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(icon, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  });
}

/**
 * 스크롤 기반 애니메이션
 */
function initScrollAnimations() {
  // 헤더 스크롤 효과
  ScrollTrigger.create({
    start: "top -80",
    end: 99999,
    toggleClass: {
      className: "scrolled",
      targets: "header",
    },
  });

  // 섹션별 페이드 인 애니메이션
  gsap.utils.toArray("section").forEach((section) => {
    gsap.fromTo(
      section,
      {
        opacity: 0.8,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 20%",
          scrub: false,
        },
      }
    );
  });
}

/**
 * 배경 요소 애니메이션 (floating)
 */
function initBackgroundAnimations() {
  // 히어로 섹션 배경 원형 요소들
  const floatingElements = document.querySelectorAll(".animate-float");

  floatingElements.forEach((element, index) => {
    gsap.to(element, {
      y: "random(-20, 20)",
      x: "random(-10, 10)",
      rotation: "random(-5, 5)",
      duration: "random(3, 5)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: index * 0.5,
    });
  });
}

// ========================================
// 4. 이벤트 리스너
// ========================================

/**
 * 이벤트 리스너 초기화
 */
function initEventListeners() {
  // 스크롤 다운 인디케이터 클릭
  const scrollIndicator = document.querySelector(".animate-bounce");
  if (scrollIndicator) {
    scrollIndicator.addEventListener("click", () => {
      scrollToFeatures();
    });
  }

  // 키보드 네비게이션
  document.addEventListener("keydown", handleKeyboardNavigation);

  // 리사이즈 이벤트
  window.addEventListener("resize", handleWindowResize);

  // 스크롤 이벤트 (성능 최적화)
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(handleScroll, 10);
  });

  // FAQ 아코디언 기능
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      // 다른 FAQ 아이템들 닫기
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
        }
      });

      // 현재 아이템 토글
      item.classList.toggle("active");
    });
  });

  // 사용자 후기 슬라이더 기능
  const testimonialCards = document.querySelectorAll(".testimonial-card");
  const navDots = document.querySelectorAll(".nav-dot");

  navDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      // 모든 카드와 도트 비활성화
      testimonialCards.forEach((card) => card.classList.remove("active"));
      navDots.forEach((navDot) => navDot.classList.remove("active"));

      // 선택된 카드와 도트 활성화
      testimonialCards[index].classList.add("active");
      dot.classList.add("active");
    });
  });

  // 대시보드 미리보기 슬라이더 기능
  const previewItems = document.querySelectorAll(".preview-item");
  const previewDots = document.querySelectorAll(".preview-navigation .nav-dot");

  previewDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      // 모든 아이템과 도트 비활성화
      previewItems.forEach((item) => item.classList.remove("active"));
      previewDots.forEach((navDot) => navDot.classList.remove("active"));

      // 선택된 아이템과 도트 활성화
      previewItems[index].classList.add("active");
      dot.classList.add("active");
    });
  });

  // 자동 슬라이드 (선택사항)
  let currentSlide = 0;
  setInterval(() => {
    currentSlide = (currentSlide + 1) % previewItems.length;

    previewItems.forEach((item) => item.classList.remove("active"));
    previewDots.forEach((dot) => dot.classList.remove("active"));

    previewItems[currentSlide].classList.add("active");
    previewDots[currentSlide].classList.add("active");
  }, 4000); // 4초마다 자동 슬라이드
}

/**
 * 키보드 네비게이션 핸들러
 */
function handleKeyboardNavigation(e) {
  // 접근성: 키보드로 섹션 이동
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "1":
        e.preventDefault();
        scrollToSection("hero");
        break;
      case "2":
        e.preventDefault();
        scrollToSection("features");
        break;
      case "3":
        e.preventDefault();
        scrollToSection("start");
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

/**
 * 스크롤 핸들러
 */
function handleScroll() {
  // 스크롤 진행률 표시 (옵션)
  const scrolled =
    (window.pageYOffset /
      (document.documentElement.scrollHeight - window.innerHeight)) *
    100;

  // 헤더 배경 투명도 조절
  const header = document.querySelector("header");
  if (header && window.pageYOffset > 100) {
    header.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
  } else if (header) {
    header.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
  }
}

// ========================================
// 5. 유틸리티 함수
// ========================================

/**
 * 섹션으로 부드럽게 스크롤
 */
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    gsap.to(window, {
      duration: 1.2,
      scrollTo: {
        y: section,
        offsetY: 80,
      },
      ease: "power2.inOut",
    });
  }
}

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

// ========================================
// 6. 전역 함수 노출
// ========================================

// 전역 스코프에 함수 노출 (HTML onclick에서 사용)
window.startGoogleAuth = startGoogleAuth;
window.scrollToFeatures = scrollToFeatures;
window.scrollToSection = scrollToSection;

// 디버깅용 함수들
if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
  window.landingDebug = {
    replayAnimations: initLandingAnimations,
    refreshScrollTrigger: () => ScrollTrigger.refresh(),
    refreshAOS: () => AOS.refresh(),
  };
}

console.log("✨ TeamFlow 랜딩 페이지 JavaScript 로드 완료");
