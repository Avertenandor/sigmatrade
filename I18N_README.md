# SigmaTrade - Multilingual Support / Поддержка многоязычности

## 🌍 Supported Languages / Поддерживаемые языки

- 🇷🇺 Russian (Русский) - `ru`
- 🇰🇿 Kazakh (Қазақша) - `kk`
- 🇨🇳 Chinese (中文) - `zh`
- 🇯🇵 Japanese (日本語) - `ja`
- 🇹🇷 Turkish (Türkçe) - `tr`
- 🇵🇹 Portuguese (Português) - `pt`
- 🇪🇸 Spanish (Español) - `es`
- 🇻🇳 Vietnamese (Tiếng Việt) - `vi`

## 📁 File Structure / Структура файлов

```
sigmatrade/
├── i18n.js                 # Core i18n system / Основная система i18n
├── lang-switcher.js        # Language switcher component / Компонент переключения языков
├── lang-switcher.css       # Language switcher styles / Стили переключателя
├── i18n-auto-apply.js      # Auto-apply translations / Автоматическое применение переводов
└── locales/                # Translation files / Файлы переводов
    ├── ru.json            # Russian / Русский
    ├── kk.json            # Kazakh / Казахский
    ├── zh.json            # Chinese / Китайский
    ├── ja.json            # Japanese / Японский
    ├── tr.json            # Turkish / Турецкий
    ├── pt.json            # Portuguese / Португальский
    ├── es.json            # Spanish / Испанский
    └── vi.json            # Vietnamese / Вьетнамский
```

## 🚀 Features / Возможности

### 1. Automatic Language Detection / Автоматическое определение языка
- Detects browser language / Определяет язык браузера
- Saves user preference in localStorage / Сохраняет выбор пользователя

### 2. Beautiful Language Switcher / Красивый переключатель языков
- Modern, animated design / Современный анимированный дизайн
- Country flags with emojis / Флаги стран с эмодзи
- Dropdown menu with all languages / Выпадающее меню со всеми языками
- Smooth transitions and hover effects / Плавные переходы и эффекты наведения

### 3. Complete Translation Coverage / Полное покрытие переводов
- All UI elements / Все элементы интерфейса
- Meta tags (SEO) / Мета-теги (SEO)
- Dynamic content / Динамический контент
- Error messages and notifications / Сообщения об ошибках и уведомления

### 4. Intelligent Caching / Интеллектуальное кэширование
- Loads translations on demand / Загружает переводы по требованию
- Caches in memory / Кэширует в памяти
- Fast language switching / Быстрое переключение языков

## 💻 Usage / Использование

### For Users / Для пользователей

1. Click on the language button in the header / Нажмите на кнопку языка в шапке сайта
2. Select your preferred language / Выберите предпочитаемый язык
3. The site will automatically translate / Сайт автоматически переведется

Your language preference is saved and will be remembered on your next visit.
Ваш выбор языка сохраняется и будет использован при следующем посещении.

### For Developers / Для разработчиков

#### Adding translations to HTML elements:

```html
<!-- Text content -->
<h1 data-i18n="hero.title">Default text</h1>

<!-- HTML content -->
<div data-i18n-html="exchange_bot.warning_text">Default HTML</div>

<!-- Placeholder -->
<input data-i18n-placeholder="login.username_placeholder" placeholder="Default">

<!-- Title attribute -->
<button data-i18n-title="header.copy_email" title="Default">Button</button>
```

#### Using translations in JavaScript:

```javascript
// Get translation
const text = window.i18n.t('transactions.title');

// With parameters
const text = window.i18n.t('notifications.email_copied', { email: 'test@example.com' });

// Change language programmatically
await window.i18n.changeLanguage('en');

// Get current language
const currentLang = window.i18n.getCurrentLanguage();

// Get language info
const langInfo = window.i18n.getLanguageInfo('ru');
// Returns: { name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' }
```

#### Adding a new language:

1. Create a new JSON file in `locales/` directory:
   ```
   locales/de.json
   ```

2. Copy the structure from `ru.json` and translate all values

3. Add language info to `i18n.js`:
   ```javascript
   this.supportedLanguages = {
       // ... existing languages
       de: { name: 'Немецкий', flag: '🇩🇪', nativeName: 'Deutsch' }
   };
   ```

4. The language will automatically appear in the language switcher

## 🎨 Customization / Настройка

### Styling the language switcher

Edit `lang-switcher.css` to customize colors, animations, and layout:

```css
.lang-switcher-btn {
    background: your-custom-gradient;
    border-color: your-custom-color;
}
```

### Modifying translations

Edit the corresponding JSON file in `locales/` directory. All changes will be automatically applied after page refresh.

## 🔧 Technical Details / Технические детали

### Translation Format

JSON structure with nested keys:

```json
{
  "header": {
    "wallet_label": "Кошелек:",
    "login_btn": "Войти"
  },
  "hero": {
    "title": "Пока все болтают, мы работаем"
  }
}
```

### Event System

The i18n system dispatches events:

```javascript
// Listen for language changes
window.addEventListener('languageChanged', (e) => {
    console.log('New language:', e.detail.language);
    // Update your dynamic content here
});
```

### Fallback System

If a translation is not found:
1. Try the current language
2. Fallback to Russian (ru)
3. Return the translation key as-is

## 📱 Mobile Support / Поддержка мобильных устройств

The language switcher is fully responsive:
- Dropdown on desktop / Выпадающее меню на десктопе
- Bottom sheet on mobile / Нижняя панель на мобильных
- Touch-friendly interface / Сенсорный интерфейс
- Gesture support / Поддержка жестов

## ⚡ Performance / Производительность

- Lazy loading of translations / Ленивая загрузка переводов
- Minimal bundle size / Минимальный размер бандла
- Efficient DOM updates / Эффективные обновления DOM
- No external dependencies / Нет внешних зависимостей

## 🐛 Troubleshooting / Решение проблем

### Language not switching

1. Check browser console for errors
2. Verify translation file exists in `locales/` directory
3. Clear browser cache and reload

### Missing translations

1. Check if the translation key exists in the JSON file
2. Verify JSON syntax (no trailing commas, proper quotes)
3. Check browser console for warnings

### Styling issues

1. Ensure `lang-switcher.css` is loaded
2. Check for CSS conflicts with existing styles
3. Verify CSS custom properties are defined

## 📄 License / Лицензия

This i18n system is part of SigmaTrade platform.
© 2025 SigmaTrade. All rights reserved.

## 🤝 Contributing / Участие в разработке

To improve translations or add new languages:

1. Edit the corresponding JSON file
2. Test on the local site
3. Submit your changes

For translation quality issues, please contact: trdgood00@gmail.com
