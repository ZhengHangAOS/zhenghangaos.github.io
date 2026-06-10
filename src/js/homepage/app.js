import { loadHomePageUpdates } from "./updates.js";
import { initWeatherSystem } from "./weatherSystem.js";
import { initRightPlanet } from "./rightPlanet.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. 初始化天气与右侧 3D 星球
  initRightPlanet();

  // 2. 自动识别系统当前黑白主题
  // ---------------------------- 2. 联动全站 theme.js 并对齐天气系统 ----------------------------
  const themeToggle = document.getElementById("theme-toggle");

  if (themeToggle) {
    // 🚀 2.1 初始化对齐：直接读取当前已经被 theme.js 锁定的最新主题状态
    let isDark =
      document.documentElement.getAttribute("data-theme") !== "light";

    // 初始化时立刻通知天气系统执行渲染（比如渲染出繁星闪烁或者晴空万里）
    if (typeof initWeatherSystem === "function") {
      initWeatherSystem(isDark);
    }

    // 监听点击，顺便触发天气形变
    themeToggle.addEventListener("click", () => {
      // 此时 theme.js 已经在上一轮微任务里把 html 的 data-theme 改好了，直接拿最新的状态
      const currentDark =
        document.documentElement.getAttribute("data-theme") !== "light";

      if (typeof initWeatherSystem === "function") {
        initWeatherSystem(currentDark);
      }
    });
  }

  // ---------------------------- 3. 语言切换逻辑 ----------------------------
  const langToggle = document.getElementById("lang-toggle");
  if (langToggle) {
    let isEn = true;
    langToggle.addEventListener("click", () => {
      isEn = !isEn;
      langToggle.textContent = isEn ? "EN" : "中";
    });
  }

  // 内容更新
  loadHomePageUpdates();
});
