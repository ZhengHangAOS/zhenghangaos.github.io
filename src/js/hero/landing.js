import { camera } from "../three/camera.js";
import { planetSystem } from "../three/planets/planet.js";

export function initLanding() {
  const landingBtn = document.getElementById("landing-btn");
  let isLanding = false;

  if (!landingBtn) return;

  landingBtn.addEventListener("click", () => {
    if (isLanding) return;
    isLanding = true;

    window.isLandinging = true;

    const duration = 2.0; // 🚀 去掉白屏后，可以将冲向大气的动画时间缩短一点（比如 2.0s），让节奏更紧凑
    const commonEase = "power3.inOut";

    // 1. UI 层平滑淡出
    gsap.to(".ui-layer", { opacity: 0, duration: 0.8, ease: "power2.inOut" });

    // 2. 星球突然加速旋转
    gsap.to(planetSystem.rotation, {
      y: "+=" + Math.PI * 3.0,
      duration: duration,
      ease: commonEase,
    });

    // 3. 镜头冲向大气层（并瞬间开启广角）
    gsap.to(camera, {
      fov: 80,
      duration: duration,
      ease: commonEase,
    });

    gsap.to(camera.position, {
      x: 0,
      y: 0.5,
      z: 4.1,
      duration: duration,
      ease: commonEase,
      onUpdate: () => {
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
      },
      // ✨【关键修改】当镜头完全冲到地表时，不再变白，直接无缝跳转主页
      onComplete: () => {
        console.log("镜头冲入完毕，直接跳转...");
        window.location.href = "homepage.html";
      },
    });
  });
}
