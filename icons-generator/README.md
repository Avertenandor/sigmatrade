# 🎨 Генераторы иконок SigmaTrade

## 📋 Инструкция по использованию

В этой папке находятся HTML-генераторы для создания всех графических ресурсов проекта SigmaTrade.

### Шаги для создания иконок:

1. **Откройте каждый HTML файл в браузере** (просто двойной клик на файле)
2. **Проверьте, как выглядит иконка** на canvas
3. **Нажмите кнопку "Скачать"** - файл скачается автоматически с правильным именем
4. **Переместите скачанный файл** из папки "Загрузки" в корень проекта `C:\Users\konfu\Desktop\sigmatrade.org\`

### Список генераторов:

1. **generate-favicon-16.html** → создаст `favicon-16x16.png`
2. **generate-favicon-32.html** → создаст `favicon-32x32.png`
3. **generate-apple-icon.html** → создаст `apple-touch-icon.png`
4. **generate-icon-192.html** → создаст `icon-192x192.png`
5. **generate-icon-512.html** → создаст `icon-512x512.png`
6. **generate-og-image.html** → создаст `og-image.jpg`

### Быстрый способ открыть все файлы:

**Windows PowerShell:**
```powershell
cd "C:\Users\konfu\Desktop\sigmatrade.org\icons-generator"
start generate-favicon-16.html
start generate-favicon-32.html
start generate-apple-icon.html
start generate-icon-192.html
start generate-icon-512.html
start generate-og-image.html
```

### После скачивания всех иконок:

1. Убедитесь, что все 6 файлов находятся в корне проекта:
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png`
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `og-image.jpg`

2. Можете удалить папку `icons-generator` (она больше не нужна)

3. Сделайте коммит:
   ```bash
   git add .
   git commit -m "assets: add all required icons and og-image"
   git push origin main
   ```

## 🎨 Дизайн иконок

Все иконки используют единый стиль:
- **Темный фон:** #0a0a0a
- **Символ:** Σ (греческая сигма)
- **Градиент:** от #00d4ff (cyan) до #7c3aed (purple)
- **Стиль:** Современный, технологичный, минималистичный

Для больших иконок добавлены декоративные элементы в стиле tech/hacker.

---

**Удачи! После создания иконок проект будет полностью готов к продакшену! 🚀**
