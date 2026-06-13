import {
  initSpaceBackground,
  updateSpaceBackground,
} from "./spaceBackground.js";

let scene, camera, renderer, dirLight, ambientLight;
let currentPlanetBundle = null;
let isSwitching = false;
let isPausedByMoon = false;
let isManualPaused = false; // 🎯 新增：用户手动点击暂停锁
let CustomTime = 0;

// 🌟 新增：性能优化的四级全局状态控制
let isTabActive = true;
let isWindowFocused = true;
let isModalOpen = false;
let isInViewport = true;

const clock = new THREE.Clock();
const container = document.getElementById("planet-canvas-container");
const labelsContainer = document.getElementById("moon-labels-container");
const moonCard = document.getElementById("moon-info-card");

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false,
  isMouseMoved = false,
  prevX = 0,
  prevY = 0;
const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);

/* ==========================================================================
   1. 核心自适应矩阵计算器 (解耦静态配置)
   ========================================================================== */
function getPlanetCamConfig(planetData) {
  const pRadius = planetData.radius || 4;
  const camDist = 1.5 + 5.2 * pRadius;

  let camHeight = 1;
  if (pRadius > 5) camHeight = pRadius * 0.7;
  else if (pRadius > 1) camHeight = pRadius * 0.4;
  else camHeight = pRadius * 0.25;

  const lightDist = pRadius * 1.8;
  return { pRadius, camHeight, camDist, lightDist };
}

/* ==========================================================================
   2. 核心初始化板块 (Core Initialization)
   ========================================================================== */
export function initExplorePlanet() {
  if (!container) return;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    40,
    container.clientWidth / container.clientHeight,
    0.1,
    2000,
  );

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 5));
  container.appendChild(renderer.domElement);

  ambientLight = new THREE.AmbientLight(0x404040, 1.0);
  dirLight = new THREE.DirectionalLight(0xffffff, 1.05);
  dirLight.castShadow = true;
  scene.add(ambientLight, dirLight);

  initDragInteraction();
  initPerformanceObserver();
  initSpaceBackground(scene);

  if (moonCard) {
    const closeBtn = moonCard.querySelector(".btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isPausedByMoon = false;

        gsap.to(moonCard, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            moonCard.style.display = "none";
          },
        });
      });
    }
  }

  if (!window.ExploreApp) window.ExploreApp = {};
  window.ExploreApp.switchToPlanet = switchToPlanet;

  window.ExploreApp.isSwitching = false;

  if (window.ExploreApp) {
    window.ExploreApp.onPlanetChange = (
      oldData,
      newData,
      isInitialLoad,
      direction,
    ) => {
      switchToPlanet(newData, isInitialLoad, direction);
    };
  }

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  console.log("🪐 [3D 引擎] 核心矩阵与切换管道就绪，发送就绪广播...");
  window.dispatchEvent(new Event("planetEngineReady"));

  // 初始化窗口状态
  isTabActive = document.visibilityState === "visible";
  isWindowFocused = document.hasFocus();

  animate();
}

/* ==========================================================================
   3. 电影级等视高极坐标切换管道 (Cinematic Polar Transition Pipeline)
   ========================================================================== */
function updatePlanetPolarPosition(
  bundle,
  mode,
  progress,
  currentCamPos,
  targetConfig,
) {
  const { camDist, camHeight } = targetConfig;
  let angle = 0,
    xLocal = 0,
    zLocal = 0;

  switch (mode) {
    case "exit_left":
      angle = progress * (Math.PI / 2);
      xLocal = -camDist * Math.sin(angle);
      zLocal = -camDist * Math.cos(angle);
      break;
    case "exit_right":
      angle = progress * (Math.PI / 2);
      xLocal = camDist * Math.sin(angle);
      zLocal = -camDist * Math.cos(angle);
      break;
    case "enter_right":
      angle = (1 - progress) * (Math.PI / 2);
      xLocal = camDist * Math.sin(angle);
      zLocal = -camDist * Math.cos(angle);
      break;
    case "enter_left":
      angle = (1 - progress) * (Math.PI / 2);
      xLocal = -camDist * Math.sin(angle);
      zLocal = -camDist * Math.cos(angle);
      break;
  }

  bundle.rootGroup.position.set(
    currentCamPos.x + xLocal,
    currentCamPos.y - camHeight,
    currentCamPos.z + zLocal,
  );
}

