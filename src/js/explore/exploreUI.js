window.ExploreApp = {
  currentSystem: null,
  currentPlanet: null,
  planetsList: [],
  isTransitioning: false,
  isSwitching: false,
  onPlanetChange: null,
};

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetPlanetId = urlParams.get("planet") || urlParams.get("id");

  // 初始化全局探索应用状态，增加鲁棒性
  window.ExploreApp = window.ExploreApp || {
    isTransitioning: false,
    isSwitching: false,
    planetsList: [],
    currentPlanet: null,
  };

  try {
    const sstRes = await fetch("/planets/sst.json");
    const systems = await sstRes.json();

    // 🎯 1. 初始化现代化下拉菜单
    initSystemSwitcher(systems);

    let initialSys = systems[0];

    if (targetPlanetId) {
      // =========================================================================
      // 🎯 终极优化：利用正则表达式匹配第一个 "0" 之前的所有非数字字母作为目录名
      // 💡 原理：^([^0]+) 意思是从头开始匹配，直到遇到第一个字符 '0' 为止
      //    例如："S004" -> "S", "So001" -> "So", "Kepler003" -> "Kepler"
      // =========================================================================
      const match = String(targetPlanetId).match(/^([^0]+)/);

      if (match && match[1]) {
        const folderName = match[1].toUpperCase(); // 统一转大写，防止大小写坑人

        // 精准去星系总表里匹配 folder 字段
        const matchedSys = systems.find(
          (sys) => sys.folder.toUpperCase() === folderName,
        );

        if (matchedSys) {
          initialSys = matchedSys;
          console.log(
            `🎯 [智能路由] 成功解析 ID "${targetPlanetId}" -> 归属于星系目录: "${folderName}" (${matchedSys.name})`,
          );
        } else {
          console.warn(
            `⚠️ [智能路由] 解析出目录名 "${folderName}"，但在 sst.json 中未找到匹配项。`,
          );
        }
      }
    }

    // 2. 带着精准定位到的星系数据，去加载内部星球
    await loadSystem(initialSys, targetPlanetId);
  } catch (err) {
    console.error("加载星系数据失败：", err);
  }

  // ==========================================
  // 🎯 左右切换按钮逻辑绑定（增加切星高压拦截线）
  // ==========================================
  const prevBtn = document.getElementById("btn-prev");
  const nextBtn = document.getElementById("btn-next");

  if (prevBtn) {
    prevBtn.onclick = () => {
      // 🌟 铁闸门：如果 3D 引擎正在切星，直接返回，不触发任何改字或切星动作（3D端已弹 alert 提示）
      if (window.ExploreApp.isSwitching) return;

      if (window.ExploreApp.isTransitioning) {
        console.warn("检测到残留状态锁，左右切换强行解锁...");
        window.ExploreApp.isTransitioning = false;
      }
      if (typeof switchPlanetByOffset === "function") {
        switchPlanetByOffset(-1);
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      // 🌟 铁闸门：同上，防止右箭头疯狂连点撕裂 UI
      if (window.ExploreApp.isSwitching) return;

      if (window.ExploreApp.isTransitioning) {
        console.warn("检测到残留状态锁，左右切换强行解锁...");
        window.ExploreApp.isTransitioning = false;
      }
      if (typeof switchPlanetByOffset === "function") {
        switchPlanetByOffset(1);
      }
    };
  }

  // 卫星卡片关闭按钮的隐藏点击事件
  const closeMoonBtn = document.getElementById("close-moon-card");
  const moonCard = document.getElementById("moon-info-card");
  if (closeMoonBtn && moonCard) {
    closeMoonBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      moonCard.style.display = "none";
    });
  }
});

/**
 * 🎯 初始化星系切换器与下拉菜单逻辑 (完美规避子元素冒泡冲突)
 */
