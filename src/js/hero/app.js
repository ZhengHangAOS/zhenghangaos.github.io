import { initParallax } from "../animations/parallax.js";
import { initTypewriter } from "./typewriter.js";
import { initThemeToggle } from "../global/heroTheme.js";
import { initLanguageSwitch } from "../global/languageSwitch.js";
import { initLanding } from "./landing.js";
import { initScene, animate } from "../three/scene.js";
import { camera } from "../three/camera.js";

document.addEventListener("DOMContentLoaded", () => {
  initScene();
  animate();

  initTypewriter();
  initThemeToggle();
  initLanguageSwitch();
  initLanding();

  // ======= 接收从主页返回的逆向动画 =======
  const urlParams = new URLSearchParams(window.location.search);
  const isLaunch = urlParams.get("launch");

  if (isLaunch === "true") {
    const uiLayer = document.querySelector(".ui-layer");

    if (uiLayer) {
      // ❌ 删除了 overlay 的初始化与动画

      // 💡 初始化逆向状态：相机埋伏在地表，UI 初始透明
      uiLayer.style.opacity = 0;

      camera.fov = 80;
      camera.position.set(0, 0.5, 4.1);
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);

      const duration = 2.5;
      const commonEase = "power3.out";

      // 1. ✨【新增/修改】广角 FOV 逆向平滑恢复
      gsap.to(camera, {
        fov: 45,
        duration: duration,
        ease: commonEase,
      });

      // 2. ✨【修改】摄像机直接向后拉远，回到太空视点
      gsap.to(camera.position, {
        x: 0,
        y: 2.5,
        z: 16,
        duration: duration,
        ease: commonEase,
        onUpdate: () => {
          camera.updateProjectionMatrix();
          camera.lookAt(0, 0, 0);
        },
      });

      // 3. UI 平滑浮现
      gsap.to(uiLayer, {
        opacity: 1,
        duration: 1.5,
        delay: 0.5, // 🚀 调小延迟，让文字在镜头后退的同时就伴随浮现，动效更紧凑
        ease: "power2.out",
      });
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }
});
