(function () {
  'use strict';

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  document.querySelectorAll('[data-archive]').forEach(function (archive) {
    var input = archive.querySelector('[data-archive-filter]');
    var category = archive.querySelector('[data-archive-category]');
    var items = Array.prototype.slice.call(archive.querySelectorAll('[data-archive-item]'));
    var empty = archive.querySelector('[data-archive-empty]');
    var count = archive.querySelector('[data-archive-count]');
    var pagination = archive.querySelector('[data-archive-pagination]');
    var previous = archive.querySelector('[data-archive-previous]');
    var next = archive.querySelector('[data-archive-next]');
    var pageStatus = archive.querySelector('[data-archive-page-status]');
    var pageSize = Number(archive.getAttribute('data-page-size')) || 9;
    var page = 1;
    var timer;

    function returnToArchive() {
      var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      archive.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function render() {
      var query = normalize(input ? input.value : '');
      var selectedCategory = normalize(category ? category.value : '');
      var filtered = items.filter(function (item) {
        var matchesText = normalize(item.getAttribute('data-search-text')).indexOf(query) >= 0;
        var matchesCategory = !selectedCategory || normalize(item.getAttribute('data-category')) === selectedCategory;
        return matchesText && matchesCategory;
      });
      var pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, pages);
      items.forEach(function (item) { item.hidden = true; });
      filtered.slice((page - 1) * pageSize, page * pageSize).forEach(function (item) { item.hidden = false; });
      if (empty) empty.hidden = filtered.length > 0;
      if (count) count.textContent = filtered.length + (filtered.length === 1 ? ' conteúdo' : ' conteúdos');
      if (pagination) pagination.hidden = filtered.length <= pageSize;
      if (previous) previous.disabled = page <= 1;
      if (next) next.disabled = page >= pages;
      if (pageStatus) pageStatus.textContent = 'Página ' + page + ' de ' + pages;
    }

    if (input) input.addEventListener('input', function () { window.clearTimeout(timer); timer = window.setTimeout(function () { page = 1; render(); }, 150); });
    if (category) category.addEventListener('change', function () { page = 1; render(); });
    if (previous) previous.addEventListener('click', function () { page -= 1; render(); returnToArchive(); });
    if (next) next.addEventListener('click', function () { page += 1; render(); returnToArchive(); });
    render();
  });
}());
