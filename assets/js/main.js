/* ============================================
   IB Solutions — Site JavaScript
   ============================================ */

(function () {
  'use strict';
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.nav-overlay');
  let pageContent = document.getElementById('page-content');
  const contentTransitionMs = 260;

  function setHeaderShadow() {
    if (!header) {
      return;
    }
    header.classList.toggle('scrolled', window.scrollY > 10);
  }

  function openNav() {
    if (!toggle || !mobileNav || !overlay) {
      return;
    }
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    if (!toggle || !mobileNav || !overlay) {
      return;
    }
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setActiveNav(pathname) {
    const currentPage = pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a:not(.nav-cta), .mobile-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      const isActive = href === currentPage || (currentPage === '' && href === 'index.html');
      link.classList.toggle('active', isActive);
    });
    updateNavIndicator();
  }

  function updateNavIndicator(targetLink = null) {
    const nav = document.querySelector('.nav-links');
    if (!nav || window.innerWidth <= 900) {
      return;
    }

    const activeLink = targetLink || nav.querySelector('a.active:not(.nav-cta)');
    if (!activeLink) {
      nav.classList.remove('has-active-pill');
      return;
    }

    const leftOffset = Math.max(0, activeLink.offsetLeft);
    nav.style.setProperty('--nav-pill-x', `${leftOffset}px`);
    nav.style.setProperty('--nav-pill-w', `${activeLink.offsetWidth}px`);
    nav.classList.add('has-active-pill');
  }

  function initFaders(root = document) {
    const faders = root.querySelectorAll('.fade-up');
    if (!faders.length) {
      return;
    }
    if (!('IntersectionObserver' in window)) {
      faders.forEach((el) => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    faders.forEach((el) => io.observe(el));
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function updateHead(parsedDoc) {
    document.title = parsedDoc.title;
    const currentMeta = document.querySelector('meta[name="description"]');
    const nextMeta = parsedDoc.querySelector('meta[name="description"]');
    if (currentMeta && nextMeta) {
      currentMeta.setAttribute('content', nextMeta.getAttribute('content') || '');
    }
  }

  function shouldHandleLink(link, event) {
    const href = link.getAttribute('href');
    if (!href) {
      return false;
    }
    if (
      href.startsWith('#') ||
      link.target === '_blank' ||
      link.hasAttribute('download') ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return false;
    }

    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return false;
    }
    const sameOrigin = url.origin === window.location.origin;
    const hashOnly = url.pathname === window.location.pathname && url.search === window.location.search && !!url.hash;

    return sameOrigin && !hashOnly;
  }

  async function swapPage(url, pushState = true) {
    if (!pageContent) {
      window.location.href = url.href;
      return;
    }

    pageContent.classList.add('page-transition-out');
    await wait(contentTransitionMs);

    const response = await fetch(url.href, { credentials: 'same-origin' });
    if (!response.ok) {
      window.location.href = url.href;
      return;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, 'text/html');
    const nextContent = parsedDoc.querySelector('#page-content');

    if (!nextContent) {
      window.location.href = url.href;
      return;
    }

    pageContent.replaceWith(nextContent);
    pageContent = nextContent;
    updateHead(parsedDoc);
    setActiveNav(url.pathname);
    const nav = document.querySelector('.nav-links');
    if (nav) {
      nav.classList.remove('is-navigating');
    }
    initFaders(nextContent);
    nextContent.classList.add('page-transition-in');
    window.requestAnimationFrame(() => {
      nextContent.classList.remove('page-transition-in');
    });
    closeNav();
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (pushState) {
      history.pushState({}, '', url.href);
    }
  }

  if (header) {
    window.addEventListener('scroll', setHeaderShadow, { passive: true });
    setHeaderShadow();
  }

  if (toggle && mobileNav && overlay) {
    toggle.addEventListener('click', () => {
      mobileNav.classList.contains('open') ? closeNav() : openNav();
    });
    overlay.addEventListener('click', closeNav);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || !shouldHandleLink(link, event)) {
      return;
    }

    if (link.matches('.nav-links a:not(.nav-cta)')) {
      const nav = link.closest('.nav-links');
      if (nav) {
        nav.classList.add('is-navigating');
      }
      updateNavIndicator(link);
    }

    const url = new URL(link.href, window.location.href);
    event.preventDefault();
    swapPage(url, true);
  });

  window.addEventListener('popstate', () => {
    swapPage(new URL(window.location.href), false);
  });

  window.addEventListener('resize', () => {
    updateNavIndicator();
  });

  window.addEventListener('load', () => {
    updateNavIndicator();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateNavIndicator();
    });
  }

  setActiveNav(window.location.pathname);
  initFaders(document);
  updateNavIndicator();
})();
