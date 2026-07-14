import { camera, updateHeroCameraForViewport } from "./camera.js";
import { renderer } from "./renderer.js";
import { ambientLight, directionalLight, backLight } from "./lighting.js";
import {
  tiltGroup,
  planetSystem,
  satelliteMesh,
  orbitCurve,
  planetCore, // 引入用于主循环射线检测的实体
} from "./planets/planet.js";
import { atmosphere } from "./atmosphere/atmosphere.js";
import { particlesMesh } from "./particles/particles.js";
import { initDragInteraction } from "./interactions.js";

export const scene = new THREE.Scene();
const clock = new THREE.Clock();

// 创建主循环专用的单例 Raycaster，避免重复创建对象
const mainRaycaster = new THREE.Raycaster();

// ==========================================
// 🚀 性能优化：状态锁与时间累加器
// ==========================================
let isVisible = true;
let isTabVisible = true;
let isWindowFocused = true;
let customTime = 0;
// ==========================================

export function initScene() {
  updateHeroCameraForViewport();

  scene.background = new THREE.Color(0x010308);

  scene.add(ambientLight);
  scene.add(directionalLight);
  scene.add(backLight);

  scene.add(tiltGroup);
  scene.add(atmosphere);
  scene.add(particlesMesh);

  const container = document.getElementById("canvas-container");
  container.appendChild(renderer.domElement);

  // 传入 camera 供交互文件使用
  initDragInteraction(renderer, camera);

  window.addEventListener("resize", updateHeroCameraForViewport);

  // ==========================================
  // 🚀 性能优化：标签页激活与窗口焦点监听器
  // ==========================================
  function updateVisibility() {
    isVisible = isTabVisible && isWindowFocused;
    if (isVisible) clock.getDelta();
  }

  window.addEventListener("visibilitychange", () => {
    isTabVisible = document.visibilityState === "visible";
    updateVisibility();
  });
  window.addEventListener("blur", () => {
    isWindowFocused = false;
    updateVisibility();
  });
  window.addEventListener("focus", () => {
    isWindowFocused = true;
    updateVisibility();
  });
  // ==========================================
}

export function animate() {
  requestAnimationFrame(animate);

  // 后台挂起时切断一切计算与渲染
  if (!isVisible) return;

  customTime += clock.getDelta();

  const interact = window.interactionState;

  // 1. 星球日常基础自转（未进行拖拽交互时才自转）
  if (!window.isLandinging) {
    planetSystem.rotation.y += 0.0005;
  }

  // ==========================================
  // 🚀 新增：鼠标悬浮 Raycaster 帧率节流优化
  // ==========================================
  if (interact && interact.isMouseMoved && !interact.isDragging) {
    mainRaycaster.setFromCamera(interact.mouse, camera);
    const isHovering = mainRaycaster.intersectObject(planetCore).length > 0;
    renderer.domElement.style.cursor = isHovering ? "grab" : "default";

    interact.isMouseMoved = false; // 消费完后重置锁
  }
  // ==========================================

  // 2. 卫星公转逻辑
  if (orbitCurve && satelliteMesh) {
    const orbitSpeed = 0.008;
    const t = (customTime * orbitSpeed) % 1.0;

    const pt = orbitCurve.getPoint(t);
    satelliteMesh.position.set(pt.x, 0, pt.y);
  }

  // 3. 卫星自转
  if (satelliteMesh) {
    satelliteMesh.rotation.y += 0.005;
  }

  // 4. 背景星空缓慢转动
  particlesMesh.rotation.y += 0.0001;

  renderer.render(scene, camera);
}
