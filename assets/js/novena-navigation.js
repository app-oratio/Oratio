(function () {
  'use strict';

  var roots = document.querySelectorAll('[data-devotion-progress]');
  if (!roots.length) return;

  var weekdayMap = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    domingo: 0,
    sunday: 0,
    segunda: 1,
    'segunda-feira': 1,
    monday: 1,
    terca: 2,
    'terça': 2,
    'terca-feira': 2,
    'terça-feira': 2,
    tuesday: 2,
    quarta: 3,
    'quarta-feira': 3,
    wednesday: 3,
    quinta: 4,
    'quinta-feira': 4,
    thursday: 4,
    sexta: 5,
    'sexta-feira': 5,
    friday: 5,
    sabado: 6,
    'sábado': 6,
    saturday: 6
  };

  function uniqueDays(values, total) {
    var seen = {};
    return (Array.isArray(values) ? values : []).map(Number).filter(function (day) {
      if (!Number.isInteger(day) || day < 1 || day > total || seen[day]) return false;
      seen[day] = true;
      return true;
    }).sort(function (a, b) { return a - b; });
  }

  function validIso(value) {
    if (!value || Number.isNaN(Date.parse(value))) return null;
    return new Date(value).toISOString();
  }

  function validDateInput(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
  }

  function parseLocalDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var result = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null;
    return result;
  }

  function toDateInput(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function addDays(date, amount) {
    var next = new Date(date.getTime());
    next.setDate(next.getDate() + amount);
    return next;
  }

  function normalizeSkippedDays(raw) {
    var parsed = [];
    try { parsed = JSON.parse(raw || '[]'); } catch (error) { parsed = []; }
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function (value) {
      var key = String(value).toLowerCase().trim();
      return Object.prototype.hasOwnProperty.call(weekdayMap, key) ? weekdayMap[key] : null;
    }).filter(function (value, index, values) {
      return value !== null && values.indexOf(value) === index;
    });
  }

  function buildForwardSchedule(start, total, skipped) {
    if (!start || skipped.indexOf(start.getDay()) >= 0) return [];
    var dates = [];
    var cursor = new Date(start.getTime());
    var safety = 0;
    while (dates.length < total && safety < total * 10 + 370) {
      if (skipped.indexOf(cursor.getDay()) < 0) dates.push(new Date(cursor.getTime()));
      cursor = addDays(cursor, 1);
      safety += 1;
    }
    return dates;
  }

  function buildBackwardSchedule(base, total, skipped) {
    if (!base) return [];
    var dates = [];
    var cursor = new Date(base.getTime());
    var safety = 0;
    while (dates.length < total && safety < total * 10 + 370) {
      cursor = addDays(cursor, -1);
      if (skipped.indexOf(cursor.getDay()) < 0) dates.unshift(new Date(cursor.getTime()));
      safety += 1;
    }
    return dates;
  }

  function formatShortDate(date) {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).format(date);
  }

  function formatLongDate(date) {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function formatDateTime(value) {
    if (!value || Number.isNaN(Date.parse(value))) return 'nenhuma';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function setup(root) {
    var id = root.getAttribute('data-devotion-id');
    var slug = root.getAttribute('data-devotion-slug');
    var type = root.getAttribute('data-devotion-type') || 'devoção';
    var pageMode = root.getAttribute('data-devotion-page') || 'index';
    var currentDay = Number(root.getAttribute('data-devotion-day')) || 0;
    var total = Math.max(1, Number(root.getAttribute('data-devotion-total')) || 1);
    var intentionKey = root.getAttribute('data-intention-key') || '';
    var key = 'oratio:devotion-progress:v2:' + id;
    var legacyKey = 'oratio-novena-progress:' + slug;
    var skipped = normalizeSkippedDays(root.getAttribute('data-calendar-skip-weekdays'));
    var baseMonth = Number(root.getAttribute('data-calendar-base-month'));
    var baseDay = Number(root.getAttribute('data-calendar-base-day'));
    var startMonth = Number(root.getAttribute('data-calendar-start-month'));
    var startDay = Number(root.getAttribute('data-calendar-start-day'));
    var officialConfigured = root.getAttribute('data-calendar-configured') === 'true';
    var memoryState = null;

    var progressStatus = root.querySelector('[data-progress-status]');
    var calendarStatus = root.querySelector('[data-calendar-status]');
    var importFile = root.querySelector('[data-progress-import-file]');
    var customStartInput = root.querySelector('[data-custom-start]');

    function defaultState() {
      return {
        version: 2,
        completedDays: [],
        customStart: null,
        updatedAt: null
      };
    }

    function sanitizeState(value) {
      var state = value && typeof value === 'object' ? value : {};
      return {
        version: 2,
        completedDays: uniqueDays(state.completedDays, total),
        customStart: validDateInput(state.customStart),
        updatedAt: validIso(state.updatedAt)
      };
    }

    function readState() {
      var raw = null;
      try { raw = window.localStorage.getItem(key); } catch (error) { raw = memoryState; }
      if (!raw && memoryState) raw = memoryState;
      if (raw) {
        try { return sanitizeState(JSON.parse(raw)); } catch (error) { return defaultState(); }
      }

      var legacy = null;
      try { legacy = window.localStorage.getItem(legacyKey); } catch (error) { legacy = null; }
      if (legacy) {
        try {
          var migratedDays = JSON.parse(legacy);
          if (Array.isArray(migratedDays)) {
            var migrated = sanitizeState({
              completedDays: migratedDays,
              updatedAt: new Date().toISOString()
            });
            saveState(migrated);
            return migrated;
          }
        } catch (error) {
          return defaultState();
        }
      }
      return defaultState();
    }

    function saveState(state) {
      var normalized = sanitizeState(state);
      var raw = JSON.stringify(normalized);
      try {
        window.localStorage.setItem(key, raw);
        memoryState = null;
        return true;
      } catch (error) {
        memoryState = raw;
        return false;
      }
    }

    function officialSchedule() {
      var today = new Date();
      today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);

      if (baseMonth >= 1 && baseMonth <= 12 && baseDay >= 1 && baseDay <= 31) {
        var base = new Date(today.getFullYear(), baseMonth - 1, baseDay, 12);
        if (base.getMonth() !== baseMonth - 1 || base.getDate() !== baseDay) return [];
        if (today >= base) base = new Date(today.getFullYear() + 1, baseMonth - 1, baseDay, 12);
        return buildBackwardSchedule(base, total, skipped);
      }

      if (startMonth >= 1 && startMonth <= 12 && startDay >= 1 && startDay <= 31) {
        var start = new Date(today.getFullYear(), startMonth - 1, startDay, 12);
        if (start.getMonth() !== startMonth - 1 || start.getDate() !== startDay) return [];
        var currentSchedule = buildForwardSchedule(start, total, skipped);
        var currentEnd = currentSchedule[currentSchedule.length - 1];
        if (currentEnd && today > currentEnd) start = new Date(today.getFullYear() + 1, startMonth - 1, startDay, 12);
        return buildForwardSchedule(start, total, skipped);
      }
      return [];
    }

    function activeSchedule(state) {
      if (state.customStart) return buildForwardSchedule(parseLocalDate(state.customStart), total, skipped);
      return officialSchedule();
    }

    function renderCalendar(state) {
      var schedule = activeSchedule(state);
      var summary = '';
      if (schedule.length) {
        summary = (state.customStart ? 'Calendário particular: ' : 'Calendário oficial: ') +
          formatLongDate(schedule[0]) + ' a ' + formatLongDate(schedule[schedule.length - 1]) + '.';
      } else if (!officialConfigured && !state.customStart) {
        summary = 'Este conteúdo ainda não possui uma data oficial configurada. Você pode escolher uma data particular para começar.';
      } else {
        summary = 'Não foi possível calcular as datas com a configuração atual.';
      }

      root.querySelectorAll('[data-calendar-summary]').forEach(function (element) { element.textContent = summary; });
      root.querySelectorAll('[data-calendar-hero-summary]').forEach(function (element) {
        element.textContent = schedule.length
          ? formatLongDate(schedule[0]) + ' a ' + formatLongDate(schedule[schedule.length - 1])
          : 'Data a definir';
      });
      root.querySelectorAll('[data-devotion-day-item]').forEach(function (item) {
        var day = Number(item.getAttribute('data-day-number'));
        var date = schedule[day - 1];
        var time = item.querySelector('[data-day-date]');
        if (!time) return;
        if (date) {
          time.dateTime = toDateInput(date);
          time.textContent = formatShortDate(date);
        } else {
          time.removeAttribute('datetime');
          time.textContent = 'Data não definida';
        }
      });
      root.querySelectorAll('[data-current-day-date]').forEach(function (time) {
        var date = schedule[currentDay - 1];
        if (date) {
          time.dateTime = toDateInput(date);
          time.textContent = formatLongDate(date);
        } else {
          time.removeAttribute('datetime');
          time.textContent = 'Data não definida';
        }
      });
      if (customStartInput) customStartInput.value = state.customStart || '';
    }

    function renderProgress(state) {
      var completed = state.completedDays.length;
      var percent = Math.round((completed / total) * 100);
      var plural = completed === 1 ? 'dia concluído' : 'dias concluídos';
      var label = completed + ' de ' + total + ' ' + plural + '.';

      root.querySelectorAll('[data-progress-percent]').forEach(function (element) { element.textContent = percent + '%'; });
      root.querySelectorAll('[data-progress-count]').forEach(function (element) { element.textContent = completed + ' de ' + total; });
      root.querySelectorAll('[data-progress-label]').forEach(function (element) { element.textContent = label; });
      root.querySelectorAll('[data-progress-updated]').forEach(function (element) {
        element.textContent = formatDateTime(state.updatedAt);
        if (state.updatedAt) element.dateTime = state.updatedAt;
        else element.removeAttribute('datetime');
      });
      root.querySelectorAll('[data-progress-bar]').forEach(function (element) {
        element.style.transform = 'scaleX(' + Math.min(1, percent / 100) + ')';
      });
      root.querySelectorAll('[data-progress-track]').forEach(function (element) {
        element.setAttribute('aria-valuenow', String(percent));
      });

      root.querySelectorAll('[data-devotion-day-item]').forEach(function (item) {
        var day = Number(item.getAttribute('data-day-number'));
        var complete = state.completedDays.indexOf(day) >= 0;
        item.classList.toggle('is-complete', complete);
        var toggle = item.querySelector('[data-day-toggle]');
        if (toggle) {
          toggle.setAttribute('aria-pressed', String(complete));
          toggle.setAttribute('aria-label', (complete ? 'Desmarcar' : 'Marcar') + ' o dia ' + day + ' como concluído');
        }
      });

      var checkbox = root.querySelector('[data-day-complete]');
      if (checkbox) checkbox.checked = state.completedDays.indexOf(currentDay) >= 0;

      var continueButton = root.querySelector('[data-devotion-continue]');
      var continueLabel = root.querySelector('[data-devotion-continue-label]');
      if (continueButton && continueLabel) {
        var firstItem = root.querySelector('[data-devotion-day-item]');
        var nextItem = null;
        root.querySelectorAll('[data-devotion-day-item]').forEach(function (item) {
          var day = Number(item.getAttribute('data-day-number'));
          if (!nextItem && state.completedDays.indexOf(day) < 0) nextItem = item;
        });
        if (completed >= total) {
          continueButton.href = firstItem ? firstItem.getAttribute('data-day-url') : continueButton.href;
          continueButton.setAttribute('data-devotion-complete', 'true');
          continueLabel.textContent = 'Rezar novamente';
        } else if (nextItem) {
          var nextDay = Number(nextItem.getAttribute('data-day-number'));
          continueButton.href = nextItem.getAttribute('data-day-url');
          continueButton.removeAttribute('data-devotion-complete');
          continueLabel.textContent = 'Continuar no dia ' + nextDay;
        }
      }
    }

    function render() {
      var state = readState();
      renderProgress(state);
      renderCalendar(state);
    }

    function updateCompleted(day, complete) {
      var state = readState();
      var days = state.completedDays.slice();
      var index = days.indexOf(day);
      if (complete && index < 0) days.push(day);
      if (!complete && index >= 0) days.splice(index, 1);
      state.completedDays = uniqueDays(days, total);
      state.updatedAt = new Date().toISOString();
      var persisted = saveState(state);
      if (!persisted && progressStatus) {
        progressStatus.textContent = 'O navegador bloqueou o armazenamento permanente; a alteração ficará disponível somente nesta página.';
      }
      render();
    }

    root.querySelectorAll('[data-day-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = button.closest('[data-devotion-day-item]');
        var day = Number(item && item.getAttribute('data-day-number'));
        var state = readState();
        updateCompleted(day, state.completedDays.indexOf(day) < 0);
      });
    });

    var checkbox = root.querySelector('[data-day-complete]');
    if (checkbox) checkbox.addEventListener('change', function () {
      updateCompleted(currentDay, checkbox.checked);
    });

    root.querySelectorAll('[data-progress-reset]').forEach(function (button) {
      button.addEventListener('click', function () {
        var confirmed = window.confirm('Deseja desmarcar todos os dias concluídos deste itinerário? A data particular e as intenções serão mantidas.');
        if (!confirmed) return;
        var state = readState();
        state.completedDays = [];
        state.updatedAt = new Date().toISOString();
        saveState(state);
        if (progressStatus) progressStatus.textContent = 'Os dias concluídos foram reiniciados.';
        render();
      });
    });

    var continueButton = root.querySelector('[data-devotion-continue]');
    if (continueButton) continueButton.addEventListener('click', function (event) {
      if (continueButton.getAttribute('data-devotion-complete') !== 'true') return;
      event.preventDefault();
      var confirmed = window.confirm('Deseja rezar este itinerário novamente? Os dias serão desmarcados, mas as intenções e a data escolhida serão mantidas.');
      if (!confirmed) return;
      var target = continueButton.href;
      var state = readState();
      state.completedDays = [];
      state.updatedAt = new Date().toISOString();
      saveState(state);
      window.location.href = target;
    });

    var customDateForm = root.querySelector('[data-custom-date-form]');
    if (customDateForm && customStartInput) customDateForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var date = parseLocalDate(customStartInput.value);
      if (!date) {
        if (calendarStatus) calendarStatus.textContent = 'Escolha uma data válida para iniciar.';
        customStartInput.focus();
        return;
      }
      if (skipped.indexOf(date.getDay()) >= 0) {
        if (calendarStatus) calendarStatus.textContent = 'A data escolhida corresponde a um dia da semana excluído da contagem. Escolha o próximo dia permitido.';
        customStartInput.focus();
        return;
      }
      var state = readState();
      state.customStart = toDateInput(date);
      state.updatedAt = new Date().toISOString();
      saveState(state);
      if (calendarStatus) calendarStatus.textContent = 'O calendário particular foi aplicado a todos os dias.';
      render();
    });

    var officialButton = root.querySelector('[data-use-official-calendar]');
    if (officialButton) officialButton.addEventListener('click', function () {
      var state = readState();
      state.customStart = null;
      state.updatedAt = new Date().toISOString();
      saveState(state);
      if (calendarStatus) calendarStatus.textContent = officialConfigured
        ? 'O calendário oficial voltou a ser utilizado.'
        : 'A data particular foi removida; este conteúdo ainda não possui uma data oficial configurada.';
      render();
    });

    root.querySelectorAll('[data-progress-export]').forEach(function (exportButton) {
      exportButton.addEventListener('click', function () {
        var state = readState();
        var intentions = window.OratioIntentions && intentionKey ? window.OratioIntentions.read(intentionKey) : [];
        var backup = {
          schema: 'oratio-devotion-progress',
          version: 2,
          exportedAt: new Date().toISOString(),
          devotion: {
            id: id,
            slug: slug,
            type: type,
            totalDays: total
          },
          progress: state,
          intentions: intentions
        };
        var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'oratio-' + slug + '-progresso.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        var menu = exportButton.closest('details');
        if (menu) menu.open = false;
        if (progressStatus) progressStatus.textContent = 'O arquivo de progresso foi exportado.';
      });
    });

    root.querySelectorAll('[data-progress-import]').forEach(function (importButton) {
      if (importFile) importButton.addEventListener('click', function () {
        var menu = importButton.closest('details');
        if (menu) menu.open = false;
        importFile.click();
      });
    });
    if (importFile) importFile.addEventListener('change', function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      file.text().then(function (text) {
        var backup = JSON.parse(text);
        if (!backup || backup.schema !== 'oratio-devotion-progress' || !backup.devotion || backup.devotion.id !== id) {
          throw new Error('Este arquivo pertence a outro conteúdo ou não é um backup válido do Oratio.');
        }
        var confirmed = window.confirm('Deseja substituir o progresso e as intenções locais deste itinerário pelos dados do arquivo?');
        if (!confirmed) return;
        var importedState = sanitizeState(backup.progress);
        importedState.updatedAt = importedState.updatedAt || new Date().toISOString();
        saveState(importedState);
        if (window.OratioIntentions && intentionKey && Array.isArray(backup.intentions)) {
          window.OratioIntentions.replace(intentionKey, backup.intentions);
        }
        if (progressStatus) progressStatus.textContent = 'O progresso foi importado com sucesso.';
        render();
      }).catch(function (error) {
        if (progressStatus) progressStatus.textContent = error && error.message
          ? error.message
          : 'Não foi possível importar este arquivo.';
      }).finally(function () {
        importFile.value = '';
      });
    });

    window.addEventListener('storage', function (event) {
      if (event.key === key) render();
    });

    render();
  }

  roots.forEach(setup);
}());
