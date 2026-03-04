/* =============================================
   STOREVANCE LLC. - main.js
   スクロールアニメーション / ホバー / インタラクション
   ============================================= */

(function () {
  'use strict';

  /* ------------------------------------------
     1. スクロール進捗バー
  ------------------------------------------ */
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.prepend(progressBar);

  /* ------------------------------------------
     2. ヘッダー：スクロールでshadow強化
  ------------------------------------------ */
  const header = document.getElementById('header');

  /* ------------------------------------------
     3. スクロールイベント（throttle）
  ------------------------------------------ */
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  function onScroll() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;

    // 進捗バー
    const pct = docH > 0 ? (scrollY / docH) * 100 : 0;
    progressBar.style.width = pct + '%';

    // ヘッダー
    if (header) {
      if (scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // フェードイン
    checkFadeUp();
  }

  /* ------------------------------------------
     4. フェードイン（IntersectionObserver）
  ------------------------------------------ */
  function initFadeUp() {
    // fade-up クラスを持つ要素を監視
    const targets = document.querySelectorAll('.fade-up');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      targets.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // フォールバック：すべて表示
      targets.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  // IntersectionObserverがない環境向けのフォールバック
  function checkFadeUp() {
    if ('IntersectionObserver' in window) return;
    const targets = document.querySelectorAll('.fade-up:not(.is-visible)');
    targets.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        el.classList.add('is-visible');
      }
    });
  }

  /* ------------------------------------------
     5. ヒーロー：ページロード時の入場アニメーション
  ------------------------------------------ */
  function initHeroAnimation() {
    const heroEls = document.querySelectorAll(
      '.hero-label, .hero-title, .hero-sub, .hero-actions'
    );
    if (heroEls.length === 0) return;

    // 少し遅らせてから一斉にis-visibleを付与
    setTimeout(function () {
      heroEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }, 100);
  }

  /* ------------------------------------------
     6. セクションに fade-up を自動付与
        （HTMLに書いていない要素にも適用）
  ------------------------------------------ */
  function autoFadeUp() {
    const selectors = [
      '.services-header',
      '.service-item',
      '.about-inner',
      '.news-card',
      '.blog-card',
      '.cta-content',
      '.timeline-section',
      '.contact-grid',
      '.note-banner',
      '.page-hero-title',
      '.page-hero-desc',
      '.info-table',
      '.service-detail-item',
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (!el.classList.contains('fade-up')) {
          el.classList.add('fade-up');
          // 連続する要素には遅延を付与（最大5段階）
          if (i > 0 && i <= 5) {
            el.classList.add('delay-' + i);
          }
        }
      });
    });
  }

  /* ------------------------------------------
     7. スムーススクロール（アンカーリンク）
  ------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerH = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ------------------------------------------
     8. カーソル：サービスアイテムのホバーエフェクト
  ------------------------------------------ */
  function initServiceHover() {
    document.querySelectorAll('.service-item').forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        this.style.paddingLeft = '16px';
      });
      item.addEventListener('mouseleave', function () {
        this.style.paddingLeft = '';
      });
    });
  }

  /* ------------------------------------------
     9. ハンバーガーメニュー（モバイル）
  ------------------------------------------ */
  function initHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.getElementById('nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // ナビリンクをクリックしたら閉じる
    nav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------
     10. 数字カウントアップ（stat系の数値があれば）
  ------------------------------------------ */
  function initCountUp() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const duration = 1200;
      const start = performance.now();

      const observer = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // easeOutExpo
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          el.textContent = Math.floor(ease * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
      }, { threshold: 0.5 });

      observer.observe(el);
    });
  }

  /* ------------------------------------------
     初期化
  ------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    autoFadeUp();      // fade-up を自動付与
    initFadeUp();      // IntersectionObserver で監視開始
    initHeroAnimation(); // ヒーロー入場
    initSmoothScroll();
    initServiceHover();
    initHamburger();
    initCountUp();
    onScroll();        // 初期スクロール状態を反映
  });

})();
