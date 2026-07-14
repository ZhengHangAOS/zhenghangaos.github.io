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
  let activeTouchId = null;

  const state = window.interactionState;

  // 统一的坐标计算函数
  function updateMousePos({ clientX, clientY }) {
    const rect = container.getBoundingClientRect();
    state.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    state.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function startDrag({ clientX, clientY }) {
    updateMousePos({ clientX, clientY });
    raycaster.setFromCamera(state.mouse, camera);

    if (raycaster.intersectObject(planetCore).length === 0) return false;

    state.isDragging = true;
    prevX = clientX;
    prevY = clientY;
    container.style.cursor = "grabbing";
    return true;
  }

  function drag({ clientX, clientY }) {
    const deltaX = (clientX - prevX) * 0.005;
    const deltaY = (clientY - prevY) * 0.005;

    interactionGroup.rotateOnWorldAxis(yAxis, deltaX);
    interactionGroup.rotateOnWorldAxis(xAxis, deltaY);

    prevX = clientX;
    prevY = clientY;
  }

  function stopDrag() {
    if (!state.isDragging) return;

    state.isDragging = false;
    state.isMouseMoved = true;
    activeTouchId = null;
  }

  // --- A. 画布内点击事件 ---
  container.addEventListener("mousedown", (e) => {
    startDrag(e);
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

    drag(e);
  });

  // --- D. 全局鼠标抬起 ---
  window.addEventListener("mouseup", () => {
    stopDrag();
  });

  // --- E. 触屏拖拽：与鼠标使用相同的命中检测和旋转计算 ---
  container.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      if (startDrag(touch)) {
        activeTouchId = touch.identifier;
        e.preventDefault();
      }
    },
    { passive: false },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!state.isDragging || activeTouchId === null) return;

      const touch = Array.from(e.touches).find(
        ({ identifier }) => identifier === activeTouchId,
      );
      if (!touch) return;

      e.preventDefault();
      drag(touch);
    },
    { passive: false },
  );

  function endTouchDrag(e) {
    if (activeTouchId === null) return;

    const didEnd = Array.from(e.changedTouches).some(
      ({ identifier }) => identifier === activeTouchId,
    );
    if (didEnd) stopDrag();
  }

  window.addEventListener("touchend", endTouchDrag);
  window.addEventListener("touchcancel", endTouchDrag);
}
