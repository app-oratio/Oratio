(function () {
  'use strict';
  var root = document.querySelector('[data-catechism-root]');
  if (!root) return;
  var bodyBase = document.body.getAttribute('data-baseurl') || '';
  var base = bodyBase ? '/' + bodyBase.replace(/^\/+|\/+$/g, '') : '';
  var LAST_KEY = 'oratio-catechism-last-read-v1';
  var COMPLETED_KEY = 'oratio-catechism-completed-v1';
  var BOOKMARKS_KEY = 'oratio-catechism-bookmarks-v1';
  var FONT_KEY = 'oratio-catechism-font-v1';
  var selectedParagraph = null;
  var pageData = readJson('catechism-page-data') || {};
  var indexUnits = readJson('catechism-index-data') || pageData.units || [];

  function readJson(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (error) { return null; }
  }
  function siteUrl(path) { return base + '/' + String(path || '').replace(/^\/+/, ''); }
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function storageRead(key, fallback) {
    try { var value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (error) { return fallback; }
  }
  function storageWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
  }
  function locateUnit(number) {
    number = Number(number);
    if (!number) return null;
    for (var i = 0; i < indexUnits.length; i += 1) {
      var unit = indexUnits[i];
      var hasExactIndex = Array.isArray(unit.paragraphs);
      if (hasExactIndex && unit.paragraphs.indexOf(number) !== -1) return unit;
      if (!hasExactIndex && number >= Number(unit.paragraph_start) && number <= Number(unit.paragraph_end)) return unit;
    }
    return null;
  }
  function initJumpForms() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-catechism-jump-form]'), function (form) {
      var input = form.querySelector('[data-catechism-jump-input]');
      var status = form.querySelector('[data-catechism-jump-status]');
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var number = Number(input && input.value);
        var local = document.getElementById('paragrafo-' + number);
        if (local) {
          local.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.setTimeout(function () { local.focus({ preventScroll: true }); }, 350);
          window.history.replaceState(null, '', '#paragrafo-' + number);
          return;
        }
        var unit = locateUnit(number);
        if (!unit) {
          if (status) status.textContent = 'Parágrafo não localizado nesta edição.';
          if (input) input.focus();
          return;
        }
        if (status) status.textContent = 'Abrindo o parágrafo ' + number + '…';
        window.location.assign(siteUrl(unit.url) + '#paragrafo-' + number);
      });
    });
  }
  function initIndex() {
    var filter = document.querySelector('[data-catechism-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-catechism-unit-card]'));
    var parts = Array.prototype.slice.call(document.querySelectorAll('[data-catechism-part]'));
    var empty = document.querySelector('[data-catechism-empty-filter]');
    if (filter && cards.length) {
      filter.addEventListener('input', function () {
        var query = normalize(filter.value);
        var visible = 0;
        cards.forEach(function (card) {
          var match = !query || normalize(card.getAttribute('data-search')).indexOf(query) !== -1;
          card.hidden = !match;
          if (match) visible += 1;
        });
        parts.forEach(function (part) { part.hidden = !part.querySelector('[data-catechism-unit-card]:not([hidden])'); });
        if (empty) empty.hidden = visible !== 0;
      });
    }
    var completed = storageRead(COMPLETED_KEY, []);
    if (!Array.isArray(completed)) completed = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-catechism-unit-progress]'), function (label) {
      label.textContent = completed.indexOf(label.getAttribute('data-catechism-unit-progress')) !== -1 ? 'Concluída' : 'Não iniciada';
    });
    var resume = document.querySelector('[data-catechism-resume]');
    var last = storageRead(LAST_KEY, null);
    if (resume && last && last.url) {
      resume.href = siteUrl(last.url) + (last.paragraph ? '#paragrafo-' + last.paragraph : '');
      var title = resume.querySelector('[data-catechism-resume-title]');
      if (title) title.textContent = last.title + (last.paragraph ? ' · § ' + last.paragraph : '');
      resume.hidden = false;
    }
  }
  function initUnitSelect() {
    var select = document.querySelector('[data-catechism-unit-select]');
    if (select) select.addEventListener('change', function () { window.location.assign(select.value); });
  }
  function initFont() {
    var reading = document.querySelector('[data-catechism-reading]');
    if (!reading) return;
    var value = Number(storageRead(FONT_KEY, 100));
    if (!value || value < 80 || value > 150) value = 100;
    var output = document.querySelector('[data-catechism-font-value]');
    function render() {
      reading.style.setProperty('--catechism-font-size', (1.08 * value / 100).toFixed(3) + 'rem');
      if (output) output.textContent = value + '%';
      storageWrite(FONT_KEY, value);
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-catechism-font]'), function (button) {
      button.addEventListener('click', function () {
        value += button.getAttribute('data-catechism-font') === 'increase' ? 10 : -10;
        value = Math.max(80, Math.min(150, value));
        render();
      });
    });
    render();
  }
  function initCompletion() {
    var button = document.querySelector('[data-catechism-complete]');
    if (!button || !pageData.slug) return;
    var completed = storageRead(COMPLETED_KEY, []);
    if (!Array.isArray(completed)) completed = [];
    function render() {
      var active = completed.indexOf(pageData.slug) !== -1;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.textContent = active ? 'Unidade concluída' : 'Marcar como concluída';
    }
    button.addEventListener('click', function () {
      var index = completed.indexOf(pageData.slug);
      if (index === -1) completed.push(pageData.slug); else completed.splice(index, 1);
      storageWrite(COMPLETED_KEY, completed);
      render();
    });
    render();
  }
  function initBookmarks() {
    var bookmarks = storageRead(BOOKMARKS_KEY, []);
    if (!Array.isArray(bookmarks)) bookmarks = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-catechism-bookmark]'), function (button) {
      var number = String(button.getAttribute('data-catechism-bookmark'));
      function render() {
        var active = bookmarks.indexOf(number) !== -1;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.textContent = active ? '★' : '☆';
      }
      button.addEventListener('click', function () {
        var index = bookmarks.indexOf(number);
        if (index === -1) bookmarks.push(number); else bookmarks.splice(index, 1);
        storageWrite(BOOKMARKS_KEY, bookmarks);
        render();
      });
      render();
    });
  }
  function rememberReading(number) {
    if (!pageData.slug) return;
    storageWrite(LAST_KEY, { slug: pageData.slug, title: pageData.title, paragraph: number || pageData.paragraphStart, url: pageData.url, updatedAt: new Date().toISOString() });
  }
  function initParagraphSelection() {
    var tools = document.querySelector('[data-catechism-selection-tools]');
    var label = document.querySelector('[data-catechism-selection-label]');
    var copy = document.querySelector('[data-catechism-copy]');
    var share = document.querySelector('[data-catechism-share]');
    Array.prototype.forEach.call(document.querySelectorAll('[data-catechism-paragraph]'), function (paragraph) {
      paragraph.addEventListener('click', function (event) {
        if (event.target.closest('[data-catechism-bookmark]')) return;
        if (selectedParagraph) selectedParagraph.classList.remove('is-selected');
        selectedParagraph = paragraph;
        paragraph.classList.add('is-selected');
        var number = paragraph.getAttribute('data-paragraph-number');
        rememberReading(number);
        if (label) label.textContent = 'Catecismo § ' + number;
        if (tools) tools.hidden = false;
      });
    });
    function referenceText() {
      if (!selectedParagraph) return '';
      var number = selectedParagraph.getAttribute('data-paragraph-number');
      return 'Catecismo da Igreja Católica, § ' + number + ': ' + selectedParagraph.querySelector('.catechism-paragraph__text').textContent.trim();
    }
    if (copy) copy.addEventListener('click', function () {
      var text = referenceText();
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () { copy.textContent = 'Copiado'; window.setTimeout(function () { copy.textContent = 'Copiar referência'; }, 1600); });
    });
    if (share) share.addEventListener('click', function () {
      if (!selectedParagraph) return;
      var number = selectedParagraph.getAttribute('data-paragraph-number');
      var url = window.location.href.split('#')[0] + '#paragrafo-' + number;
      var data = { title: 'Catecismo § ' + number, text: referenceText(), url: url };
      if (navigator.share) navigator.share(data).catch(function () {});
      else navigator.clipboard.writeText(data.text + '\n' + data.url);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && tools && !tools.hidden) {
        tools.hidden = true;
        if (selectedParagraph) selectedParagraph.classList.remove('is-selected');
        selectedParagraph = null;
      }
    });
  }
  function initPageSearch() {
    var input = document.querySelector('[data-catechism-page-search]');
    var status = document.querySelector('[data-catechism-page-search-status]');
    var paragraphs = Array.prototype.slice.call(document.querySelectorAll('[data-catechism-paragraph]'));
    if (!input || !paragraphs.length) return;
    input.addEventListener('input', function () {
      var query = normalize(input.value);
      var matches = [];
      paragraphs.forEach(function (paragraph) {
        var match = query && normalize(paragraph.textContent).indexOf(query) !== -1;
        paragraph.classList.toggle('is-search-match', Boolean(match));
        if (match) matches.push(paragraph);
      });
      if (status) status.textContent = query ? matches.length + (matches.length === 1 ? ' resultado' : ' resultados') : '';
      if (matches.length) matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function initHash() {
    if (!window.location.hash || window.location.hash.indexOf('#paragrafo-') !== 0) return;
    var target = document.querySelector(window.location.hash);
    if (target) window.setTimeout(function () { target.focus({ preventScroll: true }); rememberReading(target.getAttribute('data-paragraph-number')); }, 200);
  }

  initJumpForms();
  if (root.hasAttribute('data-catechism-index')) initIndex();
  if (root.hasAttribute('data-catechism-reader')) {
    initUnitSelect(); initFont(); initCompletion(); initBookmarks(); initParagraphSelection(); initPageSearch(); initHash(); rememberReading();
  }
}());
