(function () {
  'use strict';

  var layer = document.querySelector('[data-drawer-layer]');
  var drawer = document.getElementById('site-drawer');
  var openButton = document.querySelector('[data-drawer-open]');
  if (!layer || !drawer || !openButton) return;

  var closeButtons = layer.querySelectorAll('[data-drawer-close]');
  var lastFocused = null;
  var closeTimer = null;
  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function focusableElements() {
    return Array.prototype.slice.call(drawer.querySelectorAll(focusableSelector)).filter(function (element) {
      return !element.hidden && element.offsetParent !== null;
    });
  }

  function openDrawer() {
    window.clearTimeout(closeTimer);
    lastFocused = document.activeElement;
    layer.inert = false;
    layer.setAttribute('aria-hidden', 'false');
    openButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('drawer-open');
    window.requestAnimationFrame(function () {
      layer.classList.add('is-open');
      var first = drawer.querySelector('[data-drawer-first]') || focusableElements()[0] || drawer;
      first.focus();
    });
  }

  function closeDrawer(restoreFocus) {
    layer.classList.remove('is-open');
    openButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
    closeTimer = window.setTimeout(function () {
      layer.setAttribute('aria-hidden', 'true');
      layer.inert = true;
    }, 270);
    if (restoreFocus !== false && lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function trapFocus(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer(true);
      return;
    }
    if (event.key !== 'Tab') return;
    var elements = focusableElements();
    if (!elements.length) {
      event.preventDefault();
      drawer.focus();
      return;
    }
    var first = elements[0];
    var last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openButton.addEventListener('click', openDrawer);
  closeButtons.forEach(function (button) { button.addEventListener('click', function () { closeDrawer(true); }); });
  drawer.addEventListener('keydown', trapFocus);
  drawer.querySelectorAll('a[href]').forEach(function (link) { link.addEventListener('click', function () { closeDrawer(false); }); });
}());
