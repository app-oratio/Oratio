(function () {
  'use strict';

  var SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';
  var HOUR_LABELS = {
    'oficio-das-leituras': 'Ofício das Leituras',
    'laudes': 'Laudes',
    'hora-terca': 'Hora Terça',
    'hora-sexta': 'Hora Sexta',
    'hora-nona': 'Hora Nona',
    'vesperas': 'Vésperas',
    'completas': 'Completas'
  };

  function readDaysData() {
    var element = document.querySelector('[data-liturgy-days-json]');
    if (!element) return { days: [], baseurl: '' };

    try {
      var value = JSON.parse(element.textContent || '[]');
      return {
        days: Array.isArray(value) ? value : [],
        baseurl: normalizeBaseurl(element.getAttribute('data-baseurl') || '')
      };
    } catch (error) {
      return { days: [], baseurl: '' };
    }
  }

  function normalizeBaseurl(value) {
    if (!value || value === '/') return '';
    return '/' + String(value).replace(/^\/+|\/+$/g, '');
  }

  function localUrl(url, baseurl) {
    if (!url || /^(?:[a-z]+:)?\/\//i.test(url) || url.charAt(0) === '#') return url;
    var normalized = '/' + String(url).replace(/^\/+/, '');
    if (baseurl && normalized.indexOf(baseurl + '/') !== 0 && normalized !== baseurl) {
      return baseurl + normalized;
    }
    return normalized;
  }

  function saoPauloParts(now) {
    var formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SAO_PAULO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    var result = {};
    formatter.formatToParts(now || new Date()).forEach(function (part) {
      if (part.type !== 'literal') result[part.type] = part.value;
    });
    return result;
  }

  function previousIsoDate(isoDate) {
    var pieces = String(isoDate).split('-').map(Number);
    var date = new Date(Date.UTC(pieces[0], pieces[1] - 1, pieces[2]));
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  function currentCivilDate(now) {
    var parts = saoPauloParts(now);
    return [parts.year, parts.month, parts.day].join('-');
  }

  function findHourCard(day, slug) {
    if (!day || !Array.isArray(day.hour_cards)) return null;
    return day.hour_cards.find(function (hour) { return hour.slug === slug; }) || null;
  }

  function hourCardMarkup(hour, date, baseurl, options) {
    options = options || {};
    var cover = localUrl(hour.cover || '/assets/images/social/og-default.webp', baseurl);
    var url = localUrl(hour.url || '', baseurl);
    var title = hour.title || hour.short_title || 'Liturgia das Horas';
    var shortTitle = hour.short_title || HOUR_LABELS[hour.slug] || title;
    var classes = 'liturgy-hour-card';
    if (options.current) classes += ' is-current';
    if (options.recommended) classes += ' liturgy-hour-card--recommended';
    var badge = options.current
      ? '<span class="liturgy-hour-card__current" data-current-hour-badge>Indicada agora</span>'
      : '<span class="liturgy-hour-card__current" data-current-hour-badge hidden>Indicada agora</span>';
    var notice = options.notice
      ? '<p class="liturgy-hour-card__notice">' + escapeHtml(options.notice) + '</p>'
      : '';

    return '<article class="' + classes + '" data-hour-card data-hour-date="'
      + escapeAttribute(date || '') + '" data-hour-slug="' + escapeAttribute(hour.slug || '') + '">'
      + '<a class="liturgy-hour-card__link" href="' + escapeAttribute(url) + '">'
      + '<div class="liturgy-hour-card__media"><img src="' + escapeAttribute(cover) + '" alt="'
      + escapeAttribute(hour.image_alt || title) + '" width="720" height="480" loading="lazy" data-liturgy-cover>'
      + badge + '</div><div class="liturgy-hour-card__body"><p class="eyebrow">Liturgia das Horas</p><h3>'
      + escapeHtml(shortTitle) + '</h3><p>' + escapeHtml(title) + '</p>' + notice
      + '<span class="liturgy-hour-card__action">Rezar esta Hora <span aria-hidden="true">→</span></span>'
      + '</div></a></article>';
  }

  function currentLiturgyTarget(now) {
    var parts = saoPauloParts(now);
    var date = [parts.year, parts.month, parts.day].join('-');
    var minutes = Number(parts.hour) * 60 + Number(parts.minute);
    var slug;

    if (minutes < 180) {
      date = previousIsoDate(date);
      slug = 'completas';
    } else if (minutes < 360) {
      slug = 'oficio-das-leituras';
    } else if (minutes < 510) {
      slug = 'laudes';
    } else if (minutes < 660) {
      slug = 'hora-terca';
    } else if (minutes < 810) {
      slug = 'hora-sexta';
    } else if (minutes < 960) {
      slug = 'hora-nona';
    } else if (minutes < 1200) {
      slug = 'vesperas';
    } else {
      slug = 'completas';
    }

    return { date: date, slug: slug, label: HOUR_LABELS[slug] || slug };
  }

  function findDay(days, date) {
    return days.find(function (item) { return item.date === date; }) || null;
  }

  function markCurrentHour(days, baseurl) {
    if (!days.length) return;
    var current = currentLiturgyTarget();
    var currentDay = findDay(days, current.date);
    var currentUrl = currentDay && currentDay.hours ? currentDay.hours[current.slug] : null;
    var currentHour = findHourCard(currentDay, current.slug);

    document.querySelectorAll('[data-hour-card]').forEach(function (card) {
      var isCurrent = card.getAttribute('data-hour-date') === current.date
        && card.getAttribute('data-hour-slug') === current.slug;
      card.classList.toggle('is-current', isCurrent);
      var badge = card.querySelector('[data-current-hour-badge]');
      if (badge) badge.hidden = !isCurrent;
    });

    var page = document.querySelector('[data-liturgy-page]');
    var pageMatches = false;
    if (page) {
      pageMatches = page.getAttribute('data-page-date') === current.date
        && page.getAttribute('data-page-hour') === current.slug;
      page.querySelectorAll('[data-current-hour-badge]').forEach(function (badge) {
        if (!badge.closest('[data-hour-card]')) badge.hidden = !pageMatches;
      });
    }

    document.querySelectorAll('[data-current-hour-callout]').forEach(function (callout) {
      if (!currentDay || !currentUrl || (page && page.getAttribute('data-page-hour') && pageMatches)) {
        callout.hidden = true;
        callout.replaceChildren();
        return;
      }

      var pageDate = page ? page.getAttribute('data-page-date') : null;
      var previousDayNotice = pageDate && current.date !== pageDate
        ? 'Neste horário, a oração indicada pertence ao dia litúrgico anterior.'
        : 'Esta é a Hora mais apropriada para o momento atual.';
      var hour = currentHour || {
        slug: current.slug,
        short_title: current.label,
        title: current.label,
        cover: '/assets/images/social/og-default.webp',
        image_alt: current.label,
        url: currentUrl
      };
      callout.innerHTML = hourCardMarkup(hour, current.date, baseurl, {
        current: true,
        recommended: true,
        notice: previousDayNotice
      });
      callout.hidden = false;
      setupImageFallbacks(baseurl, callout);
    });
  }

  function renderSelectedHours(day, baseurl) {
    var section = document.querySelector('[data-selected-hours-section]');
    var list = document.querySelector('[data-selected-hours-list]');
    var label = document.querySelector('[data-selected-hours-label]');
    if (!section || !list) return;

    var hours = day && Array.isArray(day.hour_cards) ? day.hour_cards : [];
    if (!hours.length) {
      section.hidden = true;
      list.replaceChildren();
      return;
    }

    section.hidden = false;
    if (label) label.textContent = day.label || day.date;
    list.innerHTML = hours.map(function (hour) {
      return hourCardMarkup(hour, day.date, baseurl);
    }).join('');
    setupImageFallbacks(baseurl, list);
  }

  function redirectDailyIndex(days, baseurl) {
    var index = document.querySelector('.liturgy-index[data-liturgy-index-kind="daily"]');
    if (!index || !days.length) return false;
    var today = findDay(days, currentCivilDate());
    if (!today || !today.daily_url) return false;
    var target = localUrl(today.daily_url, baseurl);
    if (!window.location || window.location.pathname === target) return false;
    if (typeof window.location.replace === 'function') window.location.replace(target);
    else window.location.assign(target);
    return true;
  }

  function initDatePickers(days, baseurl) {
    document.querySelectorAll('[data-liturgy-date-form]').forEach(function (form) {
      var input = form.querySelector('[data-liturgy-date-picker]');
      var status = form.querySelector('[data-liturgy-date-status]');
      if (!input) return;

      function selectedDay() {
        return findDay(days, input.value);
      }

      function updateIndexPreview() {
        var day = selectedDay();
        var title = document.querySelector('[data-selected-day-title]');
        var label = document.querySelector('[data-selected-day-label]');
        var link = document.querySelector('[data-selected-day-link]');
        if (title && label && link && day) {
          var target = input.getAttribute('data-date-target') || 'daily_url';
          title.textContent = day.celebration || 'Liturgia do dia';
          label.textContent = day.label || day.date;
          link.href = localUrl(day[target], baseurl);
        }
        renderSelectedHours(day, baseurl);
      }

      input.addEventListener('change', function () {
        var day = selectedDay();
        if (status) status.textContent = day ? '' : 'Ainda não há conteúdo disponível para esta data.';
        updateIndexPreview();
        markCurrentHour(days, baseurl);
      });

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var day = selectedDay();
        var target = input.getAttribute('data-date-target') || 'daily_url';
        if (!day || !day[target]) {
          if (status) status.textContent = 'Ainda não há conteúdo disponível para esta data.';
          return;
        }
        window.location.assign(localUrl(day[target], baseurl));
      });

      updateIndexPreview();
    });
  }

  function selectBestIndexDay(days) {
    if (!days.length) return;
    var today = findDay(days, currentCivilDate());
    if (!today) return;
    document.querySelectorAll('.liturgy-index [data-liturgy-date-picker]').forEach(function (input) {
      input.value = today.date;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    var description = document.querySelector('[data-liturgy-today-description]');
    if (description) description.textContent = 'A data atual foi selecionada.';
  }

  function setupImageFallbacks(baseurl, root) {
    var fallback = localUrl('/assets/images/social/og-default.webp', baseurl);
    var scope = root || document;
    scope.querySelectorAll('[data-liturgy-cover], [data-liturgical-color-image]').forEach(function (image) {
      if (image.getAttribute('data-fallback-ready') === 'true') return;
      image.setAttribute('data-fallback-ready', 'true');
      image.addEventListener('error', function onError() {
        image.removeEventListener('error', onError);
        image.src = fallback;
        image.classList.add('has-fallback');
        var colorContainer = image.closest('.liturgy-summary__color');
        if (colorContainer) colorContainer.classList.add('is-fallback');
      });
    });
  }

  function setTabState(buttons, panels, activeKey, buttonKeyAttribute, panelKeyAttribute) {
    buttons.forEach(function (button) {
      var selected = button.getAttribute(buttonKeyAttribute) === activeKey;
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.classList.toggle('is-active', selected);
      button.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel) {
      var selected = panel.getAttribute(panelKeyAttribute) === activeKey;
      panel.classList.toggle('is-active', selected);
      panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
      if (selected) {
        panel.style.removeProperty('display');
        panel.hidden = false;
      } else {
        panel.hidden = true;
        panel.style.setProperty('display', 'none');
      }
    });
  }

  function initInvitatoryPsalms() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-invitatory-select]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-invitatory-psalm]'));
    if (!buttons.length || !panels.length) return;

    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () {
        setTabState(buttons, panels, button.getAttribute('data-invitatory-select'), 'data-invitatory-select', 'data-invitatory-psalm');
      });
      button.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        var direction = event.key === 'ArrowRight' ? 1 : -1;
        var next = buttons[(index + direction + buttons.length) % buttons.length];
        next.focus();
        next.click();
      });
    });
    setTabState(buttons, panels, '94', 'data-invitatory-select', 'data-invitatory-psalm');
  }

  function makeInteractive(element, handler) {
    if (!element) return;
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.addEventListener('click', handler);
    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler(event);
      }
    });
  }

  function initLegacyLanguageSwitches() {
    var root = document.querySelector('.liturgy-reading__text');
    if (!root) return;
    var groups = [
      { ptButton: 'btnPt', latButton: 'btnLat', ptPanel: 'pt', latPanel: 'lat' },
      { ptButton: 'cantEvangBtnPt', latButton: 'cantEvangBtnLat', ptPanel: 'cantEvangPt', latPanel: 'cantEvangLat' }
    ];

    groups.forEach(function (group) {
      var ptButton = root.querySelector('#' + group.ptButton);
      var latButton = root.querySelector('#' + group.latButton);
      var ptPanel = root.querySelector('#' + group.ptPanel);
      var latPanel = root.querySelector('#' + group.latPanel);
      if (!ptButton || !latButton || !ptPanel || !latPanel) return;

      var buttons = [ptButton, latButton];
      var panels = [ptPanel, latPanel];
      ptButton.setAttribute('data-language-select', 'pt');
      latButton.setAttribute('data-language-select', 'lat');
      ptPanel.setAttribute('data-language-panel', 'pt');
      latPanel.setAttribute('data-language-panel', 'lat');
      buttons.forEach(function (button) { button.setAttribute('role', 'tab'); });
      ptPanel.setAttribute('role', 'tabpanel');
      latPanel.setAttribute('role', 'tabpanel');

      makeInteractive(ptButton, function () {
        setTabState(buttons, panels, 'pt', 'data-language-select', 'data-language-panel');
      });
      makeInteractive(latButton, function () {
        setTabState(buttons, panels, 'lat', 'data-language-select', 'data-language-panel');
      });
      setTabState(buttons, panels, 'pt', 'data-language-select', 'data-language-panel');
    });
  }

  function initDialogs() {
    var dialog = document.querySelector('[data-liturgy-dialog]');
    if (!dialog) return;
    var title = dialog.querySelector('[data-liturgy-dialog-title]');
    var content = dialog.querySelector('[data-liturgy-dialog-content]');
    var close = dialog.querySelector('[data-liturgy-dialog-close]');

    function openDialog(action) {
      var template = document.querySelector('[data-liturgy-dialog-template="' + cssEscape(action) + '"]');
      if (!template) return;
      title.textContent = template.getAttribute('data-title') || 'Oração';
      content.replaceChildren(template.content.cloneNode(true));
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }

    document.querySelectorAll('[data-liturgy-action]').forEach(function (trigger) {
      makeInteractive(trigger, function () { openDialog(trigger.getAttribute('data-liturgy-action')); });
    });

    var paiNosso = document.querySelector('.liturgy-reading__text #paiNosso');
    if (paiNosso && !paiNosso.hasAttribute('data-liturgy-action')) {
      paiNosso.setAttribute('data-liturgy-action', 'pai-nosso');
      makeInteractive(paiNosso, function () { openDialog('pai-nosso'); });
    }

    if (close) close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  function slugify(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function initToc() {
    var toc = document.querySelector('[data-liturgy-toc]');
    var prose = document.querySelector('.liturgy-reading__text');
    if (!toc || !prose) return;
    var list = toc.querySelector('[data-liturgy-toc-list]');
    var headings = Array.prototype.slice.call(prose.querySelectorAll('h2, h3'))
      .filter(function (heading) { return heading.textContent.trim().length > 0; });
    if (headings.length < 2 || !list) return;

    var used = {};
    headings.forEach(function (heading) {
      var base = heading.id || slugify(heading.textContent) || 'secao';
      used[base] = (used[base] || 0) + 1;
      heading.id = used[base] > 1 ? base + '-' + used[base] : base;
      var link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();
      if (heading.tagName === 'H3') link.classList.add('is-subsection');
      list.appendChild(link);
    });
    toc.hidden = false;

    var toggle = toc.querySelector('[data-liturgy-toc-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        toc.classList.toggle('is-open', !expanded);
      });
    }
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function init() {
    var data = readDaysData();
    if (redirectDailyIndex(data.days, data.baseurl)) return;
    setupImageFallbacks(data.baseurl);
    initDatePickers(data.days, data.baseurl);
    selectBestIndexDay(data.days);
    markCurrentHour(data.days, data.baseurl);
    window.setInterval(function () { markCurrentHour(data.days, data.baseurl); }, 60000);
    initInvitatoryPsalms();
    initLegacyLanguageSwitches();
    initDialogs();
    initToc();
  }

  window.OratioLiturgia = Object.freeze({
    currentTarget: currentLiturgyTarget,
    currentCivilDate: currentCivilDate,
    setTabState: setTabState
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
