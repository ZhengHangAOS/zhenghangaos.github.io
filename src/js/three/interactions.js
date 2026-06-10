import { planetCore, interactionGroup } from "./planets/planet.js";

const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);

// 创建全局共享的状态挂载（如果你有全局状态管理，也可以挂载到全局状态对象上）
window.interactionState = {
  mouse: new THREE.Vector2(),
  isMouseMoved: false,
  isDragging: false,
};

export function initDragInteraction(renderer, camera) {
  const container = renderer.domElement;
  const raycaster = new THREE.Raycaster();

  let prevX = 0;
  let prevY = 0;

  const state = window.interactionState;

  // 统一的坐标计算函数
  function updateMousePos(e) {
    const rect = container.getBoundingClientRect();
    state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // --- A. 画布内点击事件 ---
  container.addEventListener("mousedown", (e) => {
    updateMousePos(e);
    raycaster.setFromCamera(state.mouse, camera);

    if (raycaster.intersectObject(planetCore).length > 0) {
      state.isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      container.style.cursor = "grabbing";
    }
  });

  // --- B. 画布内移动：仅更新坐标和标记锁，0计算量 ---
  container.addEventListener("mousemove", (e) => {
    if (state.isDragging) return;
    updateMousePos(e);
    state.isMouseMoved = true;
  });

  // --- C. 全局拖拽响应 ---
  window.addEventListener("mousemove", (e) => {
    if (!state.isDragging) return;

    const deltaX = (e.clientX - prevX) * 0.005;
    const deltaY = (e.clientY - prevY) * 0.005;

    interactionGroup.rotateOnWorldAxis(yAxis, deltaX);
    interactionGroup.rotateOnWorldAxis(xAxis, deltaY);

    prevX = e.clientX;
    prevY = e.clientY;
  });

  // --- D. 全局鼠标抬起 ---
  window.addEventListener("mouseup", () => {
    if (state.isDragging) {
      state.isDragging = false;
      // 抬起时标记移动，让主循环立刻重算一次指针样式（防止松开时游标卡在 grabbing）
      state.isMouseMoved = true;
    }
  });
}
