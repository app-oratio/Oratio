(function () {
  'use strict';

  document.querySelectorAll('[data-back-to-top]').forEach(function (button) {
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      var skipTarget = document.querySelector('.skip-link');
      if (skipTarget) skipTarget.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('[data-fallback-image]').forEach(function (image) {
    function showFallback() {
      image.hidden = true;
      var fallback = image.nextElementSibling;
      if (fallback && fallback.classList.contains('image-placeholder')) fallback.hidden = false;
    }
    image.addEventListener('error', showFallback);
    if (image.complete && image.naturalWidth === 0) showFallback();
  });

  var notice = document.querySelector('[data-storage-notice]');
  if (notice) {
    var accepted = false;
    try { accepted = window.localStorage.getItem('oratio-storage-notice') === 'accepted'; } catch (error) { accepted = false; }
    notice.hidden = accepted;
    var accept = notice.querySelector('[data-storage-accept]');
    if (accept) accept.addEventListener('click', function () {
      notice.hidden = true;
      try { window.localStorage.setItem('oratio-storage-notice', 'accepted'); } catch (error) { /* Sem persistência. */ }
    });
  }
}());

