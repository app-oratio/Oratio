(() => {
  'use strict';

  const STORAGE_PREFIX = 'oratio.library';
  const normalize = (value) => (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const safeRead = (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (_) {
      return null;
    }
  };

  const safeWrite = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // A leitura continua funcionando normalmente quando o armazenamento local está indisponível.
    }
  };

  const initCatalog = () => {
    const catalog = document.querySelector('[data-library-catalog]');
    if (!catalog) return;

    const input = catalog.querySelector('[data-library-search]');
    const clear = catalog.querySelector('[data-library-search-clear]');
    const reset = catalog.querySelector('[data-library-reset]');
    const status = catalog.querySelector('[data-library-status]');
    const empty = catalog.querySelector('[data-library-empty]');
    const items = Array.from(catalog.querySelectorAll('[data-library-item]'));
    const filters = Array.from(catalog.querySelectorAll('[data-library-filter]'));
    let category = 'all';

    const update = () => {
      const query = normalize(input?.value);
      let visible = 0;

      items.forEach((item) => {
        const haystack = normalize(item.textContent);
        const itemCategory = item.dataset.libraryCategory || '';
        const matchesQuery = !query || haystack.includes(query);
        const matchesCategory = category === 'all' || itemCategory === category;
        const show = matchesQuery && matchesCategory;
        item.hidden = !show;
        if (show) visible += 1;
      });

      if (clear) clear.hidden = !query;
      if (empty) empty.hidden = visible !== 0;
      if (status) status.textContent = `${visible} ${visible === 1 ? 'obra encontrada' : 'obras encontradas'}.`;
    };

    input?.addEventListener('input', update);
    clear?.addEventListener('click', () => {
      input.value = '';
      input.focus();
      update();
    });
    reset?.addEventListener('click', () => {
      if (input) input.value = '';
      category = 'all';
      filters.forEach((button) => {
        const active = button.dataset.libraryFilter === 'all';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      update();
      input?.focus();
    });
    filters.forEach((button) => {
      button.addEventListener('click', () => {
        category = button.dataset.libraryFilter || 'all';
        filters.forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        update();
      });
    });
  };

  const initBookResume = () => {
    const book = document.querySelector('[data-library-book]');
    if (!book) return;

    const slug = book.dataset.bookSlug;
    const button = book.querySelector('[data-reading-primary]');
    const label = book.querySelector('[data-reading-primary-label]');
    if (!slug || !button || !label) return;

    const progress = safeRead(`${STORAGE_PREFIX}.progress.${slug}`);
    if (!progress?.url || !progress?.label) return;

    button.href = progress.url;
    label.textContent = `Continuar leitura · ${progress.label}`;
    button.setAttribute('aria-label', `Continuar leitura em ${progress.label}`);
  };

  const initReaderProgress = () => {
    const reader = document.querySelector('[data-library-reader]');
    if (!reader) return;

    const slug = reader.dataset.bookSlug;
    if (!slug) return;

    const baseurl = document.body.dataset.baseurl || '';
    const currentUrl = `${baseurl}${reader.dataset.currentUrl || ''}`;
    safeWrite(`${STORAGE_PREFIX}.progress.${slug}`, {
      url: currentUrl,
      label: reader.dataset.currentLabel || 'Leitura',
      title: reader.dataset.currentTitle || '',
      position: Number(reader.dataset.readingPosition || 0),
      total: Number(reader.dataset.readingTotal || 0),
      updatedAt: new Date().toISOString(),
    });
  };

  const initReaderFont = () => {
    const reader = document.querySelector('[data-library-reader]');
    if (!reader) return;

    const key = `${STORAGE_PREFIX}.fontScale`;
    const saved = Number(safeRead(key));
    let scale = Number.isFinite(saved) && saved >= 0.9 && saved <= 1.3 ? saved : 1;

    const apply = () => reader.style.setProperty('--library-reader-scale', scale.toFixed(2));
    const save = () => safeWrite(key, scale);
    const change = (delta) => {
      scale = Math.min(1.3, Math.max(0.9, Math.round((scale + delta) * 20) / 20));
      apply();
      save();
    };

    apply();
    reader.querySelector('[data-reader-font-decrease]')?.addEventListener('click', () => change(-0.05));
    reader.querySelector('[data-reader-font-increase]')?.addEventListener('click', () => change(0.05));
    reader.querySelector('[data-reader-font-reset]')?.addEventListener('click', () => {
      scale = 1;
      apply();
      save();
    });
  };

  const initReaderToc = () => {
    const reader = document.querySelector('[data-library-reader]');
    const toc = reader?.querySelector('[data-library-toc]');
    const openButton = reader?.querySelector('[data-library-toc-open]');
    if (!reader || !toc || !openButton) return;

    const closeButtons = Array.from(toc.querySelectorAll('[data-library-toc-close]'));
    const panel = toc.querySelector('.library-reader-toc__panel');
    let returnFocus = null;

    const close = () => {
      toc.hidden = true;
      toc.setAttribute('aria-hidden', 'true');
      openButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('library-toc-open');
      if (returnFocus) returnFocus.focus();
    };

    const open = () => {
      returnFocus = document.activeElement;
      toc.hidden = false;
      toc.setAttribute('aria-hidden', 'false');
      openButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('library-toc-open');
      const current = toc.querySelector('[aria-current="page"]');
      const target = current || toc.querySelector('a, button');
      window.requestAnimationFrame(() => {
        target?.focus({ preventScroll: true });
        current?.scrollIntoView({ block: 'center' });
      });
    };

    openButton.addEventListener('click', open);
    closeButtons.forEach((button) => button.addEventListener('click', close));

    document.addEventListener('keydown', (event) => {
      if (toc.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusable = Array.from(panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hidden && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    initBookResume();
    initReaderProgress();
    initReaderFont();
    initReaderToc();
  });
})();
