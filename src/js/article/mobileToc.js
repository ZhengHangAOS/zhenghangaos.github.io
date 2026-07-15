document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".article-toc-toggle");
  const closeButton = document.querySelector(".article-toc-close");
  const toc = document.getElementById("sidebar-left");

  if (!toggle || !closeButton || !toc) return;

  const closeToc = () => {
    const scrollY = document.body.dataset.articleTocScrollY;
    document.body.classList.remove("article-toc-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    delete document.body.dataset.articleTocScrollY;
    if (scrollY !== undefined) window.scrollTo(0, Number(scrollY));
  };

  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("article-toc-open")) {
      closeToc();
      return;
    }

    const scrollY = window.scrollY;
    document.body.dataset.articleTocScrollY = String(scrollY);
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.classList.add("article-toc-open");
    toggle.setAttribute("aria-expanded", "true");
  });

  // 使用事件委托，避免目录内容或文章布局的层叠/重绘影响关闭按钮绑定。
  document.addEventListener("click", (event) => {
    if (event.target.closest(".article-toc-close")) {
      event.preventDefault();
      event.stopPropagation();
      closeToc();
      return;
    }

    if (
      document.body.classList.contains("article-toc-open") &&
      !toc.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      closeToc();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeToc();
  });
});
