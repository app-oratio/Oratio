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

console.log('12 verificações de horário concluídas com sucesso.');
