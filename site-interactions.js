/* site-interactions.js - Главные интерактивности сайта */

(()=>{
  'use strict';

  // Ждём загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initHeaderScroll();
    initNavigationCards();
    initWalletCopy();
    initLogoClick();
    console.log('[site-interactions] Site interactions initialized');
  }

  /**
   * Обработка скролла для изменения стиля header
   */
  function initHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 50;

    function handleScroll() {
      const currentScroll = window.pageYOffset;

      if (currentScroll > scrollThreshold) {
        header.classList.add('scrolled');
        document.body.classList.add('header-scrolled');
      } else {
        header.classList.remove('scrolled');
        document.body.classList.remove('header-scrolled');
      }

      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Проверка при загрузке
  }

  /**
   * Навигация по карточкам: плавный скролл или модальное окно
   */
  function initNavigationCards() {
    const navItems = document.querySelectorAll('.premium-nav-item[data-section]');

    navItems.forEach(item => {
      item.addEventListener('click', function() {
        const status = this.getAttribute('data-status');
        const sectionId = this.getAttribute('data-section');

        // Если карточка со статусом "soon", показываем модальное окно
        if (status === 'soon') {
          const botName = this.querySelector('.premium-nav-item-name').textContent;
          showSoonModal(botName);
          return;
        }

        // Иначе прокручиваем к секции
        if (sectionId) {
          scrollToSection(sectionId);
        }
      });
    });
  }

  /**
   * Плавная прокрутка к секции
   */
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      console.warn(`[site-interactions] Section ${sectionId} not found`);
      return;
    }

    // Получаем высоту header для правильного offset
    const header = document.getElementById('siteHeader');
    const headerHeight = header ? header.offsetHeight : 70;
    const offset = 20; // Дополнительный отступ

    const targetPosition = section.offsetTop - headerHeight - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Подсвечиваем целевую секцию на 1 секунду
    section.classList.add('section-highlight');
    setTimeout(() => {
      section.classList.remove('section-highlight');
    }, 1000);
  }

  /**
   * Модальное окно "Скоро запустим"
   */
  function showSoonModal(botName) {
    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.className = 'soon-modal';
    modal.innerHTML = `
      <div class="soon-modal-backdrop"></div>
      <div class="soon-modal-content">
        <div class="soon-modal-header">
          <h3>${botName}</h3>
          <button class="soon-modal-close">&times;</button>
        </div>
        <div class="soon-modal-body">
          <div class="soon-modal-icon">🚧</div>
          <p class="soon-modal-text">Находится в разработке. Запуск планируется в ближайшее время.</p>
        </div>
        <div class="soon-modal-footer">
          <button class="soon-modal-btn">Понятно</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Анимация появления
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });

    // Обработчики закрытия
    const closeBtn = modal.querySelector('.soon-modal-close');
    const okBtn = modal.querySelector('.soon-modal-btn');
    const backdrop = modal.querySelector('.soon-modal-backdrop');

    function closeModal() {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }

    closeBtn.addEventListener('click', closeModal);
    okBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Закрытие по ESC
    function handleEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    }
    document.addEventListener('keydown', handleEsc);
  }

  /**
   * Копирование адреса кошелька
   */
  function initWalletCopy() {
    const copyBtn = document.getElementById('walletCopyBtn');
    if (!copyBtn) return;

    const fullAddress = '0xB6858fCb3A7985E4b6d3f8aF9be3d1617c5a895b'; // Полный адрес

    copyBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(fullAddress);
        showToast('✅ Адрес кошелька скопирован!', 'success');
      } catch (err) {
        console.error('[site-interactions] Failed to copy:', err);
        showToast('❌ Ошибка копирования', 'error');
      }
    });
  }

  /**
   * Клик по логотипу возвращает на главную
   */
  function initLogoClick() {
    const logo = document.getElementById('siteLogo');
    if (!logo) return;

    logo.addEventListener('click', function(e) {
      // Если мы уже на главной странице, прокручиваем вверх
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      // Иначе переходим на главную (стандартное поведение ссылки)
    });
  }

  /**
   * Toast-уведомления
   */
  function showToast(message, type = 'info') {
    // Создаём контейнер для toast, если его нет
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Создаём toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Анимация появления
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Экспорт для использования в других модулях
  window.siteInteractions = {
    showToast,
    scrollToSection,
    version: '1.0.0'
  };
})();
