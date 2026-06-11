/**
 * /src/js/drag-helper.js
 * 全局自适应：一键激活元素的 鼠标 + 手指 矩阵拖拽滚动（带全自动文章区域豁免保护）
 * @param {string} selector - 需要支持拖拽的容器选择器（如 '.planets-box'）
 */
function initResponsiveDrag(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  let isDragging = false;
  let startX, startY, scrollLeft, scrollTop;

  // 🛠️ 检查当前触摸/点击的元素是否应该被“豁免”
  function isExempted(target) {
    // 如果用户触摸的是文章正文容器（根据你的类名修改，比如 .article-content, .markdown-body 等）
    // 或者触摸到了长文章内的文字、图片、段落 (p, img, h1, span...)
    if (
      target.closest(".article-container") ||
      target.closest("article") ||
      target.closest(".markdown-body")
    ) {
      return true; // 触发豁免权
    }
    return false;
  }

  // 统一的按下逻辑
  function startDrag(e) {
    // 🌟 豁免检查：如果碰的是文章区域，直接下班，不启动拖拽
    if (isExempted(e.target)) return;

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
    // 🌟 双重保险：如果没有触发拖拽，或者碰的是文章区域，绝对不调用 preventDefault()
    if (!isDragging || isExempted(e.target)) return;

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
  container.addEventListener("touchmove", dragMove, { passive: false });
  container.addEventListener("touchend", stopDrag);
}
