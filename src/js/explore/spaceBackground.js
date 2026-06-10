/**
 * 🌠 ZhengHangAOS - Deep Space Background & Meteor Engine (V4 全随机视觉自然版)
 * 升级：
 * 1. 整体尺寸收紧（更细），粒子链缩短（更短）
 * 2. 出生点大范围随机，打破固定轨迹
 * 3. 每一颗流星在重置时，自动随机分配【浓淡、粗细、轨迹长度、颜色星谱】
 */

let starsMesh = null;
let meteorsMesh = null;
let meteorCount = 5; // 同屏流星数量
const trailLength = 18; // 🎯 从 25 减少到 18：整体缩短流星长度

const meteorsData = [];

export function initSpaceBackground(scene) {
  // ==========================================================================
  // 1. 🌌 稠密深邃星空（保持不变）
  // ==========================================================================
  const starsGeo = new THREE.BufferGeometry();
  const starsCount = 5500;
  const posArray = new Float32Array(starsCount * 3);
  const colorsArray = new Float32Array(starsCount * 3);
  const minRadius = 250;
  const maxRadius = 600;

  for (let i = 0; i < starsCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    posArray[i * 3 + 2] = radius * Math.cos(phi);

    const r = 0.85 + Math.random() * 0.15;
    const g = 0.85 + Math.random() * 0.15;
    const b = 0.95 + Math.random() * 0.05;
    const brightness = 0.4 + Math.random() * 0.6;

    colorsArray[i * 3] = r * brightness;
    colorsArray[i * 3 + 1] = g * brightness;
    colorsArray[i * 3 + 2] = b * brightness;
  }

  starsGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
  starsGeo.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

  const starsMat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  starsMesh = new THREE.Points(starsGeo, starsMat);
  scene.add(starsMesh);

  // ==========================================================================
  // 2. 🌠 全随机动态流星系统
  // ==========================================================================
  const totalMeteorPoints = meteorCount * trailLength;
  const meteorsGeo = new THREE.BufferGeometry();
  const meteorPosArray = new Float32Array(totalMeteorPoints * 3);
  const meteorColorsArray = new Float32Array(totalMeteorPoints * 3);

  for (let i = 0; i < meteorCount; i++) {
    meteorsData.push({
      x: 9999,
      y: 9999,
      z: 0,
      speedX: 0,
      speedY: 0,
      speedZ: 0,
      active: false,
      delay: Math.random() * 3.0,
      opacity: 0.0,
      state: "fade_in",
      trailSpread: 0.002, // 独立拖尾间距（控制单根长度）
      baseColor: { r: 1, g: 1, b: 1 }, // 运行中动态覆盖
    });
  }

  for (let k = 0; k < totalMeteorPoints; k++) {
    meteorPosArray[k * 3] = 9999;
    meteorPosArray[k * 3 + 1] = 9999;
    meteorPosArray[k * 3 + 2] = 0;
    meteorColorsArray[k * 3] = 0;
    meteorColorsArray[k * 3 + 1] = 0;
    meteorColorsArray[k * 3 + 2] = 0;
  }

  meteorsGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(meteorPosArray, 3),
  );
  meteorsGeo.setAttribute(
    "color",
    new THREE.BufferAttribute(meteorColorsArray, 3),
  );

  const meteorsMat = new THREE.PointsMaterial({
    size: 3.2, // 🎯 从 5.5 缩小到 3.2：让流星整体物理尺寸变细
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  meteorsMesh = new THREE.Points(meteorsGeo, meteorsMat);
  meteorsMesh.frustumCulled = false;
  scene.add(meteorsMesh);
}

/**
 * 🏃 流星发射台：赋予每一颗流星完全独立的生命特征
 */
function resetMeteor(index) {
  const data = meteorsData[index];

  // ==========================================================================
  // 🎯 改变 1：极大地拓宽随机空间，不再固定在右上死角，满屏错落出现
  // = =========================================================================
  data.x = 100 + Math.random() * 380; // X 轴出生大范围跨度 (100 ~ 480)
  data.y = 120 + Math.random() * 260; // Y 轴出生大范围跨度 (120 ~ 380)
  data.z = -380 - Math.random() * 120; // Z 轴纵深随机，产生前后交错的远近感

  // 速度也随机抖动，产生不同的划落角度
  data.speedX = 350 + Math.random() * 150;
  data.speedY = 280 + Math.random() * 120;
  data.speedZ = (Math.random() - 0.5) * 15;

  // ==========================================================================
  // 🎯 改变 2：动态随机颜色谱库（冷发光星体常见色调）
  // ==========================================================================
  const colorThemes = [
    { r: 0.65, g: 0.85, b: 1.0 }, // 💫 科技冷冰蓝
    { r: 1.0, g: 1.0, b: 1.0 }, // 💫 纯净炽白
    { r: 1.0, g: 0.92, b: 0.75 }, // 💫 璀璨星芒金
    { r: 0.8, g: 0.7, b: 1.0 }, // 💫 星云浅紫蓝
  ];
  const randomColor =
    colorThemes[Math.floor(Math.random() * colorThemes.length)];

  // ==========================================================================
  // 🎯 改变 3：随机注入【浓淡/粗细】因数
  // 通过调整底色亮度保底值（0.35 ~ 1.0），亮者显粗显浓，暗者显细显淡
  // ==========================================================================
  const densityIntensity = 0.25 + Math.random() * 0.65;
  data.baseColor.r = randomColor.r * densityIntensity;
  data.baseColor.g = randomColor.g * densityIntensity;
  data.baseColor.b = randomColor.b * densityIntensity;

  // ==========================================================================
  // 🎯 改变 4：随机控制单根流星的拖尾紧密程度（长度微观随机）
  // ==========================================================================
  data.trailSpread = 0.0014 + Math.random() * 0.0016;

  data.opacity = 0.0;
  data.state = "fade_in";
  data.active = true;
  data.delay = 0.5 + Math.random() * 4.5; // 彻底错开相遇时间
}

/**
 * 🔄 全局帧动态更新处理器
 */
export function updateSpaceBackground(deltaTime) {
  if (!starsMesh || !meteorsMesh) return;

  starsMesh.rotation.y += 0.001 * deltaTime;

  const positions = meteorsMesh.geometry.attributes.position.array;
  const colors = meteorsMesh.geometry.attributes.color.array;
  let needsUpdate = false;
  const cappedDelta = Math.min(deltaTime, 0.1);

  for (let i = 0; i < meteorCount; i++) {
    const data = meteorsData[i];

    if (!data.active) {
      data.delay -= cappedDelta;
      if (data.delay <= 0) {
        resetMeteor(i);
      }
      for (let j = 0; j < trailLength; j++) {
        const vIndex = (i * trailLength + j) * 3;
        positions[vIndex] = 9999;
        positions[vIndex + 1] = 9999;
        colors[vIndex] = 0;
        colors[vIndex + 1] = 0;
        colors[vIndex + 2] = 0;
      }
      needsUpdate = true;
      continue;
    }

    data.x -= data.speedX * cappedDelta;
    data.y -= data.speedY * cappedDelta;
    data.z += data.speedZ * cappedDelta;
    needsUpdate = true;

    if (data.state === "fade_in") {
      data.opacity += cappedDelta * 4.0;
      if (data.opacity >= 1.0) {
        data.opacity = 1.0;
        data.state = "active";
      }
    } else if (data.state === "active") {
      // 拓展划落边界：因为出生点变广了，消失点也往左下方推移，保证划完整个屏幕
      if (data.x < -250 || data.y < -200) {
        data.state = "fade_out";
      }
    } else if (data.state === "fade_out") {
      data.opacity -= cappedDelta * 3.0; // 稍微加快淡出，更干净利落
      if (data.opacity <= 0) {
        data.opacity = 0;
        data.active = false;
        continue;
      }
    }

    // 渲染全随机链式物理拖尾
    for (let j = 0; j < trailLength; j++) {
      const vIndex = (i * trailLength + j) * 3;

      // 使用每颗流星自己专属的拖尾间距 data.trailSpread
      const timeLag = j * data.trailSpread;

      positions[vIndex] = data.x + data.speedX * timeLag;
      positions[vIndex + 1] = data.y + data.speedY * timeLag;
      positions[vIndex + 2] = data.z - data.speedZ * timeLag;

      // 强化尾部拉尖收窄羽化
      const tailFade = Math.pow(1.0 - j / trailLength, 1.8);
      const currentIntensity = data.opacity * tailFade;

      colors[vIndex] = data.baseColor.r * currentIntensity;
      colors[vIndex + 1] = data.baseColor.g * currentIntensity;
      colors[vIndex + 2] = data.baseColor.b * currentIntensity;
    }
  }

  if (needsUpdate) {
    meteorsMesh.geometry.attributes.position.needsUpdate = true;
    meteorsMesh.geometry.attributes.color.needsUpdate = true;
  }
}

// ========================================================
// 🎯 核心修复：打破作用域壁垒，强行挂载至全局 window
// ========================================================
window.toggleSpaceBackground = function (isVisible) {
  // 1. 控制静态星空的可见性（增加未定义保护）
  if (typeof starsMesh !== "undefined" && starsMesh) {
    starsMesh.visible = isVisible;
  }

  // 2. 控制流星引擎的可见性与物理隐藏
  if (typeof meteorsMesh !== "undefined" && meteorsMesh) {
    meteorsMesh.visible = isVisible;

    // 如果是白天模式，强行把后台流星坐标扔出视界，释放计算压力
    if (!isVisible) {
      const positions = meteorsMesh.geometry.attributes.position.array;
      for (let k = 0; k < positions.length / 3; k++) {
        positions[k * 3] = 9999;
        positions[k * 3 + 1] = 9999;
      }
      meteorsMesh.geometry.attributes.position.needsUpdate = true;

      if (typeof meteorsData !== "undefined" && Array.isArray(meteorsData)) {
        meteorsData.forEach((data) => {
          data.active = false;
          data.delay = 1.0 + Math.random() * 4.0;
        });
      }
    }
  }
};
