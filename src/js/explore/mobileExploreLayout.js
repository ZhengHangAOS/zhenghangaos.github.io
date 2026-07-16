document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const panel = document.querySelector(".col-left");
  const toggle = document.querySelector(".explore-left-toggle");
  const close = document.querySelector(".explore-left-close");
  const backdrop = document.querySelector(".explore-left-backdrop");
  const mobileQuery = window.matchMedia("(max-width: 800px)");
  let scrollY = 0;

  const closePanel = () => {
    if (!body.classList.contains("explore-left-open")) return;
    body.classList.remove("explore-left-open");
    toggle?.setAttribute("aria-expanded", "false");
    body.style.position = "";
    body.style.top = "";
    body.style.width = "";
    window.scrollTo(0, scrollY);
  };

  const openPanel = () => {
    if (!mobileQuery.matches || body.classList.contains("explore-left-open")) return;
    scrollY = window.scrollY;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.classList.add("explore-left-open");
    toggle?.setAttribute("aria-expanded", "true");
  };

  toggle?.addEventListener("click", () => {
    if (body.classList.contains("explore-left-open")) closePanel();
    else openPanel();
  });
  close?.addEventListener("click", closePanel);
  backdrop?.addEventListener("click", closePanel);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
  });
  mobileQuery.addEventListener("change", (event) => {
    if (!event.matches) closePanel();
  });
});
