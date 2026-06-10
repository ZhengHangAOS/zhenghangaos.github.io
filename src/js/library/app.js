document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     1. 全站通用 theme.js 状态侦听与对齐
     ========================================================================== */
  const themeToggleBtn = document.getElementById("theme-toggle");

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      console.log(`Library layout realigned to: ${currentTheme}`);
    });
  }

  /* ==========================================================================
     3. 动态目录面板系统 
     ========================================================================== */
  const catalogSidebar = document.getElementById("catalog-sidebar");
  const catalogList = document.getElementById("catalog-list");
  const sidebarClose = document.getElementById("sidebar-close");

  // 🎯 修复点 1：只保留一个声明，彻底解决 SyntaxError 卡死问题
  const catalogButtons = document.querySelectorAll(".catalog-btn");

  // 绑定所有目录按钮的异步加载事件
  catalogButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      // 🎯 修复点 2：双重拦截，确保安全
      e.stopPropagation(); // 阻止点击向上传递给 <a> 标签和 document
      e.preventDefault(); // 强行把外层 <a> 标签的页面跳转按在原地

      const jsonPath = btn.getAttribute("data-catalog");
      if (!jsonPath) return;

      // 展现加载状态并滑出面板
      catalogList.innerHTML = `<li style="opacity:0.5; padding:10px;">Loading catalog...</li>`;
      catalogSidebar.classList.add("active");

      try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error("Catalog fetch failed");

        const data = await response.json();
        catalogList.innerHTML = "";

        const items = Array.isArray(data) ? data : data.menu || [];

        if (items.length === 0) {
          catalogList.innerHTML = `<li style="opacity:0.5; padding:10px;">暂无文章条目</li>`;
          return;
        }

        items.forEach((item) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <a href="/article.html?path=${item.path}" class="catalog-item-link">
              <i class="fa-regular fa-file-lines" style="margin-right: 8px; opacity: 0.7;"></i>
              ${item.title}
            </a>
          `;
          catalogList.appendChild(li);
        });
      } catch (err) {
        console.error(err);
        catalogList.innerHTML = `<li style="color:#ff6b6b; padding:10px;">目录尚不存在</li>`;
      }
    });
  });

  // 关闭面板逻辑
  if (sidebarClose) {
    sidebarClose.addEventListener("click", () => {
      catalogSidebar.classList.remove("active");
    });
  }

  // 点击面板外部空白区域自动收起侧边栏
  document.addEventListener("click", (e) => {
    if (catalogSidebar && catalogSidebar.classList.contains("active")) {
      // 确保点击的不是按钮本身，也不是侧边栏内部
      if (!catalogSidebar.contains(e.target)) {
        catalogSidebar.classList.remove("active");
      }
    }
  });
});
