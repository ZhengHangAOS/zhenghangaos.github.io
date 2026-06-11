/**
 * /src/js/drag-helper.js
 * 全局自适应：一键激活元素的 鼠标 + 手指 矩阵拖拽滚动（完美修复文章滚动卡死Bug）
 * @param {string} selector - 需要支持拖拽的容器选择器（如 '.planets-box'）
 */
function initResponsiveDrag(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  let isDragging = false;
  let startX, startY, scrollLeft, scrollTop;

  // 统一的按下逻辑
  function startDrag(e) {
    isDragging = true;
    const pageX = e.touches ? e.touches[0].pageX : e.pageX;
    const pageY = e.touches ? e.touches[0].pageY : e.pageY;

    startX = pageX - container.offsetLeft;
    startY = pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
  }

  // 统一的滑动逻辑
  function dragMove(e) {
    // ✨ 核心修复：如果当前并没有在拖拽星球，直接放行，让浏览器正常处理滚动
    if (!isDragging) return;

    // ✨ 核心修复：只有在真正拖拽星球时，才阻止手机浏览器的默认随屏晃动行为
    if (e.touches) {
      e.preventDefault();
    }

    const pageX = e.touches ? e.touches[0].pageX : e.pageX;
    const pageY = e.touches ? e.touches[0].pageY : e.pageY;

    const x = pageX - container.offsetLeft;
    const y = pageY - container.offsetTop;

    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;

    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop = scrollTop - walkY;
  }

  function stopDrag() {
    isDragging = false;
  }

  // 🖱️ 鼠标事件
  container.addEventListener("mousedown", startDrag);
  container.addEventListener("mousemove", dragMove);
  container.addEventListener("mouseup", stopDrag);
  container.addEventListener("mouseleave", stopDrag);

  // 📱 手机触摸事件
  container.addEventListener("touchstart", startDrag, { passive: true });
  container.addEventListener("touchmove", dragMove, { passive: false }); // 必须保持 false 以便在拖拽时能有效拦截
  container.addEventListener("touchend", stopDrag);
}