function initSystemSwitcher(systems) {
  const switcher = document.getElementById("system-switcher");
  const dropdown = document.getElementById("sys-dropdown");

  if (!switcher || !dropdown) return;

  // 1. 点击外壳：只有当精准点击在外壳本体、Logo或名字上时，才执行 toggle
  switcher.addEventListener("click", (e) => {
    // 💡 核心修复：如果点击的目标包含在下拉框内部，说明用户在选星系，不触发外壳的折叠逻辑
    if (dropdown.contains(e.target)) return;

    e.stopPropagation();
    switcher.classList.toggle("open");
  });

  // 2. 点击页面其他任意空白地方：自动收起下拉栏
  document.addEventListener("click", () => {
    switcher.classList.remove("open");
  });

  // 清空原有的写死的内容，防止重复渲染
  dropdown.innerHTML = "";

  // 3. 遍历读取 sst.json 动态加载项
  systems.forEach((sys) => {
    const div = document.createElement("div");
    div.className = "sys-dropdown-item";

    // 🎯 1. 提取安全的图标路径（如果是空字符串，强制转为 null 让 || 拦截）
    const safeIconPath =
      sys.icon && sys.icon.trim() !== "" ? sys.icon : "/planets/icon/atom.webp";

    div.innerHTML = `
    <img src="${safeIconPath}" 
         alt="" 
         onerror="this.onerror=null; this.src='/planets/icon/atom.webp';" />
         
    <span class="sys-item-text">
      <span class="sys-item-name accent-text">${sys.name}</span>
      <span class="sys-item-dist gray-text">${sys.distance} 光年</span>
    </span>`;

    // 点击下拉单项的切星系逻辑
    div.addEventListener("click", (e) => {
      // 阻止冒泡到外壳，防止触发外壳的 toggle 导致菜单被疯狂闪烁关闭
      e.stopPropagation();
      switcher.classList.remove("open");

      // 💡 保底释放：选新系统时，无论上个系统有没有卡死，强制释放锁以载入新界面
      if (window.ExploreApp.isTransitioning) {
        window.ExploreApp.isTransitioning = false;
      }

      if (typeof loadSystem === "function") {
        loadSystem(sys, null);
      }
    });

    dropdown.appendChild(div);
  });
}

/**
  🎯 加载具体星系数据 **/
