/* lang-switcher.js */
(() => {
  function ensureSwitcher() {
    let holder = document.querySelector("[data-lang-switcher]");
    if (!holder) {
      holder = document.createElement("div");
      holder.setAttribute("data-lang-switcher", "");
      holder.className = "lang-switcher";
      holder.innerHTML = `<label style="margin-right:8px;">🌐</label><select id="lang-select"></select>`;
      document.body.appendChild(holder);
    }
    const select = holder.querySelector("#lang-select");
    select.innerHTML = "";
    (window.I18N?.AVAILABLE_LOCALES || ["ru","en"]).forEach(l => {
      const o = document.createElement("option");
      o.value = l; o.textContent = l;
      select.appendChild(o);
    });
    const current = localStorage.getItem("i18n:lang") || window.I18N?.DEFAULT_LOCALE || "ru";
    select.value = current;
    select.addEventListener("change", e => {
      const lang = e.target.value;
      window.I18N?.set(lang);
    });
  }
  document.addEventListener("DOMContentLoaded", ensureSwitcher);
})();
