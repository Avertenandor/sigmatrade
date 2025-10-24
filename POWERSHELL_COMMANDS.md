# PowerShell Commands for SigmaTrade Project

## Общие команды для управления проектом

### 1. Проверка статуса Git
```powershell
# Проверить текущий статус репозитория
git status

# Посмотреть текущую ветку
git branch

# Посмотреть последние коммиты
git log --oneline -10
```

### 2. Коммит изменений
```powershell
# Добавить все изменения в staging
git add .

# Создать коммит с сообщением
git commit -m "feat: Add MEV bot mental map with sandwich attack visualization and Open Graph meta tags"

# Или создать коммит с расширенным описанием
git commit -m "feat: Add MEV bot mental map and social media previews

- Create interactive mental map for MEV bot (sandwich attacks)
- Add translations for MEV map to all 18 languages
- Create Open Graph images for all pages (home, exchange, mev, arbitrage, partner, cooperation, mindmap)
- Add meta-updater.js for dynamic meta tag updates
- Update Open Graph and Twitter Card meta tags
- Add Telegram preview support

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. Push в удаленный репозиторий
```powershell
# Push в текущую ветку с установкой upstream
git push -u origin claude/create-mev-bot-mental-map-011CUSbn7RifDFSuQXpHHmBg

# Если возникает ошибка сети, retry с задержкой:
# Попытка 1
git push -u origin claude/create-mev-bot-mental-map-011CUSbn7RifDFSuQXpHHmBg

# Если не удалось, подождать 2 секунды и попробовать снова
Start-Sleep -Seconds 2
git push -u origin claude/create-mev-bot-mental-map-011CUSbn7RifDFSuQXpHHmBg

# Попытка 3 (подождать 4 секунды)
Start-Sleep -Seconds 4
git push -u origin claude/create-mev-bot-mental-map-011CUSbn7RifDFSuQXpHHmBg

# Попытка 4 (подождать 8 секунд)
Start-Sleep -Seconds 8
git push -u origin claude/create-mev-bot-mental-map-011CUSbn7RifDFSuQXpHHmBg
```

### 4. Создание Pull Request
```powershell
# Если используется GitHub CLI
gh pr create --title "feat: Add MEV bot mental map and social media previews" --body "## Summary
- Added interactive mental map for MEV bot with sandwich attack visualization
- Added translations for MEV map to all 18 languages
- Created Open Graph preview images for all pages
- Added dynamic meta tag updater for beautiful social media previews
- Updated Open Graph and Twitter Card meta tags

## Features
- MEV bot mental map shows sandwich attack flow (mempool monitoring → front-run → victim tx → back-run → profit)
- All pages now have beautiful preview images for Telegram, Facebook, Twitter, VK
- Meta tags update dynamically when switching pages
- SVG images for optimal quality (1200x630px)

## Test Plan
- [ ] Test MEV bot page loads correctly
- [ ] Verify mental map renders and is interactive
- [ ] Check Open Graph previews in Telegram
- [ ] Test meta tag updates when switching pages
- [ ] Verify all language translations work

Generated with Claude Code"
```

## Тестирование социальных превью

### 5. Локальный сервер для тестирования
```powershell
# Запустить простой HTTP сервер (если установлен Python)
python -m http.server 8000

# Или использовать Node.js http-server (если установлен)
npx http-server -p 8000

# Открыть в браузере
Start-Process "http://localhost:8000"
```

### 6. Проверка Open Graph тегов
```powershell
# Открыть Facebook Sharing Debugger
Start-Process "https://developers.facebook.com/tools/debug/"

# Открыть Twitter Card Validator
Start-Process "https://cards-dev.twitter.com/validator"

# Для проверки в Telegram просто отправьте ссылку в любой чат
# Telegram автоматически создаст превью
```

## Управление файлами

### 7. Просмотр файлов проекта
```powershell
# Список всех файлов в директории
Get-ChildItem -Path . -Recurse

# Список только JavaScript файлов
Get-ChildItem -Path . -Filter "*.js" -Recurse

# Список Open Graph изображений
Get-ChildItem -Path "./og-images" -Filter "*.svg"

