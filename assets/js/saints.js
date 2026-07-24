(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OratioSaints = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var DEFAULT_TIMEZONE = 'America/Sao_Paulo';
  var DEFAULT_LOCALE = 'pt-BR';
  var DATA_PROMISES = new Map();
  var MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  var GENERIC_RELATION_TERMS = new Set([
    'santo', 'santa', 'santos', 'igreja', 'catolico', 'catolica', 'oracao',
    'devocao', 'fe', 'cristo', 'jesus', 'deus', 'maria', 'historia', 'memoria'
  ]);

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
      .map(function (value) { return String(value || '').trim(); })
      .filter(Boolean)));
  }

  function safeNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toISODate(date) {
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
  }

  function parseISODate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    var match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    var date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) return null;
    return date;
  }

  function addDays(date, amount) {
    var result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + safeNumber(amount, 0));
    return result;
  }

  function daysBetween(first, second) {
    return Math.round((second.getTime() - first.getTime()) / 86400000);
  }

  function todayInTimezone(timezone) {
    var formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    var parts = formatter.formatToParts(new Date());
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return parseISODate(values.year + '-' + values.month + '-' + values.day);
  }

  function formatDate(date, options) {
    if (!date) return '';
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, Object.assign({
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long'
    }, options || {})).format(date);
  }

  function easterDate(year) {
    // Algoritmo de Meeus/Jones/Butcher para o calendário gregoriano.
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31);
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function firstSundayOfAdvent(year) {
    var date = new Date(Date.UTC(year, 10, 27));
    while (date.getUTCDay() !== 0) date = addDays(date, 1);
    return date;
  }

  function nthWeekdayOfMonth(year, month, weekday, occurrence) {
    month = safeNumber(month, 1);
    weekday = safeNumber(weekday, 0);
    occurrence = safeNumber(occurrence, 1);
    if (occurrence < 0) {
      var last = new Date(Date.UTC(year, month, 0));
      var backwards = (last.getUTCDay() - weekday + 7) % 7;
      return addDays(last, -backwards - (Math.abs(occurrence) - 1) * 7);
    }
    var first = new Date(Date.UTC(year, month - 1, 1));
    var forward = (weekday - first.getUTCDay() + 7) % 7;
    return addDays(first, forward + (occurrence - 1) * 7);
  }

  function weekdayFromFixed(year, rule, direction) {
    var base = new Date(Date.UTC(year, safeNumber(rule.month, 1) - 1, safeNumber(rule.day, 1)));
    var target = safeNumber(rule.weekday, 0);
    var inclusive = rule.inclusive === true;
    var delta;
    if (direction > 0) {
      delta = (target - base.getUTCDay() + 7) % 7;
      if (!inclusive && delta === 0) delta = 7;
    } else {
      delta = -((base.getUTCDay() - target + 7) % 7);
      if (!inclusive && delta === 0) delta = -7;
    }
    return addDays(base, delta + safeNumber(rule.offset_days, 0));
  }

  function normalizedDateRule(saintOrRule) {
    if (!saintOrRule) return null;
    if (saintOrRule.liturgicalDate || saintOrRule.liturgical_date || saintOrRule.memorialMonth || saintOrRule.memorial_month) {
      var nested = saintOrRule.liturgicalDate || saintOrRule.liturgical_date;
      if (nested && typeof nested === 'object') return nested;
      var month = saintOrRule.memorialMonth || saintOrRule.memorial_month;
      var day = saintOrRule.memorialDay || saintOrRule.memorial_day;
      if (month && day) return { type: 'fixed', month: month, day: day };
      return null;
    }
    return saintOrRule;
  }

  function resolveLiturgicalDate(saintOrRule, year) {
    var rule = normalizedDateRule(saintOrRule);
    year = safeNumber(year, new Date().getUTCFullYear());
    if (!rule || typeof rule !== 'object') return null;

    var yearFrom = safeNumber(rule.year_from !== undefined ? rule.year_from : rule.yearFrom, null);
    var yearTo = safeNumber(rule.year_to !== undefined ? rule.year_to : rule.yearTo, null);
    if (yearFrom !== null && year < yearFrom) return null;
    if (yearTo !== null && year > yearTo) return null;

    var type = normalizeText(rule.type || rule.rule || rule.base).replace(/ /g, '_');
    if (!type && rule.month && rule.day) type = 'fixed';
    if (type === 'movable') type = normalizeText(rule.rule || rule.base).replace(/ /g, '_');
    if (type === 'none' || type === 'undated' || type === 'sem_data') return null;

    if (type === 'fixed') {
      var fixedDate = new Date(Date.UTC(year, safeNumber(rule.month, 1) - 1, safeNumber(rule.day, 1)));
      if (fixedDate.getUTCMonth() !== safeNumber(rule.month, 1) - 1 || fixedDate.getUTCDate() !== safeNumber(rule.day, 1)) return null;
      return addDays(fixedDate, safeNumber(rule.offset_days, 0));
    }

    if (type === 'easter' || type === 'easter_offset' || type === 'pascoa' || type === 'pascoa_offset') {
      return addDays(easterDate(year), safeNumber(rule.offset_days !== undefined ? rule.offset_days : rule.offset, 0));
    }
    if (type === 'ash_wednesday' || type === 'quarta_feira_de_cinzas') return addDays(easterDate(year), -46);
    if (type === 'sacred_heart' || type === 'sagrado_coracao') return addDays(easterDate(year), 68);
    if (type === 'christmas' || type === 'christmas_offset' || type === 'natal' || type === 'natal_offset') {
      return addDays(new Date(Date.UTC(year, 11, 25)), safeNumber(rule.offset_days !== undefined ? rule.offset_days : rule.offset, 0));
    }
    if (type === 'advent' || type === 'advent_offset' || type === 'advento' || type === 'advento_offset') {
      return addDays(firstSundayOfAdvent(year), safeNumber(rule.offset_days !== undefined ? rule.offset_days : rule.offset, 0));
    }
    if (type === 'nth_weekday') {
      var nthDate = nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.occurrence);
      if (nthDate.getUTCMonth() !== safeNumber(rule.month, 1) - 1) return null;
      return addDays(nthDate, safeNumber(rule.offset_days, 0));
    }
    if (type === 'weekday_after_fixed') return weekdayFromFixed(year, rule, 1);
    if (type === 'weekday_before_fixed') return weekdayFromFixed(year, rule, -1);
    if (type === 'fixed_offset') {
      return addDays(new Date(Date.UTC(year, safeNumber(rule.month, 1) - 1, safeNumber(rule.day, 1))), safeNumber(rule.offset_days, 0));
    }
    return null;
  }

  function isUndated(saint) {
    var rule = normalizedDateRule(saint);
    if (!rule) return true;
    var type = normalizeText(rule.type || '').replace(/ /g, '_');
    return type === 'none' || type === 'undated' || type === 'sem_data';
  }

  function getForDateFromData(data, inputDate) {
    var date = parseISODate(inputDate) || inputDate;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return [];
    var target = toISODate(date);
    return (data.saints || []).filter(function (saint) {
      var resolved = resolveLiturgicalDate(saint, date.getUTCFullYear());
      return resolved && toISODate(resolved) === target;
    }).sort(function (first, second) {
      return safeNumber(first.dailyOrder, 100) - safeNumber(second.dailyOrder, 100) ||
        String(first.title || '').localeCompare(String(second.title || ''), DEFAULT_LOCALE);
    });
  }

  function resolveEndpoint(element) {
    return element && element.dataset && element.dataset.saintsEndpoint
      ? element.dataset.saintsEndpoint
      : '/santos/dados.json';
  }

  function load(endpoint) {
    endpoint = endpoint || '/santos/dados.json';
    if (!DATA_PROMISES.has(endpoint)) {
      DATA_PROMISES.set(endpoint, fetch(endpoint, { credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) throw new Error('Não foi possível carregar o índice de santos.');
          return response.json();
        })
        .then(function (data) {
          data.saints = Array.isArray(data.saints) ? data.saints : [];
          data.content = Array.isArray(data.content) ? data.content : [];
          return data;
        })
        .catch(function (error) {
          DATA_PROMISES.delete(endpoint);
          throw error;
        }));
    }
    return DATA_PROMISES.get(endpoint);
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function createImageShell(item, linkClass, eager) {
    var link = element('a', linkClass + ' image-shell');
    link.href = item.url;
    link.setAttribute('aria-label', 'Abrir a história de ' + item.title);
    if (item.image) {
      var image = element('img');
      image.src = item.image;
      image.alt = item.imageAlt || item.title;
      image.width = safeNumber(item.imageWidth, 1200);
      image.height = safeNumber(item.imageHeight, 675);
      image.loading = eager ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.style.objectPosition = item.imagePosition || 'center';
      image.addEventListener('error', function () {
        image.hidden = true;
        placeholder.hidden = false;
      }, { once: true });
      link.appendChild(image);
    }
    var placeholder = element('span', 'image-placeholder');
    placeholder.hidden = Boolean(item.image);
    placeholder.appendChild(element('span', '', '✢'));
    placeholder.appendChild(element('small', '', item.entryType || 'Santo'));
    link.appendChild(placeholder);
    return link;
  }

  function dateLabelForSaint(saint, year) {
    var rule = normalizedDateRule(saint);
    var date = resolveLiturgicalDate(saint, year);
    if (date) {
      var type = normalizeText(rule && (rule.type || rule.rule || rule.base)).replace(/ /g, '_');
      if (rule && rule.label && type !== 'fixed') return rule.label + ' · ' + formatDate(date);
      return rule && rule.label ? rule.label : formatDate(date);
    }
    return (rule && rule.label) || saint.liturgicalMemorial || 'Sem data litúrgica definida';
  }

  function createSaintCard(item, options) {
    options = options || {};
    var article = element('article', options.compact ? 'saint-mini-card' : 'saint-card');
    article.dataset.saintSlug = item.slug || '';
    article.appendChild(createImageShell(item, options.compact ? 'saint-mini-card__media' : 'saint-card__media', options.eager));
    var body = element('div', options.compact ? 'saint-mini-card__body' : 'saint-card__body');
    var meta = element('div', options.compact ? 'saint-mini-card__meta' : 'saint-card__meta');
    meta.appendChild(element('span', 'chip', item.entryType || 'Santo'));
    if (item.liturgicalRank) meta.appendChild(element('span', '', item.liturgicalRank));
    body.appendChild(meta);
    var heading = element(options.compact ? 'h3' : 'h3');
    var titleLink = element('a', '', item.title);
    titleLink.href = item.url;
    heading.appendChild(titleLink);
    body.appendChild(heading);
    if (item.subtitle) body.appendChild(element('p', options.compact ? 'saint-mini-card__subtitle' : 'saint-card__subtitle', item.subtitle));
    body.appendChild(element('p', options.compact ? 'saint-mini-card__date' : 'saint-card__date', dateLabelForSaint(item, options.year || new Date().getUTCFullYear())));
    if (!options.compact && item.description) body.appendChild(element('p', 'saint-card__description', item.description));
    if (!options.compact) {
      var more = element('a', 'saint-card__link', 'Conhecer esta história ');
      more.href = item.url;
      more.appendChild(element('span', '', '→'));
      more.lastChild.setAttribute('aria-hidden', 'true');
      body.appendChild(more);
    }
    article.appendChild(body);
    return article;
  }

  function renderDayComponent(container, data, date) {
    var content = container.querySelector('[data-saint-of-day-content]');
    var dateLabel = container.querySelector('[data-saint-of-day-date]');
    var input = container.querySelector('[data-saint-date-input]');
    if (!content) return;
    content.replaceChildren();
    dateLabel.textContent = formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (input) input.value = toISODate(date);
    var matches = getForDateFromData(data, date);
    if (!matches.length) {
      var empty = element('div', 'saint-today__empty');
      empty.appendChild(element('span', 'empty-state__symbol', '✢'));
      empty.appendChild(element('h3', '', 'Nenhuma celebração cadastrada para esta data'));
      empty.appendChild(element('p', '', 'O acervo pode continuar sendo consultado pela pesquisa, pelo calendário ou pelo índice alfabético.'));
      content.appendChild(empty);
      return;
    }
    if (matches.length > 1) {
      content.appendChild(element('p', 'saint-today__multiple-note', matches.length + ' celebrações cadastradas para esta data. Cada história permanece disponível de forma independente.'));
    }
    var grid = element('div', 'saint-today__grid');
    matches.forEach(function (saint) { grid.appendChild(createSaintCard(saint, { compact: true, eager: true, year: date.getUTCFullYear() })); });
    content.appendChild(grid);
  }

  function initializeDayComponents() {
    document.querySelectorAll('[data-saint-of-day]').forEach(function (container) {
      var endpoint = resolveEndpoint(container);
      load(endpoint).then(function (data) {
        var timezone = data.timezone || DEFAULT_TIMEZONE;
        var selected = parseISODate(container.dataset.saintDate) || todayInTimezone(timezone);
        renderDayComponent(container, data, selected);
        var previous = container.querySelector('[data-saint-day-previous]');
        var next = container.querySelector('[data-saint-day-next]');
        var input = container.querySelector('[data-saint-date-input]');
        if (previous) previous.addEventListener('click', function () {
          selected = addDays(selected, -1);
          renderDayComponent(container, data, selected);
        });
        if (next) next.addEventListener('click', function () {
          selected = addDays(selected, 1);
          renderDayComponent(container, data, selected);
        });
        if (input) input.addEventListener('change', function () {
          var parsed = parseISODate(input.value);
          if (parsed) {
            selected = parsed;
            renderDayComponent(container, data, selected);
          }
        });
      }).catch(function () {
        var content = container.querySelector('[data-saint-of-day-content]');
        if (content) content.textContent = 'Não foi possível consultar o calendário de santos neste momento.';
      });
    });
  }

  function parseRuleAttribute(node) {
    try {
      if (node.dataset.dateRule) {
        var parsed = JSON.parse(node.dataset.dateRule);
        if (parsed) return parsed;
      }
    } catch (error) {
      // O fallback legado abaixo mantém o conteúdo utilizável.
    }
    if (node.dataset.memorialMonth && node.dataset.memorialDay) {
      return { type: 'fixed', month: Number(node.dataset.memorialMonth), day: Number(node.dataset.memorialDay) };
    }
    return null;
  }

  function hydrateDateLabels() {
    var year = new Date().getUTCFullYear();
    document.querySelectorAll('[data-saint-date-label]').forEach(function (node) {
      var rule = parseRuleAttribute(node);
      var date = resolveLiturgicalDate(rule, year);
      if (date) {
        var type = normalizeText(rule && (rule.type || rule.rule || rule.base)).replace(/ /g, '_');
        node.textContent = rule && rule.label && type !== 'fixed' ? rule.label + ' · ' + formatDate(date) : (rule && rule.label ? rule.label : formatDate(date));
      } else node.textContent = node.dataset.dateFallback || 'Sem data litúrgica definida';
    });
  }

  function saintSearchText(saint) {
    return normalizeText([
      saint.title, saint.shortTitle, saint.subtitle, saint.description, saint.entryType,
      saint.saintType, saint.category, saint.religiousFamily,
      (saint.tags || []).join(' '), (saint.keywords || []).join(' '),
      (saint.aliases || []).join(' '), (saint.patronages || []).join(' '),
      (saint.virtues || []).join(' ')
    ].join(' '));
  }

  function monthForSaint(saint, year) {
    var date = resolveLiturgicalDate(saint, year);
    return date ? date.getUTCMonth() + 1 : null;
  }

  function initializeArchive() {
    var archive = document.querySelector('[data-saints-archive]');
    if (!archive) return;
    load(resolveEndpoint(archive)).then(function (data) {
      var currentDate = todayInTimezone(data.timezone || DEFAULT_TIMEZONE);
      var currentYear = currentDate.getUTCFullYear();
      var state = { query: '', type: '', month: '', sort: 'alphabetical', visible: 12, view: 'all', calendarYear: currentYear, calendarMonth: currentDate.getUTCMonth() };
      var allGrid = archive.querySelector('[data-saints-grid]');
      var serverCards = new Map();
      allGrid.querySelectorAll('[data-saint-card]').forEach(function (card) { serverCards.set(card.dataset.saintSlug, card); });
      var search = archive.querySelector('[data-saints-search]');
      var typeFilter = archive.querySelector('[data-saints-type-filter]');
      var monthFilter = archive.querySelector('[data-saints-month-filter]');
      var sortSelect = archive.querySelector('[data-saints-sort]');
      var count = archive.querySelector('[data-saints-count]');
      var empty = archive.querySelector('[data-saints-empty]');
      var loadMoreWrapper = archive.querySelector('[data-saints-load-more-wrapper]');
      var loadMore = archive.querySelector('[data-saints-load-more]');

      function filteredSaints() {
        var query = normalizeText(state.query);
        return data.saints.filter(function (saint) {
          if (query && saintSearchText(saint).indexOf(query) === -1) return false;
          if (state.type && String(saint.saintType || saint.entryType || '') !== state.type) return false;
          if (state.month && monthForSaint(saint, currentYear) !== Number(state.month)) return false;
          return true;
        }).sort(function (first, second) {
          if (state.sort === 'date') {
            var firstDate = resolveLiturgicalDate(first, currentYear);
            var secondDate = resolveLiturgicalDate(second, currentYear);
            if (!firstDate && secondDate) return 1;
            if (firstDate && !secondDate) return -1;
            if (firstDate && secondDate && firstDate.getTime() !== secondDate.getTime()) return firstDate - secondDate;
          }
          if (state.sort === 'type') {
            var typeCompare = String(first.saintType || first.entryType || '').localeCompare(String(second.saintType || second.entryType || ''), DEFAULT_LOCALE);
            if (typeCompare) return typeCompare;
          }
          return String(first.title || '').localeCompare(String(second.title || ''), DEFAULT_LOCALE);
        });
      }

      function renderAll() {
        var filtered = filteredSaints();
        var fragment = document.createDocumentFragment();
        filtered.forEach(function (saint, index) {
          var card = serverCards.get(saint.slug) || createSaintCard(saint, { year: currentYear });
          card.hidden = index >= state.visible;
          fragment.appendChild(card);
        });
        allGrid.replaceChildren(fragment);
        count.textContent = filtered.length + (filtered.length === 1 ? ' conteúdo encontrado' : ' conteúdos encontrados');
        empty.hidden = filtered.length !== 0;
        loadMoreWrapper.hidden = filtered.length <= state.visible;
      }

      function switchView(view) {
        state.view = view;
        archive.querySelectorAll('[data-saints-view-button]').forEach(function (button) {
          var selected = button.dataset.saintsViewButton === view;
          button.setAttribute('aria-selected', String(selected));
          button.tabIndex = selected ? 0 : -1;
        });
        archive.querySelectorAll('[data-saints-panel]').forEach(function (panel) { panel.hidden = panel.dataset.saintsPanel !== view; });
        if (view === 'calendar') renderCalendar();
        if (view === 'alpha') renderAlphabetical();
        if (view === 'undated') renderUndated();
      }

      function renderCalendarSelection(date) {
        var selection = archive.querySelector('[data-calendar-selection]');
        selection.replaceChildren();
        selection.appendChild(element('h4', '', formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })));
        var matches = getForDateFromData({ saints: filteredSaints() }, date);
        if (!matches.length) {
          selection.appendChild(element('p', '', 'Nenhum santo ou celebração corresponde aos filtros nesta data.'));
          return;
        }
        var grid = element('div', 'saints-grid saints-grid--calendar-selection');
        matches.forEach(function (saint) { grid.appendChild(createSaintCard(saint, { year: date.getUTCFullYear() })); });
        selection.appendChild(grid);
      }

      function renderCalendar() {
        var grid = archive.querySelector('[data-calendar-grid]');
        var title = archive.querySelector('[data-calendar-title]');
        var first = new Date(Date.UTC(state.calendarYear, state.calendarMonth, 1));
        var lastDay = new Date(Date.UTC(state.calendarYear, state.calendarMonth + 1, 0)).getUTCDate();
        title.textContent = MONTH_NAMES[state.calendarMonth] + ' de ' + state.calendarYear;
        grid.replaceChildren();
        for (var blank = 0; blank < first.getUTCDay(); blank += 1) {
          var spacer = element('span', 'saints-calendar__blank');
          spacer.setAttribute('aria-hidden', 'true');
          grid.appendChild(spacer);
        }
        for (var day = 1; day <= lastDay; day += 1) {
          (function (dayNumber) {
            var date = new Date(Date.UTC(state.calendarYear, state.calendarMonth, dayNumber));
            var matches = getForDateFromData({ saints: filteredSaints() }, date);
            var button = element('button', 'saints-calendar__day');
            button.type = 'button';
            button.appendChild(element('span', 'saints-calendar__day-number', String(dayNumber)));
            if (matches.length) button.appendChild(element('span', 'saints-calendar__day-count', String(matches.length)));
            if (toISODate(date) === toISODate(currentDate)) button.classList.add('is-today');
            if (matches.length) button.classList.add('has-saints');
            button.setAttribute('aria-label', dayNumber + ' de ' + MONTH_NAMES[state.calendarMonth].toLowerCase() + ': ' + (matches.length ? matches.length + ' celebração(ões)' : 'nenhuma celebração cadastrada'));
            button.addEventListener('click', function () { renderCalendarSelection(date); });
            grid.appendChild(button);
          })(day);
        }
      }

      function renderAlphabetical() {
        var nav = archive.querySelector('[data-saints-alphabet]');
        var groups = archive.querySelector('[data-saints-alpha-groups]');
        var grouped = {};
        filteredSaints().forEach(function (saint) {
          var letter = normalizeText(saint.title).charAt(0).toUpperCase() || '#';
          if (!grouped[letter]) grouped[letter] = [];
          grouped[letter].push(saint);
        });
        nav.replaceChildren();
        groups.replaceChildren();
        Object.keys(grouped).sort().forEach(function (letter) {
          var anchor = element('a', '', letter);
          anchor.href = '#santos-letra-' + letter.toLowerCase();
          nav.appendChild(anchor);
          var section = element('section', 'saints-alpha-group');
          section.id = 'santos-letra-' + letter.toLowerCase();
          section.appendChild(element('h3', '', letter));
          var cardGrid = element('div', 'saints-grid');
          grouped[letter].forEach(function (saint) { cardGrid.appendChild(createSaintCard(saint, { year: currentYear })); });
          section.appendChild(cardGrid);
          groups.appendChild(section);
        });
        if (!Object.keys(grouped).length) groups.appendChild(element('p', 'notice', 'Nenhum item corresponde aos filtros atuais.'));
      }

      function renderUndated() {
        var grid = archive.querySelector('[data-saints-undated-grid]');
        var emptyState = archive.querySelector('[data-saints-undated-empty]');
        var undated = filteredSaints().filter(isUndated);
        grid.replaceChildren();
        undated.forEach(function (saint) { grid.appendChild(createSaintCard(saint, { year: currentYear })); });
        emptyState.hidden = undated.length !== 0;
      }

      function resetPaginationAndRender() {
        state.visible = 12;
        renderAll();
        if (state.view === 'calendar') renderCalendar();
        if (state.view === 'alpha') renderAlphabetical();
        if (state.view === 'undated') renderUndated();
      }

      search.addEventListener('input', function () { state.query = search.value; resetPaginationAndRender(); });
      typeFilter.addEventListener('change', function () { state.type = typeFilter.value; resetPaginationAndRender(); });
      monthFilter.addEventListener('change', function () { state.month = monthFilter.value; resetPaginationAndRender(); });
      sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; resetPaginationAndRender(); });
      loadMore.addEventListener('click', function () { state.visible += 12; renderAll(); });
      archive.querySelector('[data-saints-clear]').addEventListener('click', function () {
        search.value = '';
        typeFilter.value = '';
        monthFilter.value = '';
        sortSelect.value = 'alphabetical';
        state.query = '';
        state.type = '';
        state.month = '';
        state.sort = 'alphabetical';
        resetPaginationAndRender();
      });
      var viewButtons = Array.from(archive.querySelectorAll('[data-saints-view-button]'));
      viewButtons.forEach(function (button, index) {
        button.addEventListener('click', function () { switchView(button.dataset.saintsViewButton); });
        button.addEventListener('keydown', function (event) {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
          event.preventDefault();
          var targetIndex = index;
          if (event.key === 'ArrowLeft') targetIndex = (index - 1 + viewButtons.length) % viewButtons.length;
          if (event.key === 'ArrowRight') targetIndex = (index + 1) % viewButtons.length;
          if (event.key === 'Home') targetIndex = 0;
          if (event.key === 'End') targetIndex = viewButtons.length - 1;
          viewButtons[targetIndex].focus();
          switchView(viewButtons[targetIndex].dataset.saintsViewButton);
        });
      });
      archive.querySelectorAll('[data-open-saints-view]').forEach(function (link) {
        link.addEventListener('click', function () { switchView(link.dataset.openSaintsView); });
      });
      archive.querySelector('[data-calendar-previous]').addEventListener('click', function () {
        state.calendarMonth -= 1;
        if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear -= 1; }
        renderCalendar();
      });
      archive.querySelector('[data-calendar-next]').addEventListener('click', function () {
        state.calendarMonth += 1;
        if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear += 1; }
        renderCalendar();
      });
      renderAll();
    }).catch(function () {
      var warning = element('p', 'notice notice--warning', 'Os filtros avançados e o calendário não puderam ser carregados, mas as histórias continuam disponíveis abaixo.');
      archive.querySelector('.saints-library__heading').after(warning);
    });
  }

  function slugifyHeading(value) {
    return normalizeText(value).replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'secao';
  }

  function initializeTableOfContents(page) {
    var article = page.querySelector('[data-saint-article]');
    var aside = page.querySelector('[data-saint-toc]');
    var list = page.querySelector('[data-saint-toc-list]');
    if (!article || !aside || !list) return;
    var headings = Array.from(article.querySelectorAll('h2, h3'));
    if (headings.length < 2) return;
    var used = new Set();
    headings.forEach(function (heading) {
      var base = heading.id || slugifyHeading(heading.textContent);
      var id = base;
      var counter = 2;
      while (used.has(id) || document.getElementById(id)) { id = base + '-' + counter; counter += 1; }
      heading.id = id;
      used.add(id);
      var item = element('li', heading.tagName === 'H3' ? 'is-subheading' : '');
      var link = element('a', '', heading.textContent);
      link.href = '#' + id;
      item.appendChild(link);
      list.appendChild(item);
    });
    aside.hidden = false;
  }

  function relationTerms(saint) {
    return uniqueStrings([].concat(saint.tags || [], saint.keywords || [], saint.patronages || [], saint.virtues || [], saint.religiousFamily || [], saint.saintType || []))
      .map(normalizeText)
      .filter(function (term) { return term && !GENERIC_RELATION_TERMS.has(term); });
  }

  function sharedCount(first, second) {
    var set = new Set(first);
    return second.reduce(function (count, value) { return count + (set.has(value) ? 1 : 0); }, 0);
  }

  function dayOfYear(date) {
    var start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return daysBetween(start, date) + 1;
  }

  function calendarDistance(first, second) {
    var distance = Math.abs(dayOfYear(first) - dayOfYear(second));
    var daysInYear = daysBetween(
      new Date(Date.UTC(first.getUTCFullYear(), 0, 1)),
      new Date(Date.UTC(first.getUTCFullYear() + 1, 0, 1))
    );
    return Math.min(distance, daysInYear - distance);
  }

  function scoreRelatedSaint(current, candidate, year) {
    if (!candidate || candidate.slug === current.slug) return -Infinity;
    var score = 0;
    if ((current.relatedSaints || []).indexOf(candidate.slug) !== -1) score += 100;
    if ((candidate.relatedSaints || []).indexOf(current.slug) !== -1) score += 45;
    score += sharedCount(relationTerms(current), relationTerms(candidate)) * 12;
    if (current.saintType && current.saintType === candidate.saintType) score += 5;
    if (current.religiousFamily && current.religiousFamily === candidate.religiousFamily) score += 14;
    var currentDate = resolveLiturgicalDate(current, year);
    var candidateDate = resolveLiturgicalDate(candidate, year);
    if (currentDate && candidateDate) {
      var distance = calendarDistance(currentDate, candidateDate);
      if (distance === 0) score += 30;
      else if (distance <= 3) score += 14;
      else if (distance <= 7) score += 7;
      else if (distance <= 14) score += 3;
    }
    return score;
  }

  function scoreRelatedContent(saint, item) {
    var score = 0;
    var slugLists = uniqueStrings([].concat(item.saintSlugs || [], item.saints || [], item.related || [])).map(normalizeText);
    if (slugLists.indexOf(normalizeText(saint.slug)) !== -1) score += 120;
    var haystack = normalizeText([item.title, item.description, item.searchText, (item.tags || []).join(' '), (item.keywords || []).join(' ')].join(' '));
    uniqueStrings([saint.title, saint.shortTitle].concat(saint.aliases || [])).forEach(function (name) {
      var normalizedName = normalizeText(name);
      if (normalizedName && haystack.indexOf(normalizedName) !== -1) score += normalizedName === normalizeText(saint.title) ? 45 : 24;
    });
    score += sharedCount(relationTerms(saint), uniqueStrings([].concat(item.tags || [], item.keywords || [])).map(normalizeText)) * 9;
    return score;
  }

  function createRelatedContentCard(item) {
    var article = element('article', 'saint-related-content-card');
    if (item.image) {
      var media = element('a', 'saint-related-content-card__media image-shell');
      media.href = item.url;
      var image = element('img');
      image.src = item.image;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      media.appendChild(image);
      article.appendChild(media);
    }
    var body = element('div', 'saint-related-content-card__body');
    body.appendChild(element('span', 'chip', item.type || 'Conteúdo'));
    var heading = element('h4');
    var link = element('a', '', item.title);
    link.href = item.url;
    heading.appendChild(link);
    body.appendChild(heading);
    if (item.description) body.appendChild(element('p', '', item.description));
    article.appendChild(body);
    return article;
  }

  function initializeRelatedContent(page) {
    var slug = page.dataset.saintSlug;
    var endpoint = resolveEndpoint(page);
    load(endpoint).then(function (data) {
      var current = data.saints.find(function (saint) { return saint.slug === slug; });
      if (!current) return;
      var year = todayInTimezone(data.timezone || DEFAULT_TIMEZONE).getUTCFullYear();
      var saintsGrid = page.querySelector('[data-related-saints-grid]');
      var existingSaints = new Set(Array.from(saintsGrid.querySelectorAll('[data-saint-slug]')).map(function (node) { return node.dataset.saintSlug; }));
      data.saints
        .map(function (candidate) { return { saint: candidate, score: scoreRelatedSaint(current, candidate, year) }; })
        .filter(function (entry) { return entry.score > 0 && !existingSaints.has(entry.saint.slug); })
        .sort(function (first, second) { return second.score - first.score || String(first.saint.title).localeCompare(String(second.saint.title), DEFAULT_LOCALE); })
        .slice(0, Math.max(0, 4 - existingSaints.size))
        .forEach(function (entry) { saintsGrid.appendChild(createSaintCard(entry.saint, { year: year })); });
      var saintsStatus = page.querySelector('[data-related-saints-status]');
      saintsStatus.hidden = saintsGrid.children.length > 0;
      if (!saintsStatus.hidden) saintsStatus.textContent = 'Ainda não há outros santos relacionados a esta história.';

      var contentGrid = page.querySelector('[data-related-content-grid]');
      var existingContentUrls = new Set(Array.from(contentGrid.querySelectorAll('a[href]')).map(function (link) { return link.getAttribute('href'); }));
      data.content
        .map(function (item) { return { item: item, score: scoreRelatedContent(current, item) }; })
        .filter(function (entry) { return entry.score > 0 && !existingContentUrls.has(entry.item.url); })
        .sort(function (first, second) { return second.score - first.score || String(first.item.title).localeCompare(String(second.item.title), DEFAULT_LOCALE); })
        .slice(0, Math.max(0, 6 - contentGrid.children.length))
        .forEach(function (entry) { contentGrid.appendChild(createRelatedContentCard(entry.item)); });
      var contentStatus = page.querySelector('[data-related-content-status]');
      contentStatus.hidden = contentGrid.children.length > 0;
      if (!contentStatus.hidden) contentStatus.textContent = 'Ainda não há orações, devoções, formações ou artigos relacionados a esta história.';
    }).catch(function () {
      page.querySelectorAll('.saint-related__status').forEach(function (status) {
        if (!status.hidden) status.textContent = 'Não foi possível completar as sugestões automáticas.';
      });
    });
  }

  function initializeSaintPage() {
    var page = document.querySelector('[data-saint-page]');
    if (!page) return;
    initializeTableOfContents(page);
    initializeRelatedContent(page);
  }

  function initializeImageFallbacks() {
    document.querySelectorAll('[data-fallback-image]').forEach(function (image) {
      image.addEventListener('error', function () {
        image.hidden = true;
        var placeholder = image.parentElement && image.parentElement.querySelector('.image-placeholder');
        if (placeholder) placeholder.hidden = false;
      }, { once: true });
    });
  }

  function init() {
    hydrateDateLabels();
    initializeImageFallbacks();
    initializeDayComponents();
    initializeArchive();
    initializeSaintPage();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  }

  return {
    init: init,
    load: load,
    normalizeText: normalizeText,
    parseISODate: parseISODate,
    toISODate: toISODate,
    addDays: addDays,
    easterDate: easterDate,
    firstSundayOfAdvent: firstSundayOfAdvent,
    nthWeekdayOfMonth: nthWeekdayOfMonth,
    resolveLiturgicalDate: resolveLiturgicalDate,
    getForDate: getForDateFromData,
    isUndated: isUndated,
    todayInTimezone: todayInTimezone,
    scoreRelatedSaint: scoreRelatedSaint,
    scoreRelatedContent: scoreRelatedContent
  };
});
