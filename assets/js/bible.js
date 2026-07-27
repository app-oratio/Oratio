(function () {
  'use strict';

  var root = document.querySelector('[data-bible-root]');
  if (!root) return;

  var bodyBase = document.body.getAttribute('data-baseurl') || '';
  var base = bodyBase ? '/' + bodyBase.replace(/^\/+|\/+$/g, '') : '';
  var LAST_READ_KEY = 'oratio-bible-last-read-v1';
  var BOOKMARKS_KEY = 'oratio-bible-bookmarks-v1';
  var DB_NAME = 'oratio-bible-cache';
  var DB_STORE = 'resources';
  var CACHE_VERSION = 'matos-soares-v1';
  var selectedVerse = null;
  var pageData = readJsonScript('bible-page-data') || {};
  var indexData = readJsonScript('bible-index-data') || {};

  function readJsonScript(id) {
    var element = document.getElementById(id);
    if (!element) return null;
    try { return JSON.parse(element.textContent); } catch (error) { return null; }
  }

  function siteUrl(path) {
    return base + '/' + String(path || '').replace(/^\/+/, '');
  }

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[ºª.]/g, '')
      .replace(/\b(i{1,3}|iv)\b/g, function (roman) {
        return ({ i: '1', ii: '2', iii: '3', iv: '4' })[roman] || roman;
      })
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function safeJsonStorage(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) { return fallback; }
  }

  function writeJsonStorage(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }

  function navigate(bookSlug, chapter, verse) {
    var target = siteUrl('/biblia/' + bookSlug + '/' + chapter + '/');
    if (verse) target += '#v' + verse;
    window.location.assign(target);
  }

  function initIndex() {
    var filter = document.querySelector('[data-bible-book-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-bible-book-card]'));
    var testaments = Array.prototype.slice.call(document.querySelectorAll('[data-bible-testament]'));
    var empty = document.querySelector('[data-bible-empty-filter]');
    if (filter && cards.length) {
      filter.addEventListener('input', function () {
        var query = normalize(filter.value);
        var visible = 0;
        cards.forEach(function (card) {
          var match = !query || normalize(card.getAttribute('data-book-search')).indexOf(query) !== -1;
          card.hidden = !match;
          if (match) visible += 1;
        });
        testaments.forEach(function (section) {
          section.hidden = !section.querySelector('[data-bible-book-card]:not([hidden])');
        });
        if (empty) empty.hidden = visible !== 0;
      });
    }

    var form = document.querySelector('[data-bible-reference-form]');
    var input = document.querySelector('[data-bible-reference-input]');
    var status = document.querySelector('[data-bible-reference-status]');
    if (form && input) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var parsed = parseReference(input.value, indexData.books || []);
        if (!parsed) {
          if (status) status.textContent = 'Não reconheci a referência. Tente, por exemplo, João 3,16.';
          input.focus();
          return;
        }
        if (status) status.textContent = 'Abrindo ' + parsed.book.name + ' ' + parsed.chapter + (parsed.verse ? ',' + parsed.verse : '') + '…';
        navigate(parsed.book.slug, parsed.chapter, parsed.verse);
      });
    }

    var resume = document.querySelector('[data-bible-resume]');
    var last = safeJsonStorage(LAST_READ_KEY, null);
    if (resume && last && last.bookSlug && last.chapter) {
      resume.href = siteUrl('/biblia/' + last.bookSlug + '/' + last.chapter + '/');
      var title = resume.querySelector('[data-bible-resume-title]');
      if (title) title.textContent = last.bookName + ' ' + last.chapter;
      resume.hidden = false;
    }
  }

  function parseReference(value, books) {
    var query = normalize(value);
    if (!query) return null;
    var candidates = [];
    books.forEach(function (book) {
      var aliases = [book.name, book.short_name, book.slug && book.slug.replace(/-/g, ' ')].concat(book.aliases || []);
      aliases.forEach(function (alias) {
        var normalizedAlias = normalize(alias);
        if (normalizedAlias) candidates.push({ alias: normalizedAlias, book: book });
      });
    });
    candidates.sort(function (a, b) { return b.alias.length - a.alias.length; });
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      var pattern = new RegExp('^' + escapeRegExp(candidate.alias) + '(?:\\s+|$)');
      if (!pattern.test(query)) continue;
      var rest = query.replace(pattern, '').trim();
      var numbers = rest.match(/^(\d+)(?:\s+(\d+))?/);
      var chapter = numbers ? Number(numbers[1]) : 1;
      var verse = numbers && numbers[2] ? Number(numbers[2]) : null;
      if (chapter < 1 || chapter > Number(candidate.book.chapters)) return null;
      return { book: candidate.book, chapter: chapter, verse: verse };
    }
    return null;
  }

  function initSelectors() {
    var bookSelect = document.querySelector('[data-bible-book-select]');
    var chapterSelect = document.querySelector('[data-bible-chapter-select]');
    if (bookSelect) {
      bookSelect.addEventListener('change', function () { navigate(bookSelect.value, 1); });
    }
    if (chapterSelect) {
      chapterSelect.addEventListener('change', function () { navigate(pageData.bookSlug, Number(chapterSelect.value)); });
    }
  }

  function initBookmark() {
    var button = document.querySelector('[data-bible-bookmark]');
    if (!button || !pageData.bookSlug) return;
    var id = pageData.bookSlug + ':' + pageData.chapter;
    var bookmarks = safeJsonStorage(BOOKMARKS_KEY, []);
    if (!Array.isArray(bookmarks)) bookmarks = [];
    function render() {
      var active = bookmarks.indexOf(id) !== -1;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.textContent = active ? 'Capítulo salvo' : 'Salvar capítulo';
    }
    button.addEventListener('click', function () {
      var index = bookmarks.indexOf(id);
      if (index === -1) bookmarks.push(id); else bookmarks.splice(index, 1);
      writeJsonStorage(BOOKMARKS_KEY, bookmarks);
      render();
    });
    render();
  }

  function rememberReading() {
    if (!pageData.bookSlug || !pageData.chapter) return;
    writeJsonStorage(LAST_READ_KEY, {
      bookSlug: pageData.bookSlug,
      bookName: pageData.bookName,
      chapter: pageData.chapter,
      updatedAt: new Date().toISOString()
    });
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB indisponível')); return; }
      var request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('Falha ao abrir cache')); };
    });
  }

  function idbGet(key) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(DB_STORE, 'readonly');
        var request = transaction.objectStore(DB_STORE).get(key);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
        transaction.oncomplete = function () { db.close(); };
      });
    }).catch(function () { return null; });
  }

  function idbSet(key, value) {
    return openDatabase().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(DB_STORE, 'readwrite');
        transaction.objectStore(DB_STORE).put(value, key);
        transaction.oncomplete = function () { db.close(); resolve(); };
        transaction.onerror = function () { db.close(); reject(transaction.error); };
      });
    }).catch(function () { return null; });
  }

  function fetchJson(url, timeoutMs) {
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? window.setTimeout(function () { controller.abort(); }, timeoutMs || 20000) : null;
    return fetch(url, { cache: 'force-cache', credentials: 'omit', signal: controller ? controller.signal : undefined })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .finally(function () { if (timer) window.clearTimeout(timer); });
  }

  function getCachedJson(key, url) {
    return idbGet(key).then(function (cached) {
      if (cached && cached.version === CACHE_VERSION && cached.payload) return cached.payload;
      return fetchJson(url).then(function (payload) {
        idbSet(key, { version: CACHE_VERSION, storedAt: Date.now(), payload: payload });
        return payload;
      });
    });
  }

  function bookName(book) {
    return book && (book.name || book.nome || book.livro || book.book || book.title || book.titulo);
  }

  function chapterArray(book) {
    if (!book || typeof book !== 'object') return [];
    return book.chapters || book.capitulos || book.capítulos || [];
  }

  function collectBooks(payload) {
    var found = [];
    var visited = typeof WeakSet === 'function' ? new WeakSet() : null;
    function walk(value, depth) {
      if (!value || depth > 5) return;
      if (typeof value === 'object' && visited) {
        if (visited.has(value)) return;
        visited.add(value);
      }
      if (Array.isArray(value)) {
        value.forEach(function (item) { walk(item, depth + 1); });
        return;
      }
      if (typeof value !== 'object') return;
      if (bookName(value) && chapterArray(value).length) {
        found.push(value);
        return;
      }
      Object.keys(value).forEach(function (key) {
        if (['verses', 'versiculos', 'versículos'].indexOf(key) === -1) walk(value[key], depth + 1);
      });
    }
    walk(payload, 0);
    return found;
  }

  function findBook(payload) {
    if (bookName(payload) && chapterArray(payload).length) return payload;
    var books = collectBooks(payload);
    var aliases = [pageData.bookName, pageData.bookShortName, pageData.bookSlug && pageData.bookSlug.replace(/-/g, ' ')].concat(pageData.aliases || []).map(normalize);
    for (var i = 0; i < books.length; i += 1) {
      var current = normalize(bookName(books[i]));
      if (aliases.indexOf(current) !== -1) return books[i];
    }
    var order = Number(pageData.bookOrder) - 1;
    if (books.length >= 73 && order >= 0 && books[order]) return books[order];
    return null;
  }

  function chapterNumber(chapter, index) {
    return Number(chapter && (chapter.number || chapter.numero || chapter.capitulo || chapter.chapter)) || index + 1;
  }

  function verseArray(chapter) {
    if (!chapter) return [];
    return chapter.verses || chapter.versiculos || chapter.versículos || [];
  }

  function normalizeChapter(book, wanted) {
    var chapters = chapterArray(book);
    for (var i = 0; i < chapters.length; i += 1) {
      if (chapterNumber(chapters[i], i) === Number(wanted)) {
        return verseArray(chapters[i]).map(function (verse, verseIndex) {
          var number = Number(verse && (verse.number || verse.numero || verse.versiculo || verse.verse)) || verseIndex + 1;
          var text = String(verse && (verse.text || verse.texto || verse.content || verse.conteudo) || verse || '');
          text = text.replace(/^\s*\[\s*\d+\s*\]\s*/, '').trim();
          return { number: number, text: text };
        }).filter(function (verse) { return verse.text; });
      }
    }
    return [];
  }

  function loadBookPayload() {
    var localBook = siteUrl('/assets/data/bible/books/' + pageData.bookSlug + '.json');
    var localFull = siteUrl('/assets/data/bible/biblia_matos_soares.json');
    var sourceUrl = pageData.sourceUrl;
    var external = pageData.externalPath ? 'https://cdn.jsdelivr.net/gh/Dancrf/biblia-db@main/' + pageData.externalPath : null;
    var attempts = [
      { key: CACHE_VERSION + ':book:' + pageData.bookSlug + ':local', url: localBook },
      { key: CACHE_VERSION + ':full:local', url: localFull },
      sourceUrl ? { key: CACHE_VERSION + ':full:primary', url: sourceUrl } : null,
      external ? { key: CACHE_VERSION + ':book:' + pageData.bookSlug + ':fallback', url: external } : null
    ].filter(Boolean);

    var errors = [];
    function attempt(index) {
      if (index >= attempts.length) throw new Error(errors.join(' · ') || 'Nenhuma fonte disponível');
      var current = attempts[index];
      return getCachedJson(current.key, current.url).then(function (payload) {
        var book = findBook(payload);
        if (!book) throw new Error('Livro não encontrado na fonte');
        return book;
      }).catch(function (error) {
        errors.push(error && error.message ? error.message : String(error));
        return attempt(index + 1);
      });
    }
    return attempt(0);
  }

  function renderVerses(verses) {
    var reading = document.querySelector('[data-bible-reading]');
    if (!reading) return;
    var fragment = document.createDocumentFragment();
    verses.forEach(function (verse) {
      var paragraph = document.createElement('p');
      paragraph.className = 'bible-verse';
      paragraph.id = 'v' + verse.number;
      paragraph.tabIndex = 0;
      paragraph.setAttribute('data-bible-verse', '');
      paragraph.setAttribute('data-verse-number', String(verse.number));
      var number = document.createElement('a');
      number.className = 'bible-verse__number';
      number.href = '#v' + verse.number;
      number.setAttribute('aria-label', 'Versículo ' + verse.number);
      number.textContent = String(verse.number);
      var text = document.createElement('span');
      text.className = 'bible-verse__text';
      text.textContent = verse.text;
      paragraph.appendChild(number);
      paragraph.appendChild(text);
      fragment.appendChild(paragraph);
    });
    reading.replaceChildren(fragment);
    reading.removeAttribute('aria-busy');
    bindVerseSelection();
    focusHashVerse();
  }

  function setStatus(message, hidden) {
    var status = document.querySelector('[data-bible-status]');
    if (!status) return;
    status.textContent = message;
    status.hidden = Boolean(hidden);
  }

  function showError(error) {
    var panel = document.querySelector('[data-bible-error]');
    var message = document.querySelector('[data-bible-error-message]');
    if (message) message.textContent = 'A fonte não respondeu ou possui um formato inesperado. ' + (error && error.message ? error.message : '');
    if (panel) panel.hidden = false;
    setStatus('Falha ao carregar o capítulo.', false);
    var reading = document.querySelector('[data-bible-reading]');
    if (reading) reading.setAttribute('aria-busy', 'false');
  }

  function loadChapter() {
    var errorPanel = document.querySelector('[data-bible-error]');
    if (errorPanel) errorPanel.hidden = true;
    setStatus('Carregando ' + pageData.bookName + ' ' + pageData.chapter + '…', false);
    return loadBookPayload().then(function (book) {
      var verses = normalizeChapter(book, pageData.chapter);
      if (!verses.length) throw new Error('O capítulo foi encontrado, mas não contém versículos reconhecíveis.');
      renderVerses(verses);
      setStatus('Texto carregado.', true);
    }).catch(showError);
  }

  function verseText(verse) {
    var text = verse && verse.querySelector('.bible-verse__text');
    return text ? text.textContent.trim() : '';
  }

  function selectVerse(verse, updateHash) {
    if (selectedVerse) selectedVerse.classList.remove('is-selected');
    selectedVerse = verse;
    if (!verse) {
      var tools = document.querySelector('[data-bible-selection-tools]');
      if (tools) tools.hidden = true;
      return;
    }
    verse.classList.add('is-selected');
    var number = verse.getAttribute('data-verse-number');
    var label = document.querySelector('[data-bible-selection-label]');
    if (label) label.textContent = pageData.bookShortName + ' ' + pageData.chapter + ',' + number;
    var controls = document.querySelector('[data-bible-selection-tools]');
    if (controls) controls.hidden = false;
    if (updateHash && window.history && history.replaceState) history.replaceState(null, '', '#v' + number);
  }

  function bindVerseSelection() {
    document.querySelectorAll('[data-bible-verse]').forEach(function (verse) {
      if (verse.getAttribute('data-bible-bound') === 'true') return;
      verse.setAttribute('data-bible-bound', 'true');
      verse.addEventListener('click', function (event) {
        if (event.target.closest('a')) return;
        selectVerse(verse, true);
      });
      verse.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectVerse(verse, true); }
      });
    });
  }

  function focusHashVerse() {
    var match = window.location.hash.match(/^#v(\d+)$/);
    if (!match) return;
    var verse = document.getElementById('v' + match[1]);
    if (!verse) return;
    window.requestAnimationFrame(function () {
      verse.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      selectVerse(verse, false);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); resolve(); } catch (error) { reject(error); }
      area.remove();
    });
  }

  function initActions() {
    var copyVerse = document.querySelector('[data-bible-copy-verse]');
    if (copyVerse) copyVerse.addEventListener('click', function () {
      if (!selectedVerse) return;
      var number = selectedVerse.getAttribute('data-verse-number');
      var citation = pageData.bookShortName + ' ' + pageData.chapter + ',' + number;
      copyText(verseText(selectedVerse) + ' (' + citation + ')').then(function () { copyVerse.textContent = 'Copiado'; });
    });
    var clear = document.querySelector('[data-bible-clear-selection]');
    if (clear) clear.addEventListener('click', function () { selectVerse(null, false); });
    var copyLink = document.querySelector('[data-bible-copy-link]');
    if (copyLink) copyLink.addEventListener('click', function () {
      copyText(window.location.href).then(function () { copyLink.textContent = 'Endereço copiado'; });
    });
    var share = document.querySelector('[data-bible-share]');
    if (share) share.addEventListener('click', function () {
      var data = { title: document.title, text: pageData.bookName + ' ' + pageData.chapter + ' · Bíblia Sagrada', url: window.location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else copyText(window.location.href).then(function () { share.textContent = 'Endereço copiado'; });
    });
    var retry = document.querySelector('[data-bible-retry]');
    if (retry) retry.addEventListener('click', loadChapter);
  }

  function initReader() {
    initSelectors();
    initBookmark();
    initActions();
    rememberReading();
    bindVerseSelection();
    var reading = document.querySelector('[data-bible-reading]');
    if (reading && !reading.querySelector('[data-bible-verse]')) loadChapter();
    else focusHashVerse();
  }

  if (root.hasAttribute('data-bible-index') || root.hasAttribute('data-bible-book-page')) initIndex();
  if (root.hasAttribute('data-bible-reader')) initReader();
}());
