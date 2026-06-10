export function initLanguageSwitch() {
  const langToggle = document.getElementById("lang-toggle");
  let isEn = true;

  if (!langToggle) return;

  langToggle.addEventListener("click", () => {
    isEn = !isEn;
    langToggle.textContent = isEn ? "EN" : "中";
  });
}
