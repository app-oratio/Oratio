(function () {
  'use strict';

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function slugify(value) {
    return normalize(value)
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'secao';
  }

  function initHub(hub) {
    var input = hub.querySelector('[data-editorial-filter]');
    var category = hub.querySelector('[data-editorial-category]');
    var tag = hub.querySelector('[data-editorial-tag]');
    var sort = hub.querySelector('[data-editorial-sort]');
    var reset = hub.querySelector('[data-editorial-reset]');
    var grid = hub.querySelector('[data-editorial-grid]');
    var items = Array.prototype.slice.call(hub.querySelectorAll('[data-editorial-item]'));
    var empty = hub.querySelector('[data-editorial-empty]');
    var count = hub.querySelector('[data-editorial-count]');
    var pagination = hub.querySelector('[data-editorial-pagination]');
    var previous = hub.querySelector('[data-editorial-previous]');
    var next = hub.querySelector('[data-editorial-next]');
    var pageStatus = hub.querySelector('[data-editorial-page-status]');
    var categoryChips = Array.prototype.slice.call(hub.querySelectorAll('[data-editorial-category-chip]'));
    var pageSize = Number(hub.getAttribute('data-page-size')) || 9;
    var currentPage = 1;
    var timer;

    items.forEach(function (item, index) {
      item.setAttribute('data-original-index', String(index));
    });

    if (tag) {
      var tags = {};
      items.forEach(function (item) {
        String(item.getAttribute('data-tags') || '').split('|').forEach(function (itemTag) {
          var cleaned = itemTag.trim();
          if (cleaned) tags[cleaned] = true;
        });
      });
      Object.keys(tags).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }).forEach(function (itemTag) {
        var option = document.createElement('option');
        option.value = itemTag;
        option.textContent = itemTag;
        tag.appendChild(option);
      });
    }

    function updateCategoryChips() {
      var selected = normalize(category ? category.value : '');
      categoryChips.forEach(function (chip) {
        var active = normalize(chip.getAttribute('data-editorial-category-chip')) === selected;
        chip.classList.toggle('is-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function updateUrl() {
      if (!window.history || !window.URLSearchParams) return;
      var params = new URLSearchParams(window.location.search);
      var values = {
        q: input ? input.value.trim() : '',
        categoria: category ? category.value : '',
        tema: tag ? tag.value : '',
        ordem: sort && sort.value !== 'newest' ? sort.value : ''
      };
      Object.keys(values).forEach(function (key) {
        if (values[key]) params.set(key, values[key]); else params.delete(key);
      });
      var query = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
    }

    function returnToLibrary() {
      var target = hub.querySelector('#todos-os-conteudos');
      if (!target) return;
      var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function render(options) {
      options = options || {};
      var query = normalize(input ? input.value : '');
      var selectedCategory = normalize(category ? category.value : '');
      var selectedTag = normalize(tag ? tag.value : '');
      var selectedSort = sort ? sort.value : 'newest';

      var filtered = items.filter(function (item) {
        var text = normalize(item.getAttribute('data-search-text'));
        var itemCategory = normalize(item.getAttribute('data-category'));
        var itemTags = String(item.getAttribute('data-tags') || '').split('|').map(normalize);
        return text.indexOf(query) >= 0 &&
          (!selectedCategory || itemCategory === selectedCategory) &&
          (!selectedTag || itemTags.indexOf(selectedTag) >= 0);
      });

      filtered.sort(function (a, b) {
        if (selectedSort === 'title') {
          return String(a.getAttribute('data-title') || '').localeCompare(String(b.getAttribute('data-title') || ''), 'pt-BR');
        }
        if (selectedSort === 'oldest') {
          return String(a.getAttribute('data-date') || '').localeCompare(String(b.getAttribute('data-date') || ''));
        }
        var newest = String(b.getAttribute('data-date') || '').localeCompare(String(a.getAttribute('data-date') || ''));
        if (newest !== 0) return newest;
        return Number(a.getAttribute('data-original-index')) - Number(b.getAttribute('data-original-index'));
      });

      if (grid) filtered.forEach(function (item) { grid.appendChild(item); });
      items.forEach(function (item) { item.hidden = true; });

      var pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      currentPage = Math.min(Math.max(1, currentPage), pages);
      filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).forEach(function (item) { item.hidden = false; });

      if (empty) empty.hidden = filtered.length > 0;
      if (count) count.textContent = filtered.length + (filtered.length === 1 ? ' conteúdo' : ' conteúdos');
      if (pagination) pagination.hidden = filtered.length <= pageSize;
      if (previous) previous.disabled = currentPage <= 1;
      if (next) next.disabled = currentPage >= pages;
      if (pageStatus) pageStatus.textContent = 'Página ' + currentPage + ' de ' + pages;

      updateCategoryChips();
      if (!options.skipUrl) updateUrl();
    }

    if (window.URLSearchParams) {
      var params = new URLSearchParams(window.location.search);
      if (input && params.get('q')) input.value = params.get('q');
      if (category && params.get('categoria')) category.value = params.get('categoria');
      if (tag && params.get('tema')) tag.value = params.get('tema');
      if (sort && params.get('ordem')) sort.value = params.get('ordem');
    }

    if (input) input.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { currentPage = 1; render(); }, 140);
    });
    [category, tag, sort].forEach(function (control) {
      if (control) control.addEventListener('change', function () { currentPage = 1; render(); });
    });
    categoryChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (category) category.value = chip.getAttribute('data-editorial-category-chip') || '';
        currentPage = 1;
        render();
        returnToLibrary();
      });
    });
    if (reset) reset.addEventListener('click', function () {
      if (input) input.value = '';
      if (category) category.value = '';
      if (tag) tag.value = '';
      if (sort) sort.value = 'newest';
      currentPage = 1;
      render();
      if (input) input.focus();
    });
    if (previous) previous.addEventListener('click', function () { currentPage -= 1; render(); returnToLibrary(); });
    if (next) next.addEventListener('click', function () { currentPage += 1; render(); returnToLibrary(); });

    render({ skipUrl: true });
  }

  function initArticle() {
    var content = document.querySelector('[data-editorial-content]');
    var progress = document.querySelector('[data-reading-progress]');
    var toc = document.querySelector('[data-editorial-toc]');
    var tocList = document.querySelector('[data-editorial-toc-list]');
    if (!content) return;

    if (progress) {
      var updateProgress = function () {
        var rect = content.getBoundingClientRect();
        var contentTop = window.scrollY + rect.top;
        var contentHeight = Math.max(content.offsetHeight - window.innerHeight, 1);
        var value = Math.min(1, Math.max(0, (window.scrollY - contentTop + window.innerHeight * 0.18) / contentHeight));
        progress.style.transform = 'scaleX(' + value + ')';
      };
      updateProgress();
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress);
    }

    if (!toc || !tocList) return;
    var headings = Array.prototype.slice.call(content.querySelectorAll('h2, h3'));
    if (headings.length < 2) return;

    var usedIds = {};
    headings.forEach(function (heading) {
      var base = heading.id || slugify(heading.textContent);
      var id = base;
      var suffix = 2;
      while (usedIds[id] || document.getElementById(id)) {
        if (heading.id === id) break;
        id = base + '-' + suffix;
        suffix += 1;
      }
      heading.id = id;
      usedIds[id] = true;

      var item = document.createElement('li');
      if (heading.tagName === 'H3') item.className = 'editorial-toc__subitem';
      var link = document.createElement('a');
      link.href = '#' + id;
      link.textContent = heading.textContent;
      item.appendChild(link);
      tocList.appendChild(item);
    });
    toc.hidden = false;

    if ('IntersectionObserver' in window) {
      var links = Array.prototype.slice.call(tocList.querySelectorAll('a'));
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) { link.removeAttribute('aria-current'); });
          var active = tocList.querySelector('a[href="#' + entry.target.id + '"]');
          if (active) active.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-22% 0px -68% 0px', threshold: 0 });
      headings.forEach(function (heading) { observer.observe(heading); });
    }
  }

  document.querySelectorAll('[data-editorial-hub]').forEach(initHub);
  initArticle();
}());
