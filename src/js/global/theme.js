/**
 * ==========================================================================
 * 1. GLOBAL THEME ENGINE (AOS Lab)
 * ==========================================================================
 */

(function () {
  // ---------------------------- 1.1 UI Nodes & SVG Assets ----------------------------
  let themeToggleBtn = null;

  const sunSVG = `<svg id="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSVG = `<svg id="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  // ---------------------------- 1.2 State Evaluation ----------------------------
  const cachedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  let isDark = cachedTheme ? cachedTheme === "dark" : prefersDark;

  // ---------------------------- 1.3 Core Render Engine ----------------------------
  // 🎯 优化：增加 suppressAnimation 参数控制是否强制静默切换
  const applyTheme = (dark, shouldSave = false, suppressAnimation = false) => {
    if (suppressAnimation) {
      document.documentElement.classList.add("no-transition");
    }

    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );

    if (themeToggleBtn) themeToggleBtn.innerHTML = dark ? moonSVG : sunSVG;
    if (shouldSave) localStorage.setItem("theme", dark ? "dark" : "light");

    if (suppressAnimation) {
      // 只有在需要压制动画时，才强制浏览器原地重绘
      window.getComputedStyle(document.documentElement).opacity;
      document.documentElement.classList.remove("no-transition");
    }
  };

  // 执行首屏无缝硬着陆渲染 -> 🎯 开启静默压制动画，防止首屏闪烁
  applyTheme(isDark, false, true);

  // ---------------------------- 1.4 Dynamic Listeners ----------------------------
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        isDark = e.matches;
        applyTheme(isDark, false, true); // 跟随系统变化时也保持静默
      }
    });

  // 绑定 DOM 触发器
  const initThemeToggle = () => {
    themeToggleBtn = document.getElementById("theme-toggle");
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isDark ? moonSVG : sunSVG;

      // 单击切换并锁定 -> 🎯 第三个参数传 false（或者不传），让切换顺畅执行，不受重绘锁死阻碍
      themeToggleBtn.addEventListener("click", () => {
        isDark = !isDark;
        applyTheme(isDark, true, false);
      });

      // 双击释放锁定，重新跟随系统
      themeToggleBtn.addEventListener("dblclick", () => {
        localStorage.removeItem("theme");
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(isDark, false, true);
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
})();
