export function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  // 🎯 图标资产定义
  const sunSVG = `<svg id="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSVG = `<svg id="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  // 🚀 核心对齐：初始化时，直接读取 theme.js 或 HTML 标签上目前已经生效的 data-theme 属性
  // 这样能确保：如果用户在别的页面选了 light 模式，回到首页时，首页的图标也是正确的 light 状态
  let isDark = document.documentElement.getAttribute("data-theme") !== "light";

  // 根据当前状态，初始化图标外观
  themeToggle.innerHTML = isDark ? moonSVG : sunSVG;

  // 🖱️ 点击切换与数据持久化同步
  themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    const themeStr = isDark ? "dark" : "light";

    // 1. 改变 HTML 标签属性（用于其他可能影响的 UI，3D 星空背景不受干扰）
    document.documentElement.setAttribute("data-theme", themeStr);

    // 2. 🎯 核心记忆点：写入持久化缓存锁，通知全站其他所有页面
    localStorage.setItem("theme", themeStr);

    // 3. 切换按钮的 SVG 图标
    themeToggle.innerHTML = isDark ? moonSVG : sunSVG;
  });
}
