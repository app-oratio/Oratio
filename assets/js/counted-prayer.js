(function () {
  'use strict';

  var roots = document.querySelectorAll('[data-counted-prayer]');
  if (!roots.length) return;

  function formatDateTime(value) {
    if (!value || Number.isNaN(Date.parse(value))) return 'nenhuma';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function scrollBehavior() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  function setup(root) {
    var contentId = root.getAttribute('data-counted-id');
    var storageKey = 'oratio:counted-prayer:v1:' + contentId;
    var groups = Array.prototype.slice.call(root.querySelectorAll('[data-counted-group]'));
    var status = root.querySelector('[data-counted-status]');
    var memoryState = null;

    function groupMaximum(group) {
      return Math.max(1, Number(group.getAttribute('data-group-count')) || 1);
    }

    function defaultState() {
      return { version: 1, groups: {}, updatedAt: null };
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
        version: 1,
        groups: clean,
        updatedAt: source.updatedAt && !Number.isNaN(Date.parse(source.updatedAt))
          ? new Date(source.updatedAt).toISOString()
          : null
      };
    }

    function readState() {
      var raw = null;
      try { raw = window.localStorage.getItem(storageKey); } catch (error) { raw = memoryState; }
      if (!raw && memoryState) raw = memoryState;
      if (!raw) return sanitizeState(defaultState());
      try { return sanitizeState(JSON.parse(raw)); } catch (error) { return sanitizeState(defaultState()); }
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

    function createBeads(group) {
      var container = group.querySelector('[data-bead-counter]');
      if (!container || container.children.length) return;
      var total = groupMaximum(group);
      var label = group.getAttribute('data-group-label') || 'oração';
      for (var index = 1; index <= total; index += 1) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'bead-button';
        button.setAttribute('data-bead-number', String(index));
        button.setAttribute('aria-label', label + ', item ' + index + ' de ' + total);
        button.setAttribute('aria-pressed', 'false');
        var number = document.createElement('span');
        number.textContent = String(index);
        button.appendChild(number);
        container.appendChild(button);
      }
    }

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
        if (output) output.textContent = value + ' de ' + maximum;
        group.classList.toggle('is-complete', value >= maximum);
        group.querySelectorAll('[data-bead-number]').forEach(function (button) {
          var active = Number(button.getAttribute('data-bead-number')) <= value;
          button.classList.toggle('is-complete', active);
          button.setAttribute('aria-pressed', String(active));
        });
        var back = group.querySelector('[data-count-back]');
        var forward = group.querySelector('[data-count-forward]');
        if (back) back.disabled = value <= 0;
        if (forward) forward.disabled = value >= maximum;
      });

      root.querySelectorAll('[data-counted-section]').forEach(function (section) {
        var sectionGroups = Array.prototype.slice.call(section.querySelectorAll('[data-counted-group]'));
        var sectionValues = sectionGroups.map(function (group) {
          var id = group.getAttribute('data-group-id');
          return { value: state.groups[id] || 0, maximum: groupMaximum(group) };
        });
        var sectionCompleted = sectionValues.length > 0 && sectionValues.every(function (item) { return item.value >= item.maximum; });
        var sectionStarted = sectionValues.some(function (item) { return item.value > 0; });
        section.classList.toggle('is-complete', sectionCompleted);
        section.classList.toggle('is-started', sectionStarted && !sectionCompleted);
        var stateLabel = section.querySelector('[data-section-state]');
        if (stateLabel) stateLabel.textContent = sectionCompleted ? 'Concluída' : (sectionStarted ? 'Em andamento' : 'Não iniciada');
      });

      var percent = total ? Math.round((completed / total) * 100) : 0;
      var progressLabel = root.querySelector('[data-counted-progress-label]');
      var percentLabel = root.querySelector('[data-counted-percent]');
      var fraction = root.querySelector('[data-counted-fraction]');
      var updated = root.querySelector('[data-counted-updated]');
      var track = root.querySelector('[data-counted-track]');
      var bar = root.querySelector('[data-counted-bar]');
      if (progressLabel) progressLabel.textContent = completed + ' de ' + total + (completed === 1 ? ' oração marcada.' : ' orações marcadas.');
      if (percentLabel) percentLabel.textContent = percent + '%';
      if (fraction) fraction.textContent = completed + ' de ' + total;
      if (updated) {
        updated.textContent = formatDateTime(state.updatedAt);
        if (state.updatedAt) updated.dateTime = state.updatedAt;
        else updated.removeAttribute('datetime');
      }
      if (track) track.setAttribute('aria-valuenow', String(percent));
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, percent / 100) + ')';

      var continueButton = root.querySelector('[data-counted-continue]');
      var continueLabel = root.querySelector('[data-counted-continue-label]');
      if (continueButton && continueLabel) {
        if (!firstIncomplete && total > 0) {
          continueButton.setAttribute('data-counted-complete', 'true');
          continueButton.removeAttribute('data-counted-target');
          continueLabel.textContent = 'Rezar novamente';
        } else if (firstIncomplete) {
          continueButton.removeAttribute('data-counted-complete');
          continueButton.setAttribute('data-counted-target', firstIncomplete.getAttribute('data-group-id'));
          continueLabel.textContent = completed > 0
            ? 'Continuar em ' + firstIncomplete.getAttribute('data-group-label')
            : 'Começar a contagem';
        }
      }
    }

    groups.forEach(function (group) {
      createBeads(group);
      group.querySelectorAll('[data-bead-number]').forEach(function (button) {
        button.addEventListener('click', function () {
          var state = readState();
          var id = group.getAttribute('data-group-id');
          var selected = Number(button.getAttribute('data-bead-number'));
          updateGroup(group, state.groups[id] === selected ? selected - 1 : selected);
        });
      });
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
      var target = groups.find(function (group) { return group.getAttribute('data-group-id') === targetId; });
      if (target) target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    });

    var resetButton = root.querySelector('[data-counted-reset]');
    if (resetButton) resetButton.addEventListener('click', function () {
      var confirmed = window.confirm('Deseja apagar toda a contagem desta oração neste navegador? As intenções serão mantidas.');
      if (!confirmed) return;
      var state = sanitizeState(defaultState());
      state.updatedAt = new Date().toISOString();
      saveState(state);
      if (status) status.textContent = 'A contagem foi reiniciada.';
      render();
    });

    window.addEventListener('storage', function (event) {
      if (event.key === storageKey) render();
    });
    render();
  }

  roots.forEach(setup);
}());