function switchToPlanet(planetData, isInitialLoad, direction = 1) {
  if (isSwitching && !isInitialLoad) {
    alert("星体折跃中，请等待当前星球就位！");
    return;
  }

  const newConfig = getPlanetCamConfig(planetData);
  const newBundle = buildPlanetSystem(planetData, newConfig.pRadius);
  scene.add(newBundle.rootGroup);

  isPausedByMoon = false;
  if (moonCard) moonCard.style.display = "none";

  if (isInitialLoad) {
    camera.position.set(0, newConfig.camHeight, newConfig.camDist);
    camera.lookAt(0, 0, 0);
    dirLight.position.set(
      newConfig.lightDist,
      newConfig.lightDist * 1.5,
      newConfig.lightDist,
    );
    if (currentPlanetBundle) disposePlanet(currentPlanetBundle);
    currentPlanetBundle = newBundle;
    newBundle.rootGroup.position.set(0, 0, 0);
    return;
  }

  isSwitching = true;
  if (window.ExploreApp) window.ExploreApp.isSwitching = true;
  if (labelsContainer) labelsContainer.innerHTML = "";

  const oldBundle = currentPlanetBundle;
  const oldConfig = currentPlanetBundle
    ? getPlanetCamConfig(currentPlanetBundle.rawDataset)
    : newConfig;
  currentPlanetBundle = newBundle;

  const isNext = direction === 1;
  const transitionDuration = 1.4;

  const modeOld = isNext ? "exit_left" : "exit_right";
  const modeNew = isNext ? "enter_right" : "enter_left";

  updatePlanetPolarPosition(newBundle, modeNew, 0, camera.position, newConfig);

  const tl = gsap.timeline({
    onComplete: () => {
      if (oldBundle) disposePlanet(oldBundle);
      newBundle.rootGroup.position.set(0, 0, 0);
      isSwitching = false;
      if (window.ExploreApp) window.ExploreApp.isSwitching = false;
    },
  });

  tl.to(
    camera.position,
    {
      x: 0,
      y: newConfig.camHeight,
      z: newConfig.camDist,
      duration: transitionDuration,
      ease: "power2.inOut",
    },
    0,
  );

  tl.to(
    dirLight.position,
    {
      x: newConfig.lightDist,
      y: newConfig.lightDist * 1.5,
      z: newConfig.lightDist,
      duration: transitionDuration,
      ease: "power2.inOut",
    },
    0,
  );

  const tweenController = { progress: 0 };
  tl.to(
    tweenController,
    {
      progress: 1,
      duration: transitionDuration,
      ease: "power2.inOut",
      onUpdate: () => {
        const currentCamPos = camera.position;
        if (oldBundle) {
          updatePlanetPolarPosition(
            oldBundle,
            modeOld,
            tweenController.progress,
            currentCamPos,
            oldConfig,
          );
        }
        updatePlanetPolarPosition(
          newBundle,
          modeNew,
          tweenController.progress,
          currentCamPos,
          newConfig,
        );
      },
    },
    0,
  );
}

/* ==========================================================================
   4. 星体高保真自动化装配生产线 (Procedural Planet Factory)
   ========================================================================== */
