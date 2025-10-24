/* lang-switcher.js */
(() => {
  let selectElement = null;

  function updateSelectedLang() {
    if (selectElement) {
      const current = localStorage.getItem("i18n:lang") || window.I18N?.DEFAULT_LOCALE || "ru";
      selectElement.value = current;
    }
  }

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
    selectElement = select;
    select.innerHTML = "";
    (window.I18N?.AVAILABLE_LOCALES || ["ru","en"]).forEach(l => {
      const o = document.createElement("option");
      o.value = l; o.textContent = l.toUpperCase();
      select.appendChild(o);
    });
    updateSelectedLang();
    select.addEventListener("change", async (e) => {
      const lang = e.target.value;
      if (window.I18N?.set) {
        await window.I18N.set(lang);
        updateSelectedLang();
      }
    });
  }

  // Expose function globally so I18N can call it after set()
  window.updateLangSwitcher = updateSelectedLang;

  document.addEventListener("DOMContentLoaded", ensureSwitcher);
})();
