(function () {
  'use strict';

  var dialog = document.querySelector('[data-search-dialog]');
  var panel = document.querySelector('[data-search-panel]');
  var input = document.querySelector('[data-search-input]');
  var results = document.querySelector('[data-search-results]');
  var status = document.querySelector('[data-search-status]');
  var clearButton = document.querySelector('[data-search-clear]');
  if (!dialog || !panel || !input || !results || !status) return;

  var documents = null;
  var loadingPromise = null;
  var lastFocused = null;
  var timer = null;
  var indexUrl = panel.getAttribute('data-index-url');
  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function loadIndex() {
    if (documents) return Promise.resolve(documents);
    if (loadingPromise) return loadingPromise;
    loadingPromise = fetch(indexUrl, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Não foi possível carregar o índice.');
        return response.json();
      })
      .then(function (data) { documents = Array.isArray(data) ? data : []; return documents; })
      .catch(function () {
        status.textContent = 'A busca não pôde ser carregada. Tente novamente após recarregar a página.';
        return [];
      });
    return loadingPromise;
  }

  function appendHighlighted(element, value, terms) {
    var text = String(value || '');
    var normalizedText = normalize(text);
    var ranges = [];
    terms.forEach(function (term) {
      var start = normalizedText.indexOf(term);
      if (start >= 0) ranges.push([start, start + term.length]);
    });
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var cursor = 0;
    ranges.forEach(function (range) {
      if (range[0] < cursor) return;
      if (range[0] > cursor) element.appendChild(document.createTextNode(text.slice(cursor, range[0])));
      var mark = document.createElement('mark');
      mark.textContent = text.slice(range[0], range[1]);
      element.appendChild(mark);
      cursor = range[1];
    });
    if (cursor < text.length) element.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function scoreDocument(documentItem, terms) {
    var title = normalize(documentItem.title);
    var haystack = normalize([
      documentItem.title, documentItem.description, documentItem.type, documentItem.category,
      (documentItem.tags || []).join(' '), (documentItem.keywords || []).join(' '),
      documentItem.excerpt, documentItem.searchText
    ].join(' '));
    var matchesAll = terms.every(function (term) { return haystack.indexOf(term) >= 0; });
    if (!matchesAll) return -1;
    return terms.reduce(function (score, term) {
      if (title === term) return score + 15;
      if (title.indexOf(term) === 0) return score + 9;
      if (title.indexOf(term) >= 0) return score + 6;
      return score + 1;
    }, 0);
  }

  function matchingExcerpt(documentItem, terms) {
    var description = String(documentItem.description || '');
    var normalizedDescription = normalize(description);
    if (terms.some(function (term) { return normalizedDescription.indexOf(term) >= 0; })) return description;

    var source = String(documentItem.searchText || documentItem.excerpt || description);
    var normalizedSource = normalize(source);
    var position = -1;
    terms.some(function (term) {
      position = normalizedSource.indexOf(term);
      return position >= 0;
    });
    if (position < 0) return description || source.slice(0, 190);
    var start = Math.max(0, position - 72);
    var end = Math.min(source.length, position + 150);
    var snippet = source.slice(start, end).trim();
    return (start > 0 ? '…' : '') + snippet + (end < source.length ? '…' : '');
  }

  function render(query) {
    var normalizedQuery = normalize(query);
    clearButton.hidden = normalizedQuery.length === 0;
    results.replaceChildren();
    if (normalizedQuery.length < 2) {
      status.textContent = 'Digite ao menos dois caracteres para pesquisar.';
      return;
    }
    var terms = normalizedQuery.split(/\s+/).filter(Boolean);
    loadIndex().then(function (index) {
      var matches = index.map(function (item) { return { item: item, score: scoreDocument(item, terms) }; })
        .filter(function (entry) { return entry.score >= 0; })
        .sort(function (a, b) { return b.score - a.score || String(a.item.title).localeCompare(String(b.item.title), 'pt-BR'); })
        .slice(0, 30);

      if (!matches.length) {
        status.textContent = 'Nenhum resultado encontrado para “' + query.trim() + '”.';
        return;
      }
      status.textContent = matches.length + (matches.length === 1 ? ' resultado encontrado.' : ' resultados encontrados.');
      matches.forEach(function (entry) {
        var link = document.createElement('a');
        link.className = 'search-result';
        link.href = entry.item.url;
        var type = document.createElement('span');
        type.className = 'search-result__type';
        type.textContent = (entry.item.type || 'Conteúdo') +
          (entry.item.searchScope ? ' · ' + entry.item.searchScope : '');
        var title = document.createElement('strong');
        appendHighlighted(title, entry.item.title, terms);
        var description = document.createElement('p');
        appendHighlighted(description, matchingExcerpt(entry.item, terms), terms);
        link.append(type, title, description);
        results.appendChild(link);
      });
    });
  }

  function openDialog() {
    lastFocused = document.activeElement;
    dialog.hidden = false;
    document.body.classList.add('dialog-open');
    input.focus();
    loadIndex();
  }

  function closeDialog() {
    dialog.hidden = true;
    document.body.classList.remove('dialog-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  document.querySelectorAll('[data-search-open]').forEach(function (button) { button.addEventListener('click', openDialog); });
  document.querySelectorAll('[data-search-close]').forEach(function (button) { button.addEventListener('click', closeDialog); });
  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { render(input.value); }, 180);
  });
  clearButton.addEventListener('click', function () { input.value = ''; render(''); input.focus(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
    var links = Array.prototype.slice.call(results.querySelectorAll('a'));
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && links.length) {
      event.preventDefault();
      var current = links.indexOf(document.activeElement);
      var next = event.key === 'ArrowDown' ? Math.min(current + 1, links.length - 1) : Math.max(current - 1, 0);
      links[next].focus();
    }
    if (event.key === 'Tab') {
      var focusables = Array.prototype.slice.call(panel.querySelectorAll(focusableSelector)).filter(function (item) { return !item.hidden && item.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  var initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery && window.location.pathname.replace(/\/+$/, '').endsWith('/busca')) {
    input.value = initialQuery;
    openDialog();
    render(initialQuery);
  }
}());
