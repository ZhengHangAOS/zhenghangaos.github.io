document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".home-nav");
  const toggle = document.querySelector(".mobile-menu-toggle");
  const closeButton = document.querySelector(".mobile-menu-close");
  const backdrop = document.querySelector(".mobile-nav-backdrop");

  if (!nav || !toggle || !backdrop) return;

  const closeMenu = () => {
    const savedScrollY = document.body.dataset.mobileMenuScrollY;

    nav.classList.remove("mobile-menu-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-open");
    window.isHomepageMobileMenuOpen = false;
    window.dispatchEvent(
      new CustomEvent("homepage:mobile-menu", { detail: { open: false } }),
    );
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    delete document.body.dataset.mobileMenuScrollY;
    if (savedScrollY !== undefined) {
      window.scrollTo(0, Number(savedScrollY));
    }
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("mobile-menu-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("mobile-menu-open", isOpen);
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.dataset.mobileMenuScrollY = String(scrollY);
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }
    window.isHomepageMobileMenuOpen = isOpen;
    window.dispatchEvent(
      new CustomEvent("homepage:mobile-menu", { detail: { open: isOpen } }),
    );
  });

  closeButton?.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
});