function buildPlanetSystem(data, pRadius) {
  const rootGroup = new THREE.Group();

  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = ((data.visuals?.obliquity || 0) * Math.PI) / 180;
  tiltGroup.position.y = pRadius / 10;
  rootGroup.add(tiltGroup);

  const interactionGroup = new THREE.Group();
  tiltGroup.add(interactionGroup);

  const planetSystem = new THREE.Group();
  interactionGroup.add(planetSystem);

  const textureLoader = new THREE.TextureLoader();
  const coreGeo = new THREE.SphereGeometry(pRadius, 64, 64);
  const matParams = { metalness: 0.1, roughness: 0.8 };

  if (data.pbr) {
    if (data.pbr.clmap)
      matParams.map = textureLoader.load("../" + data.pbr.clmap);
    if (data.pbr.nmmap) {
      matParams.normalMap = textureLoader.load("../" + data.pbr.nmmap);
      matParams.normalScale = new THREE.Vector2(1, 1);
    }
    if (data.pbr.rnmap) {
      matParams.roughnessMap = textureLoader.load("../" + data.pbr.rnmap);
      matParams.roughness = 1;
    }
  } else {
    if (data.textureImg)
      matParams.map = textureLoader.load("../" + data.textureImg);
    else matParams.color = 0x4aedff;
    if (data.visuals?.bumpImg) {
      matParams.bumpMap = textureLoader.load("../" + data.visuals.bumpImg);
      matParams.bumpScale = 0.03;
    }
  }

  const planetCore = new THREE.Mesh(
    coreGeo,
    new THREE.MeshStandardMaterial(matParams),
  );
  planetCore.castShadow = planetCore.receiveShadow = true;
  planetSystem.add(planetCore);

  // 🚀 性能优化 1：主星球自转速度缓存提取，避免在 render 中做高频运算
  const pRotDays = data.visuals?.rotationSpeed || 1;
  const pRotSpeedCache =
    (0.005 / Math.max(Math.abs(pRotDays), 0.0001)) * Math.sign(pRotDays);

  const ringMeshes = [];
  if (data.rings?.hasRings) {
    const { rIn, rOut, colorMap, alphaMap } = data.rings;
    const ringGeo = new THREE.RingGeometry(rIn, rOut, 64);
    const pos = ringGeo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      ringGeo.attributes.uv.setXY(i, (v3.length() - rIn) / (rOut - rIn), 0);
    }
    let finalColorMap = colorMap ? textureLoader.load("../" + colorMap) : null;
    const ringMat = new THREE.MeshStandardMaterial({
      map: finalColorMap,
      alphaMap: alphaMap ? textureLoader.load("../" + alphaMap) : finalColorMap,
      transparent: true,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    planetSystem.add(ring);
    ringMeshes.push(ring);
  }

  const moonsData = [];
  const moonMeshes = []; // 🚀 性能优化 2：抽离卫星网格数组池，供 raycaster 直接调用
  const orbitMaterials = [];
  const isDarkTheme =
    document.documentElement.getAttribute("data-theme") !== "light";

  if (data.moons?.count > 0) {
    data.moons.satellites.forEach((moon) => {
      const satGroup = new THREE.Group();
      satGroup.rotation.set(
        ((moon.aglx || 0) * Math.PI) / 180,
        ((moon.agly || 0) * Math.PI) / 180,
        ((moon.aglz || moon.agl || 0) * Math.PI) / 180,
      );

      const orbitCurve = new THREE.EllipseCurve(
        0,
        0,
        moon.obitA,
        moon.obitB,
        0,
        2 * Math.PI,
        false,
        0,
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: isDarkTheme ? 0xffffff : 0x666666,
        transparent: true,
        opacity: 0.4,
      });
      orbitMat.userData = { colorDark: 0xffffff, colorLight: 0x666666 };
      orbitMaterials.push(orbitMat);

      const orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(orbitCurve.getPoints(120)),
        orbitMat,
      );
      orbitLine.rotation.x = Math.PI / 2;
      satGroup.add(orbitLine);

      const satTexFile = moon.textureS ? `${moon.textureS}` : null;
      const satMesh = new THREE.Mesh(
        new THREE.SphereGeometry(moon.radius, 32, 32),
        new THREE.MeshStandardMaterial({
          map: satTexFile ? textureLoader.load(satTexFile) : null,
          color: satTexFile ? 0xffffff : 0xdddddd,
        }),
      );
      satMesh.castShadow = satMesh.receiveShadow = true;
      satMesh.userData = { isMoon: true, rawData: moon };

      satGroup.add(satMesh);
      interactionGroup.add(satGroup);
      moonMeshes.push(satMesh);

      // 🚀 性能优化 3：把公式提出来固化在初始化，彻底解放动画循环算力
      const orbitDays = moon.speed || 27.3;
      const oSpeedCache =
        (0.08 / Math.max(Math.abs(orbitDays), 0.0001)) * Math.sign(orbitDays);
      const mRotSpeedCache =
        (0.01 / Math.max(Math.abs(orbitDays), 0.0001)) * Math.sign(orbitDays);

      moonsData.push({
        mesh: satMesh,
        curve: orbitCurve,
        orbitDays,
        oSpeedCache,
        mRotSpeedCache,
      });
    });
  }

  return {
    rootGroup,
    interactionGroup,
    planetSystem,
    planetCore,
    moonsData,
    moonMeshes,
    orbitMaterials,
    ringMeshes,
    pRadius,
    pRotSpeedCache,
    rawDataset: data,
  };
}

