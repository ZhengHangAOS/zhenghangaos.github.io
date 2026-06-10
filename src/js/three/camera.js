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
