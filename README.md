# SigmaTrade - Многостраничная платформа мониторинга торговых ботов

![Version](https://img.shields.io/badge/Version-3.0.0-blue)
![SigmaTrade](https://img.shields.io/badge/Status-Active-success)
![BSC](https://img.shields.io/badge/Network-BSC-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 О проекте

**"Пока все болтают, мы работаем"**

SigmaTrade - это профессиональная многостраничная платформа для мониторинга семейства торговых ботов в реальном времени. Проект отслеживает работу трёх ботов на Binance Smart Chain: бота-обменника, МЭВ-бота и арбитражного бота.

## 🤖 Семейство ботов

- **🔄 Бот-обменник** - автоматический обмен криптовалют 24/7
- **💼 МЭВ-бот** - максимальная извлекаемая ценность (MEV)
- **📊 Арбитражный бот** - межбиржевой арбитраж

## ✨ Возможности v3.0.0

### 🆕 Новое в v3.0.0 (MAJOR UPDATE)
- 📄 **Многостраничная структура** - 3 отдельные страницы для каждого бота
- 🧭 **URL hash navigation** - прямые ссылки (#exchange, #mev, #arbitrage)
- 📱 **Мобильное меню** - hamburger навигация для мобильных устройств
- 🎭 **Hero секции** - презентационные секции с описаниями
- 💳 **Info cards** - детальное описание возможностей ботов
- 🎨 **Page-specific colors** - уникальные accent цвета для каждого бота
- ✨ **Плавные переходы** - анимации между страницами
- 🏷️ **Footer версия** - отображение текущей версии
- ⚡ **Оптимизация** - мониторинг только на активной странице

### 🚀 Основные возможности
- 🔄 **Мониторинг в реальном времени** через WebSocket
- 💰 **Балансы токенов** - BNB, USDT, CAKE, BUSD в реальном времени
- 📊 **Детальная история транзакций** (BNB + BEP-20 токены)
- 📈 **Общее количество TX** - полное количество транзакций за все время
- ♾️ **Infinite Scroll** - автоматическая подгрузка при прокрутке
- 🎨 **Современный темный UI** с многослойной темой
- 📱 **Полная мобильная адаптация** (iOS Safari, Android Chrome)
- ⚡ **Оптимизация запросов** с умным кешированием
- 🔍 **Фильтры и поиск** по транзакциям
- 🎯 **Точные расчёты** - BigInt для балансов
- 🌐 **SEO оптимизация** и Open Graph теги
- 📲 **PWA поддержка** - установка как приложение
- 🖼️ **Превью для соцсетей** (Telegram, VK, Instagram, Facebook, Twitter)

## 📄 Структура страниц

### 1. Бот-обменник (Главная - #exchange)
- Hero секция с основным слоганом
- Балансы токенов в реальном времени
- Статистика (всего TX, блок, баланс, статус)
- История транзакций с фильтрами
- Infinite scroll для транзакций

### 2. МЭВ-бот (#mev)
- Hero секция с описанием MEV
- Info cards: Скорость, Точность, Доходность
- Статистика МЭВ-операций (в разработке)
- Недавние МЭВ-операции (в разработке)
- Оранжевый accent цвет

### 3. Арбитражный бот (#arbitrage)
- Hero секция с описанием арбитража
- Info cards: Мульти-DEX, Автоматизация, Аналитика
- Статистика арбитражных сделок (в разработке)
- Недавние сделки (в разработке)
- Зеленый accent цвет

## 🚀 Технологии

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Architecture:** Single Page Application (SPA) с hash routing
- **Blockchain:** QuickNode RPC/WSS
- **API:** Etherscan V2 (BSC chainid=56)
- **Network:** Binance Smart Chain (BSC)
- **Navigation:** Hash-based routing (#exchange, #mev, #arbitrage)

## 📦 Структура проекта

```
sigmatrade.org/
├── index.html            # Главная с 3 страницами
├── styles.css            # Стили с навигацией
├── app.js                # Логика + page routing
├── config.js             # Конфигурация
├── toast.js              # Toast уведомления
├── version.json          # История версий
├── manifest.json         # PWA манифест
├── README.md             # Документация
├── DEPLOY-v3.0.0.md      # Инструкции для деплоя
├── TODO-NEXT.md          # План следующих задач
├── ICONS-GUIDE.md        # Инструкция по иконкам
├── .gitignore            # Git исключения
├── robots.txt            # SEO оптимизация
├── sitemap.xml           # Карта сайта
└── [иконки]              # favicon-*.png, og-image.jpg и др.
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

3. Откройте в браузере: 
   - `http://localhost:8000/` - автоматически откроется Exchange
   - `http://localhost:8000/#exchange` - Бот-обменник
   - `http://localhost:8000/#mev` - МЭВ-бот
   - `http://localhost:8000/#arbitrage` - Арбитражный бот

### Деплой на GitHub Pages

1. Перейдите в Settings → Pages
2. Выберите ветку `main` и папку `/root`
3. Сохраните настройки
4. Ваш сайт будет доступен по адресу: 
   - `https://sigmatrade.org/`
   - `https://sigmatrade.org/#exchange`
   - `https://sigmatrade.org/#mev`
   - `https://sigmatrade.org/#arbitrage`

## ⚙️ Конфигурация

Основные настройки находятся в `config.js`:

- `WALLET_ADDRESS` - адрес кошелька для мониторинга
- `QUICKNODE.HTTP` - HTTP endpoint QuickNode
- `QUICKNODE.WSS` - WebSocket endpoint QuickNode
- `ETHERSCAN.API_KEY` - ключ Etherscan API
- `TOKENS` - адреса контрактов токенов (USDT, CAKE, BUSD)
- `INTERVALS` - интервалы обновления данных
- `CACHE` - настройки кеширования (разные TTL)
- `SCROLL` - настройки infinite scroll

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
5. **Page-specific loading** - данные загружаются только на активной странице

## 🎨 Дизайн

- Многослойная темная тема (стиль ChatGPT/Claude)
- Hero секции с градиентными фонами
- Info cards с hover эффектами
- Плавные анимации и переходы
- Адаптивный дизайн для всех устройств
- Деловой стиль с акцентом на профессионализм
- Уникальные accent цвета для каждого бота:
  - Exchange: Синий/Фиолетовый
  - MEV: Оранжевый
  - Arbitrage: Зеленый

## 📱 Мобильная адаптация

Полная поддержка мобильных устройств:
- Hamburger меню для навигации
- Адаптивные Hero секции
- Info cards в колонку
- Оптимизированные шрифты и отступы
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

## 📊 Версии

### v3.0.0 (05.10.2025) - MAJOR UPDATE
- 📄 Многостраничная структура
- 🧭 URL hash navigation
- 📱 Мобильное меню
- 🎭 Hero секции
- 💳 Info cards
- 🎨 Page-specific accent colors

### v2.0.0 (05.10.2025) - MAJOR UPDATE
- 🤖 Визуализация семейства ботов
- 💰 Балансы токенов в реальном времени
- 📈 Общее количество транзакций
- ♾️ Infinite scroll

### v1.2.1 (05.10.2025)
- ✅ Production ready
- 🔑 Etherscan API ключ

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
# Добавить изменения
git add index.html styles.css app.js version.json DEPLOY-v3.0.0.md

# Создать коммит
git commit -m "feat(v3.0.0): Multi-page Structure - Exchange/MEV/Arbitrage Bots"

# Создать тег
git tag -a v3.0.0 -m "Release v3.0.0 - Multi-page Structure"

# Отправить на GitHub
git push origin main
git push origin --tags
```

## 🆘 Поддержка

При возникновении проблем создайте Issue в репозитории проекта.

---

**© 2025 SigmaTrade. Мониторинг блокчейн транзакций** | v3.0.0
