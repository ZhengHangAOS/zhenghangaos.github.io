import { camera } from "./camera.js";

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 处理自适应缩放
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 光照阴影的渲染
renderer.shadowMap.enabled = true; // ✨ 核心：允许渲染器计算阴影
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ✨ 柔和阴影，让阴影边缘带有平滑的过渡