/* ==========================================================================
   5. 全局鼠标拖拽交互系统 (Global Raycast Interaction)
   ========================================================================== */
function initDragInteraction() {
  let clickStartX = 0,
    clickStartY = 0;

  function updateMouse(e) {
    // 🌟 动态获取容器被 CSS 变型/平移后的真实视口矩形
    const rect = container.getBoundingClientRect();

    // 🌟 基于画布的真实物理边界，精准计算归一化设备坐标 (NDC)
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  window.addEventListener("mousemove", (e) => {
    updateMouse(e);
    isMouseMoved = true;
  });

  window.addEventListener("mousedown", (e) => {
    if (isSwitching || !currentPlanetBundle) return;
    if (
      e.target.closest(
        "#system-switcher, #sys-dropdown, #btn-prev, #btn-next, .planet-item, #moon-info-card, .planet-header",
      )
    )
      return;

    clickStartX = e.clientX;
    clickStartY = e.clientY;
    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);

    if (raycaster.intersectObject(currentPlanetBundle.planetCore).length > 0) {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      document.body.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging && !isSwitching && currentPlanetBundle) {
      const deltaX = (e.clientX - prevX) * 0.007;
      const deltaY = (e.clientY - prevY) * 0.007;

      currentPlanetBundle.interactionGroup.rotateOnWorldAxis(yAxis, deltaX);
      currentPlanetBundle.interactionGroup.rotateOnWorldAxis(xAxis, deltaY);
      prevX = e.clientX;
      prevY = e.clientY;
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = "default";
    }
  });

  window.addEventListener("click", (e) => {
    if (isSwitching || !currentPlanetBundle) return;
    if (
      e.target.closest(
        "#system-switcher, #sys-dropdown, #btn-prev, #btn-next, .planet-item, #moon-info-card, .planet-header",
      )
    )
      return;

    const moveDistance = Math.hypot(
      e.clientX - clickStartX,
      e.clientY - clickStartY,
    );
    if (moveDistance > 5) return;

    updateMouse(e);
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
      currentPlanetBundle.moonMeshes,
    ); // 🚀 性能优化复用

    if (intersects.length > 0) {
      const clickedMoon = intersects[0].object;
      const moon = clickedMoon.userData.rawData;
      isPausedByMoon = true;

      const targetVec = new THREE.Vector3();
      clickedMoon.getWorldPosition(targetVec);
      targetVec.project(camera);

      const canvasRect = container.getBoundingClientRect();

      if (moonCard) {
        const screenX =
          (targetVec.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
        const screenY =
          -(targetVec.y * 0.5 - 0.5) * canvasRect.height + canvasRect.top;

        document.getElementById("moon-card-name").textContent = moon.name;
        document.getElementById("moon-card-desc").innerHTML = `
            <div class="moon-card-item">
                <div class="info-group">
                    <span class="label">半径:</span>
                    <span class="value">${moon.radius} R</span>
                </div>
                <div class="info-group">
                    <span class="label">公转:</span>
                    <span class="value">${moon.speed} 天</span>
                </div>
            </div>
            <div class="moon-brief">
                    ${moon.brief}
            </div>
            `;

        moonCard.style.display = "block";
        moonCard.style.visibility = "hidden";
        const cardWidth = moonCard.offsetWidth;
        const cardHeight = moonCard.offsetHeight;

        let targetX = screenX - cardWidth / 2;
        let targetY = screenY - cardHeight / 2;

        const screenMargin = 10;
        if (targetX < screenMargin) targetX = screenMargin;
        if (targetX + cardWidth > window.innerWidth - screenMargin) {
          targetX = window.innerWidth - cardWidth - screenMargin;
        }
        if (targetY < screenMargin) targetY = screenMargin;
        if (targetY + cardHeight > window.innerHeight - screenMargin) {
          targetY = window.innerHeight - cardHeight - screenMargin;
        }

        moonCard.style.visibility = "visible";
        moonCard.style.left = `${targetX}px`;
        moonCard.style.top = `${targetY}px`;

        gsap.fromTo(
          moonCard,
          { opacity: 0, scale: 0.4, transformOrigin: "center center" },
          { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.5)" },
        );
      }
    }
  });
}

