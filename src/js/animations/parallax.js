export const mouseState = {
  targetX: 0,
  targetY: 0,
};

export function initParallax() {
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener("mousemove", (event) => {
    const mouseX = event.clientX - windowHalfX;
    const mouseY = event.clientY - windowHalfY;
    mouseState.targetX = mouseX * 0.001;
    mouseState.targetY = mouseY * 0.001;
  });
}
