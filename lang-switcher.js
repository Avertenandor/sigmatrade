// Language Switcher Component for SigmaTrade
// Beautiful, animated language selector with flags

function initLanguageSwitcher() {
    const header = document.querySelector('.header-info');
    if (!header) return;

    // Создаем контейнер для переключателя языка
    const langSwitcherHTML = `
        <div class="lang-switcher">
            <button class="lang-switcher-btn" id="langSwitcherBtn" title="Выбрать язык / Choose Language">
                <span class="current-lang">
                    <span class="lang-flag">🇷🇺</span>
                    <span class="lang-code">RU</span>
                </span>
                <svg class="lang-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>

            <div class="lang-dropdown" id="langDropdown">
                <div class="lang-dropdown-header">
                    <span class="lang-dropdown-title">🌍 Выберите язык</span>
                </div>
                <div class="lang-options"></div>
            </div>
        </div>
    `;

    // Вставляем переключатель перед кнопкой входа
    const loginBtn = header.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.insertAdjacentHTML('beforebegin', langSwitcherHTML);
    } else {
        header.insertAdjacentHTML('beforeend', langSwitcherHTML);
    }

    // Заполняем опции языков
    populateLanguageOptions();

    // Инициализируем обработчики событий
    setupLanguageSwitcherEvents();

    // Обновляем текущий язык в кнопке
    updateCurrentLanguageDisplay();
}

function populateLanguageOptions() {
    const langOptionsContainer = document.querySelector('.lang-options');
    if (!langOptionsContainer || !window.i18n) return;

    const languages = window.i18n.getAllLanguages();
    const currentLang = window.i18n.getCurrentLanguage();

    const optionsHTML = Object.entries(languages).map(([code, info]) => `
        <button class="lang-option ${code === currentLang ? 'active' : ''}"
                data-lang="${code}"
                title="${info.name}">
            <span class="lang-option-flag">${info.flag}</span>
            <span class="lang-option-info">
                <span class="lang-option-native">${info.nativeName}</span>
                <span class="lang-option-name">${info.name}</span>
            </span>
            <span class="lang-option-check">✓</span>
        </button>
    `).join('');

    langOptionsContainer.innerHTML = optionsHTML;

    // Добавляем обработчики на каждую опцию
    langOptionsContainer.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', async (e) => {
            const lang = e.currentTarget.getAttribute('data-lang');
            await changeLanguage(lang);
        });
    });
}

function setupLanguageSwitcherEvents() {
    const btn = document.getElementById('langSwitcherBtn');
    const dropdown = document.getElementById('langDropdown');

    if (!btn || !dropdown) return;

    // Открытие/закрытие dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
        btn.classList.toggle('active');
    });

    // Закрытие при клике вне dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lang-switcher')) {
            dropdown.classList.remove('active');
            btn.classList.remove('active');
        }
    });

    // Закрытие при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            btn.classList.remove('active');
        }
    });
}

async function changeLanguage(langCode) {
    if (!window.i18n) return;

    // Показываем индикатор загрузки
    const btn = document.getElementById('langSwitcherBtn');
    if (btn) {
        btn.classList.add('loading');
    }

    try {
        // Меняем язык
        const success = await window.i18n.changeLanguage(langCode);

        if (success) {
            // Обновляем отображение
            updateCurrentLanguageDisplay();

            // Закрываем dropdown
            const dropdown = document.getElementById('langDropdown');
            if (dropdown) {
                dropdown.classList.remove('active');
            }

            // Показываем уведомление
            if (window.showToast) {
                const langInfo = window.i18n.getLanguageInfo(langCode);
                showToast(`🌍 ${langInfo.nativeName}`, 'success');
            }

            // Обновляем список опций
            populateLanguageOptions();
        }
    } catch (error) {
        console.error('Error changing language:', error);
        if (window.showToast) {
            showToast('❌ Ошибка смены языка / Language change error', 'error');
        }
    } finally {
        if (btn) {
            btn.classList.remove('loading');
        }
    }
}

function updateCurrentLanguageDisplay() {
    if (!window.i18n) return;

    const currentLang = window.i18n.getCurrentLanguage();
    const langInfo = window.i18n.getLanguageInfo(currentLang);

    const currentLangElement = document.querySelector('.current-lang');
    if (currentLangElement && langInfo) {
        currentLangElement.innerHTML = `
            <span class="lang-flag">${langInfo.flag}</span>
            <span class="lang-code">${currentLang.toUpperCase()}</span>
        `;
    }

    // Обновляем title кнопки
    const btn = document.getElementById('langSwitcherBtn');
    if (btn && langInfo) {
        btn.title = `${langInfo.nativeName} / ${langInfo.name}`;
    }
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
} else {
    initLanguageSwitcher();
}

// Слушаем событие изменения языка для обновления интерфейса
window.addEventListener('languageChanged', (e) => {
    console.log('Language changed to:', e.detail.language);

    // Перезагружаем некоторые динамические элементы если необходимо
    if (window.app) {
        // Можно обновить динамические элементы приложения
        // app.updateDynamicContent();
    }
});
