(function () {
  'use strict';

  var prefix = 'oratio:intentions:v1:';
  var memoryFallback = {};

  function storageKey(key) {
    return prefix + key;
  }

  function normalizeRecord(record) {
    if (!record || typeof record !== 'object') return null;
    var text = String(record.text || '').trim().slice(0, 1200);
    if (!text) return null;
    return {
      id: String(record.id || createId()),
      text: text,
      createdAt: validDate(record.createdAt) || new Date().toISOString(),
      updatedAt: validDate(record.updatedAt) || validDate(record.createdAt) || new Date().toISOString()
    };
  }

  function validDate(value) {
    if (!value || Number.isNaN(Date.parse(value))) return '';
    return new Date(value).toISOString();
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function read(key) {
    var raw = null;
    try {
      raw = window.localStorage.getItem(storageKey(key));
    } catch (error) {
      raw = memoryFallback[key] || null;
    }
    if (!raw && memoryFallback[key]) raw = memoryFallback[key];
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeRecord).filter(Boolean).slice(0, 50);
    } catch (error) {
      return [];
    }
  }

  function write(key, records) {
    var normalized = (Array.isArray(records) ? records : []).map(normalizeRecord).filter(Boolean).slice(0, 50);
    var raw = JSON.stringify(normalized);
    try {
      window.localStorage.setItem(storageKey(key), raw);
      delete memoryFallback[key];
      return true;
    } catch (error) {
      memoryFallback[key] = raw;
      return false;
    }
  }

  function notify(key) {
    document.dispatchEvent(new CustomEvent('oratio:intentions-updated', { detail: { key: key } }));
  }

  function formatDate(value) {
    if (!value || Number.isNaN(Date.parse(value))) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function createAction(label, iconName, className) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    var symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = iconName;
    var text = document.createElement('span');
    text.textContent = label;
    button.append(symbol, text);
    return button;
  }

  function setup(root) {
    var key = root.getAttribute('data-intention-key');
    var form = root.querySelector('[data-intention-form]');
    var input = root.querySelector('[data-intention-input]');
    var list = root.querySelector('[data-intention-list]');
    var empty = root.querySelector('[data-intention-empty]');
    var status = root.querySelector('[data-intention-status]');
    var counter = root.querySelector('[data-intention-counter]');
    var submitLabel = root.querySelector('[data-intention-submit-label]');
    var cancel = root.querySelector('[data-intention-cancel]');
    var editingId = '';
    if (!key || !form || !input || !list) return;

    function updateCounter() {
      if (counter) counter.textContent = input.value.length.toLocaleString('pt-BR') + ' de 1.200';
    }

    function resetForm() {
      editingId = '';
      form.reset();
      if (submitLabel) submitLabel.textContent = 'Adicionar intenção';
      if (cancel) cancel.hidden = true;
      updateCounter();
    }

    function beginEdit(record) {
      editingId = record.id;
      input.value = record.text;
      if (submitLabel) submitLabel.textContent = 'Salvar alteração';
      if (cancel) cancel.hidden = false;
      updateCounter();
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }

    function removeRecord(record) {
      var confirmed = window.confirm('Deseja remover esta intenção deste navegador?');
      if (!confirmed) return;
      var records = read(key).filter(function (item) { return item.id !== record.id; });
      write(key, records);
      if (editingId === record.id) resetForm();
      if (status) status.textContent = 'A intenção foi removida.';
      notify(key);
    }

    function render() {
      var records = read(key).sort(function (a, b) {
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      });
      list.replaceChildren();
      if (empty) empty.hidden = records.length > 0;
      records.forEach(function (record) {
        var item = document.createElement('li');
        item.className = 'intention-item';
        item.setAttribute('data-intention-id', record.id);

        var content = document.createElement('div');
        content.className = 'intention-item__content';
        var text = document.createElement('p');
        text.textContent = record.text;
        var time = document.createElement('time');
        time.dateTime = record.updatedAt;
        time.textContent = 'Atualizada em ' + formatDate(record.updatedAt);
        content.append(text, time);

        var actions = document.createElement('div');
        actions.className = 'intention-item__actions';
        var edit = createAction('Editar', '✎', 'button button--text button--small');
        var remove = createAction('Excluir', '×', 'button button--text button--small intention-item__delete');
        edit.addEventListener('click', function () { beginEdit(record); });
        remove.addEventListener('click', function () { removeRecord(record); });
        actions.append(edit, remove);
        item.append(content, actions);
        list.appendChild(item);
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) {
        if (status) status.textContent = 'Escreva uma intenção antes de salvar.';
        input.focus();
        return;
      }
      var records = read(key);
      var now = new Date().toISOString();
      if (editingId) {
        records = records.map(function (record) {
          if (record.id !== editingId) return record;
          return {
            id: record.id,
            text: text,
            createdAt: record.createdAt,
            updatedAt: now
          };
        });
        if (status) status.textContent = 'A intenção foi atualizada neste navegador.';
      } else {
        records.unshift({ id: createId(), text: text, createdAt: now, updatedAt: now });
        if (status) status.textContent = 'A intenção foi salva neste navegador.';
      }
      var persisted = write(key, records);
      if (!persisted && status) {
        status.textContent = 'A intenção ficará disponível apenas enquanto esta página permanecer aberta, pois o navegador bloqueou o armazenamento local.';
      }
      resetForm();
      notify(key);
    });

    input.addEventListener('input', updateCounter);
    if (cancel) cancel.addEventListener('click', function () {
      resetForm();
      if (status) status.textContent = 'A edição foi cancelada.';
    });
    document.addEventListener('oratio:intentions-updated', function (event) {
      if (event.detail && event.detail.key === key) render();
    });
    updateCounter();
    render();
  }

  window.OratioIntentions = {
    read: read,
    replace: function (key, records) {
      var result = write(key, records);
      notify(key);
      return result;
    },
    storageKey: storageKey
  };

  document.querySelectorAll('[data-intentions-root]').forEach(setup);
}());
