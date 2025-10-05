# 🚀 Deploy Commands for SigmaTrade v5.1.0

## 📋 Pre-deployment Checklist

Перед деплоем убедитесь:
- ✅ Создан og-image.jpg через генератор (og-image-generator.html)
- ✅ Размер изображения: 1200x630 пикселей
- ✅ Формат: JPG, качество высокое
- ✅ Файл сохранен в корне проекта
- ✅ Все изменения протестированы локально

---

## 🎯 Deployment Steps

### Шаг 1: Убедитесь что вы в правильной директории

```bash
cd C:\Users\konfu\Desktop\sigmatrade.org
```

### Шаг 2: Проверьте статус git

```bash
git status
```

Должны увидеть измененные файлы:
- modified: index.html
- modified: version.json
- new file: og-image-generator.html
- new file: PREVIEW-GUIDE.md
- new file: DEPLOY-v5.1.0.md
- modified or new: og-image.jpg

---

## 📦 Deployment Commands

### Вариант A: Полный деплой (если og-image.jpg готов)

```bash
# 1. Добавить все файлы
git add og-image.jpg index.html version.json og-image-generator.html PREVIEW-GUIDE.md DEPLOY-v5.1.0.md

# 2. Создать коммит
git commit -m "feat(v5.1.0): Perfect Social Media Preview - Enhanced OG Tags

✨ OG Image Generator:
- Создан генератор превью 1200x630px
- Красивый градиентный дизайн с анимацией
- Логотип Sigma с символом Σ
- Информация о всех трех ботах

🔧 Enhanced Meta Tags:
- Добавлено версионирование ?v=5.1.0 для сброса кеша
- Специальные теги для VK и Telegram
- Улучшенные alt-тексты на русском
- Размеры изображения в Twitter Card

📱 Platform Support:
- Telegram - large image preview
- VK - полная поддержка превью
- Facebook - Open Graph
- Twitter/X - summary_large_image
- Instagram - og:image support

📋 Documentation:
- Файл og-image-generator.html для создания превью
- Подробная инструкция в PREVIEW-GUIDE.md
- Готовые команды для деплоя

🎯 Result:
- Превью 'как у YouTube' - большое и красивое!
- 100% поддержка всех популярных платформ"

# 3. Создать тег версии
git tag -a v5.1.0 -m "Release v5.1.0 - Perfect Social Media Preview

🎨 Идеальное превью для соцсетей
📸 OG Image Generator с красивым дизайном
🔧 Улучшенные мета-теги для всех платформ
📱 100% поддержка Telegram, VK, Facebook, Twitter
📋 Подробная документация и инструкции"

# 4. Отправить на GitHub
git push origin main

# 5. Отправить теги
git push origin --tags
```

### Вариант B: Частичный деплой (если og-image.jpg будет позже)

```bash
# 1. Добавить только код и документацию (БЕЗ og-image.jpg)
git add index.html version.json og-image-generator.html PREVIEW-GUIDE.md DEPLOY-v5.1.0.md

# 2. Создать коммит
git commit -m "feat(v5.1.0): Enhanced Meta Tags + OG Image Generator (image pending)"

# 3. Отправить на GitHub
git push origin main

# 4. ПОЗЖЕ, когда og-image.jpg готов:
git add og-image.jpg
git commit -m "feat(v5.1.0): Add perfect OG image 1200x630"
git tag -a v5.1.0 -m "Release v5.1.0 - Perfect Social Media Preview"
git push origin main --tags
```

---

## ✅ Post-deployment Verification

### 1. Проверка GitHub

Зайдите на: https://github.com/Avertenandor/sigmatrade

Убедитесь что:
- ✅ Коммит v5.1.0 появился
- ✅ Тег v5.1.0 создан
- ✅ Файлы обновлены: index.html, version.json
- ✅ Новые файлы добавлены: og-image-generator.html, PREVIEW-GUIDE.md

### 2. Проверка на сайте

Откройте: https://sigmatrade.org

Проверьте:
- ✅ Footer показывает версию v5.1.0
- ✅ Откройте https://sigmatrade.org/og-image.jpg - изображение загружается
- ✅ View Page Source → найдите мета-теги с ?v=5.1.0

### 3. Проверка превью в соцсетях

#### Telegram:
1. Отправьте ссылку: `https://sigmatrade.org`
2. Должно появиться большое превью с логотипом

#### VK:
1. Создайте пост с ссылкой
2. Превью должно появиться автоматически

#### Facebook Debugger:
1. Откройте: https://developers.facebook.com/tools/debug/
2. Введите: `https://sigmatrade.org`
3. Нажмите "Debug"
4. Нажмите "Scrape Again" для сброса кеша
5. Проверьте что отображается og-image.jpg

#### Twitter Card Validator:
1. Откройте: https://cards-dev.twitter.com/validator
2. Введите: `https://sigmatrade.org`
3. Проверьте preview

---

## 🐛 Troubleshooting

### Проблема: Превью не обновилось в Telegram

**Решение 1:** Добавьте версию к URL
```
https://sigmatrade.org?v=5.1.0
```

**Решение 2:** Подождите 24 часа (кеш Telegram)

**Решение 3:** Используйте специальный бот для сброса кеша:
- @WebpageBot в Telegram
- Отправьте ссылку боту

### Проблема: og-image.jpg не загружается

**Проверка:**
```bash
# Убедитесь что файл добавлен в git
git status

# Проверьте что файл коммитнут
git log --oneline -1

# Проверьте что файл отправлен
git push origin main
```

### Проблема: Неправильный размер превью

**Решение:**
1. Откройте og-image.jpg в редакторе
2. Проверьте размер: должно быть **1200x630 пикселей**
3. Если нет - пересоздайте через og-image-generator.html
4. Сохраните с правильным размером
5. Повторите деплой

---

## 📊 Version Info

**Версия:** v5.1.0  
**Дата:** 05.10.2025  
**Название:** Perfect Social Media Preview  
**GitHub:** https://github.com/Avertenandor/sigmatrade  
**Website:** https://sigmatrade.org

---

## 📝 Release Notes

### v5.1.0 - Perfect Social Media Preview

**Новое:**
- 🎨 Генератор OG изображения (og-image-generator.html)
- 🔧 Улучшенные мета-теги для всех платформ
- 📱 Специальные теги для VK и Telegram
- 📋 Подробная документация (PREVIEW-GUIDE.md)

**Улучшено:**
- Версионирование изображений для сброса кеша
- Alt-тексты на русском языке
- Размеры изображения в Twitter Card
- Поддержка всех популярных соцсетей

**Результат:**
- ✨ Превью "как у YouTube" - большое и красивое!
- 🚀 100% поддержка Telegram, VK, Facebook, Twitter, Instagram
- 💯 Правильные размеры и форматы для всех платформ

---

## 🎉 Success Criteria

Деплой считается успешным когда:
- ✅ Версия v5.1.0 в footer сайта
- ✅ og-image.jpg доступен по https://sigmatrade.org/og-image.jpg
- ✅ Мета-теги обновлены с ?v=5.1.0
- ✅ Превью работает в Telegram (может потребоваться время)
- ✅ Превью работает в VK
- ✅ Facebook Debugger показывает правильное изображение
- ✅ Twitter Card Validator показывает правильное изображение

---

## 📞 Support

Если возникли проблемы:
1. Проверьте PREVIEW-GUIDE.md для детальных инструкций
2. Убедитесь что og-image.jpg правильного размера (1200x630)
3. Используйте инструменты сброса кеша соцсетей
4. Подождите 24 часа для обновления кеша Telegram

**Удачного деплоя! 🚀**