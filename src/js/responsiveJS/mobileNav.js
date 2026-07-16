document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-responsive-menu]").forEach((nav) => {
    const menuName = nav.dataset.responsiveMenu;
    const openClass = nav.dataset.menuOpenClass || "mobile-menu-open";
    const eventName = nav.dataset.menuEvent;
    const toggle = document.querySelector(
      `[data-responsive-menu-toggle="${menuName}"]`,
    );
    const closeButton = document.querySelector(
      `[data-responsive-menu-close="${menuName}"]`,
    );
    const backdrop = document.querySelector(
      `[data-responsive-menu-backdrop="${menuName}"]`,
    );

    if (!toggle || !closeButton || !backdrop) return;

    const notify = (isOpen) => {
      if (eventName) {
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { open: isOpen, source: menuName },
          }),
        );
      }
    };

    const closeMenu = () => {
      const savedScrollY = document.body.dataset.responsiveMenuScrollY;

      nav.classList.remove(openClass);
      document.body.classList.remove(openClass, "is-responsive-menu-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      delete document.body.dataset.responsiveMenuScrollY;
      notify(false);

      if (savedScrollY !== undefined) window.scrollTo(0, Number(savedScrollY));
    };

    toggle.addEventListener("click", () => {
      const isOpen = !nav.classList.contains(openClass);
      if (!isOpen) {
        closeMenu();
        return;
      }

      const scrollY = window.scrollY;
      document.body.dataset.responsiveMenuScrollY = String(scrollY);
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      nav.classList.add(openClass);
      document.body.classList.add(openClass, "is-responsive-menu-open");
      toggle.setAttribute("aria-expanded", "true");
      notify(true);
    });

    closeButton.addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    window.matchMedia("(min-width: 801px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  });
});
