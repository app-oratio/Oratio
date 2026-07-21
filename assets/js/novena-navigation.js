(function () {
  'use strict';

  var root = document.querySelector('[data-novena-progress]');
  if (!root) return;
  var slug = root.getAttribute('data-novena-slug');
  var currentDay = Number(root.getAttribute('data-novena-day'));
  var total = Math.max(1, Number(root.getAttribute('data-novena-total')) || 9);
  var key = 'oratio-novena-progress:' + slug;
  var checkbox = root.querySelector('[data-day-complete]');
  var resetButton = root.querySelector('[data-progress-reset]');
  var bar = root.querySelector('[data-progress-bar]');
  var track = root.querySelector('[data-progress-track]');
  var label = root.querySelector('[data-progress-label]');

  function readProgress() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed.map(Number).filter(function (day) { return day >= 1 && day <= total; }) : [];
    } catch (error) { return []; }
  }

  function saveProgress(days) {
    try { window.localStorage.setItem(key, JSON.stringify(days)); } catch (error) { /* O estado permanece apenas nesta página. */ }
  }

  function render() {
    var days = Array.from(new Set(readProgress())).sort(function (a, b) { return a - b; });
    if (checkbox) checkbox.checked = days.indexOf(currentDay) >= 0;
    var completed = days.length;
    var ratio = Math.min(1, completed / total);
    if (bar) bar.style.transform = 'scaleX(' + ratio + ')';
    if (track) track.setAttribute('aria-valuenow', String(completed));
    if (label) label.textContent = completed + ' de ' + total + (completed === 1 ? ' dia concluído.' : ' dias concluídos.');
  }

  if (checkbox) checkbox.addEventListener('change', function () {
    var days = readProgress();
    var index = days.indexOf(currentDay);
    if (checkbox.checked && index < 0) days.push(currentDay);
    if (!checkbox.checked && index >= 0) days.splice(index, 1);
    saveProgress(days);
    render();
  });

  if (resetButton) resetButton.addEventListener('click', function () {
    var confirmed = window.confirm('Deseja apagar o progresso desta novena neste navegador?');
    if (!confirmed) return;
    try { window.localStorage.removeItem(key); } catch (error) { saveProgress([]); }
    render();
  });

  render();
}());