# Проверить размер файлов
Get-ChildItem -Path . -Recurse | Measure-Object -Property Length -Sum | Select-Object @{Name="Size(MB)";Expression={$_.Sum / 1MB}}
```

### 8. Поиск в файлах
```powershell
# Найти строку во всех файлах
Get-ChildItem -Path . -Recurse -Include "*.js","*.html" | Select-String "mevBotMap"

# Найти и показать контекст (2 строки до и после)
Get-ChildItem -Path . -Recurse -Include "*.js" | Select-String "mevBotMap" -Context 2,2
```

## Очистка и оптимизация

### 9. Очистка кэша и временных файлов
```powershell
# Очистить node_modules (если есть)
Remove-Item -Path "./node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Очистить временные файлы браузера (опционально)
# Chrome cache
Remove-Item -Path "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache\*" -Recurse -Force -ErrorAction SilentlyContinue

# Firefox cache
Remove-Item -Path "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles\*\cache2\*" -Recurse -Force -ErrorAction SilentlyContinue
```

### 10. Проверка и валидация JSON
```powershell
# Проверить валидность JSON файлов локализации
Get-ChildItem -Path "./locales" -Filter "*.json" | ForEach-Object {
    try {
        $json = Get-Content $_.FullName -Raw | ConvertFrom-Json
        Write-Host "✅ $($_.Name) - Valid JSON" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($_.Name) - Invalid JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

## Быстрые команды одной строкой

### 11. Полный цикл: Add → Commit → Push
```powershell
# Один блок команд для быстрого коммита и push
git add . ; git commit -m "feat: Add MEV bot mental map and social previews" ; git push -u origin claude/create-mev-bot-mental-map-011CUSbn7RifDFSuQXpHHmBg
```

### 12. Проверка всех локализаций
```powershell
# Быстро проверить, что все JSON файлы валидны
Get-ChildItem "./locales/*.json" | ForEach-Object { $_ | Get-Content -Raw | ConvertFrom-Json | Out-Null; Write-Host "✅ $($_.Name)" }
```

### 13. Backup проекта
```powershell
# Создать ZIP архив проекта
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
Compress-Archive -Path "./*" -DestinationPath "../sigmatrade_backup_$date.zip" -Force
Write-Host "✅ Backup created: sigmatrade_backup_$date.zip" -ForegroundColor Green
```

## Полезные алиасы для PowerShell профиля

Добавьте эти строки в ваш PowerShell профиль (`$PROFILE`):

```powershell
# Открыть профиль PowerShell для редактирования
notepad $PROFILE

# Добавьте эти алиасы:
function gs { git status }
function ga { git add . }
function gc { param($msg) git commit -m $msg }
function gp { git push }
function gl { git log --oneline -10 }

# Перезагрузить профиль
. $PROFILE
```

## Тестирование в разных браузерах

### 14. Открыть сайт в разных браузерах
```powershell
# Chrome
Start-Process "chrome.exe" "http://localhost:8000"

# Firefox
Start-Process "firefox.exe" "http://localhost:8000"

# Edge
Start-Process "msedge.exe" "http://localhost:8000"

# Открыть все браузеры одновременно
@("chrome.exe", "firefox.exe", "msedge.exe") | ForEach-Object {
    Start-Process $_ "http://localhost:8000"
}
```

## Production Deploy

### 15. Подготовка к деплою
```powershell
# Проверить, что все файлы закоммичены
git status

# Проверить размер SVG файлов
Get-ChildItem "./og-images/*.svg" | ForEach-Object {
    Write-Host "$($_.Name): $([math]::Round($_.Length / 1KB, 2)) KB"
}

# Убедиться, что нет ошибок в консоли браузера
Write-Host "⚠️  Откройте DevTools (F12) и проверьте консоль на ошибки" -ForegroundColor Yellow
```

---

## Итоговый чеклист для деплоя

- [ ] Все изменения закоммичены
- [ ] Push выполнен успешно
- [ ] Pull Request создан
- [ ] Open Graph изображения отображаются корректно
- [ ] Мета-теги обновляются при переключении страниц
- [ ] Проверено в Telegram - превью выглядит красиво
- [ ] MEV ментальная карта работает на всех языках
- [ ] Все JSON файлы локализации валидны

---

**Дата создания:** 2025-01-29
**Версия проекта:** 11.2.0
**Автор:** Claude Code Assistant

🚀 **Готово к деплою!**