async function loadSystem(sysData, targetPlanetId) {
  // 🎯 启动时立刻清空上一个星系的残留数据
  window.ExploreApp.planetsList = [];

  const switcherLogo = document.querySelector(".system-switcher .sys-logo");
  if (switcherLogo) {
    // 🎯 核心修复 1：在 JS 层面提前过滤空字符串。如果为空，直接喂给它默认图标
    const safeIcon =
      sysData.icon && sysData.icon.trim() !== ""
        ? sysData.icon
        : "/planets/icon/atom.webp";
    switcherLogo.src = safeIcon;

    // 🎯 核心修复 2：动态挂载 onerror 触底防线，斩断网络 404 导致的内外不一致
    switcherLogo.onerror = function () {
      this.onerror = null; // 防止死循环
      this.src = "/planets/icon/atom.webp";
    };
  }

  document.getElementById("current-sys-name").textContent = sysData.name;
  document.getElementById("current-sys-dist").textContent =
    `距离地球 ${sysData.distance} 光年`;

  // 💡 【核心修复】：结合你的 HTML 结构，完美清除 3D 场景与中央文字面板残留
  const clearCurrent3DPlanet = () => {
    // 1. 销毁 3D 场景中的星球模型
    if (typeof window.destroyCurrentPlanetInstance === "function") {
      window.destroyCurrentPlanetInstance();
    } else {
      if (window.scene && window.currentPlanetBundle) {
        window.scene.remove(window.currentPlanetBundle.rootGroup);
        window.currentPlanetBundle = null;
      }
    }

    // 2. 隐藏卫星卡片残留 UI
    const moonCard = document.getElementById("moon-info-card");
    if (moonCard) moonCard.style.display = "none";

    // ========================================================
    // 🎯 核心修复：精准清理中间大标题、小字描述和阴影层
    // ========================================================
    const midName = document.getElementById("mid-planet-name");
    const midDesc = document.getElementById("mid-planet-desc");
    const planetShadow = document.getElementById("planet-shadow");
    const moonLabels = document.getElementById("moon-labels-container");

    // 将文字变回初始的占位符 "--"（或者设为 ""）
    if (midName) midName.textContent = "--";
    if (midDesc) midDesc.textContent = "--";

    // 顺手隐藏顶部的 header 容器，视觉效果更佳（可选）
    const planetHeader = document.querySelector(".planet-header");
    if (planetHeader) {
      planetHeader.style.opacity = "0"; // 让头部文字淡出隐形
    }

    // 顺手清理 3D 舞台下的网页辅助层（阴影和可能残留的卫星标签）
    if (planetShadow) planetShadow.style.opacity = "0";
    if (moonLabels) moonLabels.innerHTML = "";
  };

  try {
    const sysRes = await fetch(`/planets/${sysData.folder}/index.json`);

    // 🎯 1. 404 错误安全拦截
    if (!sysRes.ok) {
      clearCurrent3DPlanet();
      throw new Error(`Status: ${sysRes.status}`);
    }

    // 🎯 2. 解析出 index.json 的对象数组
    const pConfigs = await sysRes.json();

    // 🎯 3. 如果星系配置为空，清空 3D 星球、刷新空列表并终止
    if (!pConfigs || pConfigs.length === 0) {
      clearCurrent3DPlanet();
      if (typeof renderPlanetList === "function") renderPlanetList();
      return;
    }

    // =========================================================================
    // 🎯 4. 核心修改：因为 pConfigs 内部是 [{id: "S001", file: "..."}, ...]
    //      我们要遍历每一项，精准提取出里面的 .file 路径去请求具体的星球数据！
    // =========================================================================
    const pPromises = pConfigs.map((item) =>
      fetch(item.file).then((res) => (res.ok ? res.json() : null)),
    );

    // 等待所有具体星球的 JSON（如 S001.json, S002.json）全部拉取完毕
    const rawPlanets = await Promise.all(pPromises);

    // 过滤掉因为网络问题或文件不存在导致请求失败的 null 空项
    window.ExploreApp.planetsList = rawPlanets.filter((p) => p !== null);

    // 🎯 5. 驱动左侧现代化列表的渲染
    if (typeof renderPlanetList === "function") {
      renderPlanetList();
    }

    // =========================================================================
    // 🎯 6. 联动修改：通过 URL 传过来的目标 ID (例如 S001) 定位当前激活星球的索引
    // =========================================================================
    let pIndex = 0;
    if (targetPlanetId) {
      const lowerTarget = String(targetPlanetId).toLowerCase();

      // 在拉取到的完整星球数据列表中，比对谁的 id 和传过来的 targetPlanetId 一致
      const idx = window.ExploreApp.planetsList.findIndex((p) => {
        const pId = p && p.id ? String(p.id).toLowerCase() : "";
        return pId === lowerTarget;
      });

      if (idx !== -1) pIndex = idx;
    }

    // 🎯 7. 激活当前选中的星球，通知 3D 引擎渲染
    if (
      window.ExploreApp.planetsList.length > 0 &&
      typeof activatePlanet === "function"
    ) {
      activatePlanet(pIndex, true);
    }
  } catch (err) {
    console.error(`加载星系 [${sysData.name}] 内部星球失败：`, err);

    // 🎯 异常兜底：若网络断开或 404，在此处彻底卸载所有 3D 遗留场景与中央文本
    clearCurrent3DPlanet();
    window.ExploreApp.planetsList = [];
    if (typeof renderPlanetList === "function") renderPlanetList();
  }
}

