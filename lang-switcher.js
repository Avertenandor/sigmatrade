/* lang-switcher.js */
(() => {
  let selectElement = null;

  function updateSelectedLang() {
    const current = localStorage.getItem("i18n:lang") || (window.I18N && window.I18N.DEFAULT_LOCALE) || "ru";
    // Обновляем select и видимый код языка в хедере
    if (selectElement) selectElement.value = current;
    const codeEl = document.getElementById('languageCode');
    if (codeEl) codeEl.textContent = (current || 'ru').toUpperCase();
  }

  function ensureSwitcher() {
    // Монтируем ТОЛЬКО в шапку сайта — рядом с кнопкой «ВОЙТИ»
    const holder = document.getElementById('languageSelector');
    if (!holder) {
      // На странице нет шапки — не создаём ничего
      return;
    }

    // Если селект уже создан — не дублируем
    let select = holder.querySelector('select.header-lang-select');
    if (!select) {
      select = document.createElement('select');
      select.className = 'header-lang-select';
      holder.appendChild(select);

      // Клик по блоку должен открывать селект
      holder.addEventListener('click', () => {
        select.focus();
        select.click();
      });
    }

    selectElement = select;
    select.innerHTML = '';

    const locales = (window.I18N && window.I18N.AVAILABLE_LOCALES) || ['ru','en'];
    locales.forEach(l => {
      const o = document.createElement('option');
      o.value = l;
      o.textContent = l.toUpperCase();
      select.appendChild(o);
    });

    updateSelectedLang();

    // Обработчик изменения языка
    select.addEventListener('change', async (e) => {
      const lang = e.target.value;
      if (window.I18N && window.I18N.set) {
        try {
          await window.I18N.set(lang);
          updateSelectedLang();
        } catch (err) {
          console.error('[lang-switcher] Failed to change language:', err);
        }
      }
    });
  }

  // Экспортируем функцию — i18n вызывает её после смены языка
  window.updateLangSwitcher = updateSelectedLang;

  // Инициализация после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(ensureSwitcher, 50));
  } else {
    setTimeout(ensureSwitcher, 50);
  }
})();
