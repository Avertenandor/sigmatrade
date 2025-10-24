# ΣIGMATRADE

**Мониторинг блокчейн транзакций в реальном времени**

[![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)](https://github.com/Avertenandor/sigmatrade)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Live](https://img.shields.io/badge/live-sigmatrade.org-brightgreen.svg)](https://sigmatrade.org)

---

## 🎯 О проекте

**SigmaTrade** — профессиональная платформа для мониторинга работы семейства торговых ботов в блокчейне Binance Smart Chain (BSC).

### Слоган
> **"Пока все болтают, мы работаем"** — 24/7 мониторинг, реальная работа.

---

## 🤖 Семейство ботов

### 1. 🔄 Бот-обменник
- **Статус:** ✅ Активен
- **Функция:** Автоматический обмен криптовалют
- **Мониторинг:** Реальное время

### 2. 💼 МЭВ-бот
- **Статус:** 🔨 В разработке  
- **Функция:** MEV (Maximal Extractable Value) стратегии
- **Запуск:** Скоро

### 3. 📊 Арбитражный бот
- **Статус:** 🔨 В разработке
- **Функция:** Арбитраж между DEX площадками
- **Запуск:** Скоро

---

## ✨ Возможности

### 📊 Мониторинг в реальном времени
- ✅ Все транзакции кошелька
- ✅ Балансы токенов (BNB, USDT, CAKE, BUSD)
- ✅ Общее количество транзакций
- ✅ История операций

### ⚡ Производительность
- ✅ Virtual Scrolling - плавный скролл любого количества TX
- ✅ IndexedDB кеширование - моментальные повторные визиты
- ✅ RPC Batching - оптимизация запросов к QuickNode
- ✅ Агрессивное кеширование API - экономия лимитов

### 🎨 Дизайн
- ✅ Темная современная тема
- ✅ 100% мобильная адаптация
- ✅ Плавные анимации и эффекты
- ✅ Профессиональный UI/UX

### 🌐 SEO & Social
- ✅ Превью для соцсетей "как у YouTube"
- ✅ Open Graph оптимизация
- ✅ Twitter Card поддержка
- ✅ Полная индексация поисковиками

---

## 🚀 Технологии

### Frontend
- **HTML5** - семантическая разметка
- **CSS3** - современные стили, grid, flexbox
- **JavaScript (ES6+)** - модульная архитектура
- **IndexedDB** - клиентское хранилище

### Backend & API
- **QuickNode** - RPC провайдер BSC ($49 тариф)
- **Etherscan V2 API** - мультичейн данные (BSC chainId=56)
- **Web3.js** - блокчейн взаимодействие

### Инфраструктура
- **GitHub Pages** - хостинг
- **CloudFlare** - CDN & DNS
- **Git** - версионирование

---

## 📦 Быстрый старт

### Клонирование

```bash
git clone https://github.com/Avertenandor/sigmatrade.git
cd sigmatrade
```

### Локальная разработка

Просто откройте `index.html` в браузере!

---

## 🔧 Конфигурация

### Мониторинг кошелька

Адрес: `0xB685760EBD368a891F27ae547391F4E2A289895b`

Изменить в `config.js`:

```javascript
const CONFIG = {
  WALLET_ADDRESS: 'your_wallet_address_here'
};
```

---

## 📖 Документация

- **[DEPLOY-LATEST.md](DEPLOY-LATEST.md)** - инструкция по деплою
- **[version.json](version.json)** - история версий

---

## 📁 Структура проекта

```
sigmatrade.org/
├── index.html           # Главная страница
├── app.js              # Основная логика
├── config.js           # Конфигурация
├── db.js               # IndexedDB менеджер
├── virtual-scroll.js   # Виртуализация
├── toast.js            # Уведомления
├── styles.css          # Стили
├── og-image.jpg        # Превью соцсети
└── *.png               # Иконки
```

---

## 🎯 Roadmap

### v7.0.0 (В работе)
- [x] Очистка устаревших файлов
- [x] Оптимизация структуры
- [x] Обновление документации

### v7.1.0 (Планируется)
- [ ] Мультивалютные кошельки
- [ ] Расширенная аналитика
- [ ] Экспорт данных (CSV/Excel)

### v8.0.0 (Будущее)
- [ ] AI-анализ транзакций
- [ ] Telegram бот
- [ ] Webhook уведомления

---

## 📊 Статистика

- **Версия:** 6.0.0 → 7.0.0
- **Дата старта:** 05.10.2025
- **Линий кода:** ~2500+
- **Токенов:** BNB, USDT, CAKE, BUSD

---

## 🌐 Ссылки

- **Сайт:** https://sigmatrade.org/
- **GitHub:** https://github.com/Avertenandor/sigmatrade
- **BSC Explorer:** https://bscscan.com/

---

## 📧 Контакты

**Email:** trdgood00@gmail.com

**Социальные сети:**
- Telegram: [@sigmatrade](https://t.me/sigmatrade)
- Twitter: [@sigmatrade](https://twitter.com/sigmatrade)

> Мы не проводим агрессивный маркетинг, но мы открыты к сотрудничеству.
> Прием новых пользователей возможен исключительно по рекомендации тех, кто с нами уже работает.
> Это закрытый клуб, друзья.

---

## 🤝 Разработка

### Git команды

```bash
git status
git add .
git commit -m "feat: описание"
git push origin main --tags
```

Подробнее: [DEPLOY-LATEST.md](DEPLOY-LATEST.md)

---

## 📄 Лицензия

MIT License - свободное использование

---

## 👨‍💻 Автор

**SigmaTrade Team**

*Пока все болтают, мы работаем* ⚡
