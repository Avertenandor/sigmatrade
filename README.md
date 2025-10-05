# SigmaTrade - Мониторинг блокчейн транзакций

![SigmaTrade](https://img.shields.io/badge/Status-Active-success)
![BSC](https://img.shields.io/badge/Network-BSC-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 О проекте

SigmaTrade - это профессиональный инструмент для мониторинга транзакций блокчейна в реальном времени. Проект использует QuickNode для подключения к Binance Smart Chain и предоставляет удобный интерфейс оператора для отслеживания активности кошелька.

## ✨ Возможности

- 🔄 **Мониторинг в реальном времени** через WebSocket
- 📊 **Детальная история транзакций** 
- 💰 **Отслеживание баланса BNB**
- 🎨 **Современный темный UI** с анимациями
- 📱 **Полная мобильная адаптация** (iOS Safari, Android Chrome)
- ⚡ **Оптимизация запросов** с кешированием
- 🔍 **Фильтры и поиск** по транзакциям
- 🌐 **SEO оптимизация** и Open Graph теги
- 📲 **PWA поддержка** - установка как приложение
- 🖼️ **Превью для соцсетей** (Telegram, VK, Instagram, Facebook, Twitter)

## 🚀 Технологии

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Blockchain:** QuickNode RPC/WSS
- **API:** Etherscan V2 (BSC chainid=56)
- **Network:** Binance Smart Chain (BSC)

## 📦 Структура проекта

```
sigmatrade.org/
├── index.html         # Главная страница
├── styles.css         # Стили (темная тема)
├── app.js             # Основная логика
├── config.js          # Конфигурация
├── manifest.json      # PWA манифест
├── README.md          # Документация
├── ICONS-GUIDE.md     # Инструкция по созданию иконок
├── .gitignore         # Git исключения
├── robots.txt         # SEO оптимизация
├── sitemap.xml        # Карта сайта
└── [иконки]           # favicon-*.png, og-image.jpg и др.
```

## 🔧 Установка и запуск

### Локальный запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/Avertenandor/sigmatrade.git
cd sigmatrade
```

2. Откройте `index.html` в браузере или используйте локальный сервер:
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

3. Откройте в браузере: `http://localhost:8000`

### Деплой на GitHub Pages

1. Перейдите в Settings → Pages
2. Выберите ветку `main` и папку `/root`
3. Сохраните настройки
4. Ваш сайт будет доступен по адресу: `https://avertenandor.github.io/sigmatrade/`

## ⚙️ Конфигурация

Основные настройки находятся в `config.js`:

- `WALLET_ADDRESS` - адрес кошелька для мониторинга
- `QUICKNODE.HTTP` - HTTP endpoint QuickNode
- `QUICKNODE.WSS` - WebSocket endpoint QuickNode
- `INTERVALS` - интервалы обновления данных
- `CACHE` - настройки кеширования

## 🔐 Безопасность

- API ключи не отображаются в UI
- Ключи не логируются в консоль
- Используется HTTPS для всех запросов
- Кеширование для минимизации запросов

## 📈 Оптимизация

Проект использует следующие методы оптимизации:

1. **Кеширование** - минимизация повторных запросов
2. **WebSocket** - эффективное получение обновлений в реальном времени
3. **Пагинация** - ограничение количества загружаемых транзакций
4. **Visibility API** - снижение активности на неактивных вкладках

## 🎨 Дизайн

- Многослойная темная тема (стиль ChatGPT/Claude)
- Плавные анимации и переходы
- Адаптивный дизайн для всех устройств
- Деловой стиль с акцентом на хакерскую эстетику

## 📱 Мобильная адаптация

Полная поддержка мобильных устройств:
- Адаптивная сетка
- Оптимизированные шрифты
- Удобное управление на touch-устройствах
- Поддержка Safari (iOS) и Chrome (Android)
- PWA манифест для установки как приложения
- Apple Touch Icons для iOS
- Тема для мобильных браузеров (theme-color)

## 🌐 SEO и соцсети

### Open Graph теги
- Корректное отображение в Facebook, VK
- Превью с изображением 1200x630
- Локализованные мета-теги (ru-RU)

### Twitter Card
- Large image preview
- Оптимизированные описания

### Общая SEO оптимизация
- Семантическая HTML5 разметка
- robots.txt для индексации
- sitemap.xml для поисковых систем
- Быстрая загрузка и производительность

### Создание иконок
Для полной функциональности необходимо создать иконки.
Подробная инструкция в файле `ICONS-GUIDE.md`

Необходимые файлы:
- `favicon-16x16.png`, `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `icon-192x192.png`, `icon-512x512.png`
- `og-image.jpg` (1200x630) для превью в соцсетях

## 🔗 Полезные ссылки

- [BSCScan](https://bscscan.com)
- [QuickNode Docs](https://www.quicknode.com/docs)
- [Etherscan V2 API](https://docs.etherscan.io/v2-migration)

## 📄 Лицензия

MIT License - свободное использование с указанием авторства

## 👨‍💻 Разработка

Для разработки используется связка Claude + CloudSonet 4.5 Preview в VSCode.

### Команды для деплоя

```bash
# Добавить все изменения
git add .

# Создать коммит
git commit -m "feat: initial project setup"

# Отправить на GitHub
git push origin main
```

## 🆘 Поддержка

При возникновении проблем создайте Issue в репозитории проекта.

---

**© 2025 SigmaTrade. Мониторинг блокчейн транзакций**
