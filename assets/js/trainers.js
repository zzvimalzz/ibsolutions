(function () {
  'use strict';

  const pageSelector = '[data-trainers-page]';
  let pageRetryTimer = null;

  function getTrainerData() {
    return Array.isArray(window.IBSolutionsTrainerDirectory) ? window.IBSolutionsTrainerDirectory : [];
  }

  function getFeaturedTrainer(trainers) {
    return trainers.find((trainer) => trainer.featured) || trainers[0];
  }

  function getInitialTrainerId() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash || hash === 'trainer-profile') {
      return '';
    }
    return hash;
  }

  function setLoadingState(element, isLoading) {
    if (!element) {
      return;
    }
    element.classList.toggle('is-loading', isLoading);
    element.classList.toggle('is-ready', !isLoading);
    element.setAttribute('aria-busy', String(isLoading));
  }

  function createDirectorySkeleton(count) {
    return Array.from({ length: count }, () => `
      <div class="trainer-directory-card trainer-directory-card--skeleton" aria-hidden="true">
        <span class="trainer-directory-thumb trainer-directory-thumb--skeleton trainer-skeleton-block"></span>
        <div class="trainer-skeleton-stack">
          <span class="trainer-skeleton-block trainer-skeleton-line trainer-skeleton-line--sm"></span>
          <span class="trainer-skeleton-block trainer-skeleton-line trainer-skeleton-line--med"></span>
          <span class="trainer-skeleton-block trainer-skeleton-line"></span>
        </div>
      </div>
    `).join('');
  }

  function createProfileSkeleton() {
    return `
      <div class="trainer-profile-skeleton" aria-hidden="true">
        <div class="trainer-profile-skeleton-head">
          <span class="trainer-skeleton-block trainer-skeleton-photo"></span>
          <div class="trainer-skeleton-stack">
            <span class="trainer-skeleton-block trainer-skeleton-line trainer-skeleton-line--sm"></span>
            <span class="trainer-skeleton-block trainer-skeleton-line trainer-skeleton-line--hero"></span>
            <span class="trainer-skeleton-block trainer-skeleton-line trainer-skeleton-line--wide"></span>
            <span class="trainer-skeleton-block trainer-skeleton-line trainer-skeleton-line--med"></span>
          </div>
        </div>
        <div class="trainer-profile-skeleton-grid">
          <span class="trainer-skeleton-block trainer-skeleton-panel"></span>
          <span class="trainer-skeleton-block trainer-skeleton-panel"></span>
          <span class="trainer-skeleton-block trainer-skeleton-panel"></span>
          <span class="trainer-skeleton-block trainer-skeleton-panel"></span>
        </div>
      </div>
    `;
  }

  function scrollToProfile(page) {
    const profileSection = page.querySelector('#trainer-profile');
    if (!profileSection) {
      return;
    }
    profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bindActiveProfileButton(page) {
    const button = page.querySelector('[data-scroll-profile]');
    if (!button || button.dataset.bound === 'true') {
      return;
    }
    button.dataset.bound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToProfile(page);
    });
  }

  function createCard(trainer, isActive) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `trainer-directory-card${isActive ? ' is-active' : ''}`;
    button.dataset.trainerId = trainer.id;
    button.setAttribute('aria-pressed', String(isActive));
    button.innerHTML = `
      <img class="trainer-directory-thumb" src="${trainer.image}" alt="${trainer.imageAlt}">
      <div>
        <p class="trainer-directory-meta">${trainer.shortRole}</p>
        <h3>${trainer.name}</h3>
        <p>${trainer.rosterSummary}</p>
      </div>
    `;
    return button;
  }

  function renderStats(stats) {
    return stats.map((stat) => `<div class="trainer-stat-card"><strong>${stat.value}</strong><span>${stat.label}</span></div>`).join('');
  }

  function renderExpertise(items) {
    return items.map((item) => `<article class="trainer-detail-card"><i class="fas ${item.icon}"></i><h3>${item.title}</h3><p>${item.body}</p></article>`).join('');
  }

  function renderAchievements(items) {
    return items.map((item) => `<article class="trainer-achievement-card"><h3>${item.title}</h3><p>${item.body}</p></article>`).join('');
  }

  function renderTimeline(items) {
    return items.map((item) => `<article class="trainer-achievement-card"><h3>${item.period}</h3><p>${item.body}</p></article>`).join('');
  }

  function renderAccordion(items) {
    const sectorAccents = ['#0d5f7a', '#156f86', '#2f6d52', '#5c677d', '#8a6a2f', '#704c63', '#2d5d8c', '#4a6d3b'];
    return items.map((item, index) => `
      <details style="--sector-accent: ${sectorAccents[index % sectorAccents.length]};">
        <summary>
          <div class="trainer-accordion-title">
            <span class="trainer-accordion-accent"></span>
            <div class="trainer-accordion-copy">
              <p class="trainer-accordion-meta">${item.clients.length} organisations</p>
              <h3>${item.title}</h3>
              <p>Expand to view the institutions and companies served.</p>
            </div>
          </div>
          <span class="trainer-accordion-icon"><i class="fas fa-chevron-down"></i></span>
        </summary>
        <div class="trainer-accordion-body"><div class="trainer-tag-cloud">${item.clients.map((client) => `<span>${client}</span>`).join('')}</div></div>
      </details>
    `).join('');
  }

  function renderProfile(shell, trainer) {
    shell.innerHTML = `
      <article class="trainer-profile-sheet">
        <div class="trainer-profile-intro">
          <div class="trainer-profile-copy">
            <span class="section-label">Trainer Profile</span>
            <div class="trainer-profile-head">
              <div class="trainer-profile-photo"><img src="${trainer.image}" alt="${trainer.imageAlt}"></div>
              <div>
                <p class="trainer-profile-role">${trainer.role}</p>
                <h2 class="section-title">${trainer.name}</h2>
                ${trainer.intro.map((paragraph, index) => `<p class="section-subtitle${index > 0 ? ' mt-16' : ''}">${paragraph}</p>`).join('')}
                <div class="trainer-pill-row">${trainer.credentials.map((item) => `<span>${item}</span>`).join('')}</div>
              </div>
            </div>
          </div>
          <aside class="trainer-profile-aside">
            <span class="trainer-kicker">Featured Profile</span>
            <h3>${trainer.highlightTitle}</h3>
            <p>${trainer.highlightBody}</p>
            <div class="trainer-summary-grid mt-28">${renderStats(trainer.stats)}</div>
          </aside>
        </div>
        <section class="section trainer-content-section trainer-content-section--teal"><div class="text-center mb-48"><span class="section-label">Specialisations</span><h2 class="section-title">Core Expertise Areas</h2><p class="section-subtitle section-subtitle--center">Programmes built around operational discipline, stronger leadership capability, and measurable organisational improvement.</p></div><div class="trainer-expertise-grid">${renderExpertise(trainer.expertise)}</div></section>
        <section class="section trainer-content-section trainer-content-section--mist"><div class="text-center mb-48"><span class="section-label">Track Record</span><h2 class="section-title">Selected Achievements</h2><p class="section-subtitle section-subtitle--center">A profile built on pioneering delivery, measurable outcomes, and trusted relationships with senior leaders.</p></div><div class="trainer-achievement-grid">${renderAchievements(trainer.achievements)}</div></section>
        <section class="section trainer-content-section trainer-content-section--sand"><div class="text-center mb-48"><span class="section-label">Career Path</span><h2 class="section-title">Leadership Roles Held</h2><p class="section-subtitle section-subtitle--center">A professional path that moved from banking leadership into consulting, manufacturing operations, training management, and director-level operational oversight.</p></div><div class="trainer-achievement-grid">${renderTimeline(trainer.timeline)}</div></section>
        <section class="section trainer-content-section trainer-content-section--slate"><div class="text-center mb-48"><span class="section-label">Client Portfolio</span><h2 class="section-title">Industries &amp; Institutions Served</h2><p class="section-subtitle section-subtitle--center">Explore the sectors and institutions this trainer has supported across corporate, industrial, public, and service environments.</p></div><div class="trainer-accordion">${renderAccordion(trainer.sectors)}</div></section>
      </article>
    `;
  }

  function initTrainersPage() {
    const page = document.querySelector(pageSelector);
    if (!page) {
      if (pageRetryTimer) {
        window.clearTimeout(pageRetryTimer);
        pageRetryTimer = null;
      }
      return;
    }

    const trainers = getTrainerData();
    const directory = page.querySelector('#trainer-directory');
    const shell = page.querySelector('#trainer-profile-shell');
    if (!directory || !shell) {
      return;
    }

    bindActiveProfileButton(page);

    if (!trainers.length) {
      setLoadingState(directory, true);
      setLoadingState(shell, true);
      directory.innerHTML = createDirectorySkeleton(3);
      shell.innerHTML = createProfileSkeleton();
      page.dataset.trainersReady = 'false';

      if (!pageRetryTimer) {
        pageRetryTimer = window.setTimeout(() => {
          pageRetryTimer = null;
          initTrainersPage();
        }, 120);
      }
      return;
    }

    if (pageRetryTimer) {
      window.clearTimeout(pageRetryTimer);
      pageRetryTimer = null;
    }

    const featured = getFeaturedTrainer(trainers);
    const initialId = getInitialTrainerId() || featured.id;
    let activeTrainer = trainers.find((trainer) => trainer.id === initialId) || featured;

    function syncView(trainerId) {
      activeTrainer = trainers.find((trainer) => trainer.id === trainerId) || featured;
      directory.innerHTML = '';
      trainers.forEach((trainer) => {
        const card = createCard(trainer, trainer.id === activeTrainer.id);
        card.addEventListener('click', () => {
          syncView(trainer.id);
          if (window.location.hash !== `#${trainer.id}`) {
            history.replaceState({}, '', `${window.location.pathname}${window.location.search}#${trainer.id}`);
          }
        });
        directory.appendChild(card);
      });
      renderProfile(shell, activeTrainer);
      setLoadingState(directory, false);
      setLoadingState(shell, false);
      page.dataset.trainersReady = 'true';
    }

    syncView(activeTrainer.id);
  }

  document.addEventListener('ibs:page-rendered', initTrainersPage);
  window.addEventListener('pageshow', initTrainersPage);
  window.addEventListener('load', initTrainersPage);
  window.addEventListener('hashchange', initTrainersPage);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrainersPage);
  } else {
    initTrainersPage();
  }
})();