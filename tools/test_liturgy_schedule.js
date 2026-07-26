'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/liturgy.js'), 'utf8');
const sandbox = {
  console,
  Date,
  Event: function Event() {},
  Intl,
  Object,
  window: {
    setInterval: function () {},
    CSS: { escape: function (value) { return value; } }
  },
  document: {
    readyState: 'loading',
    addEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { textContent: '', innerHTML: '' }; }
  }
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const currentTarget = sandbox.window.OratioLiturgia.currentTarget;
const currentCivilDate = sandbox.window.OratioLiturgia.currentCivilDate;
const setTabState = sandbox.window.OratioLiturgia.setTabState;
function atLocal(hour, minute, date = '2026-07-25') {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour + 3, minute));
}

assert.equal(JSON.stringify(currentTarget(atLocal(0, 0))), JSON.stringify({ date: '2026-07-24', slug: 'completas', label: 'Completas' }));
assert.equal(JSON.stringify(currentTarget(atLocal(2, 59))), JSON.stringify({ date: '2026-07-24', slug: 'completas', label: 'Completas' }));
assert.equal(currentTarget(atLocal(3, 0)).slug, 'oficio-das-leituras');
assert.equal(currentTarget(atLocal(5, 59)).slug, 'oficio-das-leituras');
assert.equal(currentTarget(atLocal(6, 0)).slug, 'laudes');
assert.equal(currentTarget(atLocal(8, 29)).slug, 'laudes');
assert.equal(currentTarget(atLocal(8, 30)).slug, 'hora-terca');
assert.equal(currentTarget(atLocal(11, 0)).slug, 'hora-sexta');
assert.equal(currentTarget(atLocal(13, 30)).slug, 'hora-nona');
assert.equal(currentTarget(atLocal(16, 0)).slug, 'vesperas');
assert.equal(currentTarget(atLocal(20, 0)).slug, 'completas');
assert.equal(currentTarget(atLocal(23, 59)).date, '2026-07-25');
assert.equal(currentCivilDate(atLocal(0, 0)), '2026-07-25');

function fakeClassList() {
  const values = new Set();
  return {
    toggle(name, enabled) { if (enabled) values.add(name); else values.delete(name); },
    contains(name) { return values.has(name); }
  };
}

function fakeElement(attributes, inlineDisplay) {
  const attrs = Object.assign({}, attributes);
  const styleValues = inlineDisplay ? { display: inlineDisplay } : {};
  return {
    hidden: false,
    tabIndex: 0,
    classList: fakeClassList(),
    style: {
      removeProperty(name) { delete styleValues[name]; },
      setProperty(name, value) { styleValues[name] = value; },
      getPropertyValue(name) { return styleValues[name] || ''; }
    },
    getAttribute(name) { return attrs[name] || null; },
    setAttribute(name, value) { attrs[name] = String(value); }
  };
}

const ptButton = fakeElement({ 'data-language-select': 'pt' });
const latButton = fakeElement({ 'data-language-select': 'lat' });
const ptPanel = fakeElement({ 'data-language-panel': 'pt' });
const latPanel = fakeElement({ 'data-language-panel': 'lat' }, 'none');
setTabState([ptButton, latButton], [ptPanel, latPanel], 'lat', 'data-language-select', 'data-language-panel');
assert.equal(latPanel.hidden, false);
assert.equal(latPanel.style.getPropertyValue('display'), '');
assert.equal(latPanel.getAttribute('aria-hidden'), 'false');
assert.equal(latPanel.classList.contains('is-active'), true);
assert.equal(ptPanel.hidden, true);
assert.equal(ptPanel.style.getPropertyValue('display'), 'none');

console.log('19 verificações de horário e alternância de idioma concluídas com sucesso.');
