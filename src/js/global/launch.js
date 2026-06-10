/**
 * ==========================================================================
 * GLOBAL LAUNCH COMPONENT (AOS Lab)
 * Unified Deep-Space Descent Animation
 * ==========================================================================
 */
(function () {
  const initGlobalLaunch = () => {
    const launchBtn = document.getElementById("launch-btn");
    if (!launchBtn) return;

    launchBtn.addEventListener("click", () => {
      // 🎯 统一全站起飞的空降目的地
      const targetUrl = "/index.html?launch=true";

      // 📡 降级安全策略：若未挂载 GSAP，直接硬跳转，防止脚本崩溃
      if (typeof gsap === "undefined") {
        window.location.href = targetUrl;
        return;
      }

      // 🌌 统一动效：选中全站所有页面的核心容器与导航栏
      const allLayouts = document.querySelectorAll(
        ".me-layout, .library-container, .homepage-layout, .explore-container, .home-nav",
      );

      // 🚀 触发统一的“深空沉降”动效
      gsap.to(allLayouts, {
        opacity: 0,
        y: 60, // 统一向下俯冲沉降
        duration: 0.75, // 统一 0.75 秒电影级节奏
        ease: "power2.in",
        onComplete: () => {
          window.location.href = targetUrl;
        },
      });
    });
  };

  // 确保 DOM 树就绪后自动捕获并绑定
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalLaunch);
  } else {
    initGlobalLaunch();
  }
})();