function renderPlanetList() {
  const container = document.getElementById("planet-list");
  if (!container) return;

  // 1. 保留激活指示器，清空其余所有旧星球子节点
  Array.from(container.children).forEach((child) => {
    if (child.id !== "active-indicator") child.remove();
  });

  // 获取高亮指示器节点
  const indicator = document.getElementById("active-indicator");
  const list = window.ExploreApp.planetsList;

  // 🎯 2. 空状态兜底
  if (!list || list.length === 0) {
    // 💡【核心修复】：如果系统为空，让左侧激活框直接隐形或回归顶部，防止悬空挂在前系统的位置
    if (indicator) {
      indicator.style.opacity = "0";
      indicator.style.transform = "translateY(0px)"; // 归零
    }

    const emptyHint = document.createElement("div");
    emptyHint.className = "planet-item";
    emptyHint.innerHTML = `
      <img src="/public/images/icon/hpg00.webp" class="planet-thumb" >
      <div class="planet-item-text">
        <h4 class="accent-text planet-name">信号中断</h4>
        <p class="gray-text">未观测到星体数据</p>
      </div>
    `;
    container.appendChild(emptyHint);
    return;
  }

  // 🎯 3. 正常渲染时，如果高亮框被隐形了，记得恢复显示
  if (indicator) {
    indicator.style.opacity = "1";
  }

  // 3. 正常遍历渲染你的精致组件（其余逻辑保持你的事件代理或原始绑定不变）
  list.forEach((planet, idx) => {
    const item = document.createElement("div");
    item.className = "planet-item";
    // 🎯 核心改动：把索引和 ID 直接暴露在 DOM 属性上，供全局代理捕获
    item.setAttribute("data-index", idx);
    item.setAttribute("data-planet-id", planet.id);

    item.innerHTML = `
      <img src="${planet.visuals.thumb}" 
           class="planet-thumb" 
           alt=""
           onerror="this.src='/public/images/icon/hpg00.webp'">
      
      <div class="planet-item-text">
        <h4 class="accent-text planet-name">${planet.name}</h4>
        <p class="gray-text">${planet.character || "未知特征"}</p>
      </div>
    `;

    container.appendChild(item);
  });

  // 🎯 4. 终极绝杀：销毁旧代理，重新在父容器上建立唯一的【全局事件代理】
  container.onclick = null;
  container.onclick = function (e) {
    const item = e.target.closest(".planet-item");
    if (!item) return;

    // 🌟 核心拦截：如果 3D 引擎正忙着切星球呢，立刻在这里刹车！
    // 这样既不会执行下方的 activatePlanet 去改中间的标题文字，也不会扰乱 3D 场景
    if (window.ExploreApp && window.ExploreApp.isSwitching) {
      return;
    }

    // 强行把全场的状态锁当场释放，防止被其他文件的隐形错误死锁
    if (window.ExploreApp.isTransitioning) {
      console.warn("检测到残留状态锁，强行清空并执行切换...");
      window.ExploreApp.isTransitioning = false;
    }

    const idx = parseInt(item.getAttribute("data-index"), 10);
    if (isNaN(idx)) return;

    let currentIdx = window.ExploreApp.planetsList.findIndex(
      (p) => p.id === window.ExploreApp.currentPlanet?.id,
    );
    if (currentIdx === -1) currentIdx = 0;
    if (idx === currentIdx) return;

    const direction = idx > currentIdx ? 1 : -1;

    console.log(
      `🚀 全局代理触发成功：正在从 ${currentIdx} 切换到 ${idx}，方向: ${direction}`,
    );

    if (typeof activatePlanet === "function") {
      activatePlanet(idx, false, direction);
    } else {
      if (typeof window.switchToPlanet === "function") {
        window.switchToPlanet(
          window.ExploreApp.planetsList[idx],
          false,
          direction,
        );
      }
    }
  };
}

function switchPlanetByOffset(offset) {
  // 🌟 双重保险：只要过渡锁或者 3D 切星锁任意一个存在，就不允许执行偏移切换
  if (window.ExploreApp.isTransitioning || window.ExploreApp.isSwitching)
    return;

  const list = window.ExploreApp.planetsList;
  if (!list.length) return;
  const currentIdx = list.indexOf(window.ExploreApp.currentPlanet);
  let targetIdx = currentIdx + offset;

  if (targetIdx < 0) targetIdx = list.length - 1;
  if (targetIdx >= list.length) targetIdx = 0;

  activatePlanet(targetIdx, false, offset);
}

