export const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);

// 正前-距离中
camera.position.set(0, 2, 16);
// 正上-距离远
//camera.position.set(-5, 13, 15);

// 让摄像机微微低头，永远盯住坐标原点（球心）
camera.lookAt(0, 0, 0);

const desktopCamera = {
  fov: 45,
  x: 0,
  y: 2,
  z: 16,
};

/**
 * 竖屏视野较窄：仅在移动端拉远镜头，让含星环的完整行星系统留在画面内。
 * 桌面端始终恢复为原有相机参数。
 */
export function updateHeroCameraForViewport() {
  if (window.isLandinging) return;

  if (window.matchMedia("(max-width: 800px)").matches) {
    const mobileFov = 55;
    const outerRadius = 7.5;
    const safeMargin = 1.1;
    const halfVerticalFov = THREE.MathUtils.degToRad(mobileFov / 2);
    const aspect = Math.max(window.innerWidth / window.innerHeight, 0.01);
    const distance = Math.max(
      24,
      (outerRadius * safeMargin) / (Math.tan(halfVerticalFov) * aspect),
    );

    camera.fov = mobileFov;
    camera.position.set(0, distance * 0.125, distance);
  } else {
    camera.fov = desktopCamera.fov;
    camera.position.set(desktopCamera.x, desktopCamera.y, desktopCamera.z);
  }

  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
}
