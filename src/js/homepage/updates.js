// src/js/homepage/updates.js

let allRecentData = [];
let currentRecentPage = 0;
const POSTS_PAGE_SIZE = 8;

// 🎯 定义全站统一的默认占位图路径（请确保该路径在你的 public 目录下真实存在）
const DEFAULT_POST_IMG = "/public/images/default/fig00.webp";
const DEFAULT_POST_IMG_small = "/public/images/default/fig01.webp";

/**
 * 核心自动加载系统：读取 JSON 数据并渲染到首页
 */
export async function loadHomePageUpdates() {
  try {
    const [recentRes, recommendRes] = await Promise.all([
      fetch("docs/updates/recent.json"),
      fetch("docs/updates/recommend.json"),
    ]);

    allRecentData = await recentRes.json();
    const recommendData = await recommendRes.json();

    // 1. 渲染 [最近发布]
    if (allRecentData && allRecentData.length > 0) {
      currentRecentPage = 0;
      renderRecentPage(currentRecentPage);
    } else {
      // 没数据时彻底隐藏圆点板块
      const dotsContainer = document.getElementById("posts-pagination-dots");
      if (dotsContainer) dotsContainer.style.display = "none";
    }

    // 2. 🎯 修复：渲染 [推荐内容] （同步加入双重图片兜底保护）
    const recommendContainer = document.getElementById(
      "recommend-stack-container",
    );
    if (recommendContainer && recommendData.length > 0) {
      recommendContainer.innerHTML = recommendData
        .map((item, index) => {
          // 防御 1：若 imgSrc 为空或未指定，JS 直接喂给它默认图
          const safeImg =
            item.imgSrc && item.imgSrc.trim() !== ""
              ? item.imgSrc
              : DEFAULT_POST_IMG;

          return `
            <div 
              class="stack-card glass" 
              style="--i: ${index + 1}; cursor: pointer;" 
              onclick="window.location.href='${item.link}'"
            >
              <div class="img-container">
                <img 
                  src="${safeImg}" 
                  alt="${item.title}" 
                  onerror="this.onerror=null; this.src='${DEFAULT_POST_IMG}';"
                />
              </div>
              <div class="info">
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
              </div>
            </div>
          `;
        })
        .join("");
    }
  } catch (error) {
    console.error("加载首页更新数据失败，请检查配置文件格式:", error);
  }
}

/**
 * 局部切片渲染指定页码的最近发布（手势精调与悬浮气泡版）
 */
function renderRecentPage(pageIndex) {
  const recentContainer = document.getElementById("recent-posts-container");
  if (!recentContainer) return;

  const dotsContainer = document.getElementById("posts-pagination-dots");

  // 数据分页切片
  const start = pageIndex * POSTS_PAGE_SIZE;
  const end = start + POSTS_PAGE_SIZE;
  const pageData = allRecentData.slice(start, end);

  // 清空列表并触发淡入动画
  recentContainer.innerHTML = "";
  recentContainer.classList.remove("fade-in-active");
  void recentContainer.offsetWidth;
  recentContainer.classList.add("fade-in-active");

  // 渲染当前页的数据
  recentContainer.innerHTML = pageData
    .map((post) => {
      // 🎯 防御 1：如果后端 JSON 里的 imgSrc 字段为空或不存在，直接使用默认图
      const safeImg =
        post.imgSrc && post.imgSrc.trim() !== ""
          ? post.imgSrc
          : DEFAULT_POST_IMG_small;

      return `
        <div class="post-item">
          <div class="post-img-wrapper">
            <img 
              src="${safeImg}" 
              alt="icon" 
              onerror="this.onerror=null; this.src='${DEFAULT_POST_IMG_small}';"
            />
          </div>
          
          <h4 class="post-title" data-title="${post.title}" onclick="window.location.href='${post.link}'">
            <span class="title-text">${post.title}</span>
          </h4>
          
          <span class="post-author">${post.author}</span>
          <span class="post-date">${post.date}</span>
        </div>
      `;
    })
    .join("");

  // 刷新底部的圆点
  if (dotsContainer) {
    updatePaginationDots(dotsContainer, pageIndex);
  }
}

/**
 * 动态刷新分页小圆点的状态与事件绑定
 */
function updatePaginationDots(dotsContainer, activeIndex) {
  dotsContainer.innerHTML = "";

  const totalPages = Math.ceil(allRecentData.length / POSTS_PAGE_SIZE);

  if (totalPages <= 1) {
    dotsContainer.style.display = "none";
    return;
  } else {
    dotsContainer.style.display = "flex";
  }

  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement("div");
    dot.className = i === activeIndex ? "dot active" : "dot";

    dot.addEventListener("click", () => {
      if (currentRecentPage === i) return;
      currentRecentPage = i;
      renderRecentPage(currentRecentPage);
    });

    dotsContainer.appendChild(dot);
  }
}
