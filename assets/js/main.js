(function () {
  'use strict';

  var header = document.querySelector('[data-site-header]');
  if (header) {
    var updateHeader = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  var prayerTexts = document.querySelectorAll('[data-prayer-text]');
  if (prayerTexts.length) {
    var storageKey = 'oratio-prayer-font-scale';
    var scale = 1;
    try { scale = Number(window.localStorage.getItem(storageKey)) || 1; } catch (error) { scale = 1; }
    scale = Math.min(1.35, Math.max(0.9, scale));
    function applyScale() {
      prayerTexts.forEach(function (prayerText) {
        prayerText.style.setProperty('--prayer-font-size', (1.125 * scale).toFixed(3) + 'rem');
      });
      document.querySelectorAll('[data-prayer-font-value]').forEach(function (output) {
        output.textContent = Math.round(scale * 100) + '%';
      });
      document.querySelectorAll('[data-prayer-font]').forEach(function (button) {
        var action = button.getAttribute('data-prayer-font');
        button.disabled = (action === 'decrease' && scale <= 0.9)
          || (action === 'increase' && scale >= 1.35);
      });
    }
    document.querySelectorAll('[data-prayer-font]').forEach(function (button) {
      button.addEventListener('click', function () {
        scale += button.getAttribute('data-prayer-font') === 'increase' ? 0.1 : -0.1;
        scale = Math.min(1.35, Math.max(0.9, scale));
        applyScale();
        try { window.localStorage.setItem(storageKey, String(scale)); } catch (error) { /* Sem persistência. */ }
      });
    });
    applyScale();
  }
}());
