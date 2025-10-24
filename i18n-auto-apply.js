/* i18n-auto-apply.js */
document.addEventListener("DOMContentLoaded", () => {
  if (window.I18N && typeof window.I18N.init === "function") {
    window.I18N.init();
  } else {
    console.error("I18N not found");
  }
});
