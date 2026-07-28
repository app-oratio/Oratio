(() => {
  'use strict';

  const READ_KEY = 'oratio:meditations:read';
  const FONT_KEY = 'oratio:meditations:font';
  const MIN_FONT = 85;
  const MAX_FONT = 145;
  const FONT_STEP = 10;

  const safeStorage = {
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (_error) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (_error) {
        return false;
      }
    }
  };

  const readIds = new Set((() => {
    try {
      const parsed = JSON.parse(safeStorage.get(READ_KEY, '[]'));
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch (_error) {
      return [];
    }
  })());

  const persistReadIds = () => safeStorage.set(READ_KEY, JSON.stringify([...readIds]));

  const normalize = (value) => (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const setStatus = (root, message) => {
    const status = root.querySelector('[data-meditation-status]');
    if (status) status.textContent = message;
  };

  const updateReaderState = (root) => {
    const id = root.dataset.meditationId;
    const isRead = id ? readIds.has(id) : false;
    root.querySelectorAll('[data-meditation-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(isRead));
      button.textContent = isRead ? 'Marcar como não lida' : 'Marcar como concluída';
      button.classList.toggle('button--primary', !isRead);
      button.classList.toggle('button--tonal', isRead);
    });
  };

  const setupReader = (root) => {
    const id = root.dataset.meditationId;
    const content = root.querySelector('[data-meditation-content]');
    if (!id || !content) return;

    updateReaderState(root);

    root.querySelectorAll('[data-meditation-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        if (readIds.has(id)) {
          readIds.delete(id);
          setStatus(root, 'A meditação foi marcada como não lida.');
        } else {
          readIds.add(id);
          setStatus(root, 'Meditação concluída. Seu progresso foi salvo neste dispositivo.');
        }
        persistReadIds();
        updateReaderState(root);
      });
    });

    let fontPercent = Number.parseInt(safeStorage.get(FONT_KEY, '100'), 10);
    if (!Number.isFinite(fontPercent)) fontPercent = 100;
    fontPercent = Math.min(MAX_FONT, Math.max(MIN_FONT, fontPercent));

    const applyFont = () => {
      content.style.setProperty('--meditation-font-scale', String(fontPercent / 100));
      root.querySelectorAll('[data-meditation-font-value]').forEach((output) => {
        output.textContent = `${fontPercent}%`;
      });
      root.querySelectorAll('[data-meditation-font="decrease"]').forEach((button) => {
        button.disabled = fontPercent <= MIN_FONT;
      });
      root.querySelectorAll('[data-meditation-font="increase"]').forEach((button) => {
        button.disabled = fontPercent >= MAX_FONT;
      });
    };

    root.querySelectorAll('[data-meditation-font]').forEach((button) => {
      button.addEventListener('click', () => {
        const direction = button.dataset.meditationFont;
        fontPercent += direction === 'increase' ? FONT_STEP : -FONT_STEP;
        fontPercent = Math.min(MAX_FONT, Math.max(MIN_FONT, fontPercent));
        safeStorage.set(FONT_KEY, String(fontPercent));
        applyFont();
      });
    });
    applyFont();

    root.querySelectorAll('[data-meditation-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        const text = `${document.title}\n\n${content.innerText.trim()}\n\n${window.location.href}`;
        try {
          await navigator.clipboard.writeText(text);
          setStatus(root, 'Texto da meditação copiado.');
        } catch (_error) {
          const area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          document.execCommand('copy');
          area.remove();
          setStatus(root, 'Texto da meditação copiado.');
        }
      });
    });

    const progress = root.querySelector('[data-meditation-scroll-progress]');
    if (progress) {
      let scheduled = false;
      const updateScrollProgress = () => {
        scheduled = false;
        const rect = content.getBoundingClientRect();
        const viewport = window.innerHeight || document.documentElement.clientHeight;
        const traversed = Math.max(0, viewport - rect.top);
        const total = Math.max(1, rect.height + viewport);
        const ratio = Math.min(1, traversed / total);
        progress.style.transform = `scaleX(${ratio})`;
      };
      const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(updateScrollProgress);
      };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      updateScrollProgress();
    }
  };

  const setupPeriod = (root) => {
    const cards = [...root.querySelectorAll('[data-meditation-card]')];
    if (!cards.length) return;

    const filter = root.querySelector('[data-meditation-filter]');
    const visibleCount = root.querySelector('[data-meditation-visible-count]');
    const readCount = root.querySelector('[data-meditation-read-count]');
    const progress = root.querySelector('[data-meditation-progress]');
    const continueLink = root.querySelector('[data-meditation-continue]');
    const empty = root.querySelector('[data-meditation-empty]');
    const loadMore = root.querySelector('[data-meditation-load-more]');
    const pageSize = Number.parseInt(root.querySelector('[data-meditation-list]')?.dataset.pageSize || '18', 10);
    const periodIds = cards.map((card) => card.dataset.meditationId).filter(Boolean);
    let shown = pageSize;

    const updateProgress = () => {
      const completed = periodIds.filter((id) => readIds.has(id)).length;
      if (readCount) readCount.textContent = String(completed);
      if (progress) {
        const ratio = periodIds.length ? completed / periodIds.length : 0;
        progress.setAttribute('aria-valuenow', String(completed));
        const bar = progress.querySelector('span');
        if (bar) bar.style.transform = `scaleX(${ratio})`;
      }

      cards.forEach((card) => {
        const isRead = readIds.has(card.dataset.meditationId);
        card.classList.toggle('is-read', isRead);
        const state = card.querySelector('[data-meditation-card-status]');
        if (state) state.textContent = isRead ? 'Concluída' : 'Não lida';
      });

      if (continueLink) {
        const nextUnread = cards.find((card) => !readIds.has(card.dataset.meditationId));
        const target = nextUnread?.querySelector('a')?.getAttribute('href') || continueLink.dataset.defaultUrl;
        if (target) continueLink.setAttribute('href', target);
        continueLink.textContent = completed === 0 ? 'Começar pela primeira' : (completed === periodIds.length ? 'Recomeçar este tempo' : 'Continuar a leitura');
      }
    };

    const applyFilter = () => {
      const query = normalize(filter?.value);
      const matching = cards.filter((card) => !query || normalize(card.dataset.searchText).includes(query));
      cards.forEach((card) => {
        const matches = matching.includes(card);
        const index = matching.indexOf(card);
        card.hidden = !matches || index >= shown;
      });
      if (visibleCount) visibleCount.textContent = String(matching.length);
      if (empty) empty.hidden = matching.length !== 0;
      if (loadMore) {
        loadMore.hidden = matching.length <= shown;
        loadMore.textContent = `Mostrar mais (${matching.length - shown})`;
      }
    };

    if (filter) {
      filter.addEventListener('input', () => {
        shown = pageSize;
        applyFilter();
      });
    }

    if (loadMore) {
      loadMore.addEventListener('click', () => {
        shown += pageSize;
        applyFilter();
      });
    }

    const reset = root.querySelector('[data-meditation-reset]');
    if (reset) {
      reset.addEventListener('click', () => {
        const confirmed = window.confirm('Deseja apagar o progresso deste tempo litúrgico neste dispositivo?');
        if (!confirmed) return;
        periodIds.forEach((id) => readIds.delete(id));
        persistReadIds();
        updateProgress();
      });
    }

    updateProgress();
    applyFilter();
  };

  document.querySelectorAll('[data-meditation-reader]').forEach(setupReader);
  document.querySelectorAll('[data-meditation-period]').forEach(setupPeriod);
})();