/* ==========================================================================
   6. 动画大循环板块 (Render Loop & Performance Optimization)
   ========================================================================== */
function handleResume() {
  // 🌟 修复：移除 !isModalOpen 的限制。无论什么模式，恢复时都必须吞掉积压的时间
  if (isTabActive && isWindowFocused) {
    clock.getDelta();
  }
}

function initPerformanceObserver() {
  // 1. 划走监听：记录容器是否在屏幕内
  const observer = new IntersectionObserver(
    (entries) => {
      isInViewport = entries[0].isIntersecting;
    },
    { threshold: 0.1 },
  );
  if (container) observer.observe(container);

  // 2. 主题切换监听
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme" && currentPlanetBundle) {
        const isDark =
          document.documentElement.getAttribute("data-theme") !== "light";
        currentPlanetBundle.orbitMaterials.forEach((mat) => {
          mat.color.setHex(
            isDark ? mat.userData.colorDark : mat.userData.colorLight,
          );
        });
      }
    });
  }).observe(document.documentElement, { attributes: true });

  // 3. 页面与失焦监听 (优化点 1 & 2)
  window.addEventListener("visibilitychange", () => {
    isTabActive = document.visibilityState === "visible";
    handleResume();
  });
  window.addEventListener("blur", () => {
    isWindowFocused = false;
  });
  window.addEventListener("focus", () => {
    isWindowFocused = true;
    handleResume();
  });

  // 4. Explore 弹窗拦截 (优化点 4)
  const btnExplore = document.getElementById("btn-explore");
  const btnCloseExplore = document.getElementById("close-explore-modal");

  if (btnExplore) {
    btnExplore.addEventListener("click", () => {
      isModalOpen = true;
    });
  }
  if (btnCloseExplore) {
    btnCloseExplore.addEventListener("click", () => {
      isModalOpen = false;
      handleResume();
    });
  }

  // 5. 时空冻结按钮交互 (新增)
  const btnStop = document.getElementById("btn-stop");
  const stopIcon = document.getElementById("stop-icon");

  if (btnStop && stopIcon) {
    btnStop.addEventListener("click", () => {
      isManualPaused = !isManualPaused; // 切换状态

      if (isManualPaused) {
        // 变成播放三角形图标
        stopIcon.className = "fa-solid fa-play";
        btnStop.classList.add("active"); // 可选：可以通过 CSS 给激活状态加个红光或高亮
      } else {
        // 变回暂停两条竖线图标
        stopIcon.className = "fa-solid fa-pause";
        btnStop.classList.remove("active");
        handleResume(); // 恢复时吞掉时差，防止动画跳变
      }
    });
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (!isTabActive || !isWindowFocused) return;

  // 🌟 核心修复：把获取实际时间的动作独立出来，保证时钟内部不积压时间
  const rawDelta = clock.getDelta();

  // 然后再根据暂停状态，决定要不要把这个增量时间注入到动画系统里
  const delta = isManualPaused ? 0 : rawDelta;

  // 🌌 星空背景... (后面代码保持不变)

  // 🌌 2：星空背景。若用户开启手动暂停，背景也停止滚动
  if (!isManualPaused) {
    updateSpaceBackground(delta);
  }

  // 🚫 视口拦截：星球如果被划出屏幕（优化点 3），停止其计算，但渲染出星空
  if (!isInViewport) {
    if (currentPlanetBundle) currentPlanetBundle.rootGroup.visible = false; // 隐藏网格，直接拔除 draw call
    renderer.render(scene, camera);
    return;
  } else if (currentPlanetBundle) {
    currentPlanetBundle.rootGroup.visible = true; // 划入时恢复
  }

  // 🌟 修改点 3：加上 !isManualPaused 条件，手动暂停时不累加全局动画时间轴
  if (!isPausedByMoon && !isSwitching && !isManualPaused) {
    CustomTime += delta;
  }

  if (currentPlanetBundle) {
    const bundle = currentPlanetBundle;

    // 🪐 修改点 4：主星球自转驱动，加上 !isManualPaused 阻断
    if (!isDragging && !isSwitching && !isPausedByMoon && !isManualPaused) {
      bundle.planetSystem.rotation.y += bundle.pRotSpeedCache;
    }

    // 🎯 悬浮判定：保持运行！即使时间冻结了，用户晃动鼠标依然能精准点选并触发 hover 样式
    if (isMouseMoved && !isDragging && !isSwitching) {
      raycaster.setFromCamera(mouse, camera);

      const isCoreHover =
        raycaster.intersectObject(bundle.planetCore).length > 0;
      const isMoonHover =
        raycaster.intersectObjects(bundle.moonMeshes).length > 0; // 🚀 使用预生成的网格池
      const isOverUI = document.querySelector("#system-switcher.open");

      if (!isOverUI) {
        if (isMoonHover) document.body.style.cursor = "pointer";
        else if (isCoreHover) document.body.style.cursor = "grab";
        else document.body.style.cursor = "default";
      }
      isMouseMoved = false;
    }

    // 🛰️ 卫星轨道物理运动机制
    bundle.moonsData.forEach((moonAnim) => {
      // 🌟 修改点 5：只有在没有手动暂停，或者正在切换星球时，才去更新物理位置。
      // 这不仅能彻底冻结卫星公转，还能确保切星时的极坐标极速移动不受干扰
      if (!isManualPaused || isSwitching) {
        const t = (((CustomTime * moonAnim.oSpeedCache) % 1.0) + 1.0) % 1.0;
        const pt = moonAnim.curve.getPoint(t);
        moonAnim.mesh.position.set(pt.x, 0, -pt.y);
      }

      // 🌟 修改点 6：卫星自转驱动，加上 !isManualPaused 阻断
      if (!isSwitching && !isPausedByMoon && !isManualPaused) {
        moonAnim.mesh.rotation.y += moonAnim.mRotSpeedCache;
      }
    });
  }

  // 🌟 核心修改点 7：无论动画是否被手动暂停，最后的 lookAt 和 render 必须维持执行！
  // 这样才能确保用户在暂停状态下，用鼠标拖拽旋转星球，或者点击切换星球时，画面能够实时渲染更新
  camera.lookAt(0, camera.position.y * 0.2, 0);
  renderer.render(scene, camera);
}

/* ==========================================================================
   7. 内存卸载与全局挂载接口 (GC & Global Bridge)
   ========================================================================== */
function disposePlanet(bundle) {
  if (!bundle) return;
  scene.remove(bundle.rootGroup);
  bundle.rootGroup.traverse((child) => {
    if (child.isMesh || child.isLine) {
      child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          if (child.material.normalMap) child.material.normalMap.dispose();
          if (child.material.roughnessMap)
            child.material.roughnessMap.dispose();
          if (child.material.alphaMap) child.material.alphaMap.dispose();
          child.material.dispose();
        }
      }
    }
  });
}

window.scene = scene;
window.disposePlanet = disposePlanet;
window.initExplorePlanet = initExplorePlanet;

window.destroyCurrentPlanetInstance = function () {
  let bundle =
    typeof currentPlanetBundle !== "undefined"
      ? currentPlanetBundle
      : window.currentPlanetBundle;
  if (bundle) disposePlanet(bundle);
  if (typeof currentPlanetBundle !== "undefined") currentPlanetBundle = null;
  window.currentPlanetBundle = null;
};

document.addEventListener("DOMContentLoaded", initExplorePlanet);