function activatePlanet(index, isInitialLoad = false, direction = 1) {
  // 🎯 2. 切换或打开任何星球时，第一步先确保把残留的卫星卡片彻底藏匿
  const moonCard = document.getElementById("moon-info-card");
  if (moonCard) {
    moonCard.style.display = "none";
  }

  const planetData = window.ExploreApp.planetsList[index];
  if (!planetData) return;

  const oldPlanet = window.ExploreApp.currentPlanet;
  window.ExploreApp.currentPlanet = planetData;

  const items = document.querySelectorAll(".planet-item");
  const targetItem = items[index];
  const indicator = document.getElementById("active-indicator");

  // 🎯 5. 新增：移除其余卡片的激活类名，给当前卡片加上 active。
  items.forEach((item) => item.classList.remove("active"));

  if (targetItem && indicator) {
    targetItem.classList.add("active");
    const topPos = targetItem.offsetTop;

    // 💡【核心修复】：从空星系切回正常星系时，强行恢复左侧高亮指示器的显示
    indicator.style.opacity = "1";

    if (isInitialLoad) {
      indicator.style.transition = "none";
      indicator.style.top = topPos + "px";
      targetItem.scrollIntoView({ block: "nearest" });
      setTimeout(() => (indicator.style.transition = ""), 50);
    } else {
      indicator.style.top = topPos + "px";
      targetItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // ========================================================
  // 🎯 核心修复：强行把刚才清除的中央文字标题、描述和隐藏的容器唤醒
  // ========================================================
  const planetHeader = document.querySelector(".planet-header");
  if (planetHeader) {
    planetHeader.style.opacity = "1"; // 重新恢复中央头部文字显示
  }

  const planetShadow = document.getElementById("planet-shadow");
  if (planetShadow) {
    planetShadow.style.opacity = "1"; // 重新恢复网页底部的 3D 视觉阴影层
  }

  // 填入最新的星球精细数据
  document.getElementById("mid-planet-name").textContent = planetData.name;
  document.getElementById("mid-planet-desc").textContent =
    planetData.brief || "正在分析该星体数据...";

  renderRightCards(planetData);

  // 引入 isEngineReady 安全锁
  // 如果 3D 引擎已经准备好，直接触发 3D 切换
  if (window.ExploreApp.isEngineReady && window.ExploreApp.onPlanetChange) {
    window.ExploreApp.isTransitioning = true;
    window.ExploreApp.onPlanetChange(
      oldPlanet,
      planetData,
      isInitialLoad,
      direction,
    );
  } else {
    // 如果 3D 引擎还在慢吞吞地加载，这里只安静地更新数据，不抛出异常。
    // 等 3D 引擎发送 planetEngineReady 时，它会自己来拿这里已经设置好的 currentPlanet。
    console.log(`⏳ 数据先行到位 (${planetData.name})，等待 3D 引擎握手...`);
  }
}

function renderRightCards(planetData) {
  const overviewContainer = document.getElementById("overview-list");
  if (!overviewContainer) return;

  const renderProgress = (val, max) => {
    let segments = "";
    let activeCount = 0;

    if (val >= 0.5) {
      if (val <= 1) {
        activeCount = 1;
      } else {
        const logVal = Math.log(val);
        const logMax = Math.log(max);
        activeCount = Math.floor(1 + 5 * (logVal / logMax));
        activeCount = Math.max(1, Math.min(6, activeCount));
      }
    } else {
      activeCount = 0;
    }

    for (let i = 1; i <= 6; i++) {
      const colorClass = i <= activeCount ? "active" : "";
      segments += `<div class="prog-seg ${colorClass}"></div>`;
    }

    return `<div class="progress-bar">${segments}</div>`;
  };

  // 1. 渲染基础 HTML 结构（已包含 temp-value 类名）
  overviewContainer.innerHTML = `
    <div class="data-row">
      <i class="fa-solid fa-arrow-down data-icon"></i>
      <div class="data-label"><span>GRAVITY</span>${renderProgress(planetData.overview?.gravity || 1, 3)}</div>
      <span class="data-val">${planetData.overview?.gravity || 1} g</span>
    </div>

    <div class="data-row">
      <i class="fa-solid fa-rotate-left data-icon"></i>
      <div class="data-label"><span>ROTATION</span>${renderProgress(planetData.overview?.rotationPeriod || 1, 100)}</div>
      <span class="data-val">${planetData.overview?.rotationPeriod || "--"} Days</span>
    </div>
    
    <div class="data-row">
      <i class="fa-solid fa-ruler-horizontal data-icon"></i>
      <div class="data-label"><span>RADIUS</span>${renderProgress(planetData.radius, 20)}</div>
      <span class="data-val">${planetData.radius} R</span>
    </div>
    
    <div class="data-row">
      <i class="fa-solid fa-temperature-low data-icon"></i>
      <div class="data-label"><span>TEMPERATURE</span></div>
      <span class="data-val temp-value">${planetData.overview?.Temp || "--"} °C</span>
    </div>
    
    <div class="data-row">
      <i class="fa-solid fa-bowling-ball data-icon"></i>
      <div class="data-label"><span>MOON COUNT</span></div>
      <span class="data-val">${planetData.overview?.moonCount || 0}</span>
    </div>
  `;

  // =========================================================================
  // 🎯 2. 核心新增：等上面的 HTML 塞进 DOM 后，立刻抓取温度节点并计算颜色
  // =========================================================================
  const tempSpan = overviewContainer.querySelector(".temp-value");
  if (tempSpan) {
    const rawTemp = planetData.overview?.Temp;
    const tempValue = parseFloat(rawTemp);

    // 只有在能成功解析出数字时才改变颜色，否则保持原始 CSS 默认颜色
    if (!isNaN(tempValue)) {
      if (tempValue < -80) {
        tempSpan.classList.add("temp-frozen"); // 冰蓝色 (远低于舒适)
      } else if (tempValue >= -80 && tempValue < -30) {
        tempSpan.classList.add("temp-cold"); // 浅蓝色 (低于舒适)
      } else if (tempValue >= -30 && tempValue <= 30) {
        tempSpan.classList.add("temp-comfortable"); // 绿色 (舒适范围)
      } else if (tempValue > 30 && tempValue <= 100) {
        tempSpan.classList.add("temp-warm"); // 橙色 (高于舒适)
      } else {
        tempSpan.classList.add("temp-hot"); // 红色 (远高于舒适)
      }
    }
  }
  // =========================================================================

  // 3. 渲染下方的 Highlights 列表
  const hlContainer = document.getElementById("highlight-list");
  if (hlContainer) {
    hlContainer.innerHTML = "";
    if (planetData.highlights) {
      planetData.highlights.forEach((hl) => {
        hlContainer.innerHTML += `
          <div class="highlight-row">
            <img src="/${hl.icon}" class="hl-icon" onerror="this.src='/planets/icon/hl.webp'">
            <div class="gray-text hl-text"><h5>${hl.title}</h5><p>${hl.desc}</p></div>
          </div>
        `;
      });
    }
  }
}

// ========================================================
// 无感主题监听器
// ========================================================
function initThemeObserver() {
  const applyCurrentTheme = () => {
    const isDay =
      document.documentElement.getAttribute("data-theme") === "light";
    if (typeof window.toggleSpaceBackground === "function") {
      window.toggleSpaceBackground(!isDay);
    }
  };
  applyCurrentTheme();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme") applyCurrentTheme();
    });
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

// ========================================================
// 🎯 核心修复：数据层与 3D 渲染层的唯一交接处
// ========================================================
window.addEventListener("planetEngineReady", () => {
  // 打上引擎就绪的标签，解锁 activatePlanet 内部的动画切换权
  window.ExploreApp.isEngineReady = true;

  // 此时去全局抓取 UI 层早就准备好的“目标星球”（完美吃到了 URL 传参）
  const targetPlanet =
    window.ExploreApp.currentPlanet || window.ExploreApp.planetsList[0];

  if (targetPlanet) {
    console.log(
      `✨ 3D 引擎与数据握手成功，直接渲染目标星球: ${targetPlanet.name}`,
    );
    window.ExploreApp.switchToPlanet(targetPlanet, true, 1);
  } else {
    console.warn("⚠️ 3D 引擎已就绪，但网络较慢，仍在等待 JSON 数据解析...");
  }

  initThemeObserver();
});

// 强行挂载全局函数
window.loadSystem = loadSystem;
window.switchPlanetByOffset = switchPlanetByOffset;
window.activatePlanet = activatePlanet;
