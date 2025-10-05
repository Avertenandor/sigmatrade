# 📐 ПРАВИЛА РАЗРАБОТКИ SIGMATRADE

## 🚫 ЗАПРЕЩЕНО

### 1. Inline-стили (style="...")
**❌ НИКОГДА не использовать:**
```html
<div style="display: none;">...</div>
<button style="color: red;">...</button>
```

**✅ ВСЕГДА использовать CSS классы:**
```html
<div class="hidden">...</div>
<button class="btn-danger">...</button>
```

**Причина:** 
- Чистота кода
- Легкость поддержки
- Переиспользование стилей
- Лучшая производительность
- Соответствие best practices

---

## ✅ ОБЯЗАТЕЛЬНО

### 2. Абсолютные meta-теги

Все meta-теги должны быть **полными и абсолютными** для максимальной совместимости:

**Обязательные теги:**
```html
<!-- Базовые -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">

<!-- Open Graph (все поля) -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://...">
<meta property="og:site_name" content="...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://...">
<meta property="og:image:secure_url" content="https://...">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="...">
<meta property="og:locale" content="ru_RU">

<!-- Twitter Card (все поля) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@...">
<meta name="twitter:creator" content="@...">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://...">
<meta name="twitter:image:alt" content="...">

<!-- iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="...">

<!-- Android / Chrome -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="...">

<!-- Theme Colors -->
<meta name="theme-color" content="#...">
<meta name="msapplication-TileColor" content="#...">

<!-- Safari -->
<meta name="format-detection" content="telephone=no">
<meta name="format-detection" content="date=no">
<meta name="format-detection" content="address=no">
```

**Причина:**
- Поддержка iPhone/iPad/Safari
- Поддержка Android/Chrome
- Правильное отображение в соцсетях (Telegram, VK, Facebook, Instagram)
- PWA функциональность
- Максимальная совместимость

---

### 3. CSS-first подход

**Всегда:**
- Стили в CSS файлах
- Классы для переиспользования
- CSS переменные для цветов и значений
- Утилитарные классы (.hidden, .active, .disabled и т.д.)

**Никогда:**
- Inline стили
- JavaScript для стилизации (только для toggle классов)
- Дублирование стилей

---

### 4. Семантический HTML

**Использовать правильные теги:**
```html
<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>
<h1>-<h6> в правильной иерархии
<button> для кнопок, не <div onclick="">
<a> для ссылок, с href
```

---

### 5. Доступность (A11y)

**Всегда добавлять:**
- `alt` для изображений
- `title` для интерактивных элементов
- `aria-label` где необходимо
- `role` для custom элементов
- Логичный порядок tab-навигации

---

### 6. Производительность

**Обязательно:**
- DNS prefetch для внешних ресурсов
- Preconnect для критичных ресурсов
- Lazy loading для изображений (где уместно)
- Минификация в продакшене
- Оптимизация изображений

---

## 📝 СТАНДАРТЫ КОДА

### JavaScript
- ES6+ синтаксис
- Классы для компонентов
- Async/await вместо callback hell
- Комментарии для сложной логики
- Безопасное логирование (без sensitive данных)

### CSS
- BEM naming convention (опционально, но желательно)
- Mobile-first подход
- CSS переменные для повторяющихся значений
- Комментарии для секций

### HTML
- Правильная структура документа
- Семантические теги
- Валидный HTML5
- Закрывающие теги
- Отступы для читаемости

---

## 🔍 ЧЕКЛИСТ ПЕРЕД КОММИТОМ

- [ ] Нет inline-стилей (style="")
- [ ] Все meta-теги полные и абсолютные
- [ ] CSS классы вместо inline JS стилей
- [ ] Все изображения имеют alt
- [ ] Правильная семантика HTML
- [ ] Код отформатирован
- [ ] Нет console.log с sensitive данными
- [ ] Работает на мобильных устройствах
- [ ] Протестировано в разных браузерах

---

## 🎯 ПРИОРИТЕТЫ

1. **Безопасность** - никаких ключей в коде
2. **Совместимость** - работа на всех устройствах
3. **Чистота кода** - no inline styles, семантика
4. **Производительность** - оптимизация запросов
5. **Доступность** - a11y стандарты
6. **SEO** - правильные meta-теги

---

**Версия правил:** 1.0  
**Дата:** 05.10.2025  
**Обязательны для всех изменений в проекте**
