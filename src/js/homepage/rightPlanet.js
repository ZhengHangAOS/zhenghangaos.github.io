// 1. 基于日期的伪随机算法 (确定性抽取) ====================================================
function getDailyPlanet(planetArray) {
  if (!planetArray || planetArray.length === 0) return null;

  const now = new Date();
  const d =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const sinD = Math.abs(Math.sin(d)) * 10000;
  const r = sinD - Math.floor(sinD);

  return planetArray[Math.floor(r * planetArray.length)];
}

// 2. 主初始化逻辑与动态场景构建 ====================================================
export async function initRightPlanet() {
  const container = document.getElementById("right-planet-canvas");
  if (!container) return;

  // ========================== A. 数据拉取 ==========================
  let planetData = null;
  try {
    const indexRes = await fetch("/planets/index.json");
    const planetList = await indexRes.json();

    // 1. 拿到今日星球在索引表里的引用（包含 id 和 file 路径）
    const todayPlanetRef = getDailyPlanet(planetList);

    // 2. 异步拉取该星球的具体 3D 渲染配置数据
    const planetRes = await fetch(todayPlanetRef.file);
    planetData = await planetRes.json();

    // 3. 渲染页面文字
    document.getElementById("tp-galaxy").textContent =
      planetData.galaxySystem || "未知星系";
    document.getElementById("tp-name").textContent = planetData.name;

    // 4. 🎯 核心修复：修正双斜杠错误，并安全地优先使用索引表里的标准 ID
    const targetId = todayPlanetRef.id || planetData.id || "E001";
    document.getElementById("tp-link").href =
      `/pages/explore.html?id=${targetId}`;

    console.log(
      `🔗 [主页生成成功] 今日星球 ID: ${targetId}，跳转链接:`,
      document.getElementById("tp-link").href,
    );
  } catch (err) {
    console.warn("读取星球数据失败，加载默认配置。", err);
    planetData = {
      id: "MOCK",
      name: "系统异常",
      galaxySystem: "本地",
      radius: 4,
      textureImg: "/public/textures/hero/hat_p_12b_02.jpeg",
      visuals: { obliquity: 23.5, rotationSpeed: 1 },
    };
    document.getElementById("tp-galaxy").textContent = "系统名";
    document.getElementById("tp-name").textContent = "星球名";
    document.getElementById("tp-link").href = "/pages/explore.html"; // 异常时至少保证能进探索页
  }

  // ========================== B. 场景与自适应摄像机 ==========================
  const pRadius = planetData.radius || 4;
  let camHeight = 2;
  let camDist = pRadius * 5.75;
  let lightDist = pRadius * 1.5;

  if (pRadius > 5) {
    camHeight = pRadius * 1.5;
    camDist = pRadius * 5.8;
  } else if (pRadius > 0.2 && pRadius < 2) {
    camHeight = pRadius * 0.5;
    camDist = pRadius * 6.0;
  } else if (pRadius <= 0.2) {
    camHeight = pRadius * 0.5;
    camDist = pRadius * 8.0;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    40,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(0, camHeight, camDist);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 5));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.05);
  dirLight.position.set(lightDist, lightDist * 1.5, lightDist);
  scene.add(ambientLight, dirLight);

  // ========================== C. 系统层级设计 ==========================
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = ((planetData.visuals?.obliquity || 0) * Math.PI) / 180;
  tiltGroup.position.y = pRadius / 10;
  scene.add(tiltGroup);

  const interactionGroup = new THREE.Group();
  tiltGroup.add(interactionGroup);

  const planetSystem = new THREE.Group();
  interactionGroup.add(planetSystem);

  const textureLoader = new THREE.TextureLoader();

  // ========================== D. 生成母星 ==========================
  const coreGeo = new THREE.SphereGeometry(pRadius, 64, 64);
  const matParams = { metalness: 0.1 };

  if (planetData.pbr) {
    if (planetData.pbr.clmap)
      matParams.map = textureLoader.load(planetData.pbr.clmap);
    if (planetData.pbr.nmmap) {
      matParams.normalMap = textureLoader.load(planetData.pbr.nmmap);
      matParams.normalScale = new THREE.Vector2(1, 1);
    }
    if (planetData.pbr.rnmap) {
      matParams.roughnessMap = textureLoader.load(planetData.pbr.rnmap);
      matParams.roughness = 1;
    } else {
      matParams.roughness = 0.8;
    }
  } else {
    if (planetData.textureImg)
      matParams.map = textureLoader.load(planetData.textureImg);
    else matParams.color = 0x4aedff;

    matParams.roughness = 0.8;
    if (planetData.visuals?.bumpImg) {
      matParams.bumpMap = textureLoader.load(planetData.visuals.bumpImg);
      matParams.bumpScale = 0.03;
    }
  }

  const planetCore = new THREE.Mesh(
    coreGeo,
    new THREE.MeshStandardMaterial(matParams),
  );
  planetSystem.add(planetCore);

  // ========================== E. 星环系统 ==========================
  if (planetData.rings?.hasRings) {
    const {
      rIn,
      rOut,
      colorMap, // 颜色贴图
      alphaMap, // 透明度贴图

      //color = 0xf0ffff,
      //emissive = 0xd4f2e7,
    } = planetData.rings;

    const ringGeo = new THREE.RingGeometry(rIn, rOut, 64);

    // 半径 UV 映射
    const pos = ringGeo.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      ringGeo.attributes.uv.setXY(i, (v3.length() - rIn) / (rOut - rIn), 0);
    }

    let finalColorMap = null;
    let finalAlphaMap = null;

    if (colorMap) {
      finalColorMap = textureLoader.load(colorMap);
    }

    if (alphaMap) {
      // 1：配置了独立透明贴图
      finalAlphaMap = textureLoader.load(alphaMap);
    } else if (colorMap) {
      // 2：单图兼容
      finalAlphaMap = finalColorMap;
    }

    const ringMat = new THREE.MeshStandardMaterial({
      map: finalColorMap,
      alphaMap: finalAlphaMap,
      transparent: true, // 透明和半透明
      opacity: 1.0,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1,

      //color,
      //emissive,
      //emissiveIntensity: 0.3,
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    planetSystem.add(ring);
  }

  // ========================== F. 卫星系统 ==========================
  const moonsAnimData = [];
  const orbitMaterials = [];
  const isDarkTheme =
    document.documentElement.getAttribute("data-theme") !== "light";

  if (planetData.moons?.count > 0) {
    planetData.moons.satellites.forEach((moon) => {
      const satGroup = new THREE.Group();
      satGroup.rotation.x = (moon.aglx * Math.PI) / 180;
      satGroup.rotation.y = (moon.agly * Math.PI) / 180;
      satGroup.rotation.z = (moon.aglz * Math.PI) / 180;

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

      const satTexFile = moon.textureS || null;
      const satMesh = new THREE.Mesh(
        new THREE.SphereGeometry(moon.radius, 32, 32),
        new THREE.MeshStandardMaterial({
          map: satTexFile ? textureLoader.load(satTexFile) : null,
          color: satTexFile ? 0xffffff : 0xdddddd,
        }),
      );

      satGroup.add(satMesh);
      interactionGroup.add(satGroup);

      moonsAnimData.push({
        mesh: satMesh,
        curve: orbitCurve,
        orbitDays: moon.speed || 27.3,
      });
    });
  }

  const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme") {
        const currentIsDark =
          document.documentElement.getAttribute("data-theme") !== "light";
        orbitMaterials.forEach((mat) => {
          mat.color.setHex(
            currentIsDark ? mat.userData.colorDark : mat.userData.colorLight,
          );
        });
      }
    });
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  // ========================== G. 拖拽交互系统 ==========================
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isDragging = false;
  let isMouseMoved = false;
  let prevX = 0,
    prevY = 0;

  const xAxis = new THREE.Vector3(1, 0, 0);
  const yAxis = new THREE.Vector3(0, 1, 0);

  function updateMousePos(e) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  container.addEventListener("mousemove", (e) => {
    updateMousePos(e);
    isMouseMoved = true;
  });

  container.addEventListener("mousedown", (e) => {
    updateMousePos(e);
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.intersectObject(planetCore).length > 0) {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      container.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const deltaX = (e.clientX - prevX) * 0.005;
      const deltaY = (e.clientY - prevY) * 0.005;

      interactionGroup.rotateOnWorldAxis(yAxis, deltaX);
      interactionGroup.rotateOnWorldAxis(xAxis, deltaY);

      prevX = e.clientX;
      prevY = e.clientY;
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = "grab";
    }
  });

  // ========================== H. 性能优化与动画渲染 ==========================
  const clock = new THREE.Clock();
  const pRotDays = planetData.visuals?.rotationSpeed || 1;
  const planetRotSpeed =
    (0.005 / Math.max(Math.abs(pRotDays), 0.0001)) * Math.sign(pRotDays);

  let CustomTime = 0;

  // 1. 定义三个独立的控制状态
  let isTabActive = document.visibilityState === "visible";
  let isWindowFocused = document.hasFocus(); // 初始化获取当前窗口焦点状态
  let isInViewport = true; // 默认由 Observer 接管赋值

  // 2. 状态恢复时的“防瞬移”处理函数
  function handleResume() {
    // 只有当三个条件同时满足（即真正要恢复渲染的瞬间）
    if (isTabActive && isWindowFocused && isInViewport) {
      clock.getDelta(); // 🌟 核心：在此刻调用一次，吞掉暂停期间积累的巨大时间差
    }
  }

  // 3. 标签页可见性监听 (应对切标签页 / 最小化)
  window.addEventListener("visibilitychange", () => {
    isTabActive = document.visibilityState === "visible";
    handleResume();
  });

  // 4. 窗口焦点监听 (应对打开了别的应用盖住浏览器 / 弹窗)
  window.addEventListener("blur", () => {
    isWindowFocused = false;
  });
  window.addEventListener("focus", () => {
    isWindowFocused = true;
    handleResume();
  });

  // 5. 视口交叉监听 (应对星球大卡片被划走)
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isInViewport = entry.isIntersecting;
        if (isInViewport) handleResume();
      });
    },
    {
      // 阈值设为 0.1，意味着只要卡片露出 10% 就能看到，就开始渲染
      // 当完全（0%）划出屏幕时停止渲染
      threshold: 0.1,
    },
  );
  observer.observe(container);

  // ============= 核心渲染函数 =============
  function animate() {
    // requestAnimationFrame 依然保持运转，但只要不执行 render，GPU 开销就是 0
    requestAnimationFrame(animate);

    // 🛑 终极拦截器：只要有任何一个条件不满足，立刻终止这帧的计算与渲染
    if (!isTabActive || !isWindowFocused || !isInViewport) return;

    // 只有在渲染状态下，才累加 CustomTime
    const delta = clock.getDelta();
    CustomTime += delta;

    // --- 星球本体旋转 ---
    if (!isDragging) {
      planetSystem.rotation.y += planetRotSpeed;
    }

    // --- 鼠标射线检测光标交互 ---
    if (isMouseMoved) {
      if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        container.style.cursor =
          raycaster.intersectObject(planetCore).length > 0 ? "grab" : "default";
      }
      isMouseMoved = false;
    }

    // --- 卫星轨道动画 ---
    moonsAnimData.forEach((moonAnim) => {
      const orbitDays = moonAnim.orbitDays;
      const orbitSpeed =
        (0.08 / Math.max(Math.abs(orbitDays), 0.0001)) * Math.sign(orbitDays);

      const t = (((CustomTime * orbitSpeed) % 1.0) + 1.0) % 1.0;
      const pt = moonAnim.curve.getPoint(t);
      moonAnim.mesh.position.set(pt.x, 0, -pt.y);

      const moonRotSpeed =
        (0.01 / Math.max(Math.abs(orbitDays), 0.0001)) * Math.sign(orbitDays);
      moonAnim.mesh.rotation.y += moonRotSpeed;
    });

    // --- 执行最终渲染 ---
    // 如果你的背景星空和星球在同一个 scene 里，这里一旦停止调用 render，星空和星球都会完美静止
    renderer.render(scene, camera);
  }

  // 启动循环
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// ========================== I. 卡片悬浮视差特效 ==========================
const wrapper = document.querySelector(".today-planet-wrapper");
const TRIGGER_MARGIN = 25;

if (wrapper) {
  wrapper.addEventListener("mousemove", (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x > TRIGGER_MARGIN &&
      x < rect.width - TRIGGER_MARGIN &&
      y > TRIGGER_MARGIN &&
      y < rect.height - TRIGGER_MARGIN
    ) {
      wrapper.classList.add("is-active");
    } else {
      wrapper.classList.remove("is-active");
    }
  });

  wrapper.addEventListener("mouseleave", () => {
    wrapper.classList.remove("is-active");
  });
}
