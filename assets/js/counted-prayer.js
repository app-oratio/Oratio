(function () {
  'use strict';

  var roots = document.querySelectorAll('[data-devotional-content]');
  if (!roots.length) return;

  function formatDateTime(value) {
    if (!value || Number.isNaN(Date.parse(value))) return 'nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function scrollBehavior() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  function setup(root) {
    var contentId = root.getAttribute('data-devotional-id');
    if (!contentId) return;

    var storageKey = 'oratio:devotional-sequence:v2:' + contentId;
    var legacyKey = root.getAttribute('data-legacy-counted') === 'true'
      ? 'oratio:counted-prayer:v1:' + contentId
      : '';
    var groups = Array.prototype.slice.call(root.querySelectorAll('[data-counted-group]'));
    var units = Array.prototype.slice.call(root.querySelectorAll('[data-prayer-unit]'));
    var status = root.querySelector('[data-counted-status]');
    var memoryState = null;

    function groupMaximum(group) {
      return Math.max(1, Number(group.getAttribute('data-group-count')) || 1);
    }

    function defaultState() {
      return { version: 2, groups: {}, updatedAt: null };
    }

    function sanitizeState(value) {
      var source = value && typeof value === 'object' ? value : {};
      var sourceGroups = source.groups && typeof source.groups === 'object' ? source.groups : {};
      var clean = {};
      groups.forEach(function (group) {
        var id = group.getAttribute('data-group-id');
        clean[id] = Math.min(groupMaximum(group), Math.max(0, Number(sourceGroups[id]) || 0));
      });
      return {
        version: 2,
        groups: clean,
        updatedAt: source.updatedAt && !Number.isNaN(Date.parse(source.updatedAt))
          ? new Date(source.updatedAt).toISOString()
          : null
      };
    }

    function saveState(state) {
      var normalized = sanitizeState(state);
      var raw = JSON.stringify(normalized);
      try {
        window.localStorage.setItem(storageKey, raw);
        memoryState = null;
        return true;
      } catch (error) {
        memoryState = raw;
        return false;
      }
    }

    function readState() {
      var raw = null;
      try { raw = window.localStorage.getItem(storageKey); } catch (error) { raw = memoryState; }
      if (!raw && memoryState) raw = memoryState;
      if (raw) {
        try { return sanitizeState(JSON.parse(raw)); } catch (error) { return sanitizeState(defaultState()); }
      }

      if (legacyKey) {
        var legacy = null;
        try { legacy = window.localStorage.getItem(legacyKey); } catch (error) { legacy = null; }
        if (legacy) {
          try {
            var migrated = sanitizeState(JSON.parse(legacy));
            saveState(migrated);
            return migrated;
          } catch (error) {
            return sanitizeState(defaultState());
          }
        }
      }
      return sanitizeState(defaultState());
    }

    function setupUnitLanguage(unit) {
      var panels = Array.prototype.slice.call(unit.querySelectorAll('[data-language-panel]'));
      if (!panels.length) return;
      var labels = Array.prototype.slice.call(unit.querySelectorAll('[data-language-label]'));
      var buttons = Array.prototype.slice.call(unit.querySelectorAll('[data-language-option]'));

      function applyUnitLanguage(language) {
        var selected = language === 'la' ? 'la' : 'pt';
        var target = panels.find(function (panel) {
          return panel.getAttribute('data-language') === selected;
        });
        if (!target) {
          selected = 'pt';
          target = panels.find(function (panel) {
            return panel.getAttribute('data-language') === 'pt';
          }) || panels[0];
        }
        panels.forEach(function (panel) {
          panel.hidden = panel !== target;
        });
        labels.forEach(function (label) {
          label.hidden = label.getAttribute('data-language') !== selected;
        });
        buttons.forEach(function (button) {
          var active = button.getAttribute('data-language-option') === selected;
          button.setAttribute('aria-pressed', String(active));
          button.classList.toggle('is-active', active);
        });

        var localizedLabel = unit.getAttribute('data-group-label-' + selected);
        if (localizedLabel) unit.setAttribute('data-group-label', localizedLabel);
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          applyUnitLanguage(button.getAttribute('data-language-option'));
        });
      });
      applyUnitLanguage(
        (unit.getAttribute('data-unit-default-language')
          || root.getAttribute('data-default-language')
          || 'pt').toLowerCase()
      );
    }

    units.forEach(setupUnitLanguage);

    function updateGroup(group, amount) {
      var id = group.getAttribute('data-group-id');
      var state = readState();
      state.groups[id] = Math.min(groupMaximum(group), Math.max(0, amount));
      state.updatedAt = new Date().toISOString();
      var persisted = saveState(state);
      if (!persisted && status) {
        status.textContent = 'O navegador bloqueou o armazenamento permanente; a contagem ficará disponível somente nesta página.';
      }
      render();
    }

    function render() {
      var state = readState();
      var completed = 0;
      var total = 0;
      var firstIncomplete = null;

      groups.forEach(function (group) {
        var id = group.getAttribute('data-group-id');
        var maximum = groupMaximum(group);
        var value = state.groups[id] || 0;
        completed += value;
        total += maximum;
        if (!firstIncomplete && value < maximum) firstIncomplete = group;

        var output = group.querySelector('[data-group-output]');
        var valueLabel = group.querySelector('[data-group-value]');
        var bar = group.querySelector('[data-group-bar]');
        if (output) output.textContent = value + ' de ' + maximum;
        if (valueLabel) valueLabel.textContent = String(value);
        if (bar) bar.style.transform = 'scaleX(' + Math.min(1, value / maximum) + ')';
        group.classList.toggle('is-complete', value >= maximum);

        var back = group.querySelector('[data-count-back]');
        var forward = group.querySelector('[data-count-forward]');
        if (back) back.disabled = value <= 0;
        if (forward) forward.disabled = value >= maximum;
      });

      root.querySelectorAll('[data-devotional-section]').forEach(function (section) {
        var sectionGroups = Array.prototype.slice.call(section.querySelectorAll('[data-counted-group]'));
        if (!sectionGroups.length) return;
        var sectionValues = sectionGroups.map(function (group) {
          var id = group.getAttribute('data-group-id');
          return { value: state.groups[id] || 0, maximum: groupMaximum(group) };
        });
        var sectionCompleted = sectionValues.every(function (item) { return item.value >= item.maximum; });
        var sectionStarted = sectionValues.some(function (item) { return item.value > 0; });
        section.classList.toggle('is-complete', sectionCompleted);
        section.classList.toggle('is-started', sectionStarted && !sectionCompleted);
        var stateLabel = section.querySelector('[data-section-state]');
        if (stateLabel) {
          stateLabel.textContent = sectionCompleted ? 'Concluída' : (sectionStarted ? 'Em andamento' : 'Não iniciada');
        }
      });

      var percent = total ? Math.round((completed / total) * 100) : 0;
      root.querySelectorAll('[data-counted-progress-label]').forEach(function (element) {
        element.textContent = completed + ' de ' + total + (completed === 1 ? ' oração marcada.' : ' orações marcadas.');
      });
      root.querySelectorAll('[data-counted-percent]').forEach(function (element) {
        element.textContent = percent + '%';
      });
      root.querySelectorAll('[data-counted-fraction]').forEach(function (element) {
        element.textContent = completed + ' de ' + total;
      });
      root.querySelectorAll('[data-counted-updated]').forEach(function (element) {
        element.textContent = formatDateTime(state.updatedAt);
        if (state.updatedAt) element.dateTime = state.updatedAt;
        else element.removeAttribute('datetime');
      });
      root.querySelectorAll('[data-counted-track]').forEach(function (element) {
        element.setAttribute('aria-valuenow', String(percent));
      });
      root.querySelectorAll('[data-counted-bar]').forEach(function (element) {
        element.style.transform = 'scaleX(' + Math.min(1, percent / 100) + ')';
      });

      var continueButton = root.querySelector('[data-counted-continue]');
      var continueLabel = root.querySelector('[data-counted-continue-label]');
      if (continueButton && continueLabel) {
        if (groups.length && !firstIncomplete) {
          continueButton.setAttribute('data-counted-complete', 'true');
          continueButton.removeAttribute('data-counted-target');
          continueLabel.textContent = 'Rezar novamente';
        } else if (firstIncomplete) {
          continueButton.removeAttribute('data-counted-complete');
          continueButton.setAttribute('data-counted-target', firstIncomplete.getAttribute('data-group-id'));
          continueLabel.textContent = completed > 0
            ? 'Continuar em ' + firstIncomplete.getAttribute('data-group-label')
            : 'Começar a oração';
        }
      }
    }

    groups.forEach(function (group) {
      var back = group.querySelector('[data-count-back]');
      var forward = group.querySelector('[data-count-forward]');
      if (back) back.addEventListener('click', function () {
        var state = readState();
        updateGroup(group, (state.groups[group.getAttribute('data-group-id')] || 0) - 1);
      });
      if (forward) forward.addEventListener('click', function () {
        var state = readState();
        updateGroup(group, (state.groups[group.getAttribute('data-group-id')] || 0) + 1);
      });
    });

    var continueButton = root.querySelector('[data-counted-continue]');
    if (continueButton) continueButton.addEventListener('click', function () {
      if (continueButton.getAttribute('data-counted-complete') === 'true') {
        var confirmed = window.confirm('Deseja reiniciar a contagem e rezar novamente? As intenções particulares serão mantidas.');
        if (!confirmed) return;
        var resetState = sanitizeState(defaultState());
        resetState.updatedAt = new Date().toISOString();
        saveState(resetState);
        render();
        if (groups[0]) groups[0].scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        return;
      }
      var targetId = continueButton.getAttribute('data-counted-target');
      var target = groups.find(function (group) {
        return group.getAttribute('data-group-id') === targetId;
      });
      if (!target) target = root.querySelector('[data-devotional-section], [data-prayer-unit]');
      if (target) target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    });

    root.querySelectorAll('[data-counted-reset]').forEach(function (resetButton) {
      resetButton.addEventListener('click', function () {
        var confirmed = window.confirm('Deseja apagar toda a contagem deste roteiro neste navegador? As intenções serão mantidas.');
        if (!confirmed) return;
        var state = sanitizeState(defaultState());
        state.updatedAt = new Date().toISOString();
        saveState(state);
        if (status) status.textContent = 'A contagem foi reiniciada.';
        render();
      });
    });

    window.addEventListener('storage', function (event) {
      if (event.key === storageKey) render();
    });
    render();
  }

  roots.forEach(setup);
}());
